(function(G){
'use strict';
const {motion,freeze,TAU,clamp,rng,setup,offscreen,drawCrown,makeSprites,blit,ring,box,mix}=G;

/* =====================================================================
   BEYOND — B "dive" pan and C mosaic; zones rasterised once
   ===================================================================== */
function beyondInit(){
  const canvas=document.getElementById('c-beyond');
  const S=setup(canvas,()=>{ for(const z of Object.values(zones)) z.img=null; draw(); }); const ctx=S.ctx; const r=rng(4242);
  const ZW=520, TH=600, WATER='#8FAEB0', SKY='#E9E3D3', GROUND='#C9BC96';
  const FOREST=makeSprites(11,14,14,40,['#5E7F4B','#6A8B55','#54733F','#7A9A62']), SAV=makeSprites(12,8,7,15,['#5E6F3F']), STREET=makeSprites(13,8,8,18,['#5F8A52']);
  /* illustration helpers */
  function drawWhale(c,x,y,s){ c.fillStyle='rgba(21,32,26,.18)'; c.beginPath(); c.ellipse(x,y+s*.15,s*1.9,s*.22,0,0,TAU); c.fill(); c.fillStyle='#4E565C'; c.beginPath(); c.moveTo(x-s*1.7,y); c.quadraticCurveTo(x-s*.5,y-s*.95,x+s*.5,y-s*.6); c.quadraticCurveTo(x+s*1.3,y-s*.35,x+s*1.8,y); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x+s*.3,y-s*.62); c.quadraticCurveTo(x+s*.5,y-s*1.1,x+s*.75,y-s*1.05); c.lineTo(x+s*.85,y-s*.5); c.closePath(); c.fill(); c.fillStyle='rgba(243,239,228,.9)'; for(let k=0;k<7;k++){ c.beginPath(); c.arc(x-s*1.1+k*s*.12,y-s*.95-k*k*s*.03,s*.06+k*s*.01,0,TAU); c.fill(); } }
  function drawFluke(c,x,y,s){ c.fillStyle='#4E565C'; c.beginPath(); c.moveTo(x,y+s*.55); c.quadraticCurveTo(x-s*.5,y+s*.1,x-s*1.4,y-s*.35); c.quadraticCurveTo(x-s*.6,y-s*.3,x,y-s*.05); c.quadraticCurveTo(x+s*.6,y-s*.3,x+s*1.4,y-s*.35); c.quadraticCurveTo(x+s*.5,y+s*.1,x,y+s*.55); c.fill(); }
  function drawManta(c,x,y,s,seed){ const q=rng(seed); c.fillStyle='rgba(21,32,26,.2)'; c.beginPath(); c.moveTo(x+6,y-s*.7+8); c.lineTo(x+s*1.7+6,y+s*.1+8); c.lineTo(x+6,y+s*.95+8); c.lineTo(x-s*1.7+6,y+s*.1+8); c.closePath(); c.fill(); c.fillStyle='#EFE9DD'; c.beginPath(); c.moveTo(x,y-s*.7); c.quadraticCurveTo(x+s*1.1,y-s*.5,x+s*1.7,y+s*.1); c.quadraticCurveTo(x+s*.9,y+s*.5,x,y+s*.95); c.quadraticCurveTo(x-s*.9,y+s*.5,x-s*1.7,y+s*.1); c.quadraticCurveTo(x-s*1.1,y-s*.5,x,y-s*.7); c.fill(); c.fillStyle='#3E4548'; for(let k=0;k<26;k++){ const px=x+(q()-.5)*s*1.6, py=y+q()*s*.9-s*.1; if(Math.abs(px-x)/(s*1.6)+Math.abs(py-y-s*.1)/(s*.8)>.9) continue; c.beginPath(); c.arc(px,py,1.5+q()*2.5,0,TAU); c.fill(); } c.fillRect(x-s*.3,y-s*.85,s*.14,s*.3); c.fillRect(x+s*.16,y-s*.85,s*.14,s*.3); c.strokeStyle='#3E4548'; c.lineWidth=2; c.beginPath(); c.moveTo(x,y+s*.95); c.lineTo(x+s*.15,y+s*1.6); c.stroke(); }
  function drawWhaleShark(c,x,y,s,seed){ const q=rng(seed); c.fillStyle='rgba(21,32,26,.2)'; c.beginPath(); c.ellipse(x+6,y+8,s*2.2,s*.62,0,0,TAU); c.fill(); c.fillStyle='#6E7F86'; c.beginPath(); c.ellipse(x,y,s*2.2,s*.62,0,0,TAU); c.fill(); c.beginPath(); c.moveTo(x+s*2.1,y); c.lineTo(x+s*2.7,y-s*.7); c.lineTo(x+s*2.6,y+s*.5); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x-s*.2,y-s*.55); c.lineTo(x+s*.1,y-s*1.05); c.lineTo(x+s*.4,y-s*.55); c.closePath(); c.fill(); c.fillStyle='rgba(243,239,228,.8)'; for(let k=0;k<60;k++){ const px=x+(q()-.5)*s*3.8, py=y+(q()-.5)*s*1.1; if(((px-x)/(s*2.1))**2+((py-y)/(s*.56))**2>1) continue; c.beginPath(); c.arc(px,py,.8+q()*1.3,0,TAU); c.fill(); } }
  function drawAntelope(c,x,y,s,phase){ c.strokeStyle='#4B3B2A'; c.lineWidth=s*.14; c.lineCap='round'; c.fillStyle='rgba(21,32,26,.22)'; c.beginPath(); c.ellipse(x,y+s*.95,s*1.3,s*.16,0,0,TAU); c.fill(); c.fillStyle='#4B3B2A'; c.beginPath(); c.ellipse(x,y,s*1.05,s*.5,0,0,TAU); c.fill(); for(let k=0;k<4;k++){ const lx=x-s*.7+k*s*.47, sw=Math.sin(phase+k*1.6)*s*.18; c.beginPath(); c.moveTo(lx,y+s*.3); c.lineTo(lx+sw,y+s*.95); c.stroke(); } c.beginPath(); c.moveTo(x+s*.85,y-s*.2); c.lineTo(x+s*1.25,y-s*.95); c.stroke(); c.beginPath(); c.ellipse(x+s*1.35,y-s*1.02,s*.32,s*.18,-.3,0,TAU); c.fill(); c.lineWidth=s*.08; c.beginPath(); c.moveTo(x+s*1.3,y-s*1.15); c.quadraticCurveTo(x+s*1.25,y-s*1.6,x+s*1.5,y-s*1.75); c.stroke(); c.beginPath(); c.moveTo(x+s*1.42,y-s*1.15); c.quadraticCurveTo(x+s*1.4,y-s*1.6,x+s*1.65,y-s*1.7); c.stroke(); }
  function waves(c,x0,x1,y0,y1,tt,alpha){ c.strokeStyle=`rgba(243,239,228,${alpha})`; c.lineWidth=1.5; for(let y=y0+14;y<y1;y+=22){ c.beginPath(); for(let x=x0;x<=x1;x+=8) c.lineTo(x,y+4*Math.sin(x/26+y/9+tt*1.2)); c.stroke(); } }
  function grass(c,sx,w,y0,y1,seed){ const q=rng(seed); c.strokeStyle='rgba(60,70,40,.45)'; c.lineWidth=1.2; for(let k=0;k<160;k++){ const gx=sx+q()*w, gy=y0+q()*(y1-y0); const h=6+q()*14*((gy-y0)/(y1-y0)+.3); c.beginPath(); c.moveTo(gx,gy); c.quadraticCurveTo(gx+3,gy-h*.6,gx+(q()-.5)*8,gy-h); c.stroke(); } }
  function trunks(c,sx,w,horizon,seed){ const q=rng(seed); for(let k=0;k<7;k++){ const tx=sx+q()*w, th=40+q()*60, tw=4+q()*5; c.fillStyle='#5E5140'; c.fillRect(tx,horizon-th,tw,th+6); c.fillStyle='#6E8552'; c.beginPath(); c.arc(tx+tw/2,horizon-th-10,18+q()*16,0,TAU); c.fill(); } }
  const LAB={forest:['Forest','overhead'],savanna:['Savanna','overhead'],streets:['City streets','overhead'],sea:['Open water','from a boat'],reef:['Reef','from a dive'],trap:['Trail','camera trap']};
  // zone content in zone coordinates (ZW wide, TH tall); ground scenes use a horizon at .42/.5 of the tile height
  function zoneData(kind){ const z={kind,objs:[],targets:[],label:LAB[kind][0],view:LAB[kind][1],img:null};
    const push=(spr,n)=>{ for(let k=0;k<n;k++) z.objs.push({t:'c',x:r()*ZW,y:r()*TH,spr,si:Math.floor(r()*spr.length)}); };
    if(kind==='forest'){ z.ground='#B9C9A6'; push(FOREST,150); }
    if(kind==='savanna'){ z.ground='#D8C9A6'; for(let k=0;k<80;k++) z.objs.push({t:'s',x:r()*ZW,y:r()*TH,r:2+r()*4}); push(SAV,40); for(let k=0;k<9;k++) z.objs.push({t:'a',x:r()*ZW,y:r()*TH,a:r()*TAU,s:6+r()*3}); }
    if(kind==='streets'){ z.ground='#CFC9BD'; for(let k=0;k<4;k++) z.objs.push({t:'road',x:0,y:70+k*150,w:ZW,h:26}); for(let k=0;k<3;k++) z.objs.push({t:'road',x:70+k*180,y:0,w:24,h:TH}); for(let k=0;k<34;k++) z.objs.push({t:'b',x:r()*ZW,y:r()*TH,w:40+r()*90,h:30+r()*60}); push(STREET,50); }
    if(z.view==='overhead'){ // ring targets: trees in forest and streets, animals in savanna
      const pool=(kind==='savanna'?z.objs.filter(o=>o.t==='a').map(o=>({x:o.x,y:o.y,r:o.s*1.9})):z.objs.filter(o=>o.t==='c').map(o=>({x:o.x,y:o.y,r:o.spr[o.si].r*1.15})).sort((a,b)=>b.r-a.r)).filter(c=>c.y>TH*.38&&c.y<TH*.62);
      for(const c of pool){ if(z.targets.length>=12) break; if(z.targets.every(m=>Math.abs(m.x-c.x)>50)) z.targets.push(c); }
      if(kind==='savanna'&&!z.targets.length){ z.objs.push({t:'a',x:ZW*.5,y:TH*.5,a:1,s:8}); z.targets.push({x:ZW*.5,y:TH*.5,r:15}); } }
    return z; }
  const zones={}; for(const k of Object.keys(LAB)) zones[k]=zoneData(k);
  function raster(z,h){ if(z.img&&z.img.h===h) return z.img; const o=offscreen(ZW,h); const g=o.x; const oy=(h-TH)/2;
    if(z.view==='overhead'){ g.fillStyle=z.ground; g.fillRect(0,0,ZW,h);
      for(const o2 of z.objs){ const y=o2.y+oy; if(o2.t==='c') blit(g,o2.spr[o2.si],o2.x,y,1); else if(o2.t==='s'){ g.fillStyle='#8A8250'; g.beginPath(); g.arc(o2.x,y,o2.r,0,TAU); g.fill(); } else if(o2.t==='road'){ g.fillStyle='#A8A296'; g.fillRect(o2.x,o2.y+oy,o2.w,o2.h); } else if(o2.t==='b'){ g.fillStyle='rgba(21,32,26,.18)'; g.fillRect(o2.x+4,y+5,o2.w,o2.h); g.fillStyle=['#E2DCCF','#D7CFBF','#EAE4D8'][(o2.w|0)%3]; g.fillRect(o2.x,y,o2.w,o2.h); } else if(o2.t==='a'){ g.save(); g.translate(o2.x,y); g.rotate(o2.a); g.fillStyle='rgba(21,32,26,.3)'; g.beginPath(); g.ellipse(o2.s*.5,o2.s*.5,o2.s*1.5,o2.s*.7,0,0,TAU); g.fill(); g.fillStyle='#5A5852'; g.beginPath(); g.ellipse(0,0,o2.s*1.5,o2.s*.8,0,0,TAU); g.fill(); g.fillStyle='rgba(200,200,190,.35)'; g.beginPath(); g.ellipse(0,-o2.s*.15,o2.s*1.1,o2.s*.3,0,0,TAU); g.fill(); g.restore(); } } }
    else if(z.kind==='sea'){ const hz=h*.42; g.fillStyle=SKY; g.fillRect(0,0,ZW,hz); g.fillStyle=WATER; g.fillRect(0,hz,ZW,h-hz); }
    else if(z.kind==='reef'){ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#B0C6C2'); gr.addColorStop(1,'#6B8C8A'); g.fillStyle=gr; g.fillRect(0,0,ZW,h); g.fillStyle='rgba(243,239,228,.12)'; for(let k=0;k<5;k++){ g.beginPath(); g.moveTo(60+k*110,0); g.lineTo(90+k*110,0); g.lineTo(160+k*110,h); g.lineTo(110+k*110,h); g.closePath(); g.fill(); } }
    else if(z.kind==='trap'){ const h2=h*.5; g.fillStyle=SKY; g.fillRect(0,0,ZW,h2); g.fillStyle=GROUND; g.fillRect(0,h2,ZW,h-h2); trunks(g,0,ZW,h2,3); grass(g,0,ZW,h2+10,h,5); g.fillStyle='rgba(21,32,26,.55)'; g.fillRect(ZW-118,h-30,104,18); g.font='500 10px "IBM Plex Sans", monospace'; g.fillStyle='#F3EFE4'; g.fillText('2026-04-12 05:41  CAM 07',ZW-112,h-17); }
    z.img=o; return o; }
  // moving subjects and their tight boxes, in zone coordinates for a zone of height h
  function subjects(kind,h,tt){
    if(kind==='sea'){ const hz=h*.42, wy=hz+30+2*Math.sin(tt*1.3); return [{draw:c=>drawWhale(c,ZW*.48,wy,46),box:[ZW*.48,wy-.45*46,3.8*46,1.5*46],lab:'humpback'},{draw:c=>drawFluke(c,ZW*.82,hz+78+3*Math.sin(tt*.9),22),box:[ZW*.82,hz+78+3*Math.sin(tt*.9)+.1*22,2.9*22,1.05*22],lab:'fluke · ID 0417'}]; }
    if(kind==='reef'){ const mx=ZW*.5+4*Math.sin(tt*.8), my=h*.5+3*Math.sin(tt*1.1); return [{draw:c=>drawWhaleShark(c,ZW*.2,h*.8,24,9),box:[ZW*.2+.2*24,h*.8,5.6*24,2.2*24],lab:'whale shark'},{draw:c=>drawManta(c,mx,my,42,7),box:[mx,my+.45*42,3.5*42,2.4*42],lab:'manta · match 0.93'}]; }
    if(kind==='trap'){ const ax=ZW*.52, ay=h*.5+8; return [{draw:c=>drawAntelope(c,ax,ay,26,tt*6),box:[ax+.3*26,ay-.4*26,2.9*26,2.75*26],lab:'antelope'}]; }
    return []; }
  const TILES=['forest','savanna','sea','reef','trap','streets'];
  let t=0; const lock={}; // per tile: {key, since}
  function draw(){ const W=S.W,H=S.H, cols=W<520?2:3, rows=6/cols, gap=6, tw=(W-gap*(cols-1))/cols, th=(H-gap*(rows-1))/rows; const sc=tw/ZW, zh=th/sc; ctx.clearRect(0,0,W,H);
    TILES.forEach((k,i)=>{ const z=zones[k]; const x=(i%cols)*(tw+gap), y=Math.floor(i/cols)*(th+gap); const L=lock[k]||(lock[k]={key:null,since:0});
      ctx.save(); ctx.beginPath(); ctx.rect(x,y,tw,th); ctx.clip(); let target=null;
      if(z.view==='overhead'){ const img=raster(z,th); const d=(t*8+i*130)%ZW; ctx.drawImage(img.c,x-d,y,ZW,th); ctx.drawImage(img.c,x-d+ZW,y,ZW,th);
        // lock the ring onto whichever target is well inside the tile
        const cands=[]; for(const tg of z.targets){ let lx=((tg.x-d)%ZW+ZW)%ZW; const ly=tg.y+(th-TH)/2; if(lx>-tg.r&&lx<tw+tg.r&&ly>tg.r+4&&ly<th-tg.r-4) cands.push({x:x+lx,y:y+ly,r:tg.r,key:k+':'+tg.x,c:Math.min(lx,tw-lx)}); }
        target=cands.find(c=>c.key===L.key)||cands.sort((a,b)=>b.c-a.c)[0]||null;
        if(target){ if(L.key!==target.key){ L.key=target.key; L.since=t; } const kk=clamp((t-L.since)/.6,0,1); ring(ctx,target.x,target.y,target.r+8*(1-kk),kk>=1,1); } else L.key=null;
        ctx.restore(); }
      else { const img=raster(z,zh); ctx.drawImage(img.c,x,y,tw,th); ctx.translate(x,y); ctx.scale(sc,sc); if(k==='sea') waves(ctx,0,ZW,zh*.42,zh,t,.5);
        const subs=subjects(k,zh,t); for(const sb of subs) sb.draw(ctx); ctx.restore();
        const sb=subs[Math.floor((t+i*1.3)/3.2)%subs.length]; const key=k+':'+sb.lab; if(L.key!==key){ L.key=key; L.since=t; } const kk=clamp((t-L.since)/.6,0,1); const [bx,by,bw,bh]=sb.box; const g=10*(1-kk);
        box(ctx,x+bx*sc,y+by*sc,bw*sc+g,bh*sc+g,kk>=1,1,kk>=1?sb.lab:null); }
      const txt=z.label+' · '+z.view; ctx.font='500 11px "IBM Plex Sans", sans-serif'; ctx.fillStyle='rgba(243,239,228,.92)'; ctx.fillRect(x+8,y+8,ctx.measureText(txt).width+12,18); ctx.fillStyle='#15201A'; ctx.fillText(txt,x+14,y+21); }); }
  function tick(dt){ t+=dt; draw(); }
  // a composed still: two draws so every lock has settled
  function still(){ draw(); t+=.8; draw(); }
  if(freeze){ t=3.2; draw(); t=4; } // two draws so the locks have settled at t=4
  else if(motion.reduce){ t=3.2; draw(); t=4; }
  draw(); return {tick,still};
}

G.scenes.beyond=beyondInit;
})(window.Giganteum);
