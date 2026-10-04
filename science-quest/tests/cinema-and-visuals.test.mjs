import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {documentaries,cinemaById,activeCaption,activeChapter} from '../src/cinema.js';
import {cinemaOverlayScene,cinemaView} from '../src/cinema-view.js';
import {noticeMediaForMission} from '../src/notice-media.js';
import {realisticBackdropForAdapter,regionBackdrops} from '../src/realistic-visuals.js';
import {missions,byId} from '../src/content.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const rootDir=path.resolve(__dirname,'..');

test('Cinema documentaries cover all 6 research regions with deep pedagogical data', () => {
 const expectedRegions=['motion','matter','living','earth','signal','orbit'];
 assert.equal(documentaries.length,6,'Should have exactly 6 documentaries');
 for(const reg of expectedRegions){
  const doc=cinemaById(reg);
  assert.ok(doc,`Documentary for ${reg} must exist`);
  assert.ok(doc.duration>20,`Duration of ${reg} doc must be substantial (>20s)`);
  assert.ok(doc.title&&doc.title.length>5,`Title of ${reg} doc must be descriptive`);
  assert.ok(doc.mathFormula&&doc.mathFormula.length>3,`Doc ${reg} must include core science equation`);
  assert.ok(doc.keyConcepts.length>=3,`Doc ${reg} must have key concepts`);
  assert.ok(doc.chapters.length>=3,`Doc ${reg} must have timecoded chapters`);
  assert.ok(doc.captions.length>=4,`Doc ${reg} must have synchronized subtitles`);

  // verify chapters are ordered and within duration
  let lastTime=-1;
  for(const ch of doc.chapters){
   assert.ok(ch.time>lastTime,`Chapter ${ch.title} in ${reg} should have ascending timestamp`);
   assert.ok(ch.time<doc.duration,`Chapter time must be within duration`);
   lastTime=ch.time;
  }

  // verify captions are ordered
  for(const cap of doc.captions){
   assert.ok(cap.start<cap.end,`Caption start must precede end: ${cap.text}`);
   assert.ok(cap.end<=doc.duration+1,`Caption end must be within duration`);
  }
 }
});

test('activeCaption and activeChapter return expected segments based on timestamps', () => {
 const doc=cinemaById('motion');
 const firstCaption=activeCaption(doc,2);
 assert.ok(firstCaption,`Caption at t=2 should exist`);
 assert.match(firstCaption.text,/Motion Harbor|gravitational/i);

 const midCaption=activeCaption(doc,12);
 assert.ok(midCaption,`Caption at t=12 should exist`);

 const chapterAtStart=activeChapter(doc,0);
 assert.equal(chapterAtStart.title,'Field Setup at Motion Harbor');

 const chapterAtEnd=activeChapter(doc,34);
 assert.equal(chapterAtEnd.title,'Fair Test & Target Delivery');
});

test('cinemaOverlayScene renders dynamic SVG graphics without exceptions', () => {
 for(const doc of documentaries){
  for(const t of [0, 5, 15, 25, doc.duration-1]){
   const svg=cinemaOverlayScene(doc,t);
   assert.ok(typeof svg==='string'&&svg.length>50,`Overlay for ${doc.id} at t=${t} must be valid SVG string`);
   assert.match(svg,/<svg/);
   assert.match(svg,/<\/svg>/);
  }
 }
});

test('cinemaView renders complete theater interface', () => {
 const state={activeId:'motion',isPlaying:false,currentTime:0,speed:1,muted:false,theaterMode:false};
 const html=cinemaView(state);
 assert.ok(html.includes('cinema-theater'));
 assert.ok(html.includes('cinema-scrubber'));
 assert.ok(html.includes('cinema-caption-box'));
 assert.ok(html.includes('PE = mgh'));
});

test('noticeMediaForMission generates valid cards for missions', () => {
 const m1=byId['rover-rescue'];
 const card1=noticeMediaForMission(m1);
 assert.ok(card1.includes('notice-media-card'));
 assert.ok(card1.includes('motion_harbor_rover.jpg'));
 assert.ok(card1.includes('Watch Realistic Video'));

 const m2=byId['climate-balance'];
 if(m2){
  const card2=noticeMediaForMission(m2);
  assert.ok(card2.includes('earthwatch_ridge_climate.jpg'));
 }
});

test('realisticBackdropForAdapter maps all model adapters to valid files', () => {
 const testAdapters=['ramp','push','thermal','matter','plant','habitat','runoff','wave','energy','orbit'];
 for(const a of testAdapters){
  const backdrop=realisticBackdropForAdapter(a);
  assert.ok(backdrop.startsWith('./assets/'));
  const filePath=path.resolve(rootDir,backdrop.replace('./',''));
  assert.ok(fs.existsSync(filePath),`Backdrop image must exist on disk: ${filePath}`);
 }
});

test('All 7 artwork image assets and 6 audio voiceover files exist on disk and are non-empty', () => {
 const images=[
  'assets/discovery_islands_hero.jpg',
  'assets/motion_harbor_rover.jpg',
  'assets/matter_workshop_chemistry.jpg',
  'assets/living_valley_biodome.jpg',
  'assets/earthwatch_ridge_climate.jpg',
  'assets/signal_coast_waves.jpg',
  'assets/orbital_station_astronomy.jpg'
 ];

 for(const img of images){
  const p=path.resolve(rootDir,img);
  assert.ok(fs.existsSync(p),`Image file ${img} must exist`);
  const stat=fs.statSync(p);
  assert.ok(stat.size>10000,`Image file ${img} must be substantial (>10KB), found ${stat.size} bytes`);
 }

 const audios=[
  'assets/audio/motion_harbor_video.m4a',
  'assets/audio/matter_workshop_video.m4a',
  'assets/audio/living_valley_video.m4a',
  'assets/audio/earthwatch_ridge_video.m4a',
  'assets/audio/signal_coast_video.m4a',
  'assets/audio/orbital_station_video.m4a'
 ];

 for(const aud of audios){
  const p=path.resolve(rootDir,aud);
  assert.ok(fs.existsSync(p),`Audio file ${aud} must exist`);
  const stat=fs.statSync(p);
  assert.ok(stat.size>10000,`Audio file ${aud} must be substantial (>10KB), found ${stat.size} bytes`);
 }
});
