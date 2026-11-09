// Adapter for the pinned, locally bundled jsGBC 0.7.0 (MIT).
export function validateGameBoyRom(bytes,name=''){
 if(!/\.(gb|gbc)$/i.test(name))throw Error('Escolha um jogo .gb ou .gbc.');
 if(bytes.length<32768||bytes.length>8*1024*1024)throw Error('O jogo deve ter entre 32 KB e 8 MB.');
 let checksum=0;for(let i=0x134;i<=0x14c;i++)checksum=(checksum-bytes[i]-1)&255;
 if(checksum!==bytes[0x14d])throw Error('O cabeçalho do jogo está incompleto ou inválido.');
 const expected=bytes[0x148]<=8?32768*2**bytes[0x148]:({0x52:72,0x53:80,0x54:96}[bytes[0x148]]||0)*16384;
 if(!expected||expected!==bytes.length)throw Error('O tamanho do arquivo não corresponde ao cartucho.');
 return bytes;
}

export function createGameBoySession({Core,canvas,audioContext,storage,prefix,onStorageError=()=>{},onError=()=>{},requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame}){
 const gb=new Core.GameBoy({lcd:{canvas},audio:{context:audioContext}});
 const held=new Set();let frame=0,playing=false,disposed=false,storageFailed=false;
 const storageError=()=>{storageFailed=true;onStorageError();};
 class Saves extends Core.Storage{
  get(key){try{const value=storage.getItem(prefix+key);return value?Uint8Array.from(atob(value),c=>c.charCodeAt(0)).buffer:undefined;}catch{storageError();}}
  set(key,buffer){try{let text='';for(const byte of new Uint8Array(buffer))text+=String.fromCharCode(byte);storage.setItem(prefix+key,btoa(text));}catch{storageError();}}
 }
 gb.setStorage(new Saves());gb.core=gb;
 // The upstream frame handler does not check turnOff; gate and cancel every frame.
 gb.requestFrame=callback=>{if(playing&&!disposed)frame=requestFrame(time=>{frame=0;if(playing&&!disposed)try{callback(time);}catch(error){pause();onError(error);}});};
 gb.isPaused=()=>!playing||disposed;
 function release(){for(const action of held)gb.actionUp(action);held.clear();}
 function pause(){playing=false;cancelFrame(frame);frame=0;release();gb.debouncedAutoSave.clear();gb.autoSave();audioContext.suspend().catch(()=>{});}
 return {
  get playing(){return playing;},get core(){return gb;},
  // turnOn configures the source sample rate and buffer sizes before init.
  // Initializing the device earlier leaves a zero-length buffer and silent audio.
  async start(bytes){
   if(disposed)return;gb.insertCartridge(bytes);playing=true;gb.turnOn();await gb.audioDevice.init();if(disposed)return;
   // jsGBC 0.7 only seeds this phase when upsampling. At 44.1 kHz the
   // source is slightly faster, so an undefined phase otherwise silences it.
   const resampler=gb.audioDevice.resampler;if(!Number.isFinite(resampler.lastWeight))resampler.lastWeight=1;
   gb.loadRam();gb.loadRtc();audioContext.resume().catch(()=>{});
  },
  async resume(){if(disposed||playing)return;await audioContext.resume();if(disposed)return;playing=true;gb.lastRun=0;gb.requestFrame(gb.frameHandler);},
  pause,release,
  press(action){if(playing&&!held.has(action)){audioContext.resume().catch(()=>{});held.add(action);gb.actionDown(action);}},
  lift(action){if(held.delete(action))gb.actionUp(action);},
  mute(value){if(playing)audioContext.resume().catch(()=>{});gb.audioDevice.setVolume(value?0:.5);},
  async save(){storageFailed=false;gb.debouncedAutoSave.clear();await gb.saveRam();await gb.saveRtc();return !storageFailed;},
  exportSave(){return gb.getBatteryFileArrayBuffer();},
  async importSave(buffer){const wasPlaying=playing;pause();await gb.loadBatteryFileArrayBuffer(buffer);gb.loadRam();gb.loadRtc();if(wasPlaying)await this.resume();},
  dispose(){if(disposed)return;pause();disposed=true;gb.turnOff();gb.removeAllListeners();gb.audioDevice.audioNode?.disconnect();gb.audioDevice.gainNode?.disconnect();audioContext.close().catch(()=>{});}
 };
}
