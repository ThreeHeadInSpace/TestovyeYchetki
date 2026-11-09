const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {ASSETS,shuffled,flight,create}=require('../src/celebration.js');

test('Все 16 локальных PNG существуют, перемешивание сохраняет набор',()=>{
  assert.equal(ASSETS.length,16);
  for(const asset of ASSETS)assert.ok(fs.existsSync(path.join(__dirname,'../src',asset)));
  assert.deepEqual([...shuffled(ASSETS)].sort(),[...ASSETS].sort());
  assert.notDeepEqual(shuffled(ASSETS,()=>0),ASSETS);
});
test('Траектория начинается у кнопки, изгибается вверх и уходит вниз влево',()=>{
  const frames=flight({x:1000,y:80,drift:450,fall:900,lift:250,rotation:90});
  assert.equal(frames.length,37);
  assert.match(frames[0].transform,/1000px,80px/);
  assert.match(frames.at(-1).transform,/550px,980px/);
  const positions=frames.map(f=>Number(f.transform.match(/px,([\d.-]+)px/)[1]));
  assert.ok(Math.min(...positions)<80);
  assert.equal(frames[0].opacity,0);assert.equal(frames.at(-1).opacity,0);
});
test('Повторные нажатия ограничены 18 PNG; после полёта элементы удаляются; reduced motion без дуги',async()=>{
  const oldWindow=global.window,oldDocument=global.document;
  const children=new Set(),animations=[];let reduced=false;const messages=[];
  try{
    global.window={innerWidth:1280,innerHeight:900,matchMedia:()=>({matches:reduced})};
    global.document={createElement:()=>({remove(){children.delete(this);},animate(frames,options){let resolve;const animation={frames,options,finished:new Promise(r=>resolve=r),cancel(){resolve();},finish(){resolve();}};animations.push(animation);return animation;}})};
    const button={getBoundingClientRect:()=>({right:1250,bottom:70})};
    const run=create(button,{append:img=>children.add(img)},m=>messages.push(m));
    run();assert.equal(children.size,6);
    assert.equal(new Set([...children].map(i=>i.src)).size,6);
    run();run();run();assert.equal(children.size,18);
    for(const animation of animations)animation.finish();
    await new Promise(r=>setImmediate(r));assert.equal(children.size,0);
    reduced=true;run();assert.equal(children.size,1);
    const frames=animations.at(-1).frames;assert.equal(new Set(frames.map(f=>f.transform)).size,1);
    animations.at(-1).finish();await new Promise(r=>setImmediate(r));assert.equal(children.size,0);
    assert.equal(messages.length,5);
  }finally{global.window=oldWindow;global.document=oldDocument;}
});
