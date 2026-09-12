/* ============================================================
   runyoussef.me — behaviour
   Split out of index.html for organization.
   Depends on AOS having loaded first (the aos.js script tag above).
   ============================================================ */
(function(){
  var reduceMotion = false;
  try{ reduceMotion = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

  /* scroll-in animations (AOS) */
  try{ AOS.init({ duration: 750, once: false, disable: reduceMotion }); }catch(e){}

  /* falling-snow background (hand-rolled canvas — same look as the template's
     setting, but the particles.js CDN build for this template is a broken rewrite
     that never sizes its canvas, so pulling the real lib wasn't viable) */
  function startSnow(id){
    var canvas = document.getElementById(id);
    if(!canvas) return;
    try{ if(!canvas.getContext) return; }catch(e){ return; }
    var ctx = canvas.getContext('2d');
    var N = 75, D = [], W = 0, H = 0;
    function resize(){
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    function init(){
      resize();
      D = [];
      for(var i=0;i<N;i++){
        D.push({ x:Math.random()*W, y:Math.random()*H, r:2+Math.random()*8, s:0.3+Math.random()*0.7 });
      }
    }
    function step(){
      if(!W || !H) return;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = document.documentElement.classList.contains('dark-mode') ? '#ffffff' : '#000000';
      for(var i=0;i<D.length;i++){
        var p=D[i];
        p.y += p.s;
        p.x += Math.sin((p.y+p.r)*0.02);
        if(p.y > H+10){ p.y = -10; p.x = Math.random()*W; }
        ctx.fillRect(p.x, p.y, Math.max(2,p.r*0.6), Math.max(2,p.r*0.6));
      }
    }
    init();
    setInterval(step, 33);
    window.addEventListener('resize', init);
  }
  if(!reduceMotion){ startSnow('particles-js'); }

  /* dark mode (persisted to localStorage 'mode') */
  var root = document.documentElement;
  var sw = document.getElementById('mode-switch');
  function applyDark(on){
    root.classList.toggle('dark-mode', on);
  }
  function loadMode(){
    var m='Light';
    try{ m = localStorage.getItem('mode') || 'Light'; }catch(e){}
    if(m==='Dark'){ sw.checked = true; applyDark(true); }
  }
  sw.addEventListener('change', function(){
    var on = sw.checked;
    applyDark(on);
    try{ localStorage.setItem('mode', on ? 'Dark' : 'Light'); }catch(e){}
  });
  loadMode();

  /* copyright year */
  var yr = document.getElementById('year');
  if(yr){ yr.textContent = String(new Date().getFullYear()); }
})();