import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {build} from '../scripts/build.mjs';
test('Статическая сборка содержит JSON и безопасный офлайн-слепок того же массива клиентов',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'catalog-static-'));
  try{
    await cp(new URL('../src/',import.meta.url),path.join(root,'src'),{recursive:true,filter:p=>!String(p).endsWith('test_clients_simple.json')});
    await mkdir(path.join(root,'src/data'),{recursive:true});
    const data={clients:[{name:'Демо Вымышленный',login:'TEST-LOGIN',password:'NOT-A-REAL-PASSWORD',id:'TEST-ID',products:['Кредит </script>'],available:true,other_passwords:['FAKE-ALTERNATIVE']}]};
    const source=path.join(root,'src/data/test_clients_simple.json');await writeFile(source,JSON.stringify(data));
    assert.equal(await build(root),1);
    assert.deepEqual(JSON.parse(await readFile(path.join(root,'dist/data/test_clients_simple.json'),'utf8')),data);
    const code=await readFile(path.join(root,'dist/data/clients-data.js'),'utf8');assert.doesNotMatch(code,/<\/script>/);
    const sandbox={};vm.createContext(sandbox);vm.runInContext(code,sandbox);assert.deepEqual(JSON.parse(JSON.stringify(sandbox.TESTING_CLIENTS)),data);
    await writeFile(source,'{"password":"NEVER-PRINT",');await assert.rejects(()=>build(root));
  }finally{const resolved=path.resolve(root);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep+'catalog-static-'));await rm(resolved,{recursive:true,force:true});}
});
test('В интерфейсе и загрузке нет авторизации, endpoint-ов сессии или запросов входа',async()=>{
  const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');new vm.Script(app);
  const html=await readFile(new URL('../src/index.html',import.meta.url),'utf8');
  assert.doesNotMatch(app,/api\/session|api\/logout|api\/clients|auth-panel|login-form|localStorage|sessionStorage/);
  assert.doesNotMatch(html,/id="logout"|id="auth-panel"|id="login-form"/);
  assert.match(app,/view\('catalog',false\)/);
});
