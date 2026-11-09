import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {createCanvas} from '@napi-rs/canvas';
import {webcrypto} from 'node:crypto';
import {validateGameBoyRom,createGameBoySession} from './public/gameboy-runtime.js';

// Original diagnostic cart: draw a solid tile and write 0x42 to battery RAM.
function rom(){
 const data=new Uint8Array(32768);data.set([0xc3,0x50,0x01],0x100);
 data.set(Buffer.from('PORTFOLIO TEST'),0x134);data[0x147]=3;data[0x149]=2;
 data.set([0xf3,0x3e,0x0a,0xea,0x00,0x00,0x3e,0x42,0xea,0x00,0xa0,0x3e,0x00,0xe0,0x40,0x21,0x00,0x80,0x06,0x10,0x3e,0xff,0x22,0x05,0x20,0xfc,0x3e,0xe4,0xe0,0x47,0x3e,0x91,0xe0,0x40,0x18,0xfe],0x150);
 let sum=0;for(let i=0x134;i<=0x14c;i++)sum=(sum-data[i]-1)&255;data[0x14d]=sum;return data;
}
function audio(){const node=()=>({connect(){},disconnect(){},gain:{setTargetAtTime(){}}});return {audioWorklet:{},sampleRate:44100,currentTime:0,createGain:node,createScriptProcessor:node,async resume(){this.state='running';},async suspend(){this.state='suspended';},async close(){this.state='closed';}};}
function setup(sampleRate=44100){
 const dom=new JSDOM('<!doctype html><canvas></canvas>',{url:'https://example.test/site-cs-portfolio/',runScripts:'outside-only'}),w=dom.window;
 const canvases=new WeakMap();w.HTMLCanvasElement.prototype.getContext=function(){if(!canvases.has(this))canvases.set(this,createCanvas(this.width||160,this.height||144));return canvases.get(this).getContext('2d');};
 w.eval(fs.readFileSync('public/vendor/gameboy/jsgbc.js','utf8'));
 const jobs=new Map();let id=0;const context=audio(),canvas=w.document.querySelector('canvas');context.sampleRate=sampleRate;
 const session=createGameBoySession({Core:w.PortfolioGameBoy,canvas,audioContext:context,storage:w.localStorage,prefix:'test/',requestFrame:fn=>{jobs.set(++id,fn);return id;},cancelFrame:id=>jobs.delete(id)});
 return {session,context,canvas,w,jobs,frame(time){const [id,fn]=jobs.entries().next().value;jobs.delete(id);fn(time);},close(){session.dispose();w.close();}};
}

test('Game Boy rejects invalid, truncated and wrong-system cartridges before loading',()=>{
 const bytes=rom();assert.equal(validateGameBoyRom(bytes,'test.gb'),bytes);assert.throws(()=>validateGameBoyRom(bytes,'test.sfc'));
 assert.throws(()=>validateGameBoyRom(bytes.subarray(0,100),'test.gb'));const bad=bytes.slice();bad[0x134]^=1;assert.throws(()=>validateGameBoyRom(bad,'test.gb'));
 const long=new Uint8Array(65536);long.set(bytes);assert.throws(()=>validateGameBoyRom(long,'test.gbc'));
});

test('the actual bundled core renders an original diagnostic ROM and preserves battery RAM',async()=>{
 const t=setup();try{
 await t.session.start(rom());assert(t.session.playing);
 for(let i=1;i<=30;i++)t.frame(i*17);
 assert.equal(t.session.core.cartridge.mbc.getRam()[0],0x42);
 const pixels=t.canvas.getContext('2d').getImageData(0,0,160,144).data;assert(pixels.some((value,i)=>i%4===3&&value===255),'a frame was painted');
 t.session.press('A');assert.equal(t.session.core.joypad.value&16,0);t.session.lift('A');assert.equal(t.session.core.joypad.value&16,16);
 await t.session.save();const exported=t.session.exportSave();assert.equal(exported.byteLength,8192);assert.equal(new Uint8Array(exported)[0],0x42);
 const copy=new Uint8Array(exported);copy[0]=0x77;await t.session.importSave(copy.buffer);assert.equal(t.session.core.cartridge.mbc.getRam()[0],0x77);
 t.session.press('Left');t.session.pause();assert.equal(t.jobs.size,0);assert.equal(t.session.core.joypad.value&2,2);assert.equal(t.context.state,'suspended');
 await t.session.resume();assert.equal(t.jobs.size,1);t.session.dispose();assert.equal(t.jobs.size,0);assert.equal(t.context.state,'closed');
 const restored=createGameBoySession({Core:t.w.PortfolioGameBoy,canvas:t.canvas,audioContext:audio(),storage:t.w.localStorage,prefix:'test/',requestFrame:()=>1,cancelFrame(){}});
 try{await restored.start(rom());assert.equal(restored.core.cartridge.mbc.getRam()[0],0x77);}finally{restored.dispose();}
 }finally{t.close();}
});

test('handheld uses the room discovery path, remains separate from TV orientation, and loads the core on demand',()=>{
 const room=fs.readFileSync('public/new-room.js','utf8'),ui=fs.readFileSync('public/room-discoveries.js','utf8'),mobile=fs.readFileSync('public/mobile-reading.js','utf8'),player=fs.readFileSync('public/gameboy.js','utf8');
 assert(room.includes("discovery('gameboy',gameboy.root"));assert(ui.includes("event.detail==='gameboy'"));assert(mobile.includes("getElementById('gameboy-dialog')?.open"));
 assert(!fs.readFileSync('public/index.html','utf8').includes('vendor/gameboy/jsgbc.js'));assert(player.includes('crypto.subtle.digest'));assert(player.includes("document.hidden&&session"));
});

test('handheld dialog loads a local cart, keeps it on validation failure, pauses and closes safely',async()=>{
 const t=setup(),w=t.w;try{
 Object.defineProperty(w.crypto,'subtle',{value:webcrypto.subtle});
 w.AudioContext=function(){return audio();};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.validateGameBoyRom=validateGameBoyRom;
 w.createGameBoySession=options=>createGameBoySession({...options,requestFrame:fn=>w.setTimeout(()=>fn(17),10000),cancelFrame:id=>w.clearTimeout(id)});
 let source=fs.readFileSync('public/gameboy.js','utf8').replace(/^import .*;\r?\n/,'').replace('export function openGameBoy','function openGameBoy');
 w.eval(source.replaceAll('import.meta.url',JSON.stringify('https://example.test/site-cs-portfolio/gameboy.js'))+'\nwindow.openGameBoy=openGameBoy;window.chooseFile=chooseFile;');
 const trigger=w.document.createElement('button');w.document.body.append(trigger);trigger.focus();w.document.body.style.overflow='auto';
 w.openGameBoy();const dialog=w.document.querySelector('#gameboy-dialog');assert(dialog.open);assert.equal(w.document.body.style.overflow,'hidden');
 assert(dialog.querySelector('[data-gb-action="A"]').disabled);
 const bytes=rom();await w.chooseFile({name:'adventure.gb',size:bytes.length,arrayBuffer:async()=>bytes.buffer});
 assert.equal(dialog.querySelector('[data-gb-name]').textContent,'adventure');assert.equal(dialog.querySelector('[data-gb-led]').dataset.on,'true');
 await w.chooseFile({name:'invalid.gb',size:1,arrayBuffer:async()=>new ArrayBuffer(1)});
 assert.equal(dialog.querySelector('[data-gb-led]').dataset.on,'true');assert(!dialog.querySelector('[data-gb-action="A"]').disabled);
 await dialog.querySelector('[data-gb-pause]').onclick();assert.equal(dialog.querySelector('[data-gb-led]').dataset.on,'false');
 await dialog.querySelector('[data-gb-pause]').onclick();assert.equal(dialog.querySelector('[data-gb-led]').dataset.on,'true');
 w.fetch=async url=>{assert.equal(url.pathname,'/site-cs-portfolio/games/gameboy/pokemon-blue.gb');return {ok:true,arrayBuffer:async()=>bytes.buffer};};
 await dialog.querySelector('[data-gb-blue]').onclick();assert.equal(dialog.querySelector('[data-gb-name]').textContent,'Pokémon Blue');
 assert.equal(dialog.querySelector('[data-gb-led]').dataset.on,'true');
 let resolve;const loading=w.chooseFile({name:'late.gb',size:bytes.length,arrayBuffer:()=>new Promise(r=>resolve=r)});
 dialog.close();resolve(bytes.buffer);await loading;assert(!dialog.open);assert.equal(w.document.body.style.overflow,'auto');assert.equal(w.document.activeElement,trigger);
 w.openGameBoy();assert(dialog.querySelector('[data-gb-action="A"]').disabled);dialog.close();
 }finally{t.close();}
});

test('storage denial is reported without claiming a successful save',async()=>{
 const t=setup();try{await t.session.start(rom());t.w.Storage.prototype.setItem=()=>{throw Error('quota');};assert.equal(await t.session.save(),false);}finally{t.close();}
});

for(const rate of [44100,48000])test(`the supplied Blue cartridge renders, plays audio at ${rate} Hz and responds to Start`,async()=>{
 const bytes=new Uint8Array(fs.readFileSync('public/games/gameboy/pokemon-blue.gb'));validateGameBoyRom(bytes,'pokemon-blue.gb');
 const t=setup(rate);try{
 await t.session.start(bytes);assert(t.session.core.cartridge.name.startsWith('POKEMON'));
 const device=t.session.core.audioDevice;
 assert(device.inputBuffer.length>0,'audio input is allocated after configuring the cartridge');
 assert(Number.isFinite(device.resampler.ratioWeight),'audio resampling has a valid source frequency');
 let audible=false;const channels=[new Float32Array(device.samplesPerCallback),new Float32Array(device.samplesPerCallback)];
 for(let i=1;i<=2400;i++){
  if(i===1000||i===1800)t.session.press('Start');if(i===1020||i===1820)t.session.lift('Start');t.frame(i*17);
  if(i%3===0){device.processAudio({outputBuffer:{getChannelData:channel=>channels[channel]}});audible||=channels.some(samples=>samples.some(value=>Number.isFinite(value)&&Math.abs(value)>.001));}
 }
 assert(audible,'the supplied game sends non-silent PCM samples to the audio output');
 assert(t.session.playing,'the supplied game remains running without a core error');
 const context=t.canvas.getContext('2d'),pixels=context.getImageData(0,0,160,144).data;
 assert(new Set(pixels).size>4,'the game produces a detailed frame');
 fs.mkdirSync('tmp',{recursive:true});fs.writeFileSync('tmp/pokemon-blue-test.png',context.canvas.toBuffer('image/png'));
 }finally{t.close();}
});
