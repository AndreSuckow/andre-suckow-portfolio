import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const root=path.resolve('public');
const files=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);item.isDirectory()?walk(file):files.push(file);}}
walk(root);
let checked=0;
for(const file of files){
  const ext=path.extname(file);
  if(ext==='.js'){
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,`Invalid JavaScript: ${file}\n${result.stderr}`);
  }
  if(!['.html','.js','.css'].includes(ext))continue;
  const text=fs.readFileSync(file,'utf8');
  if(ext==='.html'){
    assert(!/valdimirferraz@hotmail|github\.com\/valdimirr|CMA Motores|Desbrav|Novo Hamburgo/.test(text),`Reference identity left in ${file}`);
    const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
    assert.equal(new Set(ids).size,ids.length,`Duplicate HTML IDs in ${file}`);
    for(const [,ref] of text.matchAll(/(?:src|href)="([^"#]+)"/g)){
      if(!ref.startsWith('/'))continue;
      const clean=ref.split(/[?#]/)[0];let target=path.join(root,clean);
      if(clean.endsWith('/'))target=path.join(target,'index.html');
      assert(fs.existsSync(target),`Missing local link or asset ${ref} in ${file}`);checked++;
    }
  }
  for(const [,ref] of text.matchAll(/(?:url\((?:["'])?|[`"'])(\/(?:models|textures|img|_astro)\/[^`"'()\s]+\.(?:glb|webp|png|woff2))/g)){
    assert(fs.existsSync(path.join(root,ref)),`Missing asset ${ref} in ${file}`);checked++;
  }
}
for(const file of files.filter(f=>f.endsWith('.glb'))){
  const data=fs.readFileSync(file);
  assert.equal(data.toString('ascii',0,4),'glTF',`Invalid model: ${file}`);
  assert.equal(data.readUInt32LE(4),2);
  assert.equal(data.readUInt32LE(8),data.length);
  const json=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)).trim());
  assert(!json.buffers?.some(b=>b.uri&&!b.uri.startsWith('data:')),`External buffer in ${file}`);
  assert(!json.images?.some(b=>b.uri&&!b.uri.startsWith('data:')),`External texture in ${file}`);
}
const gltfs=files.filter(file=>file.endsWith('.gltf'));
for(const file of gltfs){
 const model=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(model.asset.version,'2.0',`Invalid glTF version: ${file}`);
 for(const ref of [...model.buffers||[],...model.images||[]]){
  if(!ref.uri||ref.uri.startsWith('data:'))continue;
  const asset=path.resolve(path.dirname(file),decodeURIComponent(ref.uri));
  assert(asset.startsWith(root+path.sep)&&fs.existsSync(asset),`Missing glTF dependency: ${ref.uri}`);
  if(ref.byteLength!==undefined)assert.equal(fs.statSync(asset).size,ref.byteLength,`Incomplete glTF buffer: ${asset}`);
 }
}
const html=fs.readFileSync(path.join(root,'cs/index.html'),'utf8');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(home.includes('href="/cs/"'),'Home must link to the CS portfolio');
assert(!home.includes('id="stage-canvas"')&&!home.includes('src="/boot.js'),'Root must stay separate from the CS engine');
for(const id of ['stage-canvas','inicio','boot','sobre','experiencia','projetos','skills','contato','fim','contact-dialog','announcer'])assert(html.includes(`id="${id}"`),`Missing engine contract: ${id}`);
const engine=fs.readFileSync(path.join(root,'engine.js'),'utf8');
for(const company of JSON.parse(fs.readFileSync('profile.json','utf8')).experience.map(x=>x.org))assert(engine.includes(company),`Missing professional experience ${company}`);
const originalPdf=fs.readFileSync('documents/ANDRE_LUIS_SUCKOW_CV.pdf');
const profile=JSON.parse(fs.readFileSync('profile.json','utf8'));
assert.equal(profile.cvPdf,'/curriculo-andre-suckow.pdf');
const pdf=fs.readFileSync(path.join(root,profile.cvPdf));
assert.equal(pdf.toString('ascii',0,5),'%PDF-','Invalid PDF download');
assert(pdf.length>1000,'Empty PDF download');
assert(pdf.equals(originalPdf),'CV download differs from supplied PDF');
console.log(`PASS: JavaScript syntax, ${checked} asset/link references, 5 GLB models, ${gltfs.length} glTF models and their dependencies, chapter contracts, career content and original CV download.`);
