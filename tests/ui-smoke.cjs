/* DOM integration smoke checks; no browser or media playback required. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const catalog=JSON.parse(fs.readFileSync('catalog.json','utf8'));
const errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{
 url:'https://markalex012.github.io/forma-home-studio/',
 runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
 beforeParse(window){window.scrollTo=()=>{};window.HTMLElement.prototype.scrollIntoView=()=>{};
 window.fetch=async()=>({ok:true,json:async()=>catalog});}
});
const {window}=dom;const doc=window.document;
const styles=doc.createElement('style');styles.textContent=fs.readFileSync('studio.css','utf8');doc.head.append(styles);
window.eval(fs.readFileSync('studio-core.js','utf8'));
window.eval(fs.readFileSync('studio.js','utf8'));
const click=node=>node.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}));
async function run(){
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(doc.querySelectorAll('#categories a').length,8);
 assert.equal(doc.querySelector('#library').hidden,true);
 assert.equal(doc.querySelectorAll('#cards .workout').length,0);
 assert.equal(doc.querySelectorAll('#footerNav a').length,6);
 click(doc.querySelector('#tvMode'));assert.equal(doc.body.classList.contains('tv'),true);assert.equal(doc.querySelector('#tvMode').getAttribute('aria-pressed'),'true');
 let checked=0;
 for(const lang of ['ru','he','en']){
  doc.querySelector('#uiLanguage').value=lang;
  doc.querySelector('#uiLanguage').dispatchEvent(new window.Event('change'));
  assert.equal(doc.documentElement.lang,lang);
  assert.equal(doc.documentElement.dir,lang==='he'?'rtl':'ltr');
  assert.equal(doc.querySelector('#videoLanguage').hidden,true);
  for(const cat of window.FormaCore.categories){
   click(doc.querySelector('#nav [data-route="studio"]'));
   click(doc.querySelector('#categories [data-cat="'+cat+'"]'));
   assert.equal(doc.querySelector('#library').hidden,false);
   assert.equal(doc.querySelector('#categories').hidden,true);
   const sections=doc.querySelectorAll('#cards .level-section');
   assert.equal(sections.length,2);
   for(const section of sections)assert.equal(section.querySelectorAll('.workout').length,12,lang+'/'+cat);
   const ids=[...doc.querySelectorAll('#cards .launch')].map(b=>b.dataset.play);
   assert.equal(new Set(ids).size,24);
   for(const id of ids)assert.equal(catalog.workouts.find(w=>w.id===id).lang,lang);
   assert.equal(doc.querySelector('#cards').textContent.includes('undefined'),false);
   click(doc.querySelector('#reset'));
   assert.equal(doc.querySelectorAll('#cards .workout').length,24);
   assert.equal(doc.querySelectorAll('#quickFilters [data-quick]').length,4);
   assert.equal(doc.querySelectorAll('#cards .workout-details').length,24);
   const first=doc.querySelector('#cards .workout');
   const source=catalog.workouts.find(w=>w.id===first.querySelector('[data-play]').dataset.play);
   assert.equal(first.querySelector('.original-title').textContent,source.originalTitle||source.title[0]);
   assert.equal(first.querySelector('h3').textContent,window.FormaCore.shortWorkoutTitle(source,lang,cat));
   assert.equal(window.getComputedStyle(first.querySelector('h3')).fontSize,'23px');
   for(const key of ['maxMinutes','noJump','standing','noEquipment']){
    const button=doc.querySelector('#quickFilters [data-quick="'+key+'"]');
    if(button.disabled)continue;
    click(button);
    assert.equal(doc.querySelector('#quickFilters [data-quick="'+key+'"]').getAttribute('aria-pressed'),'true');
    for(const play of doc.querySelectorAll('#cards .launch')){
     const w=catalog.workouts.find(w=>w.id===play.dataset.play);
     assert.equal(w.lang,lang);
     if(key==='maxMinutes')assert.ok((w.durationSeconds??w.min*60)<=900);
     else assert.equal(window.FormaCore.workoutTraits(w)[key],true);
    }
    click(doc.querySelector('#reset'));
    assert.equal(doc.querySelectorAll('#cards .workout').length,24);
   }
   checked++;
  }
  doc.querySelector('#search').value='not-a-real-video-title-12345';
  doc.querySelector('#search').dispatchEvent(new window.Event('input'));
  assert.equal(doc.querySelectorAll('#cards .workout').length,0);
  click(doc.querySelector('#reset'));
  click(doc.querySelector('#activeSummary button'));
  assert.equal(doc.querySelector('#library').hidden,true);
  click(doc.querySelector('#footerNav a[href="#equipment"]'));
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(doc.querySelector('#equipmentSection').hidden,false);
  assert.equal(doc.querySelectorAll('#equipmentList input').length,6);
 }
 assert.deepEqual(errors,[]);
 click(doc.querySelector('#tvMode'));assert.equal(doc.body.classList.contains('tv'),false);
 console.log('DOM smoke checks passed: '+checked+' localized category pages, both 12-card shelves, filters, return home, footer equipment and RTL.');
 dom.window.close();
}
run().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
