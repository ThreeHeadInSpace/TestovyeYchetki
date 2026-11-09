const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../src/core.js');
const client=extra=>({name:'Демо Вымышленный',login:'TEST-LOGIN',password:'FAKE-PASSWORD',id:'001',products:['Кредитная карта (просрочка)','Вклад'],available:true,...extra});
const filters=extra=>({query:'',products:new Set(),statuses:new Set(),availability:new Set(),...extra});
test('Простая структура, необязательные поля и понятные ошибки без значений',()=>{
  const c=client({other_passwords:['FAKE-ALTERNATIVE'],access_note:'',no_products:false});C.validate({clients:[c]});C.validate({clients:[]});
  for(const change of [d=>d.clients[0].available='false',d=>d.clients[0].products=[123],d=>d.clients[0].other_passwords='bad',d=>d.clients[0].unknown='data',d=>d.clients[0].no_products=true,d=>d.clients[0].password='DO-NOT-PRINT\nVALUE']){
    const d={clients:[client()]};change(d);assert.throws(()=>C.validate(d),e=>e.message.includes('clients[0]')&&!e.message.includes('DO-NOT-PRINT'));
  }
});
test('Описание — точное объединение products, два разных пустых состояния',()=>{
  const c=client();assert.equal(C.description(c),'Кредитная карта (просрочка) · Вклад');
  assert.equal(C.description(client({products:[],no_products:true})),'Продуктов нет');
  assert.equal(C.description(client({products:[]})),'Нет данных о продуктах');
});
test('Доступность: available и access_note, пустые логин и пароль не пропускаются',()=>{
  assert.equal(C.access(client()).available,true);
  for(const c of [client({available:false,access_note:'Обновить пароль'}),client({login:''}),client({password:''}),client({login:null,password:null})])assert.equal(C.access(c).available,false);
  assert.equal(C.access(client({available:false,access_note:'Проверка доступа'})).reason,'Проверка доступа');
  assert.equal(C.access(client({available:false,password:'',access_note:'Не указан пароль.'})).reason,'Не указан пароль.');
});
test('Поиск по ФИО, логину, ID, продуктам; пароли и альтернативы исключены',()=>{
  const c=client({other_passwords:['FAKE-ALTERNATIVE']});
  for(const query of ['демо','TEST-LOGIN','001','вклад','просрочка'])assert.equal(C.matches(c,filters({query})),true);
  for(const query of [c.password,c.other_passwords[0],'ничего не найдено'])assert.equal(C.matches(c,filters({query})),false);
});
test('Мультифильтры OR внутри группы / AND между группами, доступность и порядок',()=>{
  const c=client();assert.equal(C.matches(c,filters({products:new Set(['loan','credit_card']),statuses:new Set(['overdue'])})),true);
  assert.equal(C.matches(c,filters({products:new Set(['loan']),statuses:new Set(['overdue'])})),false);
  const blocked=client({available:false}),arrest=client({products:['Арест ФНС']});
  assert.deepEqual(C.catalogOrder([blocked,arrest,c]),[arrest,c,blocked]);
  assert.equal(C.matches(client({products:[],no_products:true}),filters({statuses:new Set(['no_products'])})),true);
});
test('Весь локальный JSON соответствует новой схеме и сохранён без преобразования',t=>{
  const file=__dirname+'/../src/data/test_clients_simple.json';if(!fs.existsSync(file)){t.skip('Файл клиентов отсутствует');return;}
  const data=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));const before=JSON.stringify(data);C.validate(data);
  data.clients.forEach(c=>{C.access(c);C.description(c);C.matches(c,filters());});
  assert.ok(JSON.stringify(data)===before);assert.ok(data.clients.length>0);
});
