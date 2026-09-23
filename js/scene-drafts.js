/* Figures for the text-heavy stretch between the hero and the aerial section.
   Default: v1 and v4 (Trees) and v3 (How it adapts). ?v= picks others (comma-separated); ?v=0 shows none.
   All four are still frames: drawn once per size, no ticking.
   v1 one crown, five capabilities · v2 one patch, three sensors · v3 adaptation loop · v4 one stand across the years */
(function(G){
'use strict';
const {TAU,clamp,rng,setup,offscreen,drawCrown,makeSprites,blit,mix}=G;

const INK='#15201A', DIM='#4B5A50', MOSS='#2E5241', AMBER='#A8761F', AMBER_TEXT='#8A5F12', RULE='rgba(21,32,26,.16)', PAPER='#F3EFE4';
const GROUND='#B9C9A6';
const SANS='"IBM Plex Sans", sans-serif', SERIF='Fraunces, Georgia, serif';

/* ---------- shared bits ---------- */
function chip(ctx,x,y,txt){ ctx.font=`500 11px ${SANS}`; const w=ctx.measureText(txt).width+12; ctx.fillStyle='rgba(243,239,228,.92)'; ctx.fillRect(x,y,w,18); ctx.fillStyle=INK; ctx.fillText(txt,x+6,y+13); return w; }
function label(ctx,x,y,txt){ ctx.save(); ctx.font=`400 12px ${SANS}`; if('letterSpacing' in ctx) ctx.letterSpacing='1px'; ctx.fillStyle=MOSS; ctx.fillText(txt.toUpperCase(),x,y); ctx.restore(); }
function hline(ctx,x0,x1,y){ ctx.fillStyle=RULE; ctx.fillRect(x0,Math.round(y),x1-x0,1); }
function vline(ctx,x,y0,y1){ ctx.fillStyle=RULE; ctx.fillRect(Math.round(x),y0,1,y1-y0); }
function circle(ctx,x,y,r,stroke,w,dash){ ctx.save(); ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.strokeStyle=stroke; ctx.lineWidth=w; if(dash) ctx.setLineDash(dash); ctx.stroke(); ctx.restore(); }
function dot(ctx,x,y,r,fill){ ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fillStyle=fill; ctx.fill(); }
// a numbered caption in the page's item style: amber serif number, ink serif title, wrapped to width
function caption(ctx,x,y,w,num,txt,dim){ ctx.save(); ctx.globalAlpha=dim?.75:1; ctx.font=`400 13px ${SERIF}`; ctx.fillStyle=AMBER_TEXT; ctx.fillText(num,x,y); const nx=x+24;
  ctx.font=`400 15px ${SERIF}`; ctx.fillStyle=INK; let line='', yy=y; for(const word of txt.split(' ')){ const t=line?line+' '+word:word; if(ctx.measureText(t).width>w-24&&line){ ctx.fillText(line,nx,yy); line=word; yy+=19; } else line=t; } ctx.fillText(line,nx,yy); ctx.restore(); }

// a small patch of crowns with a clear focus crown in the middle (world units, centred on 0,0)
function cluster(seed,spr){ const q=rng(seed), out=[{x:0,y:0,si:15,focus:true}];
  for(let k=0;k<60&&out.length<9;k++){ const a=q()*TAU, d=62+q()*34, x=Math.cos(a)*d, y=Math.sin(a)*d*.8, si=3+(q()*10|0);
    if(out.every(o=>Math.hypot(o.x-x,o.y-y)>spr[o.si].r+spr[si].r-8)) out.push({x,y,si}); }
  return out; }

// an overhead tile world: ground plus crowns, some isolated and one tight stand; returns crowns in 0..1 coords
function tileWorld(seed,spr,{n=26,stand=0}={}){ const q=rng(seed), out=[];
  const fits=(x,y,r,gap)=>out.every(o=>Math.hypot((o.x-x)*300,(o.y-y)*200)>(spr[o.si].r+r)*gap);
  for(let k=0;k<400&&out.length<n;k++){ const si=2+(q()*(spr.length-2)|0), r=spr[si].r, x=.08+q()*.84, y=.14+q()*.78; if(stand&&x>.62&&y>.3&&y<.85) continue; if(fits(x,y,r,.95)) out.push({x,y,si}); }
  for(let k=0;k<400&&stand&&out.filter(o=>o.stand).length<stand;k++){ const si=1+(q()*5|0), r=spr[si].r, x=.66+q()*.26, y=.36+q()*.44; if(fits(x,y,r,.62)) out.push({x,y,si,stand:true}); }
  return out; }
function paintTile(g,w,h,crowns,spr,s,opts={}){ g.fillStyle=GROUND; g.fillRect(0,0,w,h);
  for(const c of crowns){ if(opts.skip&&opts.skip(c)) continue; const sp=spr[c.si], x=c.x*w, y=c.y*h, tint=opts.tint&&opts.tint(c);
    g.save(); g.translate(x,y); g.scale(s,s); if(tint) drawCrown(g,sp.c,0,0,1,tint,[sp.r*.14,sp.r*.16]); else blit(g,sp,0,0,1); g.restore(); } }

// grid of n cells; phones wrap into rows of `per` cells
function cells(n,x0,y0,W,cellH,gap,per){ const out=[]; const cols=Math.min(n,per), cw=(W-gap*(cols-1))/cols;
  for(let i=0;i<n;i++){ const r=Math.floor(i/cols), c=i%cols; out.push({x:x0+c*(cw+gap),y:y0+r*(cellH+gap),w:cw,h:cellH,row:r,col:c}); } return out; }

/* ---------- v1: one crown, five capabilities ---------- */
function v1(ctx,W,H,A){ const narrow=W<640; const spr=A.hero;
  const T=[['01','Locate and count individual trees',0],['02','Find dead trees',0],['03','Sort trees by class',0],['04','A history per tree',1],['05','Early warning',1]];
  const groups=narrow?[[0,1,2],[3,4]]:[[0,1,2,3,4]];
  const headH=30, capH=narrow?58:52, rowH=(H-(groups.length-1)*40)/groups.length, drawH=rowH-headH-capH;
  const cl=cluster(31,spr);
  groups.forEach((idx,gi)=>{ const y0=gi*(rowH+40); const n=narrow?3:5, cw=W/n;
    // group labels over their columns, with the page's hairline under them
    const starts=narrow?[[idx[0],gi?'In development':'Available now']]:[[0,'Available now'],[3,'In development']];
    for(const [i,t] of starts){ const c=narrow?0:i; label(ctx,c*cw,y0+14,t); }
    hline(ctx,0,W,y0+headH-6);
    idx.forEach((ti,k)=>{ const cx=k*cw, dev=T[ti][2]===1; if(k>0) vline(ctx,cx,y0+headH-6,y0+rowH);
      const s=Math.min(1,Math.min(cw-24,drawH)/230), mx=cx+cw/2, my=y0+headH+drawH/2+4;
      const px=(o)=>mx+o.x*s, py=(o)=>my+o.y*s;
      const draw=(o,alpha,tint)=>{ const sp=spr[o.si]; ctx.save(); ctx.translate(px(o),py(o)); ctx.scale(s,s); if(tint) drawCrown(ctx,sp.c,0,0,alpha,tint,[sp.r*.14,sp.r*.16]); else blit(ctx,sp,0,0,alpha); ctx.restore(); };
      const F=cl[0], fr=spr[F.si].r*s;
      if(ti===0){ for(const o of cl) draw(o,1); for(const o of cl){ const r=spr[o.si].r*s; circle(ctx,px(o),py(o),r*.98,AMBER,1.1); dot(ctx,px(o),py(o),2.4,INK); } }
      if(ti===1){ for(const o of cl) draw(o,o.focus?1:.4,o.focus?['#7A6A58','#8E8070']:null); const b=fr*2.5; ctx.save(); ctx.strokeStyle=AMBER; ctx.lineWidth=1.4; ctx.setLineDash([5,5]); ctx.strokeRect(mx-b/2,my-b/2,b,b); ctx.restore(); }
      if(ti===2){ const young=cl.filter(o=>!o.focus).slice(0,3); for(const o of cl) draw(o,o.focus||young.includes(o)?1:.4);
        circle(ctx,mx,my,fr*1.05,AMBER,2); for(const o of young){ const r=spr[o.si].r*s; circle(ctx,px(o),py(o),r*.98,MOSS,1.6,[3,3]); }
        const y0c=young[0]; chip(ctx,mx-26,my+fr+8,'mature'); chip(ctx,px(y0c)-18,py(y0c)-spr[y0c.si].r*s-24,'young'); }
      if(ti===3){ // the same crown in three captures, joined: one record
        const yrs=['2020','2023','2026'], step=Math.min(cw*.28,70*s+26), k0=mx-step, rr=fr*.62;
        ctx.save(); ctx.strokeStyle=AMBER; ctx.lineWidth=1.2; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(k0,my); ctx.lineTo(k0+2*step,my); ctx.stroke(); ctx.restore();
        yrs.forEach((y,j)=>{ const sp=spr[F.si], x=k0+j*step; ctx.save(); ctx.translate(x,my); ctx.scale(s*.62,s*.62); drawCrown(ctx,sp.c,0,0,.9,null,[sp.r*.14,sp.r*.16]); ctx.restore();
          circle(ctx,x,my,rr*1.08,AMBER,1.1,[4,4]); ctx.font=`500 11px ${SANS}`; ctx.fillStyle=DIM; ctx.textAlign='center'; ctx.fillText(y,x,my+rr+18); ctx.textAlign='left'; }); }
      if(ti===4){ // the crown's sequence drifting, and the question: how early?
        const seq=['#7FA06E','#8FA66E','#B8A25A'], step=Math.min(cw*.2,58*s+22), k0=mx-1.5*step, rr=fr*.62;
        ctx.save(); ctx.strokeStyle=AMBER; ctx.lineWidth=1.2; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(k0,my); ctx.lineTo(k0+3*step,my); ctx.stroke(); ctx.restore();
        seq.forEach((c,j)=>{ const sp=spr[F.si]; ctx.save(); ctx.translate(k0+j*step,my); ctx.scale(s*.62,s*.62); drawCrown(ctx,sp.c,0,0,.85,[c,mix(c,'#ffffff',.25)],[sp.r*.14,sp.r*.16]); ctx.restore(); });
        circle(ctx,k0+3*step,my,rr,AMBER,1.2,[3,4]); ctx.font=`400 ${Math.round(20*Math.max(.7,s))}px ${SERIF}`; ctx.fillStyle=AMBER_TEXT; ctx.textAlign='center'; ctx.fillText('?',k0+3*step,my+7); ctx.textAlign='left'; }
      if(dev){ ctx.fillStyle='rgba(243,239,228,.18)'; ctx.fillRect(cx+1,y0+headH-5,cw-1,drawH+8); }
      caption(ctx,cx+(k>0?14:0),y0+headH+drawH+26,cw-(k>0?20:6),T[ti][0],T[ti][1],dev);
    });
  });
}

/* ---------- v2: one patch, three sensors ---------- */
function v2(ctx,W,H,A){ const spr=A.forest, gap=6, n=3, cw=(W-gap*(n-1))/n, ch=H; const crowns=A.w2||(A.w2=tileWorld(52,spr,{n:22,stand:9}));
  const s=Math.min(1.1,cw/330);
  const sharp=offscreen(cw,ch); paintTile(sharp.x,cw,ch,crowns,spr,s);
  const make=(f)=>{ const c=document.createElement('canvas'); c.width=Math.max(4,Math.round(cw/f)); c.height=Math.max(4,Math.round(ch/f)); const g=c.getContext('2d'); g.drawImage(sharp.c,0,0,c.width,c.height); return c; };
  const soft=make(3.2), coarse=make(11);
  const short=cw<200; const tiles=[[short?'Drone':'Drone · anchor',sharp.c,true],[short?'Aerial':'Aerial · watch',soft,true],[short?'Satellite':'Satellite · watch',coarse,false]];
  tiles.forEach(([lab,img,smooth],i)=>{ const x=i*(cw+gap); ctx.save(); ctx.beginPath(); ctx.rect(x,0,cw,ch); ctx.clip(); ctx.imageSmoothingEnabled=smooth; ctx.drawImage(img,x,0,cw,ch); ctx.imageSmoothingEnabled=true;
    for(const c of crowns){ const cx=x+c.x*cw, cy=c.y*ch, r=spr[c.si].r*s;
      if(i===0) circle(ctx,cx,cy,r*.95,AMBER,1.3);
      else if(i===1){ circle(ctx,cx,cy,r*.95,AMBER,1.1,[4,4]); dot(ctx,cx,cy,2,INK); }
      else if(!c.stand){ circle(ctx,cx,cy,r*.95,AMBER,1.1,[4,4]); dot(ctx,cx,cy,2,INK); } }
    if(i===2){ // the crowns that merge at this resolution are reported as one stand
      const st=crowns.filter(c=>c.stand); let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const c of st){ const r=spr[c.si].r*s; x0=Math.min(x0,c.x*cw-r); x1=Math.max(x1,c.x*cw+r); y0=Math.min(y0,c.y*ch-r); y1=Math.max(y1,c.y*ch+r); }
      ctx.save(); ctx.strokeStyle=AMBER; ctx.lineWidth=1.6; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.ellipse(x+(x0+x1)/2,(y0+y1)/2,(x1-x0)/2+8,(y1-y0)/2+8,0,0,TAU); ctx.stroke(); ctx.restore();
      chip(ctx,x+Math.min(x0,cw-96),Math.min(ch-24,y1+14),'stand level'); }
    ctx.restore(); chip(ctx,x+8,8,lab); });
}

/* ---------- v3: adaptation loop ---------- */
function v3(ctx,W,H,A){ const spr=A.forest, gap=6, n=3, cw=(W-gap*(n-1))/n, ch=H; const crowns=A.w3||(A.w3=tileWorld(71,spr,{n:20}));
  const s=Math.min(1.1,cw/330);
  // the base model misses a few crowns and fires on two patches of bare ground (illustrative)
  const miss=new Set([2,7,13]); const q=rng(9); const fp=[];
  for(let k=0;k<500&&fp.length<2;k++){ const x=.12+q()*.76, y=.18+q()*.7; if(crowns.every(c=>Math.hypot((c.x-x)*cw,(c.y-y)*ch)>(spr[c.si].r+22)*s)&&fp.every(f=>Math.hypot((f.x-x)*cw,(f.y-y)*ch)>60*s)) fp.push({x,y}); }
  const tile=offscreen(cw,ch); paintTile(tile.x,cw,ch,crowns,spr,s);
  for(const f of fp){ tile.x.fillStyle='rgba(21,32,26,.12)'; tile.x.beginPath(); tile.x.ellipse(f.x*cw,f.y*ch,14*s+4,10*s+3,.4,0,TAU); tile.x.fill(); }
  const labs=cw<200?['Stage 1','Stage 2','Stage 3']:['Stage 1 · base model','Stage 2 · your corrections','Stage 3 · frozen v1'];
  for(let i=0;i<3;i++){ const x=i*(cw+gap); ctx.save(); ctx.beginPath(); ctx.rect(x,0,cw,ch); ctx.clip(); ctx.drawImage(tile.c,x,0,cw,ch);
    crowns.forEach((c,j)=>{ const cx=x+c.x*cw, cy=c.y*ch, r=spr[c.si].r*s*.95;
      if(i===0&&!miss.has(j)) circle(ctx,cx,cy,r,AMBER,1.4);
      if(i===1){ if(miss.has(j)){ circle(ctx,cx,cy,r+3,MOSS,2,[4,3]); ctx.save(); ctx.strokeStyle=MOSS; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-5,cy); ctx.lineTo(cx+5,cy); ctx.moveTo(cx,cy-5); ctx.lineTo(cx,cy+5); ctx.stroke(); ctx.restore(); } else { ctx.save(); ctx.globalAlpha=.4; circle(ctx,cx,cy,r,AMBER,1.4); ctx.restore(); } }
      if(i===2) circle(ctx,cx,cy,r,AMBER,1.6); });
    for(const f of fp){ const fx=x+f.x*cw, fy=f.y*ch, r=16*s+4;
      if(i===0) circle(ctx,fx,fy,r,AMBER,1.4);
      if(i===1){ ctx.save(); ctx.globalAlpha=.4; circle(ctx,fx,fy,r,AMBER,1.4); ctx.restore(); ctx.save(); ctx.strokeStyle=MOSS; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(fx-r*.7,fy-r*.7); ctx.lineTo(fx+r*.7,fy+r*.7); ctx.moveTo(fx+r*.7,fy-r*.7); ctx.lineTo(fx-r*.7,fy+r*.7); ctx.stroke(); ctx.restore(); } }
    ctx.restore(); chip(ctx,x+8,8,labs[i]); }
  // the frozen version is a fixed artefact: a small stamp on the last tile
  ctx.save(); ctx.font=`500 11px ${SANS}`; const t=cw<200?'v1 · frozen':'versioned · frozen', tw=ctx.measureText(t).width+14, sx=W-tw-8, sy=ch-26; ctx.fillStyle=PAPER; ctx.fillRect(sx,sy,tw,18); ctx.strokeStyle=AMBER; ctx.lineWidth=1; ctx.strokeRect(sx+.5,sy+.5,tw-1,17); ctx.fillStyle=AMBER_TEXT; ctx.fillText(t,sx+7,sy+13); ctx.restore();
}

/* ---------- v4: one stand across the years ---------- */
function v4(ctx,W,H,A){ const spr=A.forest, narrow=W<640, gap=6, per=narrow?3:5; const crowns=A.w4||(A.w4=tileWorld(88,spr,{n:13}));
  const years=['2019','2021','2023','2025','2026'];
  // one crown declines, one is gone by 2025 (illustrative)
  const mid=crowns.filter(c=>c.x>.3&&c.x<.7&&c.y>.3&&c.y<.75); const focus=(mid.length?mid:crowns).reduce((b,c)=>spr[c.si].r>spr[b.si].r?c:b);
  const gone=crowns.filter(c=>c!==focus).sort((a,b)=>Math.abs(a.x-.3)-Math.abs(b.x-.3))[0];
  const tints=[null,[mix('#7FA06E','#B8A25A',.35),'#B6C79A'],['#B8A25A','#CDB77A'],['#8A5A33','#A8743E'],['#7A6A58','#8E8070']];
  const rows=Math.ceil(5/per), ch=(H-gap*(rows-1))/rows, cs=cells(5,0,0,W,ch,gap,per), s=Math.min(1,cs[0].w/300);
  cs.forEach((c,i)=>{ const t=offscreen(c.w,c.h); paintTile(t.x,c.w,c.h,crowns,spr,s,{skip:o=>o===gone&&i>=3,tint:o=>o===focus?tints[i]:null});
    if(i>=3){ t.x.fillStyle='rgba(120,100,60,.25)'; t.x.beginPath(); t.x.ellipse(gone.x*c.w,gone.y*c.h,spr[gone.si].r*s*.7,spr[gone.si].r*s*.5,0,0,TAU); t.x.fill(); }
    ctx.drawImage(t.c,c.x,c.y,c.w,c.h);
    for(const o of crowns){ if(o===gone&&i>=3) continue; dot(ctx,c.x+o.x*c.w,c.y+o.y*c.h,1.8,INK); }
    circle(ctx,c.x+focus.x*c.w,c.y+focus.y*c.h,spr[focus.si].r*s*1.05,AMBER,1.6);
    if(i>=3) circle(ctx,c.x+gone.x*c.w,c.y+gone.y*c.h,spr[gone.si].r*s*.9,DIM,1.2,[3,3]);
    chip(ctx,c.x+8,c.y+8,years[i]); });
  // the record: one line joining the same crown through every capture in a row
  ctx.save(); ctx.strokeStyle=AMBER; ctx.lineWidth=1.2; for(let r=0;r<rows;r++){ const rc=cs.filter(c=>c.row===r); if(rc.length<2) continue; const y=rc[0].y+focus.y*rc[0].h, r0=spr[focus.si].r*s*1.05;
    ctx.beginPath(); for(let k=0;k<rc.length-1;k++){ ctx.moveTo(rc[k].x+focus.x*rc[k].w+r0,y); ctx.lineTo(rc[k+1].x+focus.x*rc[k+1].w-r0,y); } ctx.stroke(); } ctx.restore();
}

const DRAW={1:v1,2:v2,3:v3,4:v4};
const LABELS={1:'Illustration: the same crown five times: located and counted, flagged as likely dead, sorted by class; then, in development, followed across captures and read as a sequence',
  2:'Illustration: one patch of forest seen by drone, aircraft and satellite; the crowns found in the sharpest image are read again in the coarser ones, and where crowns merge the result is reported for the stand',
  3:'Illustration: a base model misses some crowns and marks bare ground; a reviewer adds and removes marks; the corrected model is frozen as a version',
  4:'Illustration: the same stand captured in 2019, 2021, 2023, 2025 and 2026; one crown browns year by year and another is gone by 2025'};

// init for one draft canvas; returns a scene api with no tick (still frame)
G.scenes.draft=function(v,canvasId){ const canvas=document.getElementById(canvasId); canvas.setAttribute('aria-label',LABELS[v]);
  const A={hero:makeSprites(5,24,20,58), forest:makeSprites(11,14,14,40,['#5E7F4B','#6A8B55','#54733F','#7A9A62'])};
  const S=setup(canvas,()=>draw()); function draw(){ S.ctx.clearRect(0,0,S.W,S.H); DRAW[v](S.ctx,S.W,S.H,A); }
  draw(); return {tick:null}; };
})(window.Giganteum);
