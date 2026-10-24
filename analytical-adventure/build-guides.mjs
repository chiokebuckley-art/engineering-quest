// Reproducible original motion-graphic how-to clips; not recordings of learner progress.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {GUIDES} from './lab-howto.js';
fs.mkdirSync(new URL('./guides/',import.meta.url),{recursive:true});
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const stamp=t=>`00:${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}.000`;
for(const g of GUIDES){
 const dir=new URL('./guides/',import.meta.url),duration=g.seconds/g.steps.length;
 const filters=[`drawtext=fontfile=${font}:text='RELATIONSHIP LAB':x=60:y=45:fontsize=30:fontcolor=0xc6dcc3`,`drawtext=fontfile=${font}:text='${g.title}':x=60:y=105:fontsize=38:fontcolor=white`];
 const vtt=['WEBVTT',''];
 g.steps.forEach(([,text],i)=>{
  // drawtext reads text files, avoiding filter-expression escaping of punctuation.
  const words=text.split(' '),lines=[''];for(const word of words){if(lines.at(-1).length+word.length>44)lines.push('');lines[lines.length-1]+=(lines.at(-1)?' ':'')+word;}
  const file=new URL(`${g.id}-${i}.txt`,dir);fs.writeFileSync(file,lines.join(String.fromCharCode(10)));
  const start=i*duration,end=(i+1)*duration;
  filters.push(`drawbox=x=60:y=200:w=840:h=260:color=0x315f58:t=fill:enable='between(t,${start},${end})'`);
  filters.push(`drawtext=fontfile=${font}:textfile=${file.pathname}:x=95:y=240:fontsize=30:fontcolor=white:line_spacing=18:enable='between(t,${start},${end})'`);
  filters.push(`drawbox=x=60:y=505:w=840*(t/${g.seconds}):h=12:color=0xdca85f:t=fill:enable='between(t,${start},${end})'`);
  vtt.push(`${stamp(start)} --> ${stamp(end)}`,text,'');
 });
 const dest=new URL(`${g.id}.mp4`,dir);
 const result=spawnSync('ffmpeg',['-y','-f','lavfi','-i',`color=c=0x173d40:s=960x540:r=20:d=${g.seconds}`,'-vf',filters.join(','),'-an','-c:v','libx264','-preset','fast','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart',dest.pathname],{encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr);
 fs.writeFileSync(new URL(`${g.id}.vtt`,dir),vtt.join(String.fromCharCode(10)));
 console.log(g.id,fs.statSync(dest).size,'bytes');
}
