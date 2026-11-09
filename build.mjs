import {cp,mkdir,rm,readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import './customize.cjs';
// Validate the generated directory before replacing it, so removed assets cannot survive a build.
const output=path.resolve('dist');
if(output!==path.join(process.cwd(),'dist'))throw Error('Invalid build output directory');
await rm(output,{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
// Project Pages serves the site below /repository/, while local development stays at /.
const base=process.env.SITE_BASE_PATH||'/';
const runtimeVersion=(await readFile('public/cs/index.html','utf8')).match(/boot\.js\?v=([a-f0-9]+)/)?.[1];
if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base))throw Error('Invalid SITE_BASE_PATH');
if(base!=='/'){
 const entries=await readdir('public');
 const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const paths=new RegExp('(["\x27`(])/(?:'+entries.map(escape).join('|')+')(?=[/"\x27`)?#])','g');
 async function rewrite(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const file=path.join(dir,entry.name);
   if(entry.isDirectory())await rewrite(file);
   else if(/\.(html|js|css)$/.test(entry.name)){
    let text=await readFile(file,'utf8');
    if(runtimeVersion)text=text.replaceAll('?v=cs-mode-3',`?v=${runtimeVersion}`);
    text=text.replace(paths,match=>match[0]+base+match.slice(2));
    if(entry.name.endsWith('.html'))text=text.replace(/href="\/#/g,'href="#').replace(/href="\/"/g,`href="${base}"`);
    await writeFile(file,text);
   }
  }
 }
 await rewrite('dist');
}
await writeFile('dist/.nojekyll','');
console.log('Build estático criado em dist/.');
