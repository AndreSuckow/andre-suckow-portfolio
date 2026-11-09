import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { parseRange } from './range.mjs';
import path from 'node:path';
const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback};
const port=Number(option('--port', '4173'));
const host=option('--host','127.0.0.1');
const root=path.resolve('public');
const types={'.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary','.pdf':'application/pdf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
    let file=path.resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    let info=await stat(file);if(info.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(308,{'Location':pathname+'/'+new URL(req.url,'http://local').search});res.end();return;}
      file=path.join(file,'index.html');info=await stat(file);
    }
    const range=parseRange(req.headers.range,info.size);
    if(range===null){res.writeHead(416,{'Content-Range':`bytes */${info.size}`,'Accept-Ranges':'bytes','Content-Length':0});res.end();return;}
    const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Content-Length':range?range.end-range.start+1:info.size};
    if(range)headers['Content-Range']=`bytes ${range.start}-${range.end}/${info.size}`;
    res.writeHead(range?206:200,headers);
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(file,range||{});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Página não encontrada.');}
});
server.listen(port,host,()=>console.log(`Currículo game disponível em http://${host}:${server.address().port}/`));
