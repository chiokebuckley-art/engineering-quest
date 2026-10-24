import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {GUIDES} from './lab-howto.js';
import {emptyLab,dailyPlan} from './lab-engine.js';
test('every offered video is a playable MP4 with matching caption duration',()=>{for(const g of GUIDES){const path=new URL(`guides/${g.id}.mp4`,import.meta.url);assert.ok(fs.statSync(path).size>10000);const result=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',path.pathname],{encoding:'utf8'});assert.equal(result.status,0);assert.ok(Math.abs(Number(result.stdout)-g.seconds)<.2);const vtt=fs.readFileSync(new URL(`guides/${g.id}.vtt`,import.meta.url),'utf8');assert.ok(vtt.startsWith('WEBVTT\n'));assert.equal((vtt.match(/-->/g)||[]).length,g.steps.length);assert.ok(!vtt.includes('\\n'));}});
test('daily actions persist on the Chicago calendar and preserve the current position',()=>{const lab=emptyLab(),now=Date.parse('2026-10-24T02:00:00Z');const plan=dailyPlan(lab,now);assert.equal(plan.date,'2026-10-23');plan.index=2;const restored=JSON.parse(JSON.stringify(lab));assert.equal(dailyPlan(restored,now+1000).index,2);assert.equal(dailyPlan(restored,Date.parse('2026-10-24T06:00:00Z')).index,0);});
