import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {build} from './build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
try{
  await build(root);
  const allowed=new Set(['index.html','styles.css','app.js','core.js','celebration.js','assets/favicon.svg','data/test_clients_simple.json','data/clients-data.js',...Array.from({length:16},(_,i)=>'assets/celebration/meme-'+String(i+1).padStart(2,'0')+'.png')]);
  const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
  const port=Number(process.env.PORT||4173);
  const server=http.createServer(async(req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const relative=(pathname.startsWith('/preview/project/')?pathname.slice('/preview/project/'.length):pathname.slice(1))||'index.html';
      if(!['GET','HEAD'].includes(req.method)||!allowed.has(relative)){res.writeHead(404);res.end('Не найдено');return;}
      const body=await readFile(path.join(root,'dist',relative));res.writeHead(200,{'Content-Type':types[path.extname(relative)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
    }catch{res.writeHead(404);res.end('Не найдено');}
  });
  server.on('error',()=>{console.error('Не удалось запустить просмотр. Проверьте порт.');process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.info('Каталог без входа: http://127.0.0.1:'+port+'/preview/project/'));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}catch(error){console.error(error.message?.startsWith('Ошибка структуры JSON:')?error.message:'Проверьте файлы проекта и JSON.');process.exitCode=1;}
