/* Boot: menu, then register whichever scenes loaded; hero first, the rest in idle time. */
(function(G){
'use strict';
const {motion,freeze,idle,ticker,clamp}=G;
/* ---------- menu ---------- */
const menu=document.getElementById('menu'), links=document.getElementById('links');
const setMenu=o=>{ links.classList.toggle('open',o); menu.setAttribute('aria-expanded',o); menu.setAttribute('aria-label',o?'Close menu':'Open menu'); };
menu.addEventListener('click',()=>setMenu(!links.classList.contains('open')));
links.addEventListener('click',e=>{ if(e.target.tagName==='A') setMenu(false); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&links.classList.contains('open')){ setMenu(false); menu.focus(); } });

/* ---------- progressive start: hero first, the rest while the reader reads ---------- */
function boot(){
  const apis={};
  const reg=(k,el,init)=>{ ticker.add(k,el,()=>{ apis[k]=init(); },dt=>{ const a=apis[k]; if(a&&a.tick) a.tick(dt); }); };
  const S=G.scenes;
  if(S.hero) reg('hero',document.getElementById('hero-scene'),S.hero);
  if(S.aerial) reg('aerial',document.getElementById('aerial-scene'),S.aerial);
  if(S.beyond) reg('beyond',document.getElementById('beyond-scene'),S.beyond);
  // figures: by default v1 + v4 in "Trees" and v3 in "How it adapts". ?v= picks exactly what to show
  // (comma-separated); ?v=0 shows none (the text-only page).
  // Slots: trees (v1 or v2), trees2 (v4, early warning, with its note), adapts (v3).
  const q=new URLSearchParams(location.search).get('v'), V=q===null?[1,3,4]:q.split(',').map(Number).filter(n=>n>=1&&n<=4);
  const want={trees:V.find(n=>n===1||n===2), trees2:V.includes(4)?4:undefined, adapts:V.includes(3)?3:undefined};
  const note=document.getElementById('note-ew'); if(note) note.hidden=!want.trees2;
  for(const key of ['trees','trees2','adapts']){ const el=document.getElementById('draft-'+key); if(!el) continue; const v=want[key];
    if(!v||!S.draft){ el.hidden=true; continue; } el.hidden=false; el.dataset.v=v; reg('draft-'+key,el,()=>S.draft(v,'c-draft-'+key)); if(freeze) ticker.prebuild('draft-'+key); }
  // Figures in this stretch look alike and crowd each other. One rule for all of them: once the next
  // figure comes up the screen, the one you have passed recedes (its top from 95% to 50% of the
  // viewport takes the previous figure's opacity 1 -> 0.1). Reversible, scroll-linked, rect-measured,
  // never blocks scrolling; off under reduced motion and ?freeze=1. Text never fades, only figures.
  const figs=['trees','trees2','adapts'].map(k=>document.getElementById('draft-'+k)).filter(el=>el&&!el.hidden);
  if(figs.length>1&&!freeze){ let raf=0;
    const fade=()=>{ raf=0; const vh=innerHeight;
      for(let i=0;i<figs.length-1;i++){ if(motion.reduce){ figs[i].style.opacity=''; continue; }
        const p=clamp((vh*.95-figs[i+1].getBoundingClientRect().top)/(vh*.45),0,1); figs[i].style.opacity=p?String(1-.9*p):''; } };
    const req=()=>{ if(!raf) raf=requestAnimationFrame(fade); };
    addEventListener('scroll',req,{passive:true}); addEventListener('resize',req); motion.on(req); req(); }
  if(freeze){ ticker.prebuild('hero'); ticker.prebuild('aerial'); ticker.prebuild('beyond'); document.documentElement.dataset.frozen='1'; return; }
  // one pause for every scene; each moving scene carries a copy of the control, kept in sync
  const pauses=[...document.querySelectorAll('.pause')];
  const sync=()=>{ for(const b of pauses){ b.hidden=motion.reduce; b.setAttribute('aria-pressed',motion.paused); const l=motion.paused?'Play animations':'Pause animations'; b.setAttribute('aria-label',l); b.title=l; } };
  for(const b of pauses) b.addEventListener('click',()=>{ motion.paused=!motion.paused; motion.emit(); });
  motion.on(sync);
  motion.on(()=>{ if(!motion.reduce) return; for(const k in apis){ const a=apis[k]; if(a&&a.still){ try{ a.still(); }catch(e){ console.error(k,e); } } } });
  sync();
  ticker.prebuild('hero'); ticker.start();
  // lower scenes build in idle time; under reduced motion they build only when approached
  if(!motion.reduce){ idle(()=>ticker.prebuild('aerial'),1500); idle(()=>ticker.prebuild('beyond'),2500); }
}
const start=freeze?()=>{ (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(boot); }:boot;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})(window.Giganteum);
