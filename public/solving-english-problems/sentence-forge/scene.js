// Original interactive Canvas artwork. Scene state illustrates answers; it never grades them.
export function mountScene(canvas,{kind='factory',districts=0,success=false,relation='under',sentence='',description='',repaired=false,motion=true,rocket=false,progress=0}={}){
 const c=canvas.getContext('2d');if(!c)return()=>{};let raf,t0=performance.now(),dead=false;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let moving=motion&&!reduce;
 const rr=(x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}};
 const line=(x,y,a,b,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();};
 const txt=(s,x,y,size=12,col='#b5cdc9')=>{c.fillStyle=col;c.font=`600 ${size}px system-ui`;c.fillText(s,x,y);};
 function gear(x,y,r,rot){c.save();c.translate(x,y);c.rotate(rot);c.strokeStyle='#427c7c';c.lineWidth=5;for(let i=0;i<12;i++){c.rotate(Math.PI/6);c.strokeRect(-3,r-3,6,9);}c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,5,0,Math.PI*2);c.stroke();c.restore();}
 function crate(x,y,color='#f09676',scale=1){c.save();c.translate(x,y);c.scale(scale,scale);rr(0,0,51,45,3,color);rr(5,5,41,35,1,null,'#704b43');line(5,5,46,40,'#704b43',3);line(5,40,46,5,'#704b43',3);c.fillStyle='#ffd2ab';c.fillRect(4,0,43,4);c.restore();}
 function bot(x,y,t){c.save();c.translate(x,y);line(17,60,13,83,'#70b5b5',8);line(42,60,45,83,'#70b5b5',8);rr(3,80,19,8,3,'#263f4b');rr(36,80,19,8,3,'#263f4b');rr(3,26,53,40,9,'#5bc4b6');rr(13,33,32,20,4,'#163846');rr(0,0,60,31,8,'#e6c471');rr(7,7,46,15,5,'#142e39');rr(16,12,6,4,2,'#83ffe4');rr(37,12,6,4,2,'#83ffe4');line(30,0,30,-8,'#e6c471',3);c.fillStyle='#89ffe0';c.beginPath();c.arc(30,-10,4,0,7);c.fill();line(4,38,-10,50+Math.sin(t*2)*4,'#5bc4b6',8);line(54,38,68,27+Math.sin(t*2)*5,'#5bc4b6',8);c.restore();}
 function frame(now){if(dead)return;const t=moving?(now-t0)/1000:0,w=canvas.clientWidth||800,h=canvas.clientHeight||310,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}c.setTransform(dpr*w/800,0,0,dpr*h/310,0,0);c.clearRect(0,0,800,310);
 const bg=c.createLinearGradient(0,0,0,310);bg.addColorStop(0,'#102e39');bg.addColorStop(1,'#174c4d');c.fillStyle=bg;c.fillRect(0,0,800,310);
 for(let x=0;x<800;x+=50)line(x,0,x,310,'#ffffff05');for(let y=0;y<310;y+=50)line(0,y,800,y,'#ffffff05');
 if(rocket){
  for(let i=0;i<55;i++){const x=(i*137)%800,y=((i*73+t*(i%3+1)*9)%310);rr(x,y,2,2,1,'#acd6d8');}
  c.fillStyle='#aac9cd';c.beginPath();c.arc(705,55,38,0,7);c.fill();c.fillStyle='#819fa8';c.beginPath();c.arc(698,48,9,0,7);c.fill();c.beginPath();c.arc(719,67,6,0,7);c.fill();
  let x=110+Math.min(1,progress)*510,y=170+Math.sin(t*2)*7;c.save();c.translate(x,y);c.rotate(Math.PI/2);c.fillStyle='#f4b84b';c.beginPath();c.moveTo(-10,35);c.lineTo(0,75+Math.sin(t*14)*12);c.lineTo(10,35);c.fill();rr(-17,-27,34,68,16,'#dfefdc');c.fillStyle='#ef8c71';c.beginPath();c.moveTo(-17,-18);c.lineTo(0,-48);c.lineTo(17,-18);c.fill();rr(-8,-7,16,20,8,'#438f99');c.fillStyle='#6edbca';c.fillRect(-27,20,10,23);c.fillRect(17,20,10,23);c.restore();txt('MEANING MISSION',28,36,13,'#77e1d0');txt('Build a correct interpretation to boost toward the Moon.',28,278,16,'#dbece6');
 }else{
  rr(28,25,185,99,8,'#12303c','#2f575e');for(let j=0;j<4;j++){line(47+j*40,40,47+j*40,107,'#315f65');}line(40,76,201,76,'#315f65');txt('FORGE / 01',238,40,13,'#669e9f');
  line(680,0,680,111,'#345c64',16);line(680,107,744,107,'#345c64',16);gear(607,64,24,t*.4);gear(649,89,17,-t*.6);
  c.fillStyle='#0c2732';c.fillRect(0,244,800,66);for(let x=-120;x<1000;x+=75)line(x,310,x+170,245,'#214047');
  const spatial=kind==='spatial'||kind==='crate';
  if(kind==='factory'){
   for(let i=0;i<9;i++){let x=235+i*53,lev=i<districts,ht=40+(i%3)*22;rr(x,224-ht,44,ht,4,lev?'#568b85':'#294e56','#4c7073');rr(x+8,232-ht,12,14,2,lev?'#f4cf71':'#41636b');rr(x+27,232-ht,9,14,2,lev?'#8ae4cc':'#41636b');if(lev){line(x+29,223-ht,x+29,208-ht,'#7ec6bc',3);rr(x+29,201-ht,15,9,1,'#edbc64');}}
   bot(78,152,t);txt('YOUR FACTORY',245,124,13,'#8dcebf');txt(`${districts} production wings restored`,245,147,18,'#edf5e8');
  }else if(spatial){
   let prep=sentence.match(/\b(under|on|beside|behind)\b/i)?.[1]?.toLowerCase()||relation;
   if(prep==='behind')crate(465,149,'#ef957b');
   rr(385,175,186,13,3,'#d9b472');rr(398,188,11,56,2,'#6c7270');rr(547,188,11,56,2,'#6c7270');
   if(prep==='on')crate(445,128);if(prep==='under')crate(445,197);if(prep==='beside')crate(592,198);
   bot(155,155,t);txt('TEST BAY',275,56,12,'#7cbbb5');txt(`Crate ${prep} the table`,275,81,20,'#e5f0e9');
  }else if(kind==='jar'){
   bot(116,155,t);rr(402,113,116,127,18,'#7dbeb626','#7abebc');let grd=c.createLinearGradient(0,160,0,238);grd.addColorStop(0,'#68d6cc90');grd.addColorStop(1,'#347f98aa');rr(407,166,106,68,12,grd);rr(396,102,128,19,5,'#d9b475');rr(402,98,116,6,2,'#80744d');if(/crack/i.test(description)&&!repaired){line(479,100,485,111,'#26333b',3);line(485,111,480,118,'#26333b',3);for(let j=0;j<(/leak|drip|escaped/i.test(description)?4:0);j++){let y=127+((t*45+j*23)%111);c.fillStyle='#72d9e9';c.beginPath();c.ellipse(528+Math.sin(j)*4,y,3,5,0,0,7);c.fill();}}txt(repaired?'SEAL REPLACED · NO LEAK':/crack/i.test(description)?'SEAL CONDITION: CRACKED':'JAR ASSEMBLY · LID + CONTAINER',294,57,14,repaired?'#80f0c9':'#efbe7e');
  }else{bot(142,152,t);crate(452,188);txt(success?'ORDER PASSED':'ASSEMBLY IN PROGRESS',310,78,18,success?'#81ecc5':'#dfdbb7');gear(591,173,33,t*.5);}
  rr(43,266,706,26,13,'#294a52','#55757a');for(let x=58;x<736;x+=27){c.fillStyle='#173139';c.beginPath();c.arc(x,279,7,0,7);c.fill();line(x-4,279,x+4,279,'#608080',2);}let xx=80+((t*24)%530);if(moving){rr(xx,252,57,17,4,'#f5bb57');txt('word',xx+11,265,11,'#233b42');}
 }
 if(success&&moving){for(let i=0;i<15;i++){c.fillStyle=['#8ee8c7','#ffd275','#d0c4fc'][i%3];let x=(i*67+t*16)%800,y=(i*49+t*42)%250;c.fillRect(x,y,4,7);}}
 if(moving&&!document.hidden)raf=requestAnimationFrame(frame);
 }
 const resume=()=>{if(!document.hidden){cancelAnimationFrame(raf);frame(performance.now());}};const resize=new ResizeObserver(resume);resize.observe(canvas);document.addEventListener('visibilitychange',resume);frame(performance.now());return()=>{dead=true;cancelAnimationFrame(raf);resize.disconnect();document.removeEventListener('visibilitychange',resume);};
}
