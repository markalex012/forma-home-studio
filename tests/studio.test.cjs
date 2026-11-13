const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../studio-core.js');
const video='v7AYKMP6rOE';
test('supported links; rejects lookalike hosts and scripts',()=>{
  assert.equal(F.videoId('https://youtu.be/'+video),video);
  assert.equal(F.videoId('https://www.youtube.com/watch?v='+video+'&t=10'),video);
  assert.equal(F.videoId('https://youtube.com/shorts/'+video),video);
  for(const link of ['javascript:alert(1)','https://youtube.com.evil.example/watch?v='+video,'http://youtu.be/'+video,'https://youtu.be/'+video+'/extra'])assert.equal(F.videoId(link),null);
});
test('backup round trip preserves programs and custom videos',()=>{
  const d={format:'forma-studio',version:1,favorites:[video],equipment:['mat'],programs:[{id:'morning',name:'Morning',steps:[video]}],week:{0:'morning',1:'missing'},history:[{videoId:video,time:123,minutes:24}],custom:[{id:'TJa6bVbosik',name:'My class',cat:'pilates',lang:'he',min:20,eq:['mat']}]};
  const result=F.readBackup(JSON.stringify(d));
  const restored=F.readBackup({...result,format:'forma-studio',version:1});
  assert.deepEqual(result,restored);
  assert.equal(result.custom[0].name,'My class');
  assert.equal(result.week[1],undefined);
  assert.equal(result.history[0].minutes,24);
});
test('invalid restore fails without replacing application data',()=>{
  assert.throws(()=>F.readBackup({format:'another-app',version:1}));
  assert.throws(()=>F.readBackup({format:'forma-studio',version:1,programs:[{id:'bad',name:'Bad',steps:['malicious']}]}));
  assert.throws(()=>F.readBackup({format:'forma-studio',version:1,custom:[{id:video,name:'bad',cat:'yoga',lang:'ru',min:-2}]}));
});
test('session recovery rejects invalid steps and positions',()=>{
  assert.equal(F.sanitizeSession({steps:[video],index:3}),null);
  assert.equal(F.sanitizeSession({steps:['bad'],index:0}),null);
  assert.equal(F.sanitizeSession({steps:[video],index:0,name:'Morning'}).index,0);
});
test('duration includes repeated stages without inventing missing durations',()=>{
  assert.equal(F.total([video,video,'TJa6bVbosik'],[{id:video,min:24}]),48);
});
test('hidden sources remain inspectable without losing saved IDs',()=>{
  const catalog=[{id:video},{id:'TJa6bVbosik'}],status={[video]:{status:'unavailable'}};
  assert.equal(F.visible(catalog,status,false).length,1);
  assert.equal(F.visible(catalog,status,true).length,2);
});
