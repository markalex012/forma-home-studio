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

function inCategory(w,cat){return !cat||w.cat===cat||(Array.isArray(w.placements)&&w.placements.some(p=>p.cat===cat));}
function shelfLevel(w,cat){const placement=Array.isArray(w.placements)&&w.placements.find(p=>p.cat===cat);return (placement?placement.level:w.level)==='beginner'?'beginner':'advanced';}
function catalogShelves(catalog,opts={}){
 const {lang,cat='',status={},showUnavailable=false,onlyCustom=false,favorites=null,query='',duration='',level='',equipment='',owned=[],limit=12}=opts;
 const seen=new Set(),q=query.trim().toLocaleLowerCase();
 const selected=catalog.filter(w=>{
  if((w.archived&&!favorites&&!w.custom)||w.lang!==lang||!inCategory(w,cat)||seen.has(w.id)||(!showUnavailable&&status[w.id]?.status==='unavailable')||(onlyCustom&&!w.custom)||(favorites&&!favorites.has(w.id)))return false;
  if(q&&![...(w.title||[]),w.coach||''].join(' ').toLocaleLowerCase().includes(q))return false;
  if(duration&&(duration==='short'?w.min>10:duration==='medium'?w.min<=10||w.min>20:w.min<=20))return false;
  const eq=w.eq||[];
  if(equipment&&(equipment==='none'?eq.length>0:equipment==='owned'?!eq.every(e=>owned.includes(e)):!eq.includes(equipment)))return false;
  seen.add(w.id);return true;
 }).sort((a,b)=>Number(!!b.custom)-Number(!!a.custom)||((a.placements||[]).find(p=>p.cat===cat)?.order??1000)-((b.placements||[]).find(p=>p.cat===cat)?.order??1000));
 return ['beginner','advanced'].filter(key=>!level||key===(level==='moderate'?'advanced':level)).map(key=>({level:key,workouts:selected.filter(w=>shelfLevel(w,cat)===key).slice(0,limit)}));
}

return{inCategory,shelfLevel,catalogShelves,videoId,safeName,program,customVideo,readBackup,total,visible,sanitizeSession,categories};
});