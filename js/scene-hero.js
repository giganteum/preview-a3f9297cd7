(function(G){
'use strict';
const {motion,freeze,TAU,clamp,rng,setup,offscreen,drawCrown,makeSprites,blit,ring,box,mix}=G;

/* =====================================================================
   HERO — the loop: calm canopy → one crown turns → the frame hones in →
   the record is pulled, joined to the tree by a line → release → next
   ===================================================================== */
function heroInit(){
  const canvas=document.getElementById('c-hero'), scene=document.getElementById('hero-scene'), copy=document.getElementById('hero-copy');
  const rec=document.getElementById('record'), hist=document.getElementById('hist'), histL=document.getElementById('hist-label');
  const S=setup(canvas,()=>{ measure(); onLayout(); draw(); }); const ctx=S.ctx; const r=rng(77);
  const SPR=makeSprites(5,24,20,58); const TW=2600, TH=2000; const crowns=[];
  for(let i=0;i<2200;i++){ const si=Math.min(SPR.length-1,Math.floor(Math.pow(r(),.8)*SPR.length)); crowns.push({x:r()*TW,y:r()*TH,si,r:SPR[si].r,id:i,tint:null,tk:0}); }
  let mobile=false, copyRight=0, copyBottom=0;
  function measure(){ mobile=matchMedia('(max-width: 1000px)').matches; const cr=canvas.getBoundingClientRect(), tr=copy.getBoundingClientRect(); copyRight=tr.right-cr.left; copyBottom=tr.bottom-cr.top; }
  measure();
  // the text exclusion depends on the copy block, which can reflow without the canvas changing size
  // (fonts arriving, copy edits, text zoom): re-measure when it does
  if('ResizeObserver' in window) new ResizeObserver(()=>{ measure(); onLayout(); draw(); }).observe(copy);
  const leftB=y=>{ if(mobile) return -400; let b=copyRight+22; if(y>copyBottom-40) b=Math.max(S.W*.36,b-(y-(copyBottom-40))*1.25); return b+20*Math.sin(y/80)+12*Math.sin(y/33+1.3); };
  const topB=x=>(mobile?14:10)+18*Math.sin(x/110)+10*Math.sin(x/43+2);
  const botB=x=>S.H-(mobile?12:22)+(mobile?0:Math.min(40,Math.max(0,(x-S.W*.7)*.12)))-16*Math.sin(x/95+.7)-10*Math.sin(x/41);
  const inside=(x,y,rr)=>Math.min(x-rr-leftB(y), y-rr-topB(x), botB(x)-(y+rr));
  const TPL=[
    {kind:'change',id:'0413',status:'change flagged · 2024-09',cls:'mature',crown:'8.4 m',pos:'36.5652, −118.7727',caps:'6 · 2019–2026',sensors:'satellite · aerial · drone',tint:['#8A5A33','#A8743E'],hist:[['2019','#7FA06E'],['2022','#8FA66E'],['2024','#B8A25A'],['2026','#8A5A33']]},
    {kind:'ok',id:'2087',status:'no change',cls:'mature',crown:'11.2 m',pos:'36.5701, −118.7688',caps:'3 · 2020–2026',sensors:'satellite · aerial',tint:null,hist:[['2020','#7FA06E'],['2023','#7FA06E'],['2026','#86A877']]},
    {kind:'change',id:'1156',status:'change flagged · 2025-06',cls:'mature',crown:'9.7 m',pos:'36.5588, −118.7761',caps:'2 · 2023–2026',sensors:'satellite',tint:['#8A5A33','#A8743E'],hist:[['2023','#7FA06E'],['2026','#A0753F']]},
    {kind:'ok',id:'0330',status:'no change',cls:'young',crown:'4.1 m',pos:'36.5640, −118.7802',caps:'5 · 2019–2026',sensors:'aerial · drone',tint:null,hist:[['2019','#86A877'],['2021','#7FA06E'],['2023','#7FA06E'],['2025','#86A877'],['2026','#7FA06E']]},
    {kind:'dead',id:'0921',status:'dead · confirmed 2025-08',cls:'dead',crown:'6.1 m',pos:'36.5619, −118.7810',caps:'4 · 2021–2026',sensors:'satellite · drone',tint:['#7A6A58','#8E8070'],hist:[['2021','#7FA06E'],['2023','#B8A25A'],['2025','#8A5A33'],['2026','#7A6A58']]}];
  const rows={}; rec.querySelectorAll('.row').forEach(el=>rows[el.dataset.f]=el);
  const ORDER=['id','status','cls','crown','pos','caps','sensors'];
  // The card's content is written once per tree; during the reveal only row visibility changes,
  // and only when a threshold is crossed (no per-frame DOM churn).
  let filled=null, shown=-1;
  function fillCard(tpl,progress){
    if(filled!==tpl){ filled=tpl; shown=-1;
      ORDER.forEach(k=>{ rows[k].lastElementChild.textContent=tpl[k]; });
      rows.status.classList.toggle('ok',tpl.kind==='ok'); rows.status.classList.toggle('dead',tpl.kind==='dead');
      hist.innerHTML=tpl.hist.map(([y,c])=>`<div><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="${c}"/><circle cx="9" cy="9" r="3.6" fill="rgba(255,255,255,.28)"/></svg><span>${y}</span></div>`).join(''); }
    const step=ORDER.filter((k,i)=>progress>=(i+1)/(ORDER.length+2)).length+(progress>=.92?1:0)+(progress>=1?1:0);
    if(step===shown) return; shown=step;
    ORDER.forEach((k,i)=>rows[k].classList.toggle('on',i<Math.min(step,ORDER.length)));
    histL.classList.toggle('on',progress>=.92); hist.classList.toggle('on',progress>=1);
  }
  // world drift
  let ox=r()*TW, oy=r()*TH, vx=4.5, vy=2.2, t=0, fade=0;
  const spos=c=>{ let sx=((c.x-ox)%TW+TW)%TW, sy=((c.y-oy)%TH+TH)%TH; if(sx>S.W+120) sx-=TW; if(sy>S.H+120) sy-=TH; return [sx,sy]; };
  // the loop
  const PH={calm:2.4,turn:2.6,lock:1.1,card:3.2,hold:3.2,release:.9};
  let phase='calm', pt=0, tplIdx=0, focus=null, tpl=TPL[0];
  // the record's rectangle in canvas coordinates, padded; followed crowns stay clear of it
  function cardHit(sx,sy,rr){ const cr=canvas.getBoundingClientRect(), k=rec.getBoundingClientRect(); const p=18;
    return sx+rr>k.left-cr.left-p&&sx-rr<k.right-cr.left+p&&sy+rr>k.top-cr.top-p&&sy-rr<k.bottom-cr.top+p; }
  function pick(){ for(let k=0;k<80;k++){ const c=crowns[r()*crowns.length|0]; if(c.r<34||c.tint) continue; const [sx,sy]=spos(c); if(sx<40||sx>S.W-60||sy<40||sy>S.H-40) continue; if(!mobile&&sx>S.W-340&&sy>S.H-400) continue; if(mobile&&sy>S.H-60) continue; if(cardHit(sx,sy,c.r)) continue; if(inside(sx,sy,c.r)>40) return c; } return null; }
  // Deterministic fallback: the best-placed eligible crown on screen, so a static composition
  // always has a tree and a card (review V3); constraints relax only as far as they must.
  function pickBest(){ let best=null, bd=20;
    for(const c of crowns){ if(c.r<30||c.tint) continue; const [sx,sy]=spos(c); if(sx<40||sx>S.W-60||sy<40||sy>S.H-40) continue; if(!mobile&&sx>S.W-340&&sy>S.H-400) continue; if(mobile&&sy>S.H-60) continue; if(cardHit(sx,sy,c.r)) continue; const d=inside(sx,sy,c.r); if(d>bd){ bd=d; best=c; } }
    return best; }
  function next(){ tpl=TPL[tplIdx%TPL.length]; tplIdx++; focus=pick(); if(!focus){ phase='calm'; pt=0; return; } phase=tpl.tint?'turn':'lock'; pt=0; }
  // after a resize the island boundary moves; if the followed tree is no longer inside it, drop it and restart the loop
  function onLayout(){ if(!focus){ if(motion.reduce||freeze) compose(freeze?'card':'hold'); return; } const [sx,sy]=spos(focus); if(inside(sx,sy,focus.r)<20||sx<0||sx>S.W||sy<0||sy>S.H){ if(motion.reduce||freeze){ focus.tint=null; focus.tk=0; } focus=null; phase='calm'; pt=0; rec.classList.remove('show'); fillCard(tpl,0); if(motion.reduce||freeze) compose(freeze?'card':'hold'); } }
  function tick(dt){ t+=dt; fade=Math.min(1,fade+dt*1.2); ox+=vx*dt; oy+=vy*dt; pt+=dt;
    if(phase==='calm'&&pt>PH.calm) next();
    else if(phase==='turn'){ focus.tk=clamp(pt/PH.turn,0,1); focus.tint=tpl.tint; if(pt>PH.turn){ phase='lock'; pt=0; } }
    else if(phase==='lock'&&pt>PH.lock){ phase='card'; pt=0; rec.classList.add('show'); }
    else if(phase==='card'){ fillCard(tpl,clamp(pt/PH.card,0,1.0001)); if(pt>PH.card){ phase='hold'; pt=0; } }
    else if(phase==='hold'&&pt>PH.hold){ phase='release'; pt=0; rec.classList.remove('show'); }
    else if(phase==='release'&&pt>PH.release){ focus=null; phase='calm'; pt=0; fillCard(tpl,0); }
    draw(); }
  function draw(){
    const W=S.W,H=S.H; ctx.clearRect(0,0,W,H);
    const late=[];
    for(const c of crowns){ const [sx,sy]=spos(c); if(sx<-80||sx>W+80||sy<-80||sy>H+80) continue; const d=inside(sx,sy,c.r); const a=clamp((d+30)/30,0,1)*fade; if(a<=0) continue;
      if(c.tint||c===focus){ late.push([c,sx,sy,a]); continue; } blit(ctx,SPR[c.si],sx,sy,a); }
    for(const [c,sx,sy,a] of late){ const sp=SPR[c.si]; drawCrown(ctx,sp.c,sx,sy,a,c.tint?[mix(sp.c.base,c.tint[0],c.tk),mix(sp.c.lit,c.tint[1],c.tk)]:null,[c.r*.14,c.r*.16]); }
    if(!focus) return;
    const [fx,fy]=spos(focus); const rr=focus.r*1.15;
    if(phase==='lock'){ const k=clamp(pt/PH.lock,0,1); const e=1-Math.pow(1-k,3); const sz=rr*2*(3.2-2.2*e); box(ctx,fx,fy,sz,sz,false,.5+.5*k,null); }
    else if(phase!=='turn'&&phase!=='calm'){ const a=phase==='release'?1-pt/PH.release:1; box(ctx,fx,fy,rr*2,rr*2,true,a,null);
      // leader line from the tree to the card
      if(phase!=='release'){ const cr=canvas.getBoundingClientRect(), rr2=rec.getBoundingClientRect(); const k=clamp((phase==='card'?pt:9)/.5,0,1);
        ctx.save(); ctx.globalAlpha=k; ctx.strokeStyle='#A8761F'; ctx.lineWidth=1.2; ctx.beginPath();
        let ex,ey; if(rr2.top-cr.top>=S.H-2){ ex=rr2.left-cr.left+rr2.width*.5; ey=rr2.top-cr.top; const my=fy+rr+Math.max(12,(ey-fy-rr)*.5); ctx.moveTo(fx,fy+rr); ctx.lineTo(fx,my); ctx.lineTo(ex,my); ctx.lineTo(ex,ey); }
        else { ex=rr2.left-cr.left; ey=rr2.top-cr.top+rr2.height*.5; const tx=fx+(ex>fx?rr:-rr); const mx=tx+(ex-tx)*.5; ctx.moveTo(tx,fy); ctx.lineTo(mx,fy); ctx.lineTo(mx,ey); ctx.lineTo(ex,ey); }
        ctx.stroke(); ctx.fillStyle='#A8761F'; ctx.beginPath(); ctx.arc(ex,ey,2.5,0,TAU); ctx.fill(); ctx.restore(); } }
  }
  // A composed still: the first template's tree, turned, framed, card complete.
  function compose(ph){ fade=1; tpl=TPL[0]; tplIdx=1; if(focus){ focus.tint=null; focus.tk=0; }
    focus=pick()||pickBest(); if(focus){ focus.tint=tpl.tint; focus.tk=1; phase=ph; pt=ph==='card'?PH.card:0; rec.classList.add('show'); fillCard(tpl,1); } else { phase='calm'; pt=0; rec.classList.remove('show'); }
    draw(); }
  if(freeze){ compose('card'); return {tick:()=>{}}; }
  if(motion.reduce) compose('hold'); else { fillCard(TPL[0],0); draw(); }
  // called when the motion policy changes: under reduced motion, settle into the composed still
  function still(){ if(motion.reduce&&!(focus&&phase==='hold'&&rec.classList.contains('show'))) compose('hold'); }
  return {tick,still};
}

G.scenes.hero=heroInit;
})(window.Giganteum);
