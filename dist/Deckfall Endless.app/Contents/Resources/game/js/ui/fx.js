'use strict';
// ===================== VISUAL EFFECTS =====================
// Two canvases: #bg behind the table carries the ambient embers; #fxc in front of everything carries the element particles.
// Every nature (element) has three effects; hits pick one at random, status effects use the third (the "aura"), heals and
// blocks play on the player's plaque. All effects are built from a few emitters (radial, rise, fall, ring, streaks, rays,
// bolt, spiral, sweep, column) and shapes (dot, puff, streak, tri, leaf, star, ring, ray, bolt).
const FX=(()=>{
  const cv=document.getElementById('bg'); const ctx=cv?cv.getContext('2d'):null;
  const layer=()=>document.getElementById('fx');
  const fg=document.createElement('canvas'); fg.id='fxc'; const fctx=fg.getContext('2d'); { const l=layer(); if(l) l.appendChild(fg); }
  let W=0,H=0; const parts=[]; const ambient=[]; const fparts=[];
  const reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){ W=innerWidth; H=innerHeight; if(cv){ cv.width=W; cv.height=H; } fg.width=W; fg.height=H; }
  addEventListener('resize',resize); resize();
  for(let i=0;i<46;i++) ambient.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2+0.6,s:Math.random()*0.35+0.08,a:Math.random()*0.5+0.15,c:['#f2c069','#5de0d2','#9d8bff','#ff7b3d'][i%4],ph:Math.random()*6});
  function burst(x,y,color,n,opts){ if(reduced) return; for(let i=0;i<(n||18);i++){ const a=Math.random()*Math.PI*2, sp=((opts&&opts.speed)||1)*(2+Math.random()*4); parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,decay:0.02+Math.random()*0.03,r:2+Math.random()*3,c:color,g:0.15}); } }
  // ---- element particles ----
  const TAU=Math.PI*2; const rnd=(a,b)=>a+Math.random()*(b-a); const pk=a=>a[Math.floor(Math.random()*a.length)];
  const PAL={phys:['#ffffff','#cfd3dc','#8c96a8'], beast:['#f5dfc0','#d8b48a','#8a5a3a'], fire:['#ffd166','#ff7b3d','#ff3d1f'], water:['#d6f0ff','#47b6ff','#1f6fd0'], ice:['#ffffff','#9ff0ff','#5fc8e8'], light:['#fff7b0','#ffe14d','#ffb300'], grass:['#c8ff9a','#55d66b','#2c9a44'], poison:['#e6ff8a','#c6f542','#8a3fc0'], earth:['#f0d0a0','#d9a066','#8a5a2a'], shadow:['#d9c8ff','#9d8bff','#3a1f6b'], holy:['#ffffff','#fff1a8','#f2c069'], dragon:['#ffd1d6','#ff4f5e','#a8121f'], psychic:['#ffd6fb','#f562e8','#8e2a9e'], flying:['#e8fffb','#5fd9c9','#2a8f83'], fighting:['#f5d9c0','#c2703a','#6e3a14']};
  const ST_EL={burn:'fire',poison:'poison',chill:'ice',frozen:'ice',shock:'light',wet:'water',weak:'shadow',vuln:'shadow'};
  function spawn(p){ fparts.push(Object.assign({x:0,y:0,vx:0,vy:0,ax:0,ay:0,drag:1,life:1,decay:0.03,size:3,grow:0,rot:0,spin:0,shape:'dot',color:'#fff',alpha:1,glow:0,wobble:0,t:0,lw:2},p)); }
  function radial(x,y,cols,o){ o=o||{}; const n=o.n||24; for(let i=0;i<n;i++){ const a=o.spread!=null?(o.a0||0)+rnd(-o.spread,o.spread):rnd(0,TAU); const sp=rnd(o.s0==null?2:o.s0,o.s1==null?6:o.s1); spawn({x:x+rnd(-(o.jit||0),o.jit||0),y:y+rnd(-(o.jit||0),o.jit||0),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(o.up||0),ay:o.g||0,drag:o.drag||0.96,decay:rnd(o.d0||0.02,o.d1||0.04),size:rnd(o.z0||2,o.z1||4),shape:o.shape||'dot',color:pk(cols),spin:rnd(-0.3,0.3),rot:rnd(0,TAU),glow:o.glow||0,grow:o.grow||0,alpha:o.alpha||1}); } }
  function rise(x,y,cols,o){ o=o||{}; const n=o.n||22; for(let i=0;i<n;i++){ spawn({x:x+rnd(-(o.w||30),o.w||30),y:y+rnd(-(o.h0||10),o.h1||30),vx:rnd(-0.6,0.6),vy:-rnd(o.s0||1,o.s1||3),ay:-(o.acc||0.03),drag:0.99,decay:rnd(o.d0||0.012,o.d1||0.025),size:rnd(o.z0||2,o.z1||4),shape:o.shape||'dot',color:pk(cols),wobble:o.wobble==null?0.6:o.wobble,glow:o.glow||0,spin:rnd(-0.2,0.2),rot:rnd(0,TAU),grow:o.grow||0,alpha:o.alpha||1}); } }
  function fall(x,y,cols,o){ o=o||{}; const n=o.n||16; for(let i=0;i<n;i++){ spawn({x:x+rnd(-(o.w||40),o.w||40),y:y-rnd(o.h0||20,o.h1||70),vx:rnd(-0.4,0.4),vy:rnd(0.5,2),ay:o.g||0.18,drag:0.995,decay:rnd(0.018,0.03),size:rnd(o.z0||2,o.z1||4),shape:o.shape||'dot',color:pk(cols),glow:o.glow||0,spin:rnd(-0.2,0.2),rot:rnd(0,TAU)}); } }
  function ring(x,y,col,o){ o=o||{}; spawn({x,y,size:o.r0||6,grow:o.grow||3,shape:'ring',color:col,decay:o.decay||0.04,alpha:o.alpha||0.9,glow:o.glow||0,lw:o.lw||2}); }
  function streaks(x,y,cols,o){ o=o||{}; const n=o.n||3; const ang=o.ang==null?-0.75:o.ang; const len=o.len||70; const gap=o.gap||14; const px=-Math.sin(ang), py=Math.cos(ang); for(let i=0;i<n;i++){ const off=(i-(n-1)/2)*gap; const sx=x+px*off-Math.cos(ang)*len/2, sy=y+py*off-Math.sin(ang)*len/2; spawn({x:sx,y:sy,vx:Math.cos(ang)*(o.sp||14),vy:Math.sin(ang)*(o.sp||14),drag:0.86,decay:o.decay||0.055,size:o.z||3,shape:'streak',color:pk(cols),glow:o.glow||0.6,klen:o.klen||3.2}); } }
  function rays(x,y,cols,o){ o=o||{}; const n=o.n||12; for(let i=0;i<n;i++){ spawn({x,y,rot:(i/n)*TAU+rnd(-0.1,0.1),shape:'ray',size:o.r0||4,grow:o.grow||7,decay:o.decay||0.04,color:pk(cols),glow:o.glow||0.8,lw:o.lw||2,alpha:0.9}); } }
  function bolt(x,y,cols,o){ o=o||{}; const pts=[]; let cx=x+rnd(-70,70), cy=y-(o.h||230); pts.push([cx,cy]); const steps=8; for(let i=1;i<=steps;i++){ const k=i/steps; cx=x+(cx-x)*(1-k)+rnd(-22,22)*(1-k); cy=y-(o.h||230)*(1-k)+rnd(-8,8); pts.push([cx,cy]); } pts[pts.length-1]=[x,y]; spawn({x,y,shape:'bolt',pts,decay:o.decay||0.07,color:cols[0],glow:1.2,lw:2.5}); spawn({x,y,shape:'bolt',pts,decay:o.decay||0.07,color:cols[1],glow:0.6,lw:5,alpha:0.35}); spawn({x,y,shape:'dot',size:26,grow:-2,decay:0.09,color:cols[0],glow:1.4,alpha:0.7}); }
  function spiral(x,y,cols,o){ o=o||{}; const n=o.n||28; for(let i=0;i<n;i++){ spawn({cx:x,cy:y,ang:rnd(0,TAU),r:rnd(o.r0||40,o.r1||90),rs:rnd(0.9,1.8),spin:o.dir||0.16,orbit:true,decay:rnd(0.016,0.026),size:rnd(2,4),shape:o.shape||'dot',color:pk(cols),glow:o.glow||0.5,x,y}); } }
  function sweep(x,y,cols,o){ o=o||{}; const n=o.n||24; const dir=o.dir||1; for(let i=0;i<n;i++){ spawn({x:x-dir*rnd(40,90),y:y+rnd(-10,20),vx:dir*rnd(4,8),vy:-rnd(1.5,4),ay:0.16,drag:0.98,decay:rnd(0.02,0.035),size:rnd(2,4.5),shape:o.shape||'dot',color:pk(cols),glow:o.glow||0.3}); } }
  function column(x,y,cols,o){ o=o||{}; const n=o.n||34; for(let i=0;i<n;i++){ spawn({x:x+rnd(-(o.w||16),o.w||16),y:y+rnd(-10,40),vx:rnd(-0.5,0.5),vy:-rnd(2,5),ay:-0.05,drag:0.985,decay:rnd(0.03,0.05),size:rnd(3,7),grow:-0.12,shape:o.shape||'dot',color:pk(cols),wobble:0.8,glow:o.glow||0.7}); } }
  const VAR={
    phys:[ (x,y,c)=>{ streaks(x,y,c,{n:3}); radial(x,y,c,{n:14,shape:'streak',s0:3,s1:7,d0:.04,d1:.07,z0:1.5,z1:2.5,klen:2}); },
           (x,y,c)=>{ ring(x,y,c[1],{grow:5,decay:.05,lw:3}); radial(x,y,c,{n:26,s0:2,s1:7,g:.15,d0:.025,d1:.045,glow:.3}); },
           (x,y,c)=>{ radial(x,y,c,{n:18,shape:'tri',s0:2,s1:5,g:.2,z0:3,z1:6,d0:.02,d1:.035}); ring(x,y,c[0],{grow:3,decay:.06,alpha:.6}); } ],
    beast:[ (x,y,c)=>{ streaks(x,y,c,{n:3,ang:-0.55,len:80,gap:12,sp:16}); radial(x,y,c,{n:10,s0:1,s1:4,g:.12,z0:1.5,z1:3}); },
            (x,y,c)=>{ radial(x,y,['#e8d2b0','#c9a57a','#a07a50'],{n:24,shape:'puff',s0:1,s1:3,z0:6,z1:12,grow:.35,d0:.03,d1:.045,alpha:.6,up:.6}); radial(x,y,c,{n:10,shape:'leaf',s0:2,s1:5,g:.1,z0:2,z1:4}); },
            (x,y,c)=>{ ring(x,y,c[1],{grow:4,decay:.05,lw:2}); ring(x,y,c[0],{r0:14,grow:5,decay:.05,lw:1.5,alpha:.6}); radial(x,y,c,{n:8,shape:'streak',s0:4,s1:8,d0:.05,d1:.08}); } ],
    fire:[ (x,y,c)=>{ radial(x,y,c,{n:30,s0:1.5,s1:6,up:1.2,g:-.02,glow:.9,d0:.02,d1:.04}); rise(x,y,c,{n:12,s0:1,s1:2.5,z0:1.5,z1:3,glow:.8}); },
           (x,y,c)=>{ column(x,y,c); rise(x,y+10,['#ffd166','#ff9a3d'],{n:10,w:12,glow:.9,z0:1,z1:2}); },
           (x,y,c)=>{ ring(x,y,'#ff7b3d',{grow:6,decay:.05,lw:4,glow:1}); ring(x,y,'#ffd166',{r0:10,grow:5,decay:.06,lw:2,glow:.8}); radial(x,y,c,{n:22,s0:3,s1:8,g:.05,glow:.8,d0:.03,d1:.05}); } ],
    water:[ (x,y,c)=>{ radial(x,y,c,{n:26,s0:2,s1:6,up:3,g:.22,glow:.4,d0:.02,d1:.035}); ring(x,y,c[1],{grow:4,decay:.06,lw:2,alpha:.6}); },
            (x,y,c)=>{ sweep(x,y,c,{n:30,dir:1}); sweep(x,y+8,c,{n:14,dir:1,shape:'puff'}); },
            (x,y,c)=>{ rise(x,y,c,{n:18,shape:'bubble',s0:.8,s1:2,z0:3,z1:7,wobble:.9,glow:.3,d0:.012,d1:.02}); } ],
    ice:[ (x,y,c)=>{ radial(x,y,c,{n:20,shape:'tri',s0:3,s1:8,g:.12,z0:3,z1:7,glow:.6,d0:.02,d1:.035}); },
          (x,y,c)=>{ fall(x,y,c,{n:26,shape:'star',w:60,h0:10,h1:90,g:.04,z0:2,z1:4,glow:.6}); },
          (x,y,c)=>{ ring(x,y,c[1],{grow:5,decay:.045,lw:3,glow:.8}); ring(x,y,c[0],{r0:4,grow:3,decay:.05,lw:1.5,alpha:.7}); radial(x,y,c,{n:16,shape:'tri',s0:.5,s1:2,z0:4,z1:9,d0:.02,d1:.03,glow:.6}); } ],
    light:[ (x,y,c)=>{ bolt(x,y,c); radial(x,y,c,{n:14,shape:'streak',s0:4,s1:9,d0:.05,d1:.08,glow:1}); },
            (x,y,c)=>{ radial(x,y,c,{n:34,shape:'streak',s0:3,s1:10,d0:.04,d1:.07,glow:1,z0:1,z1:2,klen:2.5}); ring(x,y,c[0],{grow:6,decay:.08,lw:2,glow:1}); },
            (x,y,c)=>{ for(let i=0;i<3;i++) bolt(x+rnd(-50,50),y+rnd(-20,20),c,{h:120,decay:.1}); radial(x,y,c,{n:10,s0:2,s1:5,glow:1}); } ],
    grass:[ (x,y,c)=>{ radial(x,y,c,{n:22,shape:'leaf',s0:2,s1:6,g:.06,z0:3,z1:6,d0:.018,d1:.03,up:1}); },
            (x,y,c)=>{ radial(x,y,['#ffb7d5','#ff8fb8','#c8ff9a'],{n:18,shape:'leaf',s0:1,s1:4,g:.03,z0:3,z1:5,d0:.015,d1:.025}); ring(x,y,c[1],{grow:3.5,decay:.05,lw:2,alpha:.7}); },
            (x,y,c)=>{ rise(x,y,c,{n:16,shape:'leaf',s0:1,s1:3,z0:3,z1:5,wobble:1.2}); radial(x,y,['#7bff8a','#c8ff9a'],{n:8,s0:1,s1:3,glow:.7}); } ],
    poison:[ (x,y,c)=>{ rise(x,y,c,{n:18,shape:'bubble',s0:.6,s1:1.8,z0:3,z1:8,wobble:.7,glow:.5,d0:.012,d1:.02}); },
             (x,y,c)=>{ radial(x,y,['#a5e83a','#7ac02a','#8a3fc0'],{n:22,shape:'puff',s0:.5,s1:2.5,z0:8,z1:16,grow:.3,d0:.02,d1:.035,alpha:.55,up:.4}); },
             (x,y,c)=>{ fall(x,y,c,{n:14,shape:'drip',w:36,h0:0,h1:60,g:.2,z0:2,z1:4,glow:.4}); ring(x,y+20,c[1],{grow:2.5,decay:.06,lw:1.5,alpha:.5}); } ],
    earth:[ (x,y,c)=>{ radial(x,y,c,{n:16,shape:'tri',s0:2,s1:7,g:.3,z0:4,z1:9,d0:.02,d1:.035,up:2}); radial(x,y,['#c9a57a','#8a5a2a'],{n:12,shape:'puff',s0:.5,s1:2,z0:8,z1:14,alpha:.5,grow:.3,d0:.03,d1:.05}); },
            (x,y,c)=>{ radial(x,y,['#d9b48a','#b08050','#7a4a20'],{n:30,shape:'puff',s0:1,s1:3.5,z0:8,z1:18,grow:.4,d0:.02,d1:.035,alpha:.55,up:.8}); },
            (x,y,c)=>{ ring(x,y,c[1],{grow:6,decay:.05,lw:3}); ring(x,y,c[2],{r0:4,grow:5,decay:.05,lw:2,alpha:.7}); radial(x,y,c,{n:12,shape:'streak',spread:.25,a0:0,s0:5,s1:9,d0:.05,d1:.08}); radial(x,y,c,{n:12,shape:'streak',spread:.25,a0:Math.PI,s0:5,s1:9,d0:.05,d1:.08}); } ],
    shadow:[ (x,y,c)=>{ rise(x,y,c,{n:20,shape:'puff',s0:1,s1:2.5,z0:5,z1:11,wobble:1,glow:.4,alpha:.7,d0:.015,d1:.025}); },
             (x,y,c)=>{ spiral(x,y,c,{n:30,dir:-0.18,glow:.6}); ring(x,y,c[1],{r0:60,grow:-2.5,decay:.035,lw:2,alpha:.7,glow:.6}); },
             (x,y,c)=>{ radial(x,y,['#2a1450','#4a2a80','#9d8bff'],{n:24,shape:'puff',s0:.5,s1:2.5,z0:10,z1:20,grow:.4,d0:.02,d1:.03,alpha:.6}); radial(x,y,c,{n:8,shape:'streak',s0:3,s1:6,glow:.6,d0:.04,d1:.06}); } ],
    holy:[ (x,y,c)=>{ rays(x,y,c,{n:14,grow:8}); ring(x,y,c[2],{grow:4,decay:.05,lw:2,glow:.8,alpha:.7}); },
           (x,y,c)=>{ radial(x,y,c,{n:26,shape:'star',s0:1,s1:4,g:-.02,z0:2,z1:5,glow:1,d0:.015,d1:.03,alpha:.95}); },
           (x,y,c)=>{ ring(x,y,'#fff1a8',{r0:8,grow:5,decay:.04,lw:4,glow:1.2}); ring(x,y,'#ffffff',{r0:2,grow:4,decay:.05,lw:2,glow:1,alpha:.8}); radial(x,y,c,{n:14,s0:1,s1:3,g:-.03,glow:1,d0:.02,d1:.03}); } ],
    dragon:[ (x,y,c)=>{ radial(x,y,c,{n:26,shape:'tri',s0:2,s1:7,g:.15,z0:3,z1:7,glow:.8,d0:.02,d1:.035}); rise(x,y,['#ffd166','#ff4f5e'],{n:10,s0:1,s1:2.5,glow:.8}); },
             (x,y,c)=>{ column(x,y,c); ring(x,y,c[1],{grow:6,decay:.05,lw:3,glow:.9}); },
             (x,y,c)=>{ streaks(x,y,c,{n:3,ang:-0.5,len:90,gap:14}); radial(x,y,c,{n:16,s0:3,s1:8,glow:.7,d0:.03,d1:.05}); } ],
    psychic:[ (x,y,c)=>{ spiral(x,y,c,{n:30,dir:0.2,glow:.7}); ring(x,y,c[1],{grow:4,decay:.05,lw:2,glow:.8,alpha:.7}); },
              (x,y,c)=>{ rays(x,y,c,{n:10,grow:6}); ring(x,y,c[0],{r0:40,grow:-2,decay:.04,lw:2,alpha:.7,glow:.6}); },
              (x,y,c)=>{ radial(x,y,c,{n:24,shape:'star',s0:1,s1:4,g:-.01,z0:2,z1:5,glow:.9,d0:.015,d1:.03}); } ],
    flying:[ (x,y,c)=>{ sweep(x,y,c,{n:28,dir:1,shape:'leaf'}); sweep(x,y-10,c,{n:12,dir:1}); },
             (x,y,c)=>{ radial(x,y,c,{n:20,shape:'leaf',s0:3,s1:8,g:.02,z0:3,z1:6,d0:.02,d1:.035,up:1.5}); ring(x,y,c[0],{grow:5,decay:.06,lw:2,alpha:.6}); },
             (x,y,c)=>{ streaks(x,y,c,{n:4,ang:-0.2,len:110,gap:12}); radial(x,y,c,{n:10,shape:'streak',s0:4,s1:9,d0:.05,d1:.08}); } ],
    fighting:[ (x,y,c)=>{ ring(x,y,c[1],{grow:7,decay:.06,lw:4}); radial(x,y,c,{n:20,s0:3,s1:8,g:.15,d0:.03,d1:.05,glow:.3}); },
               (x,y,c)=>{ streaks(x,y,c,{n:2,ang:-1.1,len:80,gap:18}); radial(x,y,c,{n:14,shape:'streak',s0:3,s1:7,d0:.04,d1:.07}); },
               (x,y,c)=>{ radial(x,y,['#ffffff','#f5d9c0'],{n:12,shape:'star',s0:2,s1:6,g:.1,z0:2,z1:4,glow:.5,d0:.03,d1:.05}); ring(x,y,c[2],{r0:6,grow:5,decay:.05,lw:3,alpha:.8}); } ],
  };
  function elementFx(el,x,y,v){ if(reduced) return; const cols=PAL[el]||PAL.phys; const list=VAR[el]||VAR.phys; const fn=list[v!=null?((v%list.length)+list.length)%list.length:Math.floor(Math.random()*list.length)]; fn(x,y,cols); }
  function stepFg(){ for(let i=fparts.length-1;i>=0;i--){ const p=fparts[i]; p.t++; if(p.orbit){ p.ang+=p.spin; p.r-=p.rs; p.x=p.cx+Math.cos(p.ang)*p.r; p.y=p.cy+Math.sin(p.ang)*p.r; if(p.r<=2) p.life=0; } else { p.vx+=p.ax; p.vy+=p.ay; if(p.wobble) p.vx+=Math.sin(p.t*0.35+p.rot)*p.wobble*0.12; p.vx*=p.drag; p.vy*=p.drag; p.x+=p.vx; p.y+=p.vy; } p.rot+=p.spin; p.size+=p.grow; p.life-=p.decay; if(p.life<=0||p.size<=0) fparts.splice(i,1); } }
  function drawFg(){ fctx.clearRect(0,0,W,H); if(!fparts.length) return;
    for(const p of fparts){ const a=Math.max(0,Math.min(1,p.life))*p.alpha; if(a<=0) continue; fctx.globalAlpha=a; fctx.fillStyle=p.color; fctx.strokeStyle=p.color; fctx.lineWidth=p.lw; fctx.lineCap='round'; fctx.shadowBlur=p.glow?12*p.glow:0; fctx.shadowColor=p.color;
      switch(p.shape){
        case 'dot': fctx.beginPath(); fctx.arc(p.x,p.y,Math.max(0.1,p.size),0,TAU); fctx.fill(); break;
        case 'bubble': fctx.lineWidth=1.2; fctx.beginPath(); fctx.arc(p.x,p.y,Math.max(0.1,p.size),0,TAU); fctx.stroke(); fctx.globalAlpha=a*0.35; fctx.beginPath(); fctx.arc(p.x-p.size*0.3,p.y-p.size*0.3,Math.max(0.1,p.size*0.3),0,TAU); fctx.fill(); break;
        case 'puff': { fctx.shadowBlur=0; const g=fctx.createRadialGradient(p.x,p.y,0,p.x,p.y,Math.max(0.1,p.size)); g.addColorStop(0,p.color); g.addColorStop(1,'rgba(0,0,0,0)'); fctx.fillStyle=g; fctx.beginPath(); fctx.arc(p.x,p.y,Math.max(0.1,p.size),0,TAU); fctx.fill(); } break;
        case 'streak': { const k=p.klen||3; fctx.lineWidth=p.size; fctx.beginPath(); fctx.moveTo(p.x,p.y); fctx.lineTo(p.x-p.vx*k,p.y-p.vy*k); fctx.stroke(); } break;
        case 'drip': fctx.beginPath(); fctx.ellipse(p.x,p.y,p.size*0.6,p.size,0,0,TAU); fctx.fill(); break;
        case 'tri': fctx.save(); fctx.translate(p.x,p.y); fctx.rotate(p.rot); fctx.beginPath(); fctx.moveTo(0,-p.size); fctx.lineTo(p.size*0.7,p.size*0.6); fctx.lineTo(-p.size*0.7,p.size*0.6); fctx.closePath(); fctx.fill(); fctx.restore(); break;
        case 'leaf': fctx.save(); fctx.translate(p.x,p.y); fctx.rotate(p.rot); fctx.beginPath(); fctx.ellipse(0,0,p.size,p.size*0.45,0,0,TAU); fctx.fill(); fctx.restore(); break;
        case 'star': { const s=p.size; fctx.lineWidth=1.2; fctx.beginPath(); fctx.moveTo(p.x-s,p.y); fctx.lineTo(p.x+s,p.y); fctx.moveTo(p.x,p.y-s); fctx.lineTo(p.x,p.y+s); fctx.stroke(); fctx.beginPath(); fctx.arc(p.x,p.y,s*0.3,0,TAU); fctx.fill(); } break;
        case 'ring': fctx.beginPath(); fctx.arc(p.x,p.y,Math.max(0.1,p.size),0,TAU); fctx.stroke(); break;
        case 'ray': fctx.beginPath(); fctx.moveTo(p.x,p.y); fctx.lineTo(p.x+Math.cos(p.rot)*p.size,p.y+Math.sin(p.rot)*p.size); fctx.stroke(); break;
        case 'bolt': fctx.beginPath(); p.pts.forEach((q,i)=>i?fctx.lineTo(q[0],q[1]):fctx.moveTo(q[0],q[1])); fctx.stroke(); break;
      } }
    fctx.globalAlpha=1; fctx.shadowBlur=0; }
  function loop(){
    if(ctx){ ctx.clearRect(0,0,W,H);
      for(const p of ambient){ p.y-=p.s; if(p.y<-5){ p.y=H+5; p.x=Math.random()*W; } ctx.globalAlpha=p.a*(0.55+0.45*Math.sin(Date.now()/900+p.ph)); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
      for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life-=p.decay; if(p.life<=0){ parts.splice(i,1); continue; } ctx.globalAlpha=p.life; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2); ctx.fill(); }
      ctx.globalAlpha=1; }
    stepFg(); drawFg(); requestAnimationFrame(loop); }
  if(!reduced) requestAnimationFrame(loop); else if(ctx){ ctx.clearRect(0,0,W,H); }
  const q=s=>document.querySelector(s);
  function enemyNode(e){ return q(`.enemy[data-uid="${e.uid}"]`); }
  function enemyRect(e){ const n=enemyNode(e); return n?n.getBoundingClientRect():null; }
  function playerRect(){ const n=q('.player'); return n?n.getBoundingClientRect():null; }
  function pulse(n,cls){ if(!n) return; n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); }
  function hit(e,el,v){ const r=enemyRect(e); if(!r) return; elementFx(el||'phys',r.left+r.width/2,r.top+r.height*0.42,v); pulse(enemyNode(e),'hit'); }
  function status(e,st){ const r=enemyRect(e); if(!r) return; elementFx(ST_EL[st]||'shadow',r.left+r.width/2,r.top+r.height*0.45,2); }
  function player(el,v){ const r=playerRect(); if(!r) return; elementFx(el,r.left+r.width/2,r.top+r.height/2,v); }
  function playerHit(){ pulse(q('.player'),'hit'); pulse(q('#app'),'hurt'); const r=playerRect(); if(r&&!reduced){ const x=r.left+r.width/2, y=r.top+r.height/2; radial(x,y,['#ff9a8a','#ff4d6a','#8a1225'],{n:22,s0:2,s1:7,g:.12,glow:.4}); ring(x,y,'#ff4d6a',{grow:5,decay:.06,lw:3,alpha:.7}); } }
  function lunge(e){ pulse(enemyNode(e),'lunge'); }
  function death(e){ const n=enemyNode(e); if(!n) return; n.classList.add('dying'); const r=n.getBoundingClientRect(); if(!reduced){ const x=r.left+r.width/2,y=r.top+r.height/2; radial(x,y,['#ffffff','#fff1a8','#f2c069'],{n:34,s0:2,s1:8,g:.05,glow:.8,d0:.015,d1:.03}); ring(x,y,'#ffffff',{grow:7,decay:.04,lw:3,glow:1,alpha:.8}); } }
  function playCard(idx,target){
    const c=q(`.hand .card[data-i="${idx}"]`); if(!c) return; const r=c.getBoundingClientRect();
    const ghost=c.cloneNode(true); ghost.classList.add('ghost'); ghost.style.left=r.left+'px'; ghost.style.top=r.top+'px'; ghost.style.width=r.width+'px'; ghost.style.height=r.height+'px'; layer().appendChild(ghost);
    let tx=innerWidth/2-r.width/2, ty=innerHeight*0.3; const tr=target?enemyRect(target):null; if(tr){ tx=tr.left+tr.width/2-r.width/2; ty=tr.top+tr.height/2-r.height/2; }
    const a=ghost.animate([{transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1},{transform:`translate(${tx-r.left}px,${ty-r.top}px) scale(0.55) rotate(${tr?-8:0}deg)`,opacity:0.1}],{duration:reduced?1:330,easing:'cubic-bezier(.2,.7,.3,1)'});
    a.onfinish=()=>ghost.remove(); c.style.visibility='hidden';
  }
  function banner(text,cls){ const l=layer(); if(!l) return; const d=document.createElement('div'); d.className='banner '+(cls||''); d.textContent=text; l.appendChild(d); setTimeout(()=>d.remove(),1700); }
  function flash(cls){ const l=layer(); if(!l) return; const d=document.createElement('div'); d.className='flash '+(cls||''); l.appendChild(d); setTimeout(()=>d.remove(),800); }
  function countUp(el,to,ms){ if(!el) return; const from=parseInt(el.textContent,10)||0; const t0=performance.now(); const step=t=>{ const k=Math.min(1,(t-t0)/(ms||600)); el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  return {burst,hit,status,player,playerHit,lunge,death,playCard,banner,flash,enemyRect,countUp,elementFx,reduced};
})();
function banner(t,c){ FX.banner(t,c); }
