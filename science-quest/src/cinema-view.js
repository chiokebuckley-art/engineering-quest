import {documentaries,cinemaById,activeCaption,activeChapter} from './cinema.js';
import {esc} from './visuals.js';

function formatTime(seconds){
 const s=Math.max(0,Math.floor(seconds||0));
 const m=Math.floor(s/60);
 const rem=s%60;
 return `${m}:${String(rem).padStart(2,'0')}`;
}

export function cinemaOverlayScene(doc,time,progress){
 const t=time||0;
 if(doc.id==='motion'){
  const h=0.35, exit=300, scale=120;
  const rampDur=1.8;
  let rx=90, ry=205, angle=25, speed=0, pe=100*(1-Math.min(1,t/12)), ke=100*Math.min(1,t/12);
  if(t>10&&t<=22){
   const cycle=(t-10)%4;
   if(cycle<rampDur){
    const f=(cycle/rampDur)**2;
    rx=90+180*f;
    ry=205+90*f;
    speed=Math.sqrt(2*9.8*h*(cycle/rampDur));
    pe=Math.max(0,100*(1-cycle/rampDur));
    ke=100*(cycle/rampDur);
   }else{
    const rollTime=cycle-rampDur;
    rx=exit+rollTime*130;
    ry=302;
    angle=0;
    speed=Math.max(0,2.6-rollTime*1.2);
    pe=0;
    ke=Math.max(0,100*(1-rollTime/2.2));
   }
  }else if(t>22){
   rx=exit+1.75*scale;
   ry=302;
   angle=0;
   speed=0;
   pe=0;
   ke=0;
  }
  return `<svg class="cinema-sim-svg" viewBox="0 0 800 450" role="img" aria-label="Motion Harbor dynamic simulation">
   <defs>
    <linearGradient id="rampGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7a96a3"/><stop offset="100%" stop-color="#3c525c"/></linearGradient>
    <linearGradient id="glowLaser" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#55e2cf" stop-opacity=".8"/><stop offset="100%" stop-color="#55e2cf" stop-opacity="0"/></linearGradient>
   </defs>
   <path d="M50 200L270 305H750" stroke="#8ce2d7" stroke-width="4" fill="none" opacity=".8"/>
   <path d="M50 205L270 310H750V330H50Z" fill="url(#rampGrad)" opacity=".6"/>
   ${[0,1,2,3].map(m=>`<line x1="${exit+m*scale}" y1="300" x2="${exit+m*scale}" y2="320" stroke="#eef5e7" stroke-width="2"/><text x="${exit+m*scale}" y="338" fill="#eef5e7" font-size="12" text-anchor="middle">${m}m</text>`).join('')}
   <rect x="${exit+1.45*scale}" y="280" width="${0.1*scale}" height="28" rx="4" fill="#6bd6a2" stroke="#256b46" stroke-width="2" opacity=".8"/>
   <text x="${exit+1.5*scale}" y="272" fill="#8ff5c5" font-size="11" text-anchor="middle" font-weight="bold">TARGET BAY</text>
   <g transform="translate(${rx} ${ry}) rotate(${angle})">
    <rect x="-24" y="-20" width="48" height="20" rx="5" fill="#f8c84e" stroke="#ffe596" stroke-width="2"/>
    <circle cx="-16" cy="2" r="7" fill="#1b3944" stroke="#eaf5f2" stroke-width="2"/>
    <circle cx="16" cy="2" r="7" fill="#1b3944" stroke="#eaf5f2" stroke-width="2"/>
    <rect x="-8" y="-30" width="16" height="12" rx="3" fill="#e5f5f0"/>
    <line x1="0" y1="-30" x2="0" y2="-38" stroke="#ffe596" stroke-width="3"/>
    <circle cx="0" cy="-39" r="3" fill="#55e2cf"/>
   </g>
   <g transform="translate(600 40)">
    <rect width="170" height="95" rx="10" fill="#0d2530" fill-opacity=".85" stroke="#48788a" stroke-width="1.5"/>
    <text x="15" y="24" fill="#a4cfd8" font-size="12" font-weight="bold">ENERGY TELEMETRY</text>
    <text x="15" y="44" fill="#ffd078" font-size="11">PE (mgh): ${Math.round(pe)}%</text>
    <rect x="15" y="49" width="140" height="6" rx="3" fill="#244552"/><rect x="15" y="49" width="${1.4*pe}" height="6" rx="3" fill="#ffd078"/>
    <text x="15" y="73" fill="#6bd6a2" font-size="11">KE (½mv²): ${Math.round(ke)}%</text>
    <rect x="15" y="78" width="140" height="6" rx="3" fill="#244552"/><rect x="15" y="78" width="${1.4*ke}" height="6" rx="3" fill="#6bd6a2"/>
   </g>
  </svg>`;
 }
 if(doc.id==='matter'){
  const phase=(t*1.5)%360;
  return `<svg class="cinema-sim-svg" viewBox="0 0 800 450" role="img" aria-label="Matter Workshop Bohr atom and reaction telemetry">
   <g transform="translate(260 220)">
    <ellipse rx="150" ry="70" fill="none" stroke="#68b4d0" stroke-width="1.5" stroke-dasharray="4 6" opacity=".5" transform="rotate(${phase*0.4})"/>
    <ellipse rx="110" ry="50" fill="none" stroke="#7cd6a5" stroke-width="1.5" stroke-dasharray="4 6" opacity=".6" transform="rotate(-${phase*0.6})"/>
    <ellipse rx="70" ry="32" fill="none" stroke="#ffd078" stroke-width="2" opacity=".8" transform="rotate(${phase})"/>
    <circle r="22" fill="#e85d45" stroke="#ffb1a2" stroke-width="3"/>
    <text y="5" fill="white" font-size="12" font-weight="bold" text-anchor="middle">6P 6N</text>
    <circle cx="${70*Math.cos(phase*Math.PI/180)}" cy="${32*Math.sin(phase*Math.PI/180)}" r="6" fill="#ffd078" stroke="#ffffff" stroke-width="2"/>
    <circle cx="${-70*Math.cos(phase*Math.PI/180)}" cy="${-32*Math.sin(phase*Math.PI/180)}" r="6" fill="#ffd078" stroke="#ffffff" stroke-width="2"/>
    ${[0,90,180,270].map(deg=>`<circle cx="${110*Math.cos((deg+phase*0.8)*Math.PI/180)}" cy="${50*Math.sin((deg+phase*0.8)*Math.PI/180)}" r="5" fill="#7cd6a5"/>`).join('')}
   </g>
   <g transform="translate(560 60)">
    <rect width="210" height="180" rx="12" fill="#102533" fill-opacity=".9" stroke="#6292a8" stroke-width="1.5"/>
    <text x="18" y="28" fill="#8ee0d2" font-size="13" font-weight="bold">CLOSED SYSTEM MASS BALANCE</text>
    <text x="18" y="58" fill="#eef5e7" font-size="12">Reagent A: 10.00 g (0.5 mol)</text>
    <text x="18" y="80" fill="#eef5e7" font-size="12">Reagent B: 20.00 g (1.0 mol)</text>
    <line x1="18" y1="95" x2="192" y2="95" stroke="#486e7a" stroke-width="1"/>
    <text x="18" y="120" fill="#ffd078" font-size="13" font-weight="bold">Total Mass: 30.00 g</text>
    <text x="18" y="142" fill="#7cd6a5" font-size="11">✓ Conservation: Δm = 0.000 g</text>
    <text x="18" y="162" fill="#a4cfd8" font-size="11">Catalyst: Unconsumed in cycle</text>
   </g>
  </svg>`;
 }
 if(doc.id==='living'){
  const sunPulse=Math.sin(t*2)*15+45;
  return `<svg class="cinema-sim-svg" viewBox="0 0 800 450" role="img" aria-label="Living Valley chloroplast and carbon cycle animation">
   <g opacity=".8">
    ${[10,25,40,55,70].map((deg,i)=>`<line x1="60" y1="40" x2="${250+i*70}" y2="350" stroke="#ffd078" stroke-width="3" stroke-dasharray="8 12" stroke-dashoffset="${-t*40+i*15}" opacity=".4"/>`).join('')}
   </g>
   <g transform="translate(220 230)">
    <ellipse rx="130" ry="75" fill="#205938" fill-opacity=".7" stroke="#7cd6a5" stroke-width="3"/>
    <text x="0" y="-45" fill="#b9f0cd" font-size="12" font-weight="bold" text-anchor="middle">CHLOROPLAST (THYLAKOID MEMBRANE)</text>
    ${[-60,-20,20,60].map(x=>`<rect x="${x-15}" y="-18" width="30" height="38" rx="6" fill="#3ea865" stroke="#7cf2a3" stroke-width="1.5"/>`).join('')}
    <text x="0" y="48" fill="#eafdf2" font-size="11" text-anchor="middle">6 CO₂ + 6 H₂O + Photons → C₆H₁₂O₆ + 6 O₂</text>
   </g>
   <g transform="translate(560 60)">
    <rect width="210" height="175" rx="12" fill="#0d2a1d" fill-opacity=".9" stroke="#488f62" stroke-width="1.5"/>
    <text x="18" y="28" fill="#7cd6a5" font-size="13" font-weight="bold">CARBON POOL AUDIT</text>
    <text x="18" y="58" fill="#eafdf2" font-size="12">Atmosphere CO₂: 70 units</text>
    <text x="18" y="80" fill="#eafdf2" font-size="12">Producer Leaves: 55 units</text>
    <text x="18" y="102" fill="#eafdf2" font-size="12">Herbivore Biomass: 35 units</text>
    <text x="18" y="124" fill="#eafdf2" font-size="12">Soil Organics: 40 units</text>
    <line x1="18" y1="138" x2="192" y2="138" stroke="#25613c" stroke-width="1"/>
    <text x="18" y="158" fill="#ffd078" font-size="12" font-weight="bold">Total Carbon: 200 units (Conserved)</text>
   </g>
  </svg>`;
 }
 if(doc.id==='earth'){
  const yr=1880+Math.floor(Math.min(1,t/35)*145);
  const anomaly=-0.2+Math.min(1.4,Math.max(0,(t-5)/25*1.4));
  return `<svg class="cinema-sim-svg" viewBox="0 0 800 450" role="img" aria-label="Earthwatch Ridge climate data and hydrological flow">
   <g transform="translate(80 180)">
    <rect width="420" height="200" rx="10" fill="#14262f" fill-opacity=".9" stroke="#4a768c" stroke-width="1.5"/>
    <text x="20" y="28" fill="#df9c75" font-size="13" font-weight="bold">NASA GISTEMP v4 GLOBAL ANOMALY (${yr})</text>
    <line x1="40" y1="120" x2="390" y2="120" stroke="#718d96" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="395" y="124" fill="#a4c2cb" font-size="10">0.0°C</text>
    <path d="M40 135 Q120 140 180 130 T280 110 T330 85 T380 ${120-anomaly*50}" fill="none" stroke="#ff7c60" stroke-width="3"/>
    <circle cx="380" cy="${120-anomaly*50}" r="5" fill="#ffd078"/>
    <text x="20" y="175" fill="#ffd078" font-size="14" font-weight="bold">Observed Anomaly: +${anomaly.toFixed(2)} °C</text>
   </g>
   <g transform="translate(540 60)">
    <rect width="230" height="180" rx="12" fill="#1b281f" fill-opacity=".9" stroke="#5d8b68" stroke-width="1.5"/>
    <text x="18" y="28" fill="#85cda2" font-size="13" font-weight="bold">RAIN GARDEN HYDROLOGY</text>
    <text x="18" y="58" fill="#eaf5f0" font-size="12">Precipitation: 100 L/m²</text>
    <text x="18" y="80" fill="#8ee0d2" font-size="12">Infiltration / Retention: 78 L</text>
    <text x="18" y="102" fill="#ffd078" font-size="12">Surface Runoff: 22 L</text>
    <line x1="18" y1="118" x2="212" y2="118" stroke="#366144" stroke-width="1"/>
    <text x="18" y="140" fill="#a3e3c0" font-size="11">✓ Vegetation prevents flooding</text>
    <text x="18" y="160" fill="#a3e3c0" font-size="11">✓ Aquifer recharge active</text>
   </g>
  </svg>`;
 }
 if(doc.id==='signal'){
  const freq=2+Math.sin(t*0.5)*1;
  const lambda=10/freq;
  const pts=Array.from({length:150},(_,i)=>{
   const x=70+i*3.5;
   const y=230-55*Math.sin(2*Math.PI*freq*(i/140-t*0.8));
   return `${x},${y}`;
  }).join(' ');
  return `<svg class="cinema-sim-svg" viewBox="0 0 800 450" role="img" aria-label="Signal Coast wave propagation and battery telemetry">
   <rect x="50" y="130" width="560" height="200" rx="12" fill="#0d2430" fill-opacity=".88" stroke="#3d6c80" stroke-width="1.5"/>
   <line x1="70" y1="230" x2="590" y2="230" stroke="#486e80" stroke-dasharray="4 6"/>
   <polyline points="${pts}" fill="none" stroke="#68d9e6" stroke-width="3.5"/>
   <text x="75" y="165" fill="#a3f0f7" font-size="13" font-weight="bold">PROPAGATION WAVEFORM: v = f · λ</text>
   <text x="75" y="305" fill="#ffd078" font-size="12">Speed v = 10 m/s (fixed) · Frequency f = ${freq.toFixed(1)} Hz · Wavelength λ = ${lambda.toFixed(2)} m</text>
   <g transform="translate(630 60)">
    <rect width="150" height="160" rx="12" fill="#132433" fill-opacity=".9" stroke="#4a7d96" stroke-width="1.5"/>
    <text x="15" y="26" fill="#8eddf2" font-size="12" font-weight="bold">NIGHT LAB STORE</text>
    <text x="15" y="52" fill="#eef5f8" font-size="11">Capacity: 1000 Wh</text>
    <text x="15" y="72" fill="#ffd078" font-size="11">Demand: 70 W × 10h</text>
    <text x="15" y="92" fill="#7cd6a5" font-size="11">Delivered: 800 Wh</text>
    <rect x="15" y="105" width="120" height="10" rx="4" fill="#1f3d4f"/>
    <rect x="15" y="105" width="96" height="10" rx="4" fill="#7cd6a5"/>
    <text x="15" y="138" fill="#a3f0f7" font-size="11">Margin: +100 Wh</text>
   </g>
  </svg>`;
 }
 if(doc.id==='orbit'){
  const r=1.8;
  const a=r*90, b=r*50;
  const period=Math.sqrt(r**3);
  const ang=(t/period*2*Math.PI)%(2*Math.PI);
  const px=400+a*Math.cos(ang), py=225+b*Math.sin(ang);
  const vx=-Math.sin(ang)*25, vy=Math.cos(ang)*25;
  return `<svg class="cinema-sim-svg" viewBox="0 0 800 450" role="img" aria-label="Orbital Station Keplerian mechanics">
   <ellipse cx="400" cy="225" rx="${a}" ry="${b}" fill="none" stroke="#7aa5c2" stroke-width="2" stroke-dasharray="5 7" opacity=".7"/>
   <circle cx="400" cy="225" r="28" fill="#ffd078" stroke="#ffe7a8" stroke-width="3"/>
   <text x="400" y="230" fill="#1f3747" font-size="12" font-weight="bold" text-anchor="middle">STAR (1 M☉)</text>
   <circle cx="${px}" cy="${py}" r="12" fill="#6bd6a2" stroke="#ffffff" stroke-width="2"/>
   <line x1="${px}" y1="${py}" x2="${px+vx}" y2="${py+vy}" stroke="#ffd078" stroke-width="3"/>
   <line x1="400" y1="225" x2="${px}" y2="${py}" stroke="#a4d7ec" stroke-width="1.5" stroke-dasharray="3 3"/>
   <g transform="translate(60 60)">
    <rect width="250" height="140" rx="12" fill="#0f1f2e" fill-opacity=".9" stroke="#486f8c" stroke-width="1.5"/>
    <text x="18" y="28" fill="#9ec7ea" font-size="13" font-weight="bold">KEPLER’S THIRD LAW (T² = a³)</text>
    <text x="18" y="58" fill="#eaf2f8" font-size="12">Semi-major axis a = ${r.toFixed(2)} AU</text>
    <text x="18" y="80" fill="#ffd078" font-size="12">Orbital period T = ${period.toFixed(2)} Earth years</text>
    <text x="18" y="102" fill="#8eddf2" font-size="12">Harmonic Ratio: T² / a³ = 1.000</text>
    <text x="18" y="122" fill="#7cd6a5" font-size="11">✓ Conservation of Angular Momentum</text>
   </g>
  </svg>`;
 }
 return '';
}

export function cinemaView(state={}){
 const activeId=state.activeId||'motion';
 const doc=cinemaById[activeId]||documentaries[0];
 const isPlaying=!!state.isPlaying;
 const currentTime=state.currentTime||0;
 const duration=doc.duration||38;
 const progress=Math.min(1,currentTime/duration);
 const caption=activeCaption(doc,currentTime);
 const chapter=activeChapter(doc,currentTime);
 const speed=state.speed||1;
 const muted=!!state.muted;

 return `<section class="content cinema-content">
  <div class="cinema-header">
   <div>
    <p class="eyebrow">DISCOVERY ISLANDS · SCIENCE CINEMA</p>
    <h1>Visual Field Laboratory</h1>
    <p class="intro">Cinematic scientific documentaries, realistic physical simulations, and real-world engineering context.</p>
   </div>
   <div class="cinema-badge-group">
    <span class="badge success">6 HD Documentaries</span>
    <span class="badge">Narration & Telemetry</span>
   </div>
  </div>

  <div class="cinema-nav-carousel" role="tablist" aria-label="Select a science documentary">
   ${documentaries.map(d=>`
    <button class="cinema-tab-btn ${d.id===doc.id?'active':''}" data-action="cinema-select" data-id="${d.id}" role="tab" aria-selected="${d.id===doc.id}" style="--tab-color:${d.color}">
     <span class="tab-icon">${d.icon}</span>
     <span class="tab-meta">
      <strong>${esc(d.regionName)}</strong>
      <small>${esc(d.badge)}</small>
     </span>
    </button>
   `).join('')}
  </div>

  <div class="cinema-theater ${state.theaterMode?'theater-mode':''}">
   <div class="cinema-screen" id="cinema-screen">
    <img class="cinema-backdrop" src="${doc.poster}" alt="${esc(doc.title)}" style="transform: scale(${1+progress*0.08}) translate(${-progress*2}%, ${-progress*1.5}%);" />
    <div class="cinema-overlay-dim"></div>
    <div class="cinema-sim-layer">
     ${cinemaOverlayScene(doc,currentTime,progress)}
    </div>
    
    <div class="cinema-hud-top">
     <span class="cinema-live-indicator"><span class="pulse-dot"></span> FIELD RECORDING</span>
     <span class="cinema-chapter-tag">${chapter?esc(chapter.title):''}</span>
     <span class="cinema-formula-pill">${esc(doc.mathFormula)}</span>
    </div>

    ${caption?`<div class="cinema-caption-box" role="region" aria-live="polite"><p>${esc(caption)}</p></div>`:''}

    ${!isPlaying?`<button class="cinema-big-play" data-action="cinema-toggle" aria-label="Play documentary">▶</button>`:''}
   </div>

   <div class="cinema-controls-bar">
    <div class="cinema-timeline-wrapper">
     <input type="range" class="cinema-scrubber" id="cinema-scrubber" min="0" max="${duration}" step="0.1" value="${currentTime}" aria-label="Video scrubber" data-action="cinema-seek" />
     <div class="cinema-scrubber-progress" style="width:${progress*100}%"></div>
     <div class="cinema-chapter-pips">
      ${doc.chapters.map(c=>`<span class="chapter-pip" style="left:${(c.time/duration)*100}%" title="${esc(c.title)}"></span>`).join('')}
     </div>
    </div>

    <div class="cinema-buttons-row">
     <div class="ctrl-left">
      <button class="cinema-btn" data-action="cinema-toggle" aria-label="${isPlaying?'Pause':'Play'}">
       ${isPlaying?'⏸ Pause':'▶ Play'}
      </button>
      <button class="cinema-btn secondary" data-action="cinema-rewind" aria-label="Rewind 5 seconds">↺ 5s</button>
      <button class="cinema-btn secondary" data-action="cinema-forward" aria-label="Forward 5 seconds">5s ↻</button>
      <span class="cinema-time-readout">${formatTime(currentTime)} / ${formatTime(duration)}</span>
     </div>

     <div class="ctrl-right">
      <label class="cinema-select-label">Speed
       <select data-action="cinema-speed" aria-label="Playback speed">
        ${[0.75, 1, 1.25, 1.5].map(s=>`<option value="${s}" ${speed===s?'selected':''}>${s}×</option>`).join('')}
       </select>
      </label>
      <button class="cinema-btn secondary" data-action="cinema-mute" aria-label="${muted?'Unmute voiceover':'Mute voiceover'}">
       ${muted?'🔇 Muted':'🔊 Voiceover'}
      </button>
      <button class="cinema-btn secondary" data-action="cinema-theater" aria-label="Toggle theater size">
       ${state.theaterMode?'🗗 Standard':'🗖 Theater'}
      </button>
     </div>
    </div>
   </div>
  </div>

  <div class="cinema-details-grid">
   <div class="cinema-main-panel">
    <div class="cinema-info-banner" style="--banner-color:${doc.color}">
     <span class="cinema-icon-large">${doc.icon}</span>
     <div>
      <span class="badge">${esc(doc.regionName)} · ${esc(doc.badge)}</span>
      <h2>${esc(doc.title)}</h2>
      <p class="cinema-subtitle">${esc(doc.subtitle)}</p>
     </div>
    </div>

    <div class="cinema-summary-box">
     <h3>Scientific Overview</h3>
     <p>${esc(doc.summary)}</p>
     <div class="formula-callout">
      <small>GOVERNING MATHEMATICAL RELATIONSHIP</small>
      <code>${esc(doc.mathFormula)}</code>
     </div>
    </div>

    <div class="cinema-concepts-box">
     <h3>Core Pedagogical Principles</h3>
     <ul class="concepts-list">
      ${doc.keyConcepts.map(c=>`<li><span class="check-mark">✓</span> <span>${esc(c)}</span></li>`).join('')}
     </ul>
    </div>

    <div class="cinema-realworld-box">
     <h3>Real-World Engineering Application</h3>
     <p>${esc(doc.realWorldContext)}</p>
    </div>

    <div class="cinema-actions-row">
     <button class="primary" data-action="start" data-id="${doc.missionId}">
      Launch Guided Mission: ${esc(doc.title.split('&')[0].trim())} →
     </button>
     <button class="secondary" data-action="nav" data-view="lab" data-adapter="${doc.id==='motion'?'ramp':doc.id==='matter'?'matter':doc.id==='living'?'plant':doc.id==='earth'?'runoff':doc.id==='signal'?'wave':'orbit'}">
      Experiment in Free Lab ⚒
     </button>
     <button class="secondary" data-action="region" data-id="${doc.region}">
      Explore ${esc(doc.regionName)} Map ⌖
     </button>
    </div>
   </div>

   <aside class="cinema-side-panel">
    <h3>Video Chapters</h3>
    <ol class="cinema-chapter-list">
     ${doc.chapters.map((c,i)=>{
      const active=chapter&&chapter.time===c.time;
      return `
       <li>
        <button class="chapter-item ${active?'active':''}" data-action="cinema-jump" data-time="${c.time}">
         <span class="chapter-time">${formatTime(c.time)}</span>
         <div class="chapter-text">
          <strong>${esc(c.title)}</strong>
          <small>${esc(c.desc)}</small>
         </div>
        </button>
       </li>
      `;
     }).join('')}
    </ol>

    <div class="cinema-pip-box">
     <div class="pip-icon-wrap">🤖</div>
     <p><strong>Pip’s Field Tip:</strong><br>“A video shows you how the universe behaves. A fair experiment proves it! Once you finish watching, jump into the guided mission to test your own hypotheses.”</p>
    </div>
   </aside>
  </div>
 </section>`;
}
