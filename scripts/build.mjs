import {mkdir,cp,rm,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import path from 'node:path';
const {validate}=createRequire(import.meta.url)('../src/core.js');
export async function build(root=fileURLToPath(new URL('../',import.meta.url))){
  const base=path.resolve(root),out=path.resolve(base,'dist');
  const source=path.join(base,'src/data/test_clients_simple.json');
  const data=validate(JSON.parse((await readFile(source,'utf8')).replace(/^\uFEFF/,'')));
  if(path.dirname(out)!==base||path.basename(out)!=='dist')throw new Error('Неверный каталог сборки');
  await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
  for(const name of ['index.html','styles.css','core.js','app.js','celebration.js'])await cp(path.join(base,'src',name),path.join(out,name));
  await mkdir(path.join(out,'assets/celebration'),{recursive:true});
  await cp(path.join(base,'src/assets/favicon.svg'),path.join(out,'assets/favicon.svg'));
  for(let i=1;i<=16;i++){const name='meme-'+String(i).padStart(2,'0')+'.png';await cp(path.join(base,'src/assets/celebration',name),path.join(out,'assets/celebration',name));}
  await mkdir(path.join(out,'data'),{recursive:true});await cp(source,path.join(out,'data/test_clients_simple.json'));
  return data.clients.length;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.info('Статическая сборка готова. Клиентов: '+await build());}
  catch(error){console.error(error.message?.startsWith('Ошибка структуры JSON:')?error.message:'Не удалось собрать сайт. Проверьте JSON и файлы проекта.');process.exitCode=1;}
}
