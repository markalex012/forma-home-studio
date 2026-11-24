const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../studio-core.js');
const video=(name,extras={})=>({id:'v7AYKMP6rOE',title:[name,name,name],cat:'cardio',lang:'ru',level:'beginner',min:15,eq:[],...extras});
test('quick traits use explicit multilingual descriptions',()=>{
 for(const name of ['Кардио без прыжков','NO JUMPING cardio','אימון ללא קפיצות'])assert.equal(F.workoutTraits(video(name)).noJump,true);
 for(const name of ['Кардио только стоя','ALL STANDING workout','אימון בעמידה'])assert.equal(F.workoutTraits(video(name)).standing,true);
 for(const name of ['Тренировка без инвентаря','No equipment workout','אימון ללא ציוד'])assert.equal(F.workoutTraits(video(name)).noEquipment,true);
 const unknown=F.workoutTraits(video('Low impact workout'));
 assert.deepEqual(unknown,{noJump:false,standing:false,noEquipment:false});
 assert.equal(F.workoutTraits(video('No weights workout')).noEquipment,false);
 assert.equal(F.workoutTraits(video('Custom',{custom:true})).noEquipment,true);
});
test('quick filters combine without rounding a longer video into fifteen minutes',()=>{
 const a=video('Кардио стоя без прыжков без инвентаря',{durationSeconds:899});
 const b=video(a.title[0],{id:'TJa6bVbosik',durationSeconds:901});
 const opts={lang:'ru',quick:{maxMinutes:15,noJump:true,standing:true,noEquipment:true}};
 assert.deepEqual(F.catalogShelves([a,b],opts)[0].workouts.map(w=>w.id),[a.id]);
 const result=F.catalogShelves([a],{...opts,quick:{standing:true},lang:'en'});
 assert.equal(result.flatMap(s=>s.workouts).length,0);
});
test('compact titles retain the original source and meaningful text',()=>{
 const w=video('СЖЕЧЬ 500 КАЛОРИЙ за 30 минут! Кардио ТРЕНИРОВКА ДОМА');
 const original=w.title[0];
 const title=F.shortWorkoutTitle(w,'ru');
 assert.equal(title,'Кардио Тренировка Дома');
 assert.equal(w.title[0],original);
 const he=F.shortWorkoutTitle(video('יוגה למתחילים🧘🏼‍♀️ תנועה נעימה | לאה יוגה'),'he');
 assert.equal(he,'יוגה למתחילים תנועה נעימה');
 const long=F.shortWorkoutTitle(video('Подробная тренировка для начинающих '.repeat(8)),'ru');
 assert.ok(Array.from(long).length<=68);
 assert.ok(long.endsWith('…'));
 assert.equal(F.shortWorkoutTitle(video('BEGINNER FULL BODY HIIT WORKOUT (No Equipment) | Coach'),'en'),'Beginner Full Body HIIT Workout');
});
