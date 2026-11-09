import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {validate,access}=createRequire(import.meta.url)('../src/core.js');
try{
  const filename=fileURLToPath(new URL('../src/data/test_clients_simple.json',import.meta.url));
  const data=validate(JSON.parse((await readFile(filename,'utf8')).replace(/^\uFEFF/,'')));
  console.info('Проверено клиентов: '+data.clients.length+'. Доступных: '+data.clients.filter(c=>access(c).available).length+'. Альтернативных паролей: '+data.clients.reduce((n,c)=>n+(c.other_passwords?.length||0),0)+'.');
}catch(error){console.error(error?.message?.startsWith('Ошибка структуры JSON:')?error.message:'Не удалось прочитать JSON. Содержимое и значения не выводятся.');process.exitCode=1;}
