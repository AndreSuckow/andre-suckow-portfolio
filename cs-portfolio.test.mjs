import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {whatsappMessage} from './public/cs-model.js';
import {createCareerJourney,drawCareerScreen} from './public/career-map.js';
const html=fs.readFileSync('public/cs/index.html','utf8');
test('curriculum and CS share presentation while HTML, TV data and document links use their own profiles',()=>{
 const routes=[{file:'public/index.html',profile:'profile-curriculo.json',skills:'skill-details-curriculo.json',id:'curriculo',base:'/'},{file:'public/cs/index.html',profile:'profile.json',skills:'skill-details.json',id:'cs',base:'/cs/'}];
 const layouts=[],contents=[];
 for(const route of routes){
  const dom=new JSDOM(fs.readFileSync(route.file,'utf8')),d=dom.window.document,profile=JSON.parse(fs.readFileSync(route.profile,'utf8'));
  const content=JSON.parse(d.querySelector('#portfolio-data').textContent);
  contents.push(content);
  const {experience,skills,achievements,projects,...person}=profile;
  assert.deepEqual(content,{person,experience,skills,achievements,projects});
  assert.deepEqual(JSON.parse(d.querySelector('#skill-details').textContent),JSON.parse(fs.readFileSync(route.skills,'utf8')));
  assert.equal(d.documentElement.dataset.portfolio,route.id);
  for(const project of profile.projects)assert.equal(d.querySelector(`[data-tv="projetos/case/${project.slug}"]`).getAttribute('href'),`${route.base}cases/${project.slug}/`);
  layouts.push({styles:[...d.querySelectorAll('link[rel=stylesheet]')].map(e=>e.getAttribute('href')),scripts:[...d.querySelectorAll('script[src]')].map(e=>e.getAttribute('src')),structure:[...d.querySelectorAll('section[data-chapter],#stage-canvas')].map(e=>[e.tagName,e.id,e.getAttribute('class')])});
  dom.window.close();
 }
 assert.deepEqual(layouts[0],layouts[1],'both routes reuse the same visual tree, styles and runtime');
 const engine=fs.readFileSync('public/engine.js','utf8');
 for(const [name,next,field] of [['Eh','Dh','person'],['Dh','Oh','experience'],['Oh','kh','skills'],['kh','Ah','achievements'],['Ah','jh','projects']]){
  const start=engine.indexOf(`${name}=`)+name.length+1,end=engine.indexOf(`,${next}=`,start);
  const select=new Function('portfolioContent','return '+engine.slice(start,end));
  for(const content of contents)assert.equal(select(content),content[field],'TV selects this route object: '+field);
 }
});
test('all resume facts are shared by the website and printable curriculum',()=>{
 const profile=JSON.parse(fs.readFileSync('profile.json','utf8'));
 const dom=new JSDOM(html),d=dom.window.document;
 const cv=new JSDOM(fs.readFileSync('public/cs/curriculo/index.html','utf8'));
 for(const document of [d,cv.window.document]){
  const text=document.body.textContent;
  for(const company of profile.experience.filter(x=>!x.invitation)){
   for(const fact of [company.role,company.org,company.period,company.workMode,...company.bullets])assert(text.includes(fact),fact);
  }
  for(const group of profile.tools)for(const tool of group.items)assert(text.includes(tool),tool);
  for(const fact of [profile.education.title,profile.education.institution,profile.education.period,profile.certification,profile.language])assert(text.includes(fact),fact);
  assert(!/Front.?end|GP Strategies|React|TypeScript|300 empresas|2018–2021|gestão logística/i.test(text));
 }
 assert.equal(profile.experience[0].period,'Jan 2018 – Jan 2024');
 assert.equal(profile.location,'Curitiba – PR');
 for(const company of profile.experience.filter(x=>!x.invitation)){
  const caseDom=new JSDOM(fs.readFileSync(`public/cs/cases/${company.id==='marq'?'onboarding':'implantacao'}/index.html`,'utf8'));
  for(const bullet of company.bullets)assert(caseDom.window.document.body.textContent.includes(bullet));
  caseDom.window.close();
 }
 dom.window.close();cv.window.close();
});
test('career travel follows the path for two seconds and changes location only on arrival',()=>{
 const stops=[[-.4,-1.93],[.25,.67],[-.4,3.27]],journey=createCareerJourney(stops);
 assert(journey.walkTo(1,0));assert.equal(journey.current,0);assert.deepEqual(journey.position,stops[0]);
 assert.equal(journey.update(1),null);const halfway=journey.position;assert.notDeepEqual(halfway,stops[0]);assert.notDeepEqual(halfway,stops[1]);assert.equal(journey.current,0);
 assert.equal(journey.update(1),null);assert.deepEqual(journey.position,halfway,'A frozen game clock freezes the walk');
 journey.update(1.999);assert.equal(journey.current,0);assert.equal(journey.update(2),1);assert.equal(journey.current,1);assert(!journey.moving);assert.deepEqual(journey.position,stops[1]);assert.equal(journey.walkTo(1,3),false);
});
test('retargeting a walking character starts from its current position without teleporting',()=>{
 const journey=createCareerJourney([[-.4,-1.93],[.25,.67],[-.4,3.27]]);journey.walkTo(2,0);journey.update(.8);const before=journey.position;
 assert(journey.walkTo(1,.8));assert.deepEqual(journey.position,before);journey.update(2.799);assert.equal(journey.current,0);journey.update(2.8+.001);assert.equal(journey.current,1);
});
test('career hover highlights a stop without selecting it or changing unrelated hover behavior',()=>{
 const source=fs.readFileSync('src/engine.js','utf8'),start=source.indexOf('hover(e){let t=e?.id'),end=source.indexOf('addItem(e)',start);
 const hover=new Function('return function'+source.slice(start+'hover'.length,end))(),selected=[];
 const item={id:'experiencia/1',kind:'career'},state={hoverId:null,selectable:()=>[item],select:(...args)=>selected.push(args),invalidate(){}};
 hover.call(state,item);assert.equal(state.hoverId,item.id);assert.equal(selected.length,0);
 item.kind='select';hover.call(state,null);hover.call(state,item);assert.equal(selected.length,1);
});
test('career information stays at the visited company while hovering or walking',()=>{
 const companies=[0,1,2].map(i=>({id:String(i),phase:'Fase '+i,title:'Local '+i,role:'Cargo '+i,org:'Empresa '+i,period:'2020',start:2020,bullets:[]})),map=createCareerJourney([[-.4,-1.93],[.25,.67],[-.4,3.27]]),text=[],arrivals=[];
 map.draw=()=>companies.map((_,i)=>({x:i*100,y:200,w:90,h:90}));
 const game={selected:2,hoverId:'experiencia/2',careerMap:map,assets:{screenshots:{}},addItem(){},onSelect:item=>arrivals.push(item)},helpers={companies,colors:{},Q(){},kv(){},Ev(){},Tv(){},Nv(){},wv(_ctx,value,_x,y){text.push(value);return y+30;}};
 drawCareerScreen({},game,0,helpers);assert(text.includes('Cargo 0'));assert(!text.includes('Cargo 2'));assert(!map.moving);
 map.walkTo(2,0);text.length=0;drawCareerScreen({},game,1.9,helpers);assert(text.includes('Cargo 0'));assert.equal(arrivals.length,0);
 text.length=0;drawCareerScreen({},game,2,helpers);assert(text.includes('Cargo 2'));assert.equal(arrivals.length,1);assert(arrivals[0].label.includes('Empresa 2'));
});
test('Projects keeps the cartridge view at every scroll position; Skills stays close to the TV',()=>{
 const source=fs.readFileSync('src/engine.js','utf8'),start=source.indexOf('frame(e,t,n){'),end=source.indexOf('update(e,t,n=!1)',start);
 const document={documentElement:{dataset:{}}};
 const frame=new Function('Kh','Uh','document','return function'+source.slice(start+'frame'.length,end))((from,to,blend)=>({from:from.id,to:to.id,blend}),value=>Math.max(0,Math.min(1,value)),document);
 const views=Object.fromEntries(['wide','screen','desk','door','reading'].map(id=>[id,{id}]));
 const pose=result=>result.blend===1?result.to:result.from;
 for(const reduced of [false,true])for(const mobileReading of [false,true])for(const progress of [0,.08,.5,.95,1]){
  const camera={views,goal:{},reduced,mobileReading};
  assert.equal(pose(frame.call(camera,'projetos',progress,0)),'desk');
  assert.equal(pose(frame.call(camera,'projetos',progress,1)),'screen');
  assert.equal(pose(frame.call(camera,'skills',progress,0)),'screen');
 }
 for(const reduced of [false,true])for(const mobileReading of [false,true]){
  const camera={views,goal:{},reduced,mobileReading};
  for(const [preview,expected] of [['screen','reading'],['room','wide']]){
   document.documentElement.dataset.mobileTvPreview=preview;
   assert.equal(pose(frame.call(camera,'skills',0,0)),mobileReading?expected:'screen');
   assert.equal(pose(frame.call(camera,'projetos',0,0)),'desk');
   assert.equal(pose(frame.call(camera,'projetos',0,1)),'screen');
  }
 }
});
test('project loading and camera dive wait for the visible cartridge insertion; ejection waits for the shelf',async()=>{
 const source=fs.readFileSync('src/engine.js','utf8'),start=source.lastIndexOf('async function I(e){'),end=source.indexOf('function ie(){',start);
 const events=[],M={started:true,focus:1},O={active:'projetos'},g={tab:'projetos',setTab(value){this.tab=value;},setMode(){},setCart(value){this.cart=value;if(value)events.push(value.phase);},invalidate(){}},k={eject(){},insert(){},staticBurst(){},select(){}},b={static(){}},C={blinkLed(){}},D={shake(){}};
 let ready,inserted;const w={busy:false,inserted:null,insert:async slug=>{events.push('insert');await new Promise(resolve=>{inserted=()=>{w.inserted={slug};resolve();};});},eject:async()=>{events.push('eject');w.inserted=null;}};
 const xi={to:async(target,options)=>{Object.assign(target,options.focus===undefined?{p:options.p}:{focus:options.focus});options.onUpdate?.();if(options.focus===1)events.push('close-up');}};
 let interruptions=0;const factory=new Function('M','O','g','w','k','b','C','D','xi','showProjectShelf','projectShelfReady','n','SC','o','Fh','Ah','te','roomCascade',`let projectBusy=false;${source.slice(start,end)}return {insert:I,eject:L};`);
 const actions=factory(M,O,g,w,k,b,C,D,xi,()=>{M.focus=0;events.push('shelf');},()=>new Promise(resolve=>{ready=()=>resolve(true);}),()=>{},x=>x,false,{cart:{loading:.9}},[{slug:'onboarding',title:'Projeto',summary:'Resumo'}],()=>{},{interrupt(){interruptions++;}});
 const inserting=actions.insert('onboarding');assert.deepEqual(events,['shelf']);ready();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(events,['shelf','insert']);assert.equal(M.focus,0);
 inserted();await inserting;assert.deepEqual(events,['shelf','insert','loading','ready','close-up']);assert.equal(M.focus,1);
 const ejecting=actions.eject();assert.equal(M.focus,0);assert(!events.includes('eject'));ready();await ejecting;assert.equal(events.at(-1),'eject');assert.equal(w.inserted,null);assert.equal(interruptions,2);
});
function bootFixture({webgl=true,deferred=false}={}){
 const dom=new JSDOM(html,{url:'http://localhost:4173/',runScripts:'outside-only'}),w=dom.window;
 w.localStorage.setItem('andre:prefs',JSON.stringify({mode:'2d',sound:false,crt:false}));
 w.matchMedia=query=>({matches:query.includes('prefers-reduced-motion')});w.requestIdleCallback=callback=>callback();
 Object.defineProperty(w.document,'readyState',{value:'complete'});
 w.HTMLCanvasElement.prototype.getContext=()=>webgl?{getExtension:()=>({loseContext(){}})}:null;
 let finish;const engine={setActive(){}};w.__engineStart=()=>deferred?new Promise(resolve=>{finish=()=>resolve(engine);}):Promise.resolve(engine);
 const source=fs.readFileSync('src/boot.js','utf8').replace(/import\(`\.\/engine\.js\?v=cs-mode-3`\)/,'Promise.resolve({start:window.__engineStart})').replaceAll('import.meta','({url:location.href})').replace(/export\{[^}]+\};?\s*$/,'');
 w.eval(source);return {dom,w,finish:()=>finish?.()};
}
test('every visit starts in 3D despite a saved 2D preference, while manual switching remains available',async()=>{
 const {dom,w}=bootFixture();for(let i=0;i<100&&w.document.documentElement.hasAttribute('data-site-loading');i++)await new Promise(resolve=>setTimeout(resolve,5));
 assert(!w.document.documentElement.hasAttribute('data-site-loading'),'Manual navigation begins after the loading reveal');
 assert.equal(w.document.documentElement.dataset.mode,'3d');
 const button=w.document.querySelector('[data-toggle="mode"]');button.click();assert.equal(w.document.documentElement.dataset.mode,'2d');
 button.click();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(w.document.documentElement.dataset.mode,'3d');
 const prefs=JSON.parse(w.localStorage.getItem('andre:prefs'));assert.equal(prefs.sound,false);assert.equal(prefs.crt,false);dom.window.close();
});
test('a manual 2D switch during loading is respected and unsupported WebGL still has readable content',async()=>{
 const pending=bootFixture({deferred:true});await new Promise(resolve=>setTimeout(resolve,0));pending.w.document.querySelector('[data-toggle="mode"]').click();pending.finish();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(pending.w.document.documentElement.dataset.mode,'2d');pending.dom.window.close();
 const fallback=bootFixture({webgl:false});assert.equal(fallback.w.document.documentElement.dataset.mode,'2d');fallback.dom.window.close();
});
test('Tempo livre shares the supplied family description and icons across the portfolio',()=>{
 const dom=new JSDOM(html),d=dom.window.document;
 for(const link of d.querySelectorAll('a[data-nav-tab="hobbies"]'))assert.equal(link.textContent.replace(/^05/,''),'Tempo livre');
 assert.equal(d.querySelector('#hobbies-title').textContent,'Tempo livre');
 const family=d.querySelector('[data-hobby-icon="family"]').closest('article');assert.equal(family.querySelector('h3').textContent,'Família');assert(family.textContent.includes('Meus pais, minha esposa e meus quatro filhos'));
 assert.equal(d.querySelectorAll('[data-hobby-icon]').length,6);dom.window.close();
});

test('WhatsApp greeting uses Sao Paulo time at the morning, afternoon and evening boundaries',()=>{
 for(const [time,part] of [['04:59','boa noite'],['05:00','bom dia'],['11:59','bom dia'],['12:00','boa tarde'],['17:59','boa tarde'],['18:00','boa noite']]){
  const message=whatsappMessage(new Date(`2026-10-14T${time}:00-03:00`));assert(message.includes(part));assert(message.endsWith('Temos uma oportunidade para você!'));
 }
});

test('CS content uses verified contacts and treats Sua companhia as an invitation',()=>{
 const dom=new JSDOM(html),d=dom.window.document;
 assert.equal(d.querySelectorAll('.phase').length,3);assert(d.querySelectorAll('.phase')[2].textContent.includes('Sua companhia'));
 assert(!/Front.end|React|TypeScript|WordPress/.test(d.querySelector('#inicio').textContent));
 assert(!/Front.end|React|TypeScript|GP Strategies/.test(d.body.textContent));
 assert(d.querySelector('#sobre').textContent.includes('Curitiba – PR'));
 assert(d.querySelector('#sobre a[href="https://www.linkedin.com/in/andresuckow/"]'));
 assert(d.querySelector('#sobre a[href="mailto:andre.suckow.dev@gmail.com"]'));
 assert.equal(d.querySelectorAll('#inicio .hero__actions .btn').length,3);
 assert(d.querySelector('#inicio a[href="https://www.linkedin.com/in/andresuckow/"]'));
 assert.equal(d.querySelectorAll('[data-pad="a"], [data-pad="b"]').length,2);
 assert.equal(d.querySelectorAll('.attribute__trigger').length,5);
 for(const button of d.querySelectorAll('.attribute__trigger'))assert(d.getElementById(button.getAttribute('aria-describedby')).textContent.length>40);
 assert(d.querySelector('#hobbies a[href="https://www.instagram.com/tf.church/"]'));
 const company=d.querySelector('[data-tv="projetos/demo/onboarding"]');assert.equal(company.href,'https://marqhr.com/');assert(company.closest('.resume-project').querySelector('.resume-tags'));
 dom.window.close();
});

function setup(){
 const dom=new JSDOM(html,{url:'http://localhost:4173/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 let visible=false;const intervals=new Map();let id=0;
 w.document.getElementById('fim').getBoundingClientRect=()=>visible?{top:50,bottom:700}:{top:2000,bottom:2700};
 w.setInterval=fn=>{intervals.set(++id,fn);return id;};w.clearInterval=id=>intervals.delete(id);w.whatsappMessage=whatsappMessage;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.eval(fs.readFileSync('public/cs-interactions.js','utf8').replace(/^import .*;\r?\n/gm,''));
 return {dom,w,intervals,setVisible:value=>{visible=value;w.document.dispatchEvent(new w.Event('scroll'));},tick:()=>{[...intervals.values()].forEach(fn=>fn());}};
}
test('Continue starts only at the final screen, cancels when leaving, and opens Game Over once at zero',()=>{
 const s=setup(),d=s.w.document,dialog=d.querySelector('#game-over-dialog');assert.equal(s.intervals.size,0);
 s.setVisible(true);for(let i=0;i<4;i++)s.tick();assert.equal(d.querySelector('#continue-count').textContent,'5');assert(!dialog.open);
 s.setVisible(false);assert.equal(s.intervals.size,0);for(let i=0;i<10;i++)s.tick();assert(!dialog.open);
 s.setVisible(true);for(let i=0;i<9;i++)s.tick();assert.equal(d.querySelector('#continue-count').textContent,'0');assert(dialog.open);assert.equal(d.activeElement.id,'game-over-title');
 d.querySelector('[data-game-over-close]').click();assert(!dialog.open);s.setVisible(false);s.setVisible(true);assert.equal(s.intervals.size,0);s.dom.window.close();
});
test('Attribute descriptions are available by tap and dismiss with Escape',()=>{
 const s=setup(),d=s.w.document,button=d.querySelector('.attribute__trigger');button.click();assert(button.closest('.attribute').classList.contains('is-open'));
 d.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Escape'}));assert(!button.closest('.attribute').classList.contains('is-open'));s.dom.window.close();
});
