(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FormaCore=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ID=/^[A-Za-z0-9_-]{11}$/;
const categories=['yoga','pilates','stretch','dance','strength','cardio','mobility','warmup'];
function videoId(value){try{if(ID.test(value))return value;const u=new URL(value);if(u.protocol!=='https:')return null;if(u.hostname==='youtu.be'){const id=u.pathname.slice(1);return ID.test(id)?id:null;}if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)){let id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})$/)?.[1];return id&&ID.test(id)?id:null;}return null;}catch{return null;}}
function safeName(v,max=100){return typeof v==='string'?v.trim().slice(0,max):'';}
function program(p){if(!p||typeof p!=='object')throw Error('program');const id=safeName(p.id,80),name=safeName(p.name),steps=Array.isArray(p.steps)?p.steps.filter(x=>typeof x==='string'&&ID.test(x)).slice(0,30):[];if(!id||!name||!steps.length||steps.length!==p.steps.length)throw Error('program');return{id,name,steps};}
function customVideo(v){if(!v||!ID.test(v.id)||!categories.includes(v.cat)||!['ru','he','en'].includes(v.lang)||!Number.isFinite(v.min)||v.min<1||v.min>180)throw Error('video');const name=safeName(v.name||v.title?.[0]);if(!name)throw Error('video');return{id:v.id,name,cat:v.cat,lang:v.lang,min:Math.round(v.min),level:['beginner','moderate','advanced'].includes(v.level)?v.level:'beginner',eq:Array.isArray(v.eq)?v.eq.filter(e=>['mat','dumbbells','bands','blocks','chair','ball'].includes(e)):[],coach:safeName(v.coach)||'YouTube',title:[name,name,name],custom:true};}
function readBackup(input){const d=typeof input==='string'?JSON.parse(input):input;if(!d||d.format!=='forma-studio'||d.version!==1)throw Error('format');const favorites=Array.isArray(d.favorites)?d.favorites.filter(x=>typeof x==='string'&&ID.test(x)).slice(0,1000):[];const equipment=Array.isArray(d.equipment)?d.equipment.filter(e=>['mat','dumbbells','bands','blocks','chair','ball'].includes(e)):[];const programs=(d.programs||[]).slice(0,100).map(program);if(new Set(programs.map(p=>p.id)).size!==programs.length)throw Error('duplicate');const week={};for(let day=0;day<7;day++){const p=d.week?.[day];if(p&&programs.some(x=>x.id===p))week[day]=p;}const custom=(d.custom||[]).slice(0,300).map(customVideo);const history=(d.history||[]).filter(h=>h&&ID.test(h.videoId)&&Number.isFinite(h.time)&&Number.isFinite(h.minutes)&&h.minutes>0&&h.minutes<=180).slice(-1000).map(h=>({videoId:h.videoId,time:h.time,minutes:h.minutes}));return{favorites,equipment,programs,week,custom,history};}
function total(steps,catalog){return steps.reduce((n,id)=>n+(catalog.find(w=>w.id===id)?.min||0),0);}
function visible(catalog,status,showHidden){return catalog.filter(w=>showHidden||status[w.id]?.status!=='unavailable');}
function sanitizeSession(s){if(!s||!Array.isArray(s.steps)||!s.steps.length||s.steps.length>30||s.steps.some(x=>!ID.test(x)))return null;const index=Number.isInteger(s.index)?s.index:0;if(index<0||index>=s.steps.length)return null;return{steps:s.steps,name:safeName(s.name),index,startedAt:Number.isFinite(s.startedAt)?s.startedAt:Date.now()};}


function workoutTraits(w){
 const text=[w.originalTitle,...(w.title||[])].filter(Boolean).join(' ');
 const supplied=w.traits||{};
 const yes=(key,pattern)=>typeof supplied[key]==='boolean'?supplied[key]:pattern.test(text);
 return {
  noJump:yes('noJump',/\bno[ -]?(?:jumping|jumps?)\b|без\s+прыжк|(?:ללא|בלי)\s+קפיצות/iu),
  standing:yes('standing',/\ball[ -]standing\b|\bstanding\b|(?:только\s+)?стоя(?=$|[^\p{L}])|בעמידה/iu),
  noEquipment:yes('noEquipment',/\bno\s+equipment\b|\bwithout\s+equipment\b|без\s+(?:инвентаря|оборудования)|(?:ללא|בלי)\s+ציוד/iu)||(!!w.custom&&Array.isArray(w.eq)&&w.eq.length===0)
 };
}
function shortWorkoutTitle(w,lang='en',cat=w.cat){
 const raw=String(w.title?.[{ru:0,he:1,en:2}[lang]??2]||w.originalTitle||w.name||'');
 let text=raw.replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\u20E3]/gu,' ').replace(/#[^\s#]+/gu,' ');
 text=text.replace(/^(?:сжечь|сжигаем|сожги|burn)\s+\d[\s\S]*?!\s*/iu,'');
 text=text.split(/\s*[|]+\s*/u)[0].replace(/\([^)]*\)/gu,' ');
 text=text.replace(/\([^)]*(?:ккал|калори|calorie|קלוריות)[^)]*\)/giu,' ')
  .replace(/[-–—(]?\s*\d[\d., ]*\s*(?:ккал|калори[а-я]*|calories|קלוריות)\s*\)?/giu,' ')
  .replace(/(?:сжигаем|сжечь|сожги|burn(?:s|ing)?|שריפת)\s+(?:до\s+|up to\s+)?(?:\d[\d., ]*\s*)?(?:ккал|калори[а-я]*|calories|קלוריות)/giu,' ')
  .replace(/(?:для\s+похудения|для\s+жиросжигания|\bfor\s+weight\s+loss\b|\bfat[ -]burn(?:ing)?\b|לירידה במשקל)/giu,' ')
  .replace(/\d+\s*%\s*похудение[^.!?]*(?:[.!?]|$)/giu,' ')
  .replace(/^\*+|\*+$/gu,'').replace(/\s+/gu,' ').replace(/^[\s!.,:;–—-]+|[\s!.,:;–—-]+$/gu,'').trim();
 if(!text||text.length<4)text={ru:{yoga:'Йога',pilates:'Пилатес',stretch:'Растяжка',dance:'Танцевальная тренировка',strength:'Силовая тренировка',cardio:'Кардио',mobility:'Мобилити',warmup:'Разминка и заминка'},he:{yoga:'יוגה',pilates:'פילאטיס',stretch:'מתיחות',dance:'אימון ריקוד',strength:'אימון כוח',cardio:'אירובי',mobility:'מוביליטי',warmup:'חימום ושחרור'},en:{yoga:'Yoga',pilates:'Pilates',stretch:'Stretching',dance:'Dance workout',strength:'Strength workout',cardio:'Cardio',mobility:'Mobility',warmup:'Warm up and cool down'}}[lang]?.[cat]||raw;
 if(lang!=='he')text=text.replace(/\p{L}{3,}/gu,word=>word===word.toLocaleUpperCase()&&!['HIIT','TRX','ВИИТ','ТБС','ABS'].includes(word)?word[0]+word.slice(1).toLocaleLowerCase():word);
 const letters=text.replace(/[^\p{L}]/gu,'');
 if(lang!=='he'&&letters.length>6&&letters===letters.toLocaleUpperCase()){
  text=text.toLocaleLowerCase();text=text[0].toLocaleUpperCase()+text.slice(1);
 }
 if(Array.from(text).length>68){const clip=Array.from(text).slice(0,65).join('');text=clip.replace(/\s+\S*$/u,'').replace(/[\s,.:;–—-]+$/u,'')+'…';}
 return text;
}

function inCategory(w,cat){return !cat||w.cat===cat||(Array.isArray(w.placements)&&w.placements.some(p=>p.cat===cat));}
function shelfLevel(w,cat){const placement=Array.isArray(w.placements)&&w.placements.find(p=>p.cat===cat);return (placement?placement.level:w.level)==='beginner'?'beginner':'advanced';}
function catalogShelves(catalog,opts={}){
 const {lang,cat='',status={},showUnavailable=false,onlyCustom=false,favorites=null,query='',duration='',level='',equipment='',owned=[],limit=12,quick={}}=opts;
 const seen=new Set(),q=query.trim().toLocaleLowerCase();
 const selected=catalog.filter(w=>{
  if((w.archived&&!favorites&&!w.custom)||w.lang!==lang||!inCategory(w,cat)||seen.has(w.id)||(!showUnavailable&&status[w.id]?.status==='unavailable')||(onlyCustom&&!w.custom)||(favorites&&!favorites.has(w.id)))return false;
  if(q&&![...(w.title||[]),w.coach||''].join(' ').toLocaleLowerCase().includes(q))return false;
  if(duration&&(duration==='short'?w.min>10:duration==='medium'?w.min<=10||w.min>20:w.min<=20))return false;
  const traits=workoutTraits(w);
  if(quick.maxMinutes&&((w.durationSeconds??w.min*60)>quick.maxMinutes*60))return false;
  if(['noJump','standing','noEquipment'].some(key=>quick[key]&&!traits[key]))return false;
  const eq=w.eq||[];
  if(equipment&&(equipment==='none'?eq.length>0:equipment==='owned'?!eq.every(e=>owned.includes(e)):!eq.includes(equipment)))return false;
  seen.add(w.id);return true;
 }).sort((a,b)=>Number(!!b.custom)-Number(!!a.custom)||((a.placements||[]).find(p=>p.cat===cat)?.order??1000)-((b.placements||[]).find(p=>p.cat===cat)?.order??1000));
 return ['beginner','advanced'].filter(key=>!level||key===(level==='moderate'?'advanced':level)).map(key=>({level:key,workouts:selected.filter(w=>shelfLevel(w,cat)===key).slice(0,limit)}));
}

return{workoutTraits,shortWorkoutTitle,inCategory,shelfLevel,catalogShelves,videoId,safeName,program,customVideo,readBackup,total,visible,sanitizeSession,categories};
});