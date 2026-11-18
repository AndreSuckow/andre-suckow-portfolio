import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const data={name:'Recrutador',email:'pessoa@example.com',message:'Temos uma oportunidade para você.',website:'',requestId:'12345678-1234-1234-1234-123456789abc'};
function setup(fetchImpl){
 const dom=new JSDOM(fs.readFileSync('public/index.html','utf8'),{url:'http://localhost:4173/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.fetch=fetchImpl;w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
 w.eval(fs.readFileSync('public/contact-form.js','utf8'));return {dom,w,d:w.document};
}
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));

test('Provider message explains rejection and activation never claims delivery',async()=>{
 for(const result of [{success:false,message:'Form not activated. Please activate your form.'},{success:true,message:'Activation email sent.'},{success:false,message:'Too many requests. Try later.'}]){
  const s=setup(async()=>({ok:true,json:async()=>result}));const {d,w}=s;
  const form=d.querySelector('#contact-dialog form');
  for(const [name,value] of Object.entries(data))if(form.elements.namedItem(name))form.elements.namedItem(name).value=value;
  form.dispatchEvent(new w.Event('submit',{cancelable:true}));await flush();
  assert.equal(form.elements.message.value,data.message);
  assert(d.querySelector('.dialog__status').hasAttribute('data-error'));
  assert(d.querySelector('.dialog__status').textContent.includes(result.message.includes('requests')?'Too many requests':'confirmação do destinatário'));
  s.dom.window.close();
 }
});
test('Form validates inline, keeps text on failure and prevents duplicate clicks and retries',async()=>{
 const calls=[];let success=false;const s=setup(async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:success,json:async()=>success?{success:'true'}:{error:'Tente novamente.'}};});
 const {d,w}=s;d.querySelector('[data-action="open-contact"]').click();await flush();const form=d.querySelector('#contact-dialog form');
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(calls.length,0);assert.equal(d.activeElement.name,'name');
 for(const [name,value] of Object.entries(data))if(form.elements.namedItem(name))form.elements.namedItem(name).value=value;
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));form.dispatchEvent(new w.Event('submit',{cancelable:true}));await flush();assert.equal(calls.length,1);assert.equal(form.elements.message.value,data.message);
 success=true;form.dispatchEvent(new w.Event('submit',{cancelable:true}));await flush();assert.equal(calls.length,2);assert.equal(calls[0]._replyto,data.email);assert.equal(calls[0].email,data.email);assert.equal(form.elements.message.value,'');assert(d.querySelector('.dialog__status').textContent.includes('recebida'));s.dom.window.close();
});
