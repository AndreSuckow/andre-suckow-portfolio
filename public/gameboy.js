import {validateGameBoyRom,createGameBoySession} from './gameboy-runtime.js?v=cs-mode-3';

let dialog,session,previousFocus,previousOverflow='',generation=0,loading=false,muted=false,corePromise;
const keymap={ArrowUp:'Up',ArrowDown:'Down',ArrowLeft:'Left',ArrowRight:'Right',z:'A',x:'B',Enter:'Start',Shift:'Select'};
const cartridges={blue:{name:'Pokémon Blue.gb',size:1048576,url:new URL('./games/gameboy/pokemon-blue.gb',import.meta.url)}};
function playCartridge(id){
 const cartridge=cartridges[id];if(!cartridge)return;
 return chooseFile({...cartridge,async arrayBuffer(){const response=await fetch(cartridge.url);if(!response.ok)throw Error('Não foi possível carregar o cartucho. Tente novamente.');return response.arrayBuffer();}});
}
function loadCore(){
 if(globalThis.PortfolioGameBoy)return Promise.resolve(globalThis.PortfolioGameBoy);
 return corePromise??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('./vendor/gameboy/jsgbc.js',import.meta.url).href;script.onload=()=>resolve(globalThis.PortfolioGameBoy);script.onerror=()=>{script.remove();corePromise=null;reject(Error('Não foi possível carregar o emulador. Tente novamente.'));};document.head.append(script);});
}
const status=text=>dialog.querySelector('[data-gb-status]').textContent=text;
function sync(){
 dialog.querySelector('[data-gb-choose]').disabled=loading;
 dialog.querySelector('[data-gb-blue]').disabled=loading;
 for(const button of dialog.querySelectorAll('[data-gb-action],[data-gb-pause],[data-gb-mute],[data-gb-export],[data-gb-save]'))button.disabled=!session||loading;
 const pause=dialog.querySelector('[data-gb-pause]');pause.textContent=session?.playing?'Pausar':'Continuar';pause.setAttribute('aria-pressed',String(!!session&&!session.playing));
 dialog.querySelector('[data-gb-empty]').hidden=!!session;
 dialog.querySelector('[data-gb-led]').dataset.on=String(!!session?.playing);
}
async function chooseFile(file){
 if(!file)return;
 const token=++generation;let candidate,context;loading=true;sync();status('Conferindo o cartucho…');
 try{
  if(file.size>8*1024*1024)throw Error('O jogo deve ter até 8 MB.');
  // Unlock in the initiating click/tap, before fetch, hashing or core loading.
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Este navegador não oferece áudio compatível com o Game Boy.');
  context=new Audio();context.resume().catch(()=>{});
  const data=await file.arrayBuffer();if(token!==generation||!dialog.open)return;
  const bytes=validateGameBoyRom(new Uint8Array(data),file.name);
  const [Core,digest]=await Promise.all([loadCore(),crypto.subtle.digest('SHA-256',bytes)]);
  if(token!==generation||!dialog.open)return;
  const prefix='portfolio-gameboy/'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')+'/';
  session?.dispose();session=null;
  let savesAvailable=true;
  candidate=createGameBoySession({Core,canvas:dialog.querySelector('canvas'),audioContext:context,storage:{getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)},prefix,onStorageError(){savesAvailable=false;status('O navegador não permitiu salvar. Exporte seu save antes de sair.');},onError(){status('O emulador encontrou uma falha e pausou. Exporte seu save e tente carregar o cartucho novamente.');sync();}});session=candidate;
  await candidate.start(bytes);
  if(token!==generation||!dialog.open){candidate.dispose();if(session===candidate)session=null;return;}
  session.mute(muted);dialog.querySelector('[data-gb-name]').textContent=file.name.replace(/\.(gb|gbc)$/i,'');
  status(savesAvailable?'Pronto! Setas para mover · Z: A · X: B · Enter: Start · Shift: Select.':'Salvamento local indisponível. Exporte seu save antes de sair.');
  dialog.querySelector('[data-gb-playfield]').focus({preventScroll:true});
 }catch(error){candidate?.dispose();if(token===generation){if(session===candidate)session=null;status(error.message||'Não foi possível iniciar este jogo. Escolha outra ROM.');}}
 finally{if(context&&!candidate)context.close().catch(()=>{});if(token===generation){loading=false;sync();}}
}
function buildDialog(){
 dialog=document.createElement('dialog');dialog.id='gameboy-dialog';dialog.className='dialog gameboy-dialog';dialog.setAttribute('aria-labelledby','gameboy-title');dialog.setAttribute('aria-describedby','gameboy-description');dialog.setAttribute('data-lenis-prevent','');
 dialog.innerHTML=`<header class="gb-header"><div><p class="eyebrow">Na mesa do quarto</p><h2 id="gameboy-title">Uma aventura de bolso</h2></div><button type="button" class="btn" data-gb-close>← Voltar</button></header>
 <div class="gb-layout"><div class="gb-device" data-gb-playfield tabindex="0" role="group" aria-label="Game Boy. Setas para mover, Z e X para A e B, Enter para Start e Shift para Select.">
 <div class="gb-bezel"><span class="gb-screen-caption">DOT MATRIX WITH STEREO SOUND</span><span class="gb-battery"><i data-gb-led data-on="false"></i>BATTERY</span><div class="gb-screen"><canvas width="160" height="144" aria-label="Tela do jogo"></canvas><span data-gb-empty>INSIRA UM<br>CARTUCHO<span>GAME BOY / COLOR</span></span></div></div>
 <p class="gb-brand">Nintendo <strong>GAME BOY</strong><sup>™</sup></p>
 <div class="gb-buttons"><div class="gb-dpad" role="group" aria-label="Direcional"><button type="button" data-gb-action="Up" aria-label="Cima">▲</button><button type="button" data-gb-action="Left" aria-label="Esquerda">◀</button><span></span><button type="button" data-gb-action="Right" aria-label="Direita">▶</button><button type="button" data-gb-action="Down" aria-label="Baixo">▼</button></div><div class="gb-ab"><label><button type="button" data-gb-action="B">B</button><span>B</span></label><label><button type="button" data-gb-action="A">A</button><span>A</span></label></div></div>
 <div class="gb-system"><label><button type="button" data-gb-action="Select" aria-label="Select"></button><span>SELECT</span></label><label><button type="button" data-gb-action="Start" aria-label="Start"></button><span>START</span></label></div><div class="gb-speaker" aria-hidden="true">▰ ▰ ▰ ▰ ▰ ▰</div>
 </div><aside class="gb-panel"><p class="eyebrow">Seu próximo save começa aqui</p><h3 data-gb-name>Qual vai ser a aventura?</h3><p id="gameboy-description">Escolha o cartucho azul para jogar Pokémon Blue ou carregue outro jogo do seu dispositivo.</p>
 <button type="button" class="btn btn--primary" data-gb-blue>Jogar Pokémon Blue</button>
 <button type="button" class="btn" data-gb-choose>Carregar outro cartucho</button><input type="file" accept=".gb,.gbc" hidden data-gb-file aria-label="Escolher jogo de Game Boy"><small>Outros cartuchos: .gb ou .gbc · até 8 MB</small>
 <p data-gb-status role="status" aria-live="polite">Use os botões do aparelho ou o teclado para jogar.</p><div class="gb-tools"><button type="button" class="btn" data-gb-pause aria-pressed="false">Pausar</button><button type="button" class="btn" data-gb-mute aria-pressed="false">Som ligado</button><button type="button" class="btn" data-gb-save>Salvar progresso</button><button type="button" class="btn" data-gb-export>Exportar save</button></div>
 <details><summary>Controles e salvamento</summary><p>Setas: direcional · Z: A · X: B · Enter: Start · Shift: Select. No celular, segure os botões do aparelho.</p><p>Salve também pelo menu do jogo. Os dados do cartucho ficam neste navegador; carregue a mesma ROM e escolha Continue no jogo. Exporte um save para guardar uma cópia antes de limpar os dados do navegador.</p><button type="button" class="btn" data-gb-import>Importar save</button><input type="file" accept=".sav" data-gb-save-file hidden aria-label="Escolher save de Game Boy"></details>
 <small>Emulação: <a href="https://github.com/ardean/jsGBC-core" target="_blank" rel="noopener noreferrer">jsGBC · MIT</a>. Aparelho ilustrado em código.</small></aside></div>`;
 document.body.append(dialog);
 dialog.querySelector('[data-gb-blue]').onclick=()=>playCartridge('blue');
 const file=dialog.querySelector('[data-gb-file]');dialog.querySelector('[data-gb-choose]').onclick=()=>file.click();file.onchange=()=>{const chosen=file.files?.[0];file.value='';chooseFile(chosen);};
 dialog.querySelector('[data-gb-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{generation++;loading=false;session?.dispose();session=null;for(const button of heldPointers.values())delete button.dataset.pressed;heldPointers.clear();document.body.style.overflow=previousOverflow;document.dispatchEvent(new CustomEvent('resume:skill-close'));previousFocus?.focus({preventScroll:true});sync();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 const heldPointers=new Map();
 for(const button of dialog.querySelectorAll('[data-gb-action]')){
  button.addEventListener('pointerdown',event=>{if(button.disabled)return;event.preventDefault();button.setPointerCapture(event.pointerId);heldPointers.set(event.pointerId,button);button.dataset.pressed='true';session?.press(button.dataset.gbAction);});
  const release=event=>{const held=heldPointers.get(event.pointerId);if(!held)return;heldPointers.delete(event.pointerId);delete held.dataset.pressed;session?.lift(held.dataset.gbAction);};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release);
  button.addEventListener('click',event=>{if(event.detail===0){const active=session;active?.press(button.dataset.gbAction);setTimeout(()=>active?.lift(button.dataset.gbAction),100);}});
 }
 dialog.addEventListener('keydown',event=>{if(event.target.closest('summary, input, .gb-panel, [data-gb-close]')||event.target.matches('button')&&(event.key==='Enter'||event.key===' '))return;const action=keymap[event.key]||keymap[event.key.toLowerCase()];if(!action)return;event.preventDefault();event.stopPropagation();session?.press(action);});
 dialog.addEventListener('keyup',event=>{const action=keymap[event.key]||keymap[event.key.toLowerCase()];if(action){event.preventDefault();event.stopPropagation();session?.lift(action);}});
 window.addEventListener('blur',()=>{session?.release();for(const button of heldPointers.values())delete button.dataset.pressed;heldPointers.clear();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&session){session.pause();status('Jogo pausado. Escolha Continuar para retomar.');sync();}});
 dialog.querySelector('[data-gb-pause]').onclick=async()=>{if(session?.playing)session.pause();else try{await session?.resume();}catch{status('Não foi possível retomar o áudio. Tente novamente.');}sync();};
 dialog.querySelector('[data-gb-mute]').onclick=()=>{muted=!muted;session?.mute(muted);const button=dialog.querySelector('[data-gb-mute]');button.textContent=muted?'Som desligado':'Som ligado';button.setAttribute('aria-pressed',String(muted));};
 dialog.querySelector('[data-gb-save]').onclick=async()=>{if(await session?.save())status('Progresso salvo neste navegador. Exporte o save para guardar uma cópia.');};
 dialog.querySelector('[data-gb-export]').onclick=()=>{try{const bytes=session?.exportSave();if(!bytes?.byteLength){status('Este cartucho ainda não tem um save para exportar. Salve pelo menu do jogo primeiro.');return;}const url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'})),link=document.createElement('a');link.href=url;link.download='gameboy-'+dialog.querySelector('[data-gb-name]').textContent.replace(/[^\w-]/g,'_')+'.sav';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{status('Não foi possível exportar este save.');}};
 const saveFile=dialog.querySelector('[data-gb-save-file]');dialog.querySelector('[data-gb-import]').onclick=()=>{if(!session){status('Carregue o cartucho antes de importar seu save.');return;}saveFile.click();};
 saveFile.onchange=async()=>{const file=saveFile.files?.[0];saveFile.value='';if(!file||!session)return;const active=session;try{if(!/\.sav$/i.test(file.name)||!file.size||file.size>256*1024)throw Error('Escolha um save .sav de até 256 KB.');const data=await file.arrayBuffer();if(session!==active)return;const expected=active.exportSave()?.byteLength;if(!expected||data.byteLength!==expected)throw Error('Este save não corresponde ao tamanho esperado pelo cartucho.');await active.importSave(data);if(await active.save())status('Save importado. Use o menu do jogo para continuar.');}catch(error){status(error.message);}sync();};
 sync();
}
export function openGameBoy(cartridge=null){
 if(document.querySelector('dialog[open]'))return;
 if(!dialog)buildDialog();previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.dispatchEvent(new CustomEvent('resume:skill-open'));dialog.showModal();dialog.querySelector('[data-gb-close]').focus({preventScroll:true});sync();
 if(cartridge)return playCartridge(cartridge);
}
