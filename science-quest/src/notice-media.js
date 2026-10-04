import {cinemaById} from './cinema.js';
import {esc} from './visuals.js';

export function noticeMediaForMission(mission){
 const region=mission.region;
 const doc=cinemaById[region];
 if(!doc)return '';

 return `<div class="notice-media-card">
  <div class="media-art-frame">
   <img class="notice-artwork" src="${doc.poster}" alt="Realistic illustration of ${esc(doc.regionName)} research environment" loading="lazy" />
   <div class="media-art-overlay">
    <div class="art-tag">${esc(doc.regionName.toUpperCase())} · FIELD PHENOMENON</div>
    <button class="notice-watch-btn" data-action="watch-video" data-region="${region}" aria-label="Watch ${esc(doc.title)} documentary video">
     <span class="play-icon">▶</span>
     <span>Watch Realistic Video (35s)</span>
    </button>
   </div>
  </div>
  <div class="notice-media-body">
   <div class="media-headline">
    <strong>Real-World Science Context</strong>
    <span class="media-law-badge">${esc(doc.badge)}</span>
   </div>
   <p class="media-context-text">${esc(doc.realWorldContext)}</p>
   <div class="media-principle-pill">
    <span>✦ Scientific Principle:</span> <strong>${esc(doc.keyConcepts[0])}</strong>
   </div>
  </div>
 </div>`;
}
