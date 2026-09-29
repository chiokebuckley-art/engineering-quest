import {earlyDiagram} from './early-years.js';
export const readingDefaults={band:'All explorers',large:false,reduced:false,technical:false,pictures:true,rate:.9};
export function readingPreferences(profile,legacy={}){if(!profile.reading)profile.reading={...readingDefaults,...Object.fromEntries(Object.keys(readingDefaults).filter(k=>legacy[k]!==undefined).map(k=>[k,legacy[k]]))};return profile.reading;}
export function setReading(profile,key,value){const p=readingPreferences(profile);if(['large','reduced','technical','pictures'].includes(key)&&typeof value==='boolean')p[key]=value;else if(key==='rate'&&[.7,.9,1.1].includes(value))p.rate=value;else if(key==='band'&&['All explorers','K–2','3–5','6–8','9–12'].includes(value))p.band=value;else throw Error('Unsupported reading preference.');return p;}
/** Authored picture cues are keyed by exact answer text; no guesses on unseen variants. */
const cues={
 'The panel that blocks none of the light.':['☀ ── ▯ ── ◻','Light passes through'],
 'The panel that blocks all of the light.':['☀ ── ▰    ◻','Light is blocked'],
 'Both panels always let the same amount through.':['▯ = ▰','Both the same'],
 'Move farther from its middle position.':['←── ● ──→','Bigger movement'],
 'Repeat more often every second in this fixed-frequency test.':['∿∿∿∿','More repeats'],
 'Stop moving.':['●','No movement'],
 'Make the shadow shorter.':['│ ▰','Shorter shadow'],
 'Make the shadow longer.':['│ ▰▰▰','Longer shadow'],
 'Leave its length unchanged at every elevation.':['▰ = ▰','Same shadow'],
 'An object with density below the water’s density.':['◧ ≋≋','Less dense than water'],
 'An object with density above the water’s density.':['≋≋ ◼','More dense than water'],
 'Every object floats because water pushes upward.':['◧ ◧ ◧ ≋','All objects float']
};
export function pictureCue(mission,question,index){if(mission.band!=='K–2')return null;if(question.pictures?.[index]){const p=question.pictures[index];return{svg:earlyDiagram(p.kind),label:p.label};}const cue=cues[question.options[index]];return cue?{picture:cue[0],label:cue[1]}:null;}
