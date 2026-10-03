import {documentaries,cinemaById} from './cinema.js';
import {esc} from './visuals.js';

export const regionBackdrops={
 motion:'./assets/motion_harbor_rover.jpg',
 matter:'./assets/matter_workshop_chemistry.jpg',
 living:'./assets/living_valley_biodome.jpg',
 earth:'./assets/earthwatch_ridge_climate.jpg',
 signal:'./assets/signal_coast_waves.jpg',
 orbit:'./assets/orbital_station_astronomy.jpg'
};

export function realisticBackdropForAdapter(adapter,region='motion'){
 const map={
  ramp:'motion',
  push:'motion',
  direction:'motion',
  force:'motion',
  resistance:'motion',
  collision:'motion',
  thermal:'matter',
  matter:'matter',
  plant:'living',
  habitat:'living',
  runoff:'earth',
  wave:'signal',
  energy:'signal',
  orbit:'orbit'
 };
 const r=region||map[adapter]||'motion';
 return regionBackdrops[r]||regionBackdrops.motion;
}

export function realisticDecorations(adapter,region){
 const backdrop=realisticBackdropForAdapter(adapter,region);
 return `<defs>
  <filter id="sciGlow" x="-20%" y="-20%" width="140%" height="140%">
   <feGaussianBlur stdDeviation="4" result="blur" />
   <feComposite in="SourceGraphic" in2="blur" operator="over" />
  </filter>
  <linearGradient id="sciMetal" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0%" stop-color="#4a6370"/>
   <stop offset="50%" stop-color="#2c3e47"/>
   <stop offset="100%" stop-color="#1b282e"/>
  </linearGradient>
 </defs>
 <image href="${backdrop}" x="0" y="0" width="800" height="410" preserveAspectRatio="xMidYMid slice" opacity="0.32" />
 <rect width="800" height="410" fill="#0c1e28" fill-opacity="0.35" />`;
}
