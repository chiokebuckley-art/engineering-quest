import {glossary,missions,byId} from './content.js';
import {adapters,simulate,round} from './models.js';
import {scene,esc} from './visuals.js';

// Missions without their own vocabulary list use these starter words.
export const defaultWords=['trial','variable','force','energy','model','fair'];
export const missionWords=m=>(m?.vocabulary||defaultWords).filter(t=>glossary[t]);

// Units appear only where the app's own models measure the word in that unit.
export const units={force:'newton (N)',distance:'metre (m)',energy:'joule (J)',power:'watt (W)',frequency:'hertz (Hz)',conductivity:'watt per metre-kelvin (W/(m·K))',current:'ampere (A)',voltage:'volt (V)',resistance:'ohm (Ω)',density:'kilogram per cubic metre (kg/m³)',temperature:'degree Celsius (°C)',amplitude:'millimetre (mm)',concentration:'units per litre (units/L)',elevation:'degree (°)',mole:'mole (mol)'};

// Where each word lives in the harbor or lab: the model scene shown as its picture.
const pictureAdapter={trial:'push',variable:'ramp',force:'push',ramp:'ramp',distance:'ramp',energy:'ramp',power:'energy',frequency:'wave',replicate:'plant',model:'ramp',conductivity:'thermal',orbit:'orbit',fair:'push'};
export function wordAdapter(term){if(pictureAdapter[term])return pictureAdapter[term];const m=missions.find(m=>(m.vocabulary||[]).includes(term));return m?.adapter??null;}
export function wordPicture(term){const adapter=wordAdapter(term);if(!adapter||!adapters[adapter])return '';try{const input=adapters[adapter].initial;return scene(adapter,input,simulate(adapter,input),1);}catch{return '';}}

const ramp=h=>simulate('ramp',h).value,push=f=>simulate('push',f).value;
const ease=x=>x<=0?0:x>=1?1:1-(1-x)**3;
const fade=(t,start,len=.6)=>Math.max(0,Math.min(1,(t-start)/len));
const lane=(y,x0=60,x1=760)=>`<path d="M${x0} ${y}H${x1}" stroke="#bcb18f" stroke-width="10" stroke-linecap="round"/>`;
const cart=(x,y,color='#f8c84e')=>`<g transform="translate(${x} ${y})"><rect x="-26" y="-24" width="52" height="22" rx="5" fill="${color}" stroke="#7a5b12" stroke-width="2"/><circle cx="-15" cy="0" r="7" fill="#1b3944"/><circle cx="15" cy="0" r="7" fill="#1b3944"/></g>`;
const arrow=(x,y,len,label)=>len?`<g><path d="M${x-len} ${y}H${x-8}" stroke="#c4552f" stroke-width="${3+len/14}" stroke-linecap="round"/><path d="M${x-12} ${y-9}L${x} ${y}L${x-12} ${y+9}Z" fill="#c4552f"/><text x="${x-len/2-4}" y="${y-14}" class="clip-small" text-anchor="middle">${label}</text></g>`:'';
const rampShape=(h,x0=60,exit=260,y=280)=>{const rise=h*300;return `<path d="M${x0} ${y-rise}L${exit} ${y}H${x0}Z" fill="#506973" stroke="#344e59" stroke-width="3"/><text x="${x0-6}" y="${y-rise-10}" class="clip-small">${round(h)} m</text>`;};
const rover=(x,y,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle})">${cart(0,0)}</g>`;
function rampRun(t,h,{x0=60,exit=260,y=280,scale=170,start=.5,slide=1.2,roll=2.2}={}){const rise=h*300,d=ramp(h);if(t<start)return {x:x0+18,y:y-rise,angle:Math.atan2(rise,exit-x0)*180/Math.PI};const a=(t-start)/slide;if(a<1){const f=a*a;return {x:x0+18+(exit-x0-18)*f,y:y-rise+rise*f,angle:Math.atan2(rise,exit-x0)*180/Math.PI};}const b=ease((t-start-slide)/roll);return {x:exit+d*scale*b,y,angle:0};}
const wordBanner=(t,word,at)=>{const o=fade(t,at);return o?`<text x="400" y="70" text-anchor="middle" class="clip-word" opacity="${o}">${esc(word)}</text>`:'';};

export const clips=[
 {id:'clip-force',term:'force',title:'Force',duration:10,sentence:glossary.force,
  frame(t){const g=push(2),s=push(4),scale=300,m=ease((t-1)/3);return `${lane(170)}${lane(290)}${arrow(110,150,t>=.4&&t<1.6?40:0,'gentle push')}${arrow(110,270,t>=.4&&t<1.6?80:0,'harder push')}${cart(110+g*scale*m,166)}${cart(110+s*scale*m,286)}${t>4.2?`<text x="${110+g*scale+40}" y="140" class="clip-small">${round(g)} m</text><text x="${110+s*scale+40}" y="260" class="clip-small">${round(s)} m</text>`:''}${wordBanner(t,'force',6)}`;}},
 {id:'clip-fair',term:'fair',title:'Fair test',duration:10,sentence:glossary.fair,
  frame(t){const same=['Same cart','Same surface','Same push time'];const m=ease((t-4.2)/1.8),a=push(2),b=push(4),scale=300;return `${lane(170)}${lane(290)}${cart(110+a*scale*m,166)}${cart(110+b*scale*m,286)}${same.map((s,i)=>fade(t,.6+i*.9)?`<text x="560" y="${130+i*26}" class="clip-small" opacity="${fade(t,.6+i*.9)}">✓ ${s}</text>`:'').join('')}${fade(t,3.4)?`<text x="560" y="230" class="clip-small clip-strong" opacity="${fade(t,3.4)}">Only the push changes</text>`:''}${arrow(110,150,t>=4&&t<4.8?40:0,'')}${arrow(110,270,t>=4&&t<4.8?80:0,'')}${wordBanner(t,'fair test',6.6)}`;}},
 {id:'clip-variable',term:'variable',title:'Variable',duration:10,sentence:glossary.variable,
  frame(t){const h=t<6?.3+.2*Math.sin(Math.min(t,6)/6*Math.PI*2):.3;return `${lane(280,60,760)}${rampShape(h,60,300,280)}<text x="520" y="170" class="clip-small">Ramp height can change</text><text x="520" y="196" class="clip-small clip-strong">${round(h)} m</text>${wordBanner(t,'variable',6)}`;}},
 {id:'clip-distance',term:'distance',title:'Distance',duration:10,sentence:glossary.distance,
  frame(t){const h=.3,d=ramp(h),scale=170,p=rampRun(t,h,{start:.4,slide:1.1,roll:2}),tape=ease((t-4)/1.4),exit=260;return `${lane(280,60,760)}${rampShape(h)}${rover(p.x,p.y-4,p.angle)}${tape?`<path d="M${exit} 312H${exit+d*scale*tape}" stroke="#176d73" stroke-width="4"/><path d="M${exit} 302V322M${exit+d*scale*tape} 302V322" stroke="#176d73" stroke-width="3"/>`:''}${t>5.4?`<text x="${exit+d*scale/2}" y="344" text-anchor="middle" class="clip-small clip-strong">${round(d)} m from the ramp exit</text>`:''}${wordBanner(t,'distance',6)}`;}},
 {id:'clip-energy-ramp',term:'energy',title:'Energy on a ramp',duration:12,sentence:'Starting higher gives it more gravitational energy to transfer into motion.',
  frame(t){const low=rampRun(t,.15,{y:180,scale:170}),high=rampRun(t,.3,{y:330,scale:170});return `${lane(180,60,760)}${lane(330,60,760)}<g>${rampShape(.15,60,260,180)}</g><g>${rampShape(.3,60,260,330)}</g>${rover(low.x,176,low.angle)}${rover(high.x,326,high.angle)}${t>4.2?`<text x="${260+ramp(.15)*170+40}" y="150" class="clip-small">lower start: ${round(ramp(.15))} m</text><text x="${260+ramp(.3)*170+40}" y="300" class="clip-small">higher start: ${round(ramp(.3))} m</text>`:''}${wordBanner(t,'energy',7)}`;}}
];
export const clipFor=term=>clips.find(c=>c.term===term)||(term==='ramp'?clips.find(c=>c.id==='clip-energy-ramp'):null);
export const clipById=id=>clips.find(c=>c.id===id);
export function clipFrame(clip,t){const time=Math.max(0,Math.min(clip.duration,t));const sentence=fade(time,clip.duration-2.6,.5);return `<svg class="clip-svg" viewBox="0 0 800 380" role="img" aria-label="${esc(clip.title)} clip"><rect width="800" height="380" fill="#e6f1ea"/>${clip.frame(time)}${sentence?`<text x="400" y="372" text-anchor="middle" class="clip-sentence" opacity="${sentence}">${esc(clip.sentence)}</text>`:''}</svg>`;}
export function clipPlayer(clip,t,playing){return `<div class="clip-player"><div class="clip-stage" id="clip-stage">${clipFrame(clip,t)}</div><p class="sr-only" id="clip-caption" aria-live="polite">${t>=clip.duration-2.6?esc(clip.sentence):''}</p><div class="run-buttons">${button(playing?'⏸ Pause':t>=clip.duration?'↺ Watch again':t>0?'▶ Resume':'▶ Play clip','clip-play','primary',`id="clip-play-btn" data-id="${clip.id}"`)}</div></div>`;}

const button=(label,action,cls='',extra='')=>`<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const sortedTerms=()=>Object.keys(glossary).sort((a,b)=>b.length-a.length);
let termPattern=null,termPatternKey='';
function pattern(){const keys=sortedTerms(),key=keys.join('|');if(key!==termPatternKey){termPatternKey=key;termPattern=new RegExp(`\\b(${keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})\\b`,'gi');}return termPattern;}
const lookup=word=>Object.keys(glossary).find(k=>k.toLowerCase()===word.toLowerCase());

// Wraps the first use of each dictionary word in already-safe HTML text so a learner can tap it.
export function linkTerms(html,met={},seen=new Set()){if(!html)return '';return String(html).split(/(<[^>]*>|&[^;\s]+;)/).map(part=>{if(!part||part.startsWith('<')||part.startsWith('&'))return part;return part.replace(pattern(),word=>{const term=lookup(word);if(!term||seen.has(term))return word;seen.add(term);return `<button type="button" class="word-link ${met[term]?'met':''}" data-action="term" data-term="${esc(term)}">${word}</button>`;});}).join('');}

export function wordChips(terms,met={}){return `<div class="terms word-chips">${terms.map(t=>`<button class="term ${met[t]?'met':''}" data-action="term" data-term="${esc(t)}">${met[t]?'✓ ':''}${esc(t)}${clipFor(t)?' <span aria-hidden="true">▶</span>':''}</button>`).join('')}</div>`;}

export function wordCard(term,{met=false,clip=null}={}){const c=clipFor(term),u=units[term],pic=wordPicture(term);return `<article class="word-card"><p class="eyebrow">DICTIONARY${met?' · MET ✓':''}</p><h2 id="word-title" tabindex="-1">${esc(term)}</h2><p class="word-sentence">${esc(glossary[term])}</p>${u?`<p class="word-unit"><b>Unit:</b> ${esc(u)}</p>`:''}${c?(clip?clipPlayer(c,clip.t,clip.playing):button(`▶ Watch the short clip: ${esc(c.title)} (${c.duration}s)`,'clip-open','secondary full',`data-id="${c.id}" data-term="${esc(term)}"`)):''}${pic&&!clip?`<figure class="word-picture">${pic}<figcaption>Where you meet it: the ${esc(adapters[wordAdapter(term)].label.toLowerCase())}.</figcaption></figure>`:''}<div class="run-buttons">${button('◖ Read aloud','term-read','secondary',`data-term="${esc(term)}"`)}${button('Close','term-close','text-button')}</div></article>`;}

export function wordLayer(term,opts){return `<div class="word-layer" data-action="term-close" data-backdrop="true"><div class="word-dialog" role="dialog" aria-modal="true" aria-labelledby="word-title">${wordCard(term,opts)}</div></div>`;}

export function dictionaryView({met={},query=''}={}){const q=query.trim().toLowerCase(),terms=Object.keys(glossary).sort((a,b)=>a.localeCompare(b)).filter(t=>!q||t.toLowerCase().includes(q)||glossary[t].toLowerCase().includes(q)),count=Object.keys(glossary).filter(t=>met[t]).length;return `<section class="content dictionary"><div class="section-heading"><div><p class="eyebrow">WORDS FOR THE ISLANDS</p><h1>Dictionary</h1><p class="intro">Tap a word to meet it: one plain sentence, its unit if it has one, and where you see it in the harbor or lab. Nothing here is graded.</p></div><span class="badge success">${count} of ${Object.keys(glossary).length} met</span></div><h2 class="shelf-title">Short clips · one idea each</h2><div class="clip-shelf">${clips.map(c=>`<button class="clip-card ${met[c.term]?'met':''}" data-action="clip-open" data-id="${c.id}" data-term="${c.term}"><span class="clip-thumb" aria-hidden="true">▶</span><strong>${esc(c.title)}</strong><small>${c.duration}s · Motion Harbor${met[c.term]?' · met ✓':''}</small></button>`).join('')}</div><label class="field dictionary-search">Find a word<input id="dictionary-search" type="search" value="${esc(query)}" placeholder="force, energy, fair…" autocomplete="off"></label><ul class="word-list">${terms.map(t=>`<li><button class="word-row ${met[t]?'met':''}" data-action="term" data-term="${esc(t)}"><strong>${esc(t)}</strong><span>${esc(glossary[t])}</span><small>${met[t]?'Met ✓':''}${clipFor(t)?`${met[t]?' · ':''}▶ clip`:''}</small></button></li>`).join('')}</ul>${terms.length?'':'<p class="empty">No word matches that search.</p>'}</section>`;}

export const wordsMetFor=(terms,met={})=>terms.every(t=>met[t]);
export const filmWords=doc=>missionWords(byId[doc.missionId]);
