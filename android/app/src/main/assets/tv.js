(function () {
  if (window.formaTVReady) return;
  window.formaTVReady = true;
  document.body.classList.add('tv');
  var tv = document.getElementById('tvMode');
  if (tv) { tv.classList.add('active'); tv.setAttribute('aria-pressed', 'true'); }
  var style = document.createElement('style');
  style.textContent = 'body.tv header{height:76px}body.tv .hero{min-height:420px}body.tv .hero-content{padding-top:38px;padding-bottom:55px}body.tv h1{font-size:46px}body.tv .hero-side{display:none}body.tv .category .cat-text strong{font-size:15px}body.tv .filter-bar select,body.tv .search-wrap input{font-size:15px}body.tv .eyebrow{font-size:12px}body.tv .card-body .coach{font-size:14px}body.tv .card-kicker{font-size:12px}body.tv .cards{grid-template-columns:repeat(3,1fr)}body.tv .card-body h3{font-size:20px}body.tv .card-bottom small,body.tv .card-bottom button{font-size:13px}body.tv :focus{outline:4px solid #b57b36!important;outline-offset:4px!important}';
  document.head.appendChild(style);
  document.addEventListener('click', function (event) {
    var play = event.target.closest('[data-play]');
    if (play && /^[A-Za-z0-9_-]{11}$/.test(play.dataset.play)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      location.href = 'forma://video/' + play.dataset.play;
    }
  }, true);
  document.addEventListener('keydown', function (event) {
    var element = document.activeElement;
    if (!element || element.tagName === 'SELECT' || element.tagName === 'INPUT') return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Unidentified' && event.keyCode === 23) {
      if (element.matches('button,a[href]')) { event.preventDefault(); element.click(); }
    }
  }, true);
  var start = document.getElementById('explore');
  if (start) start.focus({preventScroll:true});
}());
