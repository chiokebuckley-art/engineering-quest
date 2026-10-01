import {scene} from './visuals.js';
import {simulate} from './models.js';
export const rampHandleTop=h=>(285-h*260-11)/410*100;
export function snapRampHeight(h){return Math.max(.1,Math.min(.5,Math.round(h/.05)*.05));}
export function heightFromPointer(rect,clientY){if(!rect||!Number.isFinite(rect.height)||rect.height<=0||!Number.isFinite(clientY))throw Error('Invalid ramp pointer.');return Number(snapRampHeight((274-(clientY-rect.top)/rect.height*410)/260).toFixed(2));}
export function rampBayScene(input,result=null,progress=0,options={},locked=false){simulate('ramp',input,options);const shown=progress>0&&result?result.input:input;return `<div class="ramp-interior"><div class="ramp-scene-art">${scene('ramp',shown,result,progress,[1.45,1.55],null,options)}</div><button type="button" class="ramp-height-handle" role="slider" aria-label="Ramp height. Drag or use arrow keys." aria-valuemin="0.1" aria-valuemax="0.5" aria-valuenow="${input}" aria-valuetext="${input.toFixed(2)} metres" style="top:${rampHandleTop(shown)}%" ${locked?'disabled':''}>↕<span class="sr-only">Drag ramp height</span></button></div>`;}
