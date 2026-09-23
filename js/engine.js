/* Shared engine: rng, sprites, the single 30 fps ticker, canvas setup, ring/box.
   Classic script (no build step, works from file://); everything hangs off window.Giganteum. */
(function(){
'use strict';
// One motion policy for every scene: the reader's reduced-motion preference (live, not a
// snapshot), the global pause, and ?freeze=1. Scenes still build and draw while it is on;
// only ticking stops. Listeners run on any change so scenes can settle into a composed frame.
const motionMQ=matchMedia('(prefers-reduced-motion: reduce)');
const motion={paused:false, get reduce(){ return motionMQ.matches; }, get still(){ return freeze||this.paused||this.reduce; },
  fns:[], on(fn){ this.fns.push(fn); }, emit(){ for(const fn of this.fns){ try{ fn(); }catch(e){ console.error(e); } } }};
// the change event is not always delivered (seen in Chromium), so the ticker also polls; one path emits
let lastReduce=motionMQ.matches; motion.check=()=>{ const r=motionMQ.matches; if(r!==lastReduce){ lastReduce=r; motion.emit(); } };
if(motionMQ.addEventListener) motionMQ.addEventListener('change',motion.check); else if(motionMQ.addListener) motionMQ.addListener(motion.check);
const reduce = motion.reduce; // at load; scenes read motion.reduce for the live value
// ?freeze=1: every scene is built at a fixed moment and the ticker never starts (screenshot tests)
const freeze = /[?&]freeze=1(&|$)/.test(location.search); if(freeze) document.documentElement.classList.add('freeze');
const TAU = Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
const DPR=Math.min(devicePixelRatio||1, matchMedia('(max-width: 900px)').matches?1.25:1.5);
const idle=(fn,ms)=>('requestIdleCallback' in window)?requestIdleCallback(fn,{timeout:ms||1200}):setTimeout(fn,ms||300);

/* ---------- canvas helpers ---------- */
function setup(canvas,onResize){
  const ctx=canvas.getContext('2d',{alpha:true}); let W=0,H=0;
  function size(){ const r=canvas.getBoundingClientRect(); const w=Math.max(1,Math.round(r.width)), h=Math.max(1,Math.round(r.height)); if(w===W&&h===H) return false; W=w; H=h; canvas.width=Math.round(W*DPR); canvas.height=Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0); return true; }
  size();
  const re=()=>{ if(size()&&onResize) onResize(); };
  if('ResizeObserver' in window) new ResizeObserver(re).observe(canvas); addEventListener('resize',re); addEventListener('load',re); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(re);
  return {ctx,size,get W(){return W},get H(){return H}};
}
function offscreen(w,h){ const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w*DPR)); c.height=Math.max(1,Math.round(h*DPR)); const x=c.getContext('2d'); x.setTransform(DPR,0,0,DPR,0,0); return {c,x,w,h}; }
// one shared 30fps ticker. Visibility is checked by measuring each scene's rect every few
// ticks (no IntersectionObserver: inside an embedded frame it can stay silent until a layout
// change, which is why the animations only woke up when devtools opened).
const ticker={subs:new Map(),last:performance.now(),acc:0,n:0,
  start(){ const loop=now=>{ let dt=(now-this.last)/1000; this.last=now; dt=Math.min(Math.max(dt,0),.06); this.acc+=dt;
      if(this.acc>=1/31){ const d=this.acc; this.acc=0; this.n++; const check=this.n%8===1; if(check) motion.check();
        for(const [k,s] of this.subs){ if(check){ const r=s.el.getBoundingClientRect(); s.vis=r.width>0&&r.bottom>-400&&r.top<innerHeight+400; if(s.vis&&!s.ready){ try{ s.init(); s.ready=true; }catch(e){ s.ready=true; s.dead=true; console.error(k,e); } } }
          if(s.vis&&s.ready&&!s.dead&&!motion.still){ try{ s.tick(d); }catch(e){ s.dead=true; console.error(k,e); } } } }
      requestAnimationFrame(loop); }; requestAnimationFrame(loop); },
  add(k,el,init,tick){ const s={el,init,tick,vis:false,ready:false,dead:false}; this.subs.set(k,s); return s; },
  prebuild(k){ const s=this.subs.get(k); if(s&&!s.ready){ try{ s.init(); }catch(e){ s.dead=true; console.error(k,e); } s.ready=true; } } };

/* ---------- crown drawing ---------- */
const GREENS=['#8FAF7E','#7FA06E','#6F9160','#9CB98C','#86A877'], LIT=['#B6CFA6','#C3D8B5','#AECA9E'];
function makeCrown(r,x,y,rmin,rmax,pal){
  const rr=rmin+r()*(rmax-rmin); const lobes=[]; const n=4+(r()*4|0);
  for(let i=0;i<n;i++){ const a=r()*TAU,d=r()*rr*.45; lobes.push([Math.cos(a)*d,Math.sin(a)*d,rr*(.55+r()*.4)]); }
  const g=pal||GREENS, l=pal?['#9DB88A']:LIT;
  return {x,y,r:rr,lobes,base:g[r()*g.length|0],lit:l[r()*l.length|0],id:Math.floor(r()*1e9)};
}
function drawCrown(ctx,c,sx,sy,alpha,tint,shadow){
  if(alpha<=0) return; ctx.globalAlpha=alpha;
  if(shadow){ ctx.fillStyle='rgba(21,32,26,.18)'; ctx.beginPath(); ctx.ellipse(sx+shadow[0],sy+shadow[1],c.r*.95,c.r*.75,0,0,TAU); ctx.fill(); }
  const base = tint ? tint[0] : c.base, lit = tint ? tint[1] : c.lit;
  ctx.fillStyle=base; for(const [dx,dy,lr] of c.lobes){ ctx.beginPath(); ctx.arc(sx+dx,sy+dy,lr,0,TAU); ctx.fill(); }
  ctx.globalAlpha=alpha*.5; ctx.fillStyle=lit; ctx.beginPath(); ctx.arc(sx-c.r*.22,sy-c.r*.25,c.r*.42,0,TAU); ctx.fill(); ctx.globalAlpha=1;
}
// sprite sheet: crowns are rasterised once and blitted, which is what makes the flyover cheap
function makeSprites(seed,n,rmin,rmax,pal){ const q=rng(seed); const out=[]; for(let i=0;i<n;i++){ const rr=rmin+(i/(n-1))*(rmax-rmin); const c=makeCrown(q,0,0,rr,rr,pal); const pad=Math.ceil(rr*1.6); const o=offscreen(pad*2,pad*2); drawCrown(o.x,c,pad,pad,1,null,[rr*.14,rr*.16]); out.push({o,pad,r:rr,c}); } return out; }
function blit(ctx,sp,sx,sy,alpha){ if(alpha<=0) return; ctx.globalAlpha=alpha; ctx.drawImage(sp.o.c,sx-sp.pad,sy-sp.pad,sp.pad*2,sp.pad*2); ctx.globalAlpha=1; }
function ring(ctx,x,y,rr,solid,alpha){ ctx.save(); ctx.globalAlpha=alpha; ctx.beginPath(); ctx.arc(x,y,rr,0,TAU); ctx.strokeStyle='#A8761F'; ctx.lineWidth=solid?2:1.4; if(!solid) ctx.setLineDash([5,5]); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(x,y,2.2,0,TAU); ctx.fillStyle='#15201A'; ctx.fill(); ctx.restore(); }
function box(ctx,x,y,w,h,solid,alpha,lab){ ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle='#A8761F'; ctx.lineWidth=solid?2:1.4; if(!solid) ctx.setLineDash([5,5]); ctx.strokeRect(x-w/2,y-h/2,w,h); ctx.setLineDash([]); if(lab&&solid){ ctx.font='500 11px "IBM Plex Sans", sans-serif'; const tw=ctx.measureText(lab).width; ctx.fillStyle='rgba(243,239,228,.9)'; ctx.fillRect(x-w/2-1,y+h/2+4,tw+8,16); ctx.fillStyle='#15201A'; ctx.fillText(lab,x-w/2+3,y+h/2+16); } ctx.restore(); }
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)); const mix=(a,b,k)=>{ const pa=hex(a),pb=hex(b); return `rgb(${pa.map((v,i)=>Math.round(v+(pb[i]-v)*k)).join(',')})`; };

window.Giganteum={reduce,freeze,motion,TAU,clamp,rng,DPR,idle,setup,offscreen,ticker,makeCrown,drawCrown,makeSprites,blit,ring,box,mix,scenes:{}};
})();
