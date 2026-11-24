
const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../studio-core.js');
const sample=(n,lang,level='beginner',cat='yoga')=>({id:String(n).padStart(11,'0'),lang,level,cat,min:20,eq:['mat'],coach:'Coach',title:['Title','Title','Title']});
test('each language gets twelve distinct sessions in both levels',()=>{
 const catalog=['ru','he','en'].flatMap(lang=>['beginner','advanced'].flatMap(level=>Array.from({length:16},(_,i)=>sample((lang==='ru'?0:lang==='he'?100:200)+(level==='advanced'?30:0)+i,lang,level))));
 for(const lang of ['ru','he','en']){
  const shelves=F.catalogShelves(catalog,{lang,cat:'yoga'});
  assert.deepEqual(shelves.map(s=>s.workouts.length),[12,12]);
  for(const shelf of shelves)for(const w of shelf.workouts){assert.equal(w.lang,lang);assert.equal(w.level,shelf.level);}
 }
});
test('same-language favorites, hidden sources and advanced backups retain data',()=>{
 const a=sample(1,'ru'),b=sample(2,'en'),c=sample(3,'ru','advanced');
 const f=new Set([a.id,b.id,c.id]);
 const shelves=F.catalogShelves([a,b,c],{lang:'ru',favorites:f,status:{[a.id]:{status:'unavailable'}}});
 assert.deepEqual(shelves.flatMap(s=>s.workouts).map(w=>w.id),[c.id]);
 assert.equal(f.size,3);
 assert.equal(F.customVideo({...c,name:'My workout'}).level,'advanced');
});
test('curated cross-category placements use their own levels and order',()=>{
 const a={...sample(1,'he','advanced','stretch'),placements:[{cat:'mobility',level:'beginner',order:1}]};
 const b={...sample(2,'he','advanced','stretch'),placements:[{cat:'mobility',level:'beginner',order:0}]};
 const old={...sample(3,'he'),archived:true};
 const shelves=F.catalogShelves([a,a,old,b],{lang:'he',cat:'mobility'});
 assert.deepEqual(shelves[0].workouts.map(w=>w.id),[b.id,a.id]);
 assert.equal(shelves[1].workouts.length,0);
 assert.equal(F.catalogShelves([old],{lang:'he',cat:'yoga'})[0].workouts.length,0);
 assert.equal(F.catalogShelves([old],{lang:'he',favorites:new Set([old.id])})[0].workouts.length,1);
});
test('filters keep the interface language even when no matches remain',()=>{
 const a=sample(1,'ru'),b=sample(2,'en');
 assert.equal(F.catalogShelves([a,b],{lang:'ru',equipment:'dumbbells'}).flatMap(s=>s.workouts).length,0);
 assert.equal(F.catalogShelves([a,b],{lang:'ru',query:'missing'}).flatMap(s=>s.workouts).length,0);
 assert.equal(F.catalogShelves([a,b],{lang:'ru',duration:'short'}).flatMap(s=>s.workouts).length,0);
});
