(function(){
window.formaNative=true;window.formaTVReady=true;
document.body.classList.add('app-mode','mouse-mode');
document.body.classList.remove('tv');
var toggle=document.getElementById('tvMode');if(toggle)toggle.hidden=true;
// Compatibility while the updated website propagates through CDN caches.
if(!window.FormaCore){document.addEventListener('click',function(e){var p=e.target.closest('[data-play]');if(p&&/^[A-Za-z0-9_-]{11}$/.test(p.dataset.play)){e.preventDefault();e.stopImmediatePropagation();location.href='forma://video/'+p.dataset.play;}},true);}
})();