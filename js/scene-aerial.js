(function(G){
'use strict';
const {motion,freeze,TAU,clamp,rng,setup,offscreen,drawCrown,makeSprites,blit,ring,box,mix}=G;

/* =====================================================================
   AERIAL — a steady transect; ground is rasterised once, animals graze
   ===================================================================== */
function aerialInit(){
  const canvas=document.getElementById('c-aerial'), scene=document.getElementById('aerial-scene');
  const tF=document.getElementById('t-frames'), tE=document.getElementById('t-empty'), tA=document.getElementById('t-animals');
  const S=setup(canvas,()=>{ measure(); if(ground) draw(); }); const ctx=S.ctx; const r=rng(1234);
  const TW=4200, TH=700; // the visible band only
  const riverY=x=>TH*.55+150*Math.sin(x/380)+80*Math.sin(x/150+1)+34*Math.sin(x/62)+14*Math.sin(x/23);
  const TREE=makeSprites(9,10,7,17,['#4F6438','#5E6F3F','#6A7A46']);
  const blot=[],shrub=[],trees=[],trails=[],herds=[];
  for(let i=0;i<220;i++) blot.push([r()*TW,r()*TH,60+r()*220,r()<.5?'#CDBB90':'#DACBA8']);
  for(let i=0;i<1500;i++) shrub.push([r()*TW,r()*TH,2+r()*5,r()<.6?'#8A8250':'#A39A66']);
  for(let i=0;i<520;i++){ const x=r()*TW; const near=r()<.6; const y=near?riverY(x)+(r()-.5)*150:r()*TH; if(Math.abs(y-riverY(x))<30||y<0||y>TH) continue; trees.push({x,y,si:Math.min(TREE.length-1,Math.floor(r()*TREE.length))}); }
  for(let i=0;i<9;i++){ const pts=[]; let x=r()*TW,y=r()*TH; for(let k=0;k<12;k++){ pts.push([x,y]); x+=120+r()*80; y+=(r()-.5)*160; } trails.push(pts); }
  for(let g=0;g<12;g++){ const large=r()<.4; const x=r()*TW; const y=r()<.6?riverY(x)+(r()>.5?1:-1)*(70+r()*160):r()*TH; const n=large?2+(r()*3|0):3+(r()*6|0); const a=r()*TAU;
    for(let i=0;i<n;i++) herds.push({x:x+(r()-.5)*(large?160:220),y:clamp(y+(r()-.5)*(large?110:150),20,TH-20),a:a+(r()-.5)*.8,s:large?8+r()*3:4.5+r()*2,large,id:g*100+i,ph:r()*TAU,v:large?3:6}); }
  let mobile=false, ground=null;
  function raster(){ ground=offscreen(TW,TH); const g=ground.x;
    g.fillStyle='#D8C9A6'; g.fillRect(0,0,TW,TH); g.globalAlpha=.55; for(const b of blot){ g.fillStyle=b[3]; g.beginPath(); g.ellipse(b[0],b[1],b[2],b[2]*.6,0,0,TAU); g.fill(); } g.globalAlpha=1;
    g.strokeStyle='rgba(120,100,60,.22)'; g.lineWidth=1.5; g.lineJoin='round'; for(const pts of trails){ g.beginPath(); pts.forEach((p,i)=>{ if(i===0) g.moveTo(p[0],p[1]); else { const q=pts[i-1]; g.quadraticCurveTo(q[0]+(p[0]-q[0])*.5,q[1]+(p[1]-q[1])*.5+18,p[0],p[1]); } }); g.stroke(); }
    // river: sandy banks, wet edge, water, a paler thread and gravel bars
    const path=w=>{ g.beginPath(); for(let x=-40;x<=TW+40;x+=10){ const y=riverY(((x%TW)+TW)%TW); if(x===-40) g.moveTo(x,y); else g.lineTo(x,y); } g.lineWidth=w; g.lineCap='round'; g.stroke(); };
    g.strokeStyle='#E3D8B7'; path(78); g.strokeStyle='#B8A97E'; path(50); g.strokeStyle='#8FAEB0'; path(40); g.strokeStyle='#9DB9B8'; path(22);
    g.strokeStyle='rgba(227,216,183,.9)'; g.lineWidth=1; g.setLineDash([]); const q=rng(3); for(let k=0;k<60;k++){ const x=q()*TW, y=riverY(x)+(q()-.5)*14; g.fillStyle='#D9CCA6'; g.beginPath(); g.ellipse(x,y,6+q()*14,2+q()*3,0,0,TAU); g.fill(); }
    for(const s of shrub){ g.fillStyle=s[3]; g.beginPath(); g.arc(s[0],s[1],s[2],0,TAU); g.fill(); }
    for(const tr of trees) blit(g,TREE[tr.si],tr.x,tr.y,1);
    if(mobile) return; }
  function measure(){ mobile=matchMedia('(max-width: 1000px)').matches; } measure();
  const rB=y=>mobile?S.W+400:S.W-40+18*Math.sin(y/70)+10*Math.sin(y/29+1);
  const topB=x=>16+16*Math.sin(x/100)+8*Math.sin(x/37);
  const botB=x=>S.H-18-14*Math.sin(x/90+.5)-8*Math.sin(x/33);
  const inside=(x,y,rr)=>Math.min(rB(y)-(x+rr), y-rr-topB(x), botB(x)-(y+rr));
  let ox=0, oy=(TH-520)/2, vx=34, t=0, shutterT=0, frameNo=2310, count={f:0,e:0,a:0}, flash=0, lastEmpty=true;
  const seen=new Map();
  const sp=(x,y)=>{ let sx=((x-ox)%TW+TW)%TW, sy=y-oy+(S.H-520)/2; if(sx>S.W+200) sx-=TW; return [sx,sy]; };
  function footprint(){ const W=S.W,H=S.H; return [28, topB(28)+14, (mobile?W:W-70)-56, H-topB(28)-42]; }
  function shutter(){ frameNo++; count.f++; const [fx,fy,fw,fh]=footprint(); let n=0;
    for(const h of herds){ const [sx,sy]=sp(h.x,h.y); if(sx>fx&&sx<fx+fw&&sy>fy&&sy<fy+fh) n++; }
    lastEmpty=n===0; if(lastEmpty) count.e++; else count.a+=n;
    tF.textContent=count.f.toLocaleString(); tE.textContent=count.e.toLocaleString(); tA.textContent=count.a.toLocaleString(); flash=1; }
  function islandPath(){ const W=S.W,H=S.H; const xe=mobile?W+60:W-80; ctx.beginPath(); ctx.moveTo(-50,topB(0)); for(let x=0;x<=xe;x+=20) ctx.lineTo(x,topB(x)); for(let y=topB(xe);y<=H;y+=20) ctx.lineTo(rB(y),y); for(let x=xe;x>=-50;x-=20) ctx.lineTo(x,botB(x)); ctx.closePath(); }
  function draw(){ const W=S.W,H=S.H; ctx.clearRect(0,0,W,H); ctx.save(); islandPath(); ctx.clip();
    const gy=-oy+(H-520)/2; const gx=-(((ox%TW)+TW)%TW); ctx.drawImage(ground.c,gx,gy,TW,TH); if(gx+TW<W+10) ctx.drawImage(ground.c,gx+TW,gy,TW,TH);
    // live water glints along the river
    ctx.strokeStyle='rgba(243,239,228,.55)'; ctx.lineWidth=1.2; for(let k=0;k<26;k++){ const wx=((k*163+t*40)%(W+80))-40; const wy=riverY(((wx+ox)%TW+TW)%TW)-oy+(H-520)/2+(k%3-1)*7; ctx.beginPath(); ctx.moveTo(wx,wy); ctx.lineTo(wx+10+6*Math.sin(t*2+k),wy+1.5*Math.sin(t*3+k)); ctx.stroke(); }
    for(const h of herds){ const [sx,sy]=sp(h.x,h.y); if(sx<-30||sx>W+30||sy<-30||sy>H+30) continue; const bob=Math.sin(t*5+h.ph)*.6;
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(h.a); ctx.fillStyle='rgba(21,32,26,.35)'; ctx.beginPath(); ctx.ellipse(h.s*.5,h.s*.55,h.s*1.6,h.s*.7,0,0,TAU); ctx.fill();
      ctx.fillStyle=h.large?'#5A5852':'#6B5236'; ctx.beginPath(); ctx.ellipse(0,bob,h.s*1.5,h.s*.8,0,0,TAU); ctx.fill(); ctx.beginPath(); ctx.arc(h.s*1.5,bob,h.s*.5,0,TAU); ctx.fill();
      ctx.fillStyle=h.large?'rgba(200,200,190,.35)':'rgba(230,210,170,.35)'; ctx.beginPath(); ctx.ellipse(0,bob-h.s*.15,h.s*1.1,h.s*.3,0,0,TAU); ctx.fill(); ctx.restore(); }
    ctx.restore();
    const [fx,fy,fw,fh]=footprint(); ctx.save(); ctx.strokeStyle=flash>0?`rgba(243,239,228,${.9*flash})`:'rgba(21,32,26,.22)'; ctx.lineWidth=flash>0?2:1; ctx.setLineDash(flash>0?[]:[3,4]); ctx.strokeRect(fx+.5,fy+.5,fw,fh); ctx.restore();
    if(flash>0&&lastEmpty){ ctx.save(); ctx.globalAlpha=flash; ctx.font='500 13px "IBM Plex Sans", sans-serif'; ctx.fillStyle='#4B5A50'; ctx.textAlign='right'; ctx.fillText('empty · skipped',fx+fw-10,fy+fh-12); ctx.restore(); }
    for(const h of herds){ const [sx,sy]=sp(h.x,h.y); const d=inside(sx,sy,14); if(d<-10||sx>W+20){ seen.delete(h.id); continue; } if(!seen.has(h.id)) seen.set(h.id,t); const k=clamp((t-seen.get(h.id))/.6,0,1); ring(ctx,sx,sy,(h.large?22:16)+8*(1-k),k>=1,k*clamp((d+20)/20,0,1)); } }
  function tick(dt){ t+=dt; ox+=vx*dt; shutterT+=dt; flash=Math.max(0,flash-dt*3); if(shutterT>1.8){ shutterT=0; shutter(); }
    for(const h of herds){ h.a+=(Math.sin(t*.7+h.ph)*.4)*dt; h.x+=Math.cos(h.a)*h.v*dt; h.y=clamp(h.y+Math.sin(h.a)*h.v*dt,20,TH-20); if(Math.abs(h.y-riverY(h.x))<40) h.a+=Math.PI*dt; }
    draw(); }
  // a composed still: rings settled on the current frame, no flash
  function still(){ flash=0; draw(); t+=.7; draw(); }
  raster(); shutter(); flash=0; draw(); if(freeze){ while(count.f<6) tick(1/30); flash=0; draw(); } else if(motion.reduce){ for(let i=0;i<12&&lastEmpty;i++){ ox+=600; shutter(); } still(); }
  return {tick,still};
}

G.scenes.aerial=aerialInit;
})(window.Giganteum);
