/* Boot: menu, then register whichever scenes loaded; hero first, the rest in idle time. */
(function(G){
'use strict';
const {motion,freeze,idle,ticker}=G;
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
  // draft graphics, only with ?v=1..4 (comma-separated); v3 sits in "How it adapts", the others in "Trees"
  const V=(new URLSearchParams(location.search).get('v')||'').split(',').map(Number).filter(n=>n>=1&&n<=4);
  const slot=(key,v)=>{ const el=document.getElementById('draft-'+key); if(!el||!S.draft) return; el.hidden=false; el.dataset.v=v; document.documentElement.classList.add('draft-'+key); reg('draft-'+key,el,()=>S.draft(v,'c-draft-'+key)); if(freeze) ticker.prebuild('draft-'+key); };
  const tv=V.find(n=>n!==3); if(tv) slot('trees',tv); if(V.includes(3)) slot('adapts',3);
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
