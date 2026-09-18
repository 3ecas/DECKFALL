'use strict';
// ===================== SOUND: procedural, layered, reverberant (no chiptune waves) =====================
const SFX=(()=>{
  let ctx=null, master=null, verb=null, verbGain=null, noiseBuf=null; let enabled=true; let volume=0.85; let lastError=null;
  try{ enabled=localStorage.getItem('deckfall_sound')!=='off'; }catch(e){}
  function init(){
    if(ctx) return true; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
    ctx=new AC(); master=ctx.createGain(); master.gain.value=volume;
    const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-16; comp.knee.value=18; comp.ratio.value=4; comp.attack.value=0.003; comp.release.value=0.22;
    master.connect(comp); comp.connect(ctx.destination);
    // reverb: 2.2 s of decaying stereo noise as an impulse response
    verb=ctx.createConvolver(); const len=Math.floor(ctx.sampleRate*2.2); const ir=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++){ const k=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-k,3)*(i<300?i/300:1); } }
    verb.buffer=ir; verbGain=ctx.createGain(); verbGain.gain.value=0.3; verb.connect(verbGain); verbGain.connect(master);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate); const nd=noiseBuf.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
    return true;
  }
  function resume(){ if(ctx&&ctx.state==='suspended') ctx.resume(); }
  const now=()=>ctx.currentTime; const R=(v,pct)=>v*(1+(Math.random()*2-1)*(pct||0));
  // A voice: gain envelope, optional reverb send.
  function voice(t,g,a,dur,send){ const gn=ctx.createGain(); gn.gain.setValueAtTime(0.0001,t); gn.gain.linearRampToValueAtTime(g,t+Math.max(0.002,a)); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur); gn.connect(master); if(send){ const s=ctx.createGain(); s.gain.value=send; gn.connect(s); s.connect(verb); } return gn; }
  // Filtered noise burst. o: dur, type, f0, f1, q, g, a, send, delay
  function nb(o){ const t=now()+(o.delay||0); const src=ctx.createBufferSource(); src.buffer=noiseBuf; src.loop=true; const f=ctx.createBiquadFilter(); f.type=o.type||'bandpass'; f.Q.value=o.q||1; f.frequency.setValueAtTime(R(o.f0||1000,0.06),t); if(o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(30,o.f1),t+(o.dur||0.2)); const gn=voice(t,o.g||0.3,o.a||0.004,o.dur||0.2,o.send||0.2); src.connect(f); f.connect(gn); src.start(t); src.stop(t+(o.dur||0.2)+0.05); }
  // Oscillator with pitch envelope and optional lowpass sweep. o: type, f0, f1, dur, g, a, send, lp, lp1, det, delay
  function osc(o){ const t=now()+(o.delay||0); const s=ctx.createOscillator(); s.type=o.type||'sine'; s.frequency.setValueAtTime(R(o.f0||440,0.02),t); if(o.f1) s.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+(o.dur||0.3)*(o.bend||0.9)); s.detune.value=(o.det!=null?o.det:(Math.random()*2-1)*10); let n=s; if(o.lp){ const f=ctx.createBiquadFilter(); f.type='lowpass'; f.Q.value=o.q||0.8; f.frequency.setValueAtTime(o.lp,t); if(o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1,t+(o.dur||0.3)); s.connect(f); n=f; } const gn=voice(t,o.g||0.25,o.a||0.005,o.dur||0.3,o.send||0.25); n.connect(gn); s.start(t); s.stop(t+(o.dur||0.3)+0.05); }
  const thump=(w,g,d)=>{ osc({type:'sine',f0:150*(w||1),f1:40,dur:0.24,g:g||0.7,a:0.002,send:0.15,delay:d}); nb({dur:0.07,type:'lowpass',f0:2000,f1:250,g:(g||0.7)*0.7,send:0.1,delay:d}); nb({dur:0.035,type:'highpass',f0:3000,g:0.25,send:0.05,delay:d}); };
  const whoosh=(p,g,d)=>nb({dur:0.3,type:'bandpass',f0:260*(p||1),f1:2600*(p||1),q:1.1,g:g||0.35,a:0.05,send:0.25,delay:d});
  const clank=(d)=>{ nb({dur:0.14,type:'bandpass',f0:2900,q:6,g:0.4,send:0.3,delay:d}); osc({type:'sine',f0:1900,f1:1500,dur:0.22,g:0.18,send:0.3,delay:d}); thump(0.8,0.4,d); };
  const chime=(fs,g,dur,d)=>fs.forEach((f,i)=>osc({type:'sine',f0:f,dur:dur||0.9,g:(g||0.16)*(1-i*0.12),a:0.01,send:0.55,delay:(d||0)+i*0.035,det:(Math.random()*2-1)*6}));
  const crackle=(n,g,d)=>{ for(let i=0;i<n;i++) nb({dur:0.04+Math.random()*0.05,type:'lowpass',f0:1400,f1:500,g:(g||0.3)*(0.6+Math.random()*0.6),send:0.1,delay:(d||0)+Math.random()*0.32}); };
  const S={};
  S.click=()=>nb({dur:0.05,type:'highpass',f0:2400,g:0.12,send:0.05});
  S.draw=o=>{ const n=Math.min(6,(o&&o.n)||1); for(let i=0;i<n;i++) nb({dur:0.08,type:'bandpass',f0:1700,f1:3400,q:0.9,g:0.16,send:0.08,delay:i*0.045}); };
  S.start=()=>{ chime([262,330,392,523],0.14,1.6); nb({dur:0.9,type:'highpass',f0:7000,g:0.06,a:0.2,send:0.5}); };
  S.battle=()=>{ thump(0.9,0.6); whoosh(0.8,0.3); };
  S.elite=()=>{ thump(0.7,0.8); osc({type:'sawtooth',f0:80,dur:1.2,g:0.14,a:0.05,lp:300,lp1:120,send:0.4}); };
  S.boss=()=>{ thump(0.5,1); nb({dur:0.9,type:'lowpass',f0:180,g:0.5,send:0.3}); osc({type:'sawtooth',f0:55,dur:2.2,g:0.16,a:0.1,lp:220,lp1:90,send:0.5}); osc({type:'sawtooth',f0:82.5,dur:2.2,g:0.1,a:0.1,lp:220,lp1:90,send:0.5,det:8}); };
  S.play=o=>{ const ty=o&&o.type; if(ty==='spell'||ty==='summon') { nb({dur:0.35,type:'bandpass',f0:500,f1:3800,q:1.4,g:0.3,a:0.06,send:0.4}); osc({type:'sine',f0:640,f1:1280,dur:0.28,g:0.08,send:0.4}); } else if(ty==='shield'){ clank(); } else if(ty==='mecha'){ thump(0.8,0.5); nb({dur:0.12,type:'bandpass',f0:3200,q:5,g:0.3,send:0.2}); osc({type:'sine',f0:420,f1:900,dur:0.16,g:0.1,delay:0.12}); osc({type:'sine',f0:900,f1:380,dur:0.18,g:0.1,delay:0.28}); } else if(ty==='trap'){ for(let i=0;i<3;i++) nb({dur:0.03,type:'highpass',f0:3200,g:0.25,delay:i*0.05}); clank(0.16); } else if(ty==='potion'){ osc({type:'sine',f0:520,f1:980,dur:0.2,g:0.12,send:0.3}); nb({dur:0.25,type:'lowpass',f0:1400,f1:400,g:0.15,send:0.2}); } else whoosh(1.2,0.35); };
  S.hit=o=>{ const el=(o&&o.el)||'phys'; const big=o&&(o.se||o.crit);
    if(el==='fire'){ whoosh(0.5,0.3); crackle(6,0.35); thump(1,0.5,0.03); }
    else if(el==='water'){ nb({dur:0.36,type:'lowpass',f0:2400,f1:280,g:0.4,send:0.3}); for(let i=0;i<3;i++) osc({type:'sine',f0:520+Math.random()*500,f1:1100,dur:0.07,g:0.12,delay:0.03+i*0.06,send:0.3}); thump(0.9,0.35,0.02); }
    else if(el==='ice'){ chime([2300,3400,4700,6100],0.12,0.45); nb({dur:0.12,type:'bandpass',f0:6200,q:3,g:0.25,send:0.5}); thump(1.2,0.3); }
    else if(el==='light'){ nb({dur:0.13,type:'highpass',f0:900,g:0.7,a:0.001,send:0.2}); osc({type:'sawtooth',f0:95,f1:55,dur:0.36,g:0.25,lp:3200,lp1:180,send:0.3}); thump(0.8,0.5,0.02); }
    else if(el==='grass'){ nb({dur:0.3,type:'bandpass',f0:900,f1:1500,q:2,g:0.35,a:0.02,send:0.2}); nb({dur:0.2,type:'bandpass',f0:1400,q:2,g:0.2,delay:0.06}); thump(1,0.4); }
    else if(el==='poison'){ for(let i=0;i<5;i++) osc({type:'sine',f0:300+Math.random()*450,f1:200,dur:0.09,g:0.12,delay:i*0.05,lp:1200,send:0.25}); nb({dur:0.4,type:'bandpass',f0:4200,q:1.5,g:0.1,a:0.05,send:0.2}); thump(0.9,0.3); }
    else if(el==='earth'){ osc({type:'sine',f0:75,f1:28,dur:0.55,g:0.9,a:0.002,send:0.2}); nb({dur:0.5,type:'lowpass',f0:320,f1:90,g:0.6,send:0.2}); nb({dur:0.05,type:'highpass',f0:2500,g:0.3}); }
    else if(el==='shadow'){ osc({type:'sawtooth',f0:110,dur:0.5,g:0.28,a:0.12,lp:200,lp1:1500,send:0.6}); nb({dur:0.45,type:'bandpass',f0:380,f1:900,q:1.5,g:0.3,a:0.15,send:0.6}); thump(0.7,0.4,0.12); }
    else if(el==='holy'){ chime([880,1320,1760,2640],0.14,0.9); nb({dur:0.5,type:'highpass',f0:7500,g:0.08,a:0.05,send:0.6}); thump(1.1,0.3); }
    else { thump(1,0.6); whoosh(1.3,0.25); nb({dur:0.06,type:'bandpass',f0:1800,q:2,g:0.3}); }
    if(big){ thump(0.6,0.7,0.02); nb({dur:0.5,type:'highpass',f0:6000,g:0.1,a:0.02,send:0.6}); } };
  S.tick=o=>{ const el=o&&o.el; if(el==='fire') crackle(4,0.25); else if(el==='poison') osc({type:'sine',f0:420,f1:240,dur:0.12,g:0.12,lp:1200,send:0.2}); else { thump(1,0.35); } };
  S.status=o=>{ const s=o&&o.s; if(s==='burn') crackle(4,0.22); else if(s==='poison') osc({type:'sine',f0:380,f1:220,dur:0.14,g:0.12,lp:1000,send:0.25}); else if(s==='chill') chime([3200,4800],0.08,0.35); else if(s==='shock') nb({dur:0.08,type:'highpass',f0:1200,g:0.35,send:0.15}); else if(s==='wet') osc({type:'sine',f0:700,f1:1300,dur:0.1,g:0.1,send:0.3}); else osc({type:'sine',f0:230,f1:150,dur:0.25,g:0.14,lp:900,send:0.3}); };
  S.freeze=()=>{ chime([2600,3900,5200,7000],0.14,0.8); nb({dur:0.09,type:'highpass',f0:4000,g:0.4,send:0.4}); osc({type:'sine',f0:120,f1:60,dur:0.3,g:0.3}); };
  S.block=()=>clank();
  S.blocked=()=>{ clank(); thump(1.1,0.35); };
  S.heal=()=>{ chime([523,659,784,1047],0.13,0.8); nb({dur:0.7,type:'highpass',f0:8000,g:0.05,a:0.1,send:0.5}); };
  S.mana=()=>{ osc({type:'sine',f0:480,f1:960,dur:0.22,g:0.12,send:0.45}); osc({type:'sine',f0:720,f1:1440,dur:0.22,g:0.06,send:0.45,delay:0.04}); };
  S.dodge=()=>nb({dur:0.2,type:'bandpass',f0:700,f1:4200,q:1.3,g:0.3,a:0.02,send:0.2});
  S.counter=()=>{ osc({type:'sine',f0:2500,f1:2100,dur:0.3,g:0.14,send:0.35}); whoosh(1.4,0.3); thump(1,0.5,0.06); };
  S.hurt=()=>{ thump(0.7,0.8); nb({dur:0.16,type:'lowpass',f0:900,f1:200,g:0.6,send:0.15}); osc({type:'sawtooth',f0:150,f1:85,dur:0.22,g:0.16,lp:600,lp1:200,send:0.2}); };
  S.death=()=>{ thump(0.6,0.7); nb({dur:0.5,type:'bandpass',f0:1800,f1:200,q:1,g:0.35,a:0.01,send:0.5}); osc({type:'sawtooth',f0:200,f1:60,dur:0.5,g:0.12,lp:900,lp1:150,send:0.5}); };
  S.enemyturn=()=>osc({type:'sine',f0:130,f1:95,dur:0.4,g:0.22,a:0.03,send:0.4});
  S.eblock=()=>clank(); S.ebuff=()=>{ osc({type:'sawtooth',f0:90,f1:140,dur:0.5,g:0.16,a:0.05,lp:500,lp1:1400,send:0.4}); }; S.eheal=()=>chime([440,554,659],0.1,0.6); S.debuff=()=>{ osc({type:'sawtooth',f0:220,f1:110,dur:0.4,g:0.12,lp:700,send:0.4}); nb({dur:0.3,type:'bandpass',f0:600,f1:250,g:0.2,send:0.3}); };
  S.passive=o=>{ const k=o&&o.kind; if(k==='summon'){ nb({dur:0.6,type:'bandpass',f0:400,f1:1600,q:1.2,g:0.3,a:0.3,send:0.5}); osc({type:'sawtooth',f0:70,dur:0.5,g:0.22,a:0.05,lp:500,send:0.3}); chime([660,990],0.1,0.6,0.3); } else if(k==='trap'){ for(let i=0;i<3;i++) nb({dur:0.03,type:'highpass',f0:3200,g:0.25,delay:i*0.05}); clank(0.16); } else { thump(0.8,0.5); nb({dur:0.12,type:'bandpass',f0:3200,q:5,g:0.3,send:0.2}); osc({type:'sine',f0:420,f1:900,dur:0.16,g:0.1,delay:0.12}); osc({type:'sine',f0:900,f1:380,dur:0.18,g:0.1,delay:0.28}); } };
  S.trap=()=>{ nb({dur:0.06,type:'highpass',f0:1500,g:0.8,a:0.001,send:0.2}); osc({type:'sine',f0:1500,f1:1200,dur:0.3,g:0.14,send:0.4}); thump(0.8,0.6,0.02); };
  S.steal=()=>{ whoosh(1.6,0.3); chime([1046,1318,1568],0.1,0.5,0.12); };
  S.break=()=>{ nb({dur:0.2,type:'bandpass',f0:2600,f1:600,q:2,g:0.5,send:0.3}); thump(0.7,0.5); for(let i=0;i<4;i++) nb({dur:0.05,type:'highpass',f0:3500,g:0.2,delay:0.05+i*0.06,send:0.3}); };
  S.ultimate=()=>{ nb({dur:1.3,type:'bandpass',f0:180,f1:6500,q:1.3,g:0.45,a:0.9,send:0.5}); [110,165,220].forEach((f,i)=>osc({type:'sawtooth',f0:f,dur:1.9,g:0.12,a:0.5,lp:300,lp1:3200,send:0.6,det:(i-1)*9})); thump(0.5,1,1.05); nb({dur:0.8,type:'highpass',f0:5000,g:0.15,a:0.02,send:0.7,delay:1.05}); };
  S.victory=()=>{ chime([262,330,392,523,659],0.15,1.8); nb({dur:1.2,type:'highpass',f0:7000,g:0.07,a:0.3,send:0.6}); thump(1,0.4); };
  S.defeat=()=>{ osc({type:'sawtooth',f0:220,f1:50,dur:2,g:0.2,a:0.05,lp:1400,lp1:90,send:0.6}); nb({dur:2.2,type:'lowpass',f0:140,g:0.4,a:0.3,send:0.4}); thump(0.5,0.9,0.4); };
  S.levelup=()=>{ [523,659,784,1047,1319].forEach((f,i)=>osc({type:'sine',f0:f,dur:0.55,g:0.15,a:0.01,send:0.5,delay:i*0.07})); nb({dur:0.8,type:'highpass',f0:8000,g:0.06,a:0.1,send:0.6,delay:0.2}); };
  S.coins=()=>{ for(let i=0;i<3;i++){ osc({type:'sine',f0:4200+Math.random()*900,dur:0.12,g:0.16,delay:i*0.07,send:0.3}); osc({type:'sine',f0:5600+Math.random()*900,dur:0.1,g:0.08,delay:i*0.07+0.03,send:0.3}); } };
  S.chest=()=>{ osc({type:'sawtooth',f0:85,f1:140,dur:0.45,g:0.14,a:0.05,lp:420,send:0.3}); nb({dur:0.4,type:'bandpass',f0:300,f1:700,q:2,g:0.2,a:0.1,send:0.2}); setTimeout(()=>S.coins(),380); chime([1046,1318,1568,2093],0.1,1,0.45); };
  S.blessing=()=>{ chime([784,988,1175,1568],0.13,1.4); nb({dur:1,type:'highpass',f0:7500,g:0.06,a:0.2,send:0.6}); };
  S.shrine=()=>{ chime([392,494,587,784],0.12,1.6); osc({type:'sine',f0:196,dur:1.6,g:0.08,a:0.3,send:0.6}); };
  S.forge=()=>{ clank(); clank(0.28); nb({dur:0.5,type:'lowpass',f0:600,f1:200,g:0.2,a:0.1,send:0.3,delay:0.5}); };
  S.trapfall=()=>{ nb({dur:0.5,type:'lowpass',f0:400,f1:120,g:0.5,send:0.3}); thump(0.6,0.8,0.15); nb({dur:0.06,type:'highpass',f0:2000,g:0.4,delay:0.15}); };
  S.idol=()=>{ osc({type:'sawtooth',f0:110,dur:1.2,g:0.2,a:0.3,lp:200,lp1:1800,send:0.7}); nb({dur:0.9,type:'bandpass',f0:300,f1:1200,q:1.5,g:0.25,a:0.3,send:0.6}); };
  S.ambush=()=>{ thump(0.6,0.9); nb({dur:0.2,type:'highpass',f0:2500,g:0.4,delay:0.1}); osc({type:'sawtooth',f0:70,dur:1,g:0.14,a:0.05,lp:260,lp1:110,send:0.4}); };
  S.shop=()=>{ S.coins(); chime([659,784],0.08,0.6,0.15); };
  S.pick=()=>{ whoosh(1.5,0.28); chime([784,1175],0.1,0.7,0.1); };
  S.buy=()=>{ S.coins(); S.click(); };
  S.evolve=()=>{ nb({dur:0.7,type:'bandpass',f0:500,f1:8000,q:1.2,g:0.3,a:0.3,send:0.6}); chime([659,830,988,1318,1661],0.12,1.1,0.35); };
  S.flip=()=>{ for(let i=0;i<9;i++) osc({type:'sine',f0:4200,dur:0.05,g:0.1,delay:i*i*0.012,send:0.2}); };
  S.win=()=>{ S.coins(); chime([1046,1318,1568,2093],0.12,0.9,0.1); };
  S.lose=()=>{ osc({type:'sawtooth',f0:220,f1:80,dur:0.6,g:0.16,lp:1200,lp1:150,send:0.4}); thump(0.7,0.5,0.1); };
  function play(name,o){ if(!enabled) return; try{ if(!init()) return; resume(); if(ctx.state!=='running') return; const fn=S[name]; if(fn) fn(o||{}); }catch(err){ lastError=String(err&&err.message||err); } }
  function toggle(){ enabled=!enabled; try{ localStorage.setItem('deckfall_sound',enabled?'on':'off'); }catch(e){} if(enabled){ init(); resume(); play('click'); } return enabled; }
  function unlock(){ if(!enabled) return; if(init()) resume(); }
  return {play,toggle,unlock,get enabled(){ return enabled; },get lastError(){ return lastError; },get names(){ return Object.keys(S); },get state(){ return ctx?ctx.state:'none'; }};
})();
function sfx(name,o){ SFX.play(name,o); }
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>SFX.unlock(),{passive:true}));
