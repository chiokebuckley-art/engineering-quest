// Original SVG diagrams. Geometry encodes the lesson; object identity is never color-only.
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shapes={
 ball:'<circle r="23"/><path d="M-20-11Q0 0 20 11M-11 20Q0 0 11-20"/>',
 block:'<path d="M-23-15 0-27 23-15V15L0 27-23 15ZM-23-15 0-2 23-15M0-2V27"/>',
 coin:'<circle r="24"/><circle r="18"/><path d="M0-12V12M-7-7Q8-15 8-3T-8 8"/>',
 button:'<circle r="24"/><circle cx="-7" cy="-7" r="3"/><circle cx="7" cy="-7" r="3"/><circle cx="-7" cy="7" r="3"/><circle cx="7" cy="7" r="3"/>',
 marble:'<circle r="23"/><path d="M-18-13Q23-9-2 22M-18-13Q-2 9 18-13"/><circle cx="-8" cy="-10" r="4" fill="white"/>',
 pencil:'<path d="M-25 15 13-23 25-11-13 27-29 31ZM-25 15-13 27M13-23 25-11M-20 21 19-17"/>',
 crayon:'<path d="M-24 15 11-20 23-8-12 27ZM11-20 21-29 23-8M-16 7-4 19M4-13 16-1"/>',
 eraser:'<path d="M-26 7 0-20 28-1 2 26ZM-13-7 15 12M-26 7 2 26H17L28 14V-1"/>',
 book:'<path d="M-22-25H20V24H-22Q-30 18-22 13H20M-22-25V13M-14-15H12M-14-6H7"/>',
 notebook:'<rect x="-23" y="-27" width="46" height="54" rx="3"/><path d="M-14-27V27M-27-17H-17M-27-5H-17M-27 7H-17M-27 19H-17M-6-12H15M-6-2H15M-6 8H15"/>',
 apple:'<path d="M0-15C-30-32-34 14-13 25Q0 19 13 25C34 14 30-32 0-15Z"/><path d="M0-15V-28Q15-35 17-22Q6-19 0-20"/>',
 orange:'<circle cy="3" r="24"/><path d="M0-21Q4-35 17-28Q14-15 0-21"/><path d="M-10-8h1M8 3h1M-7 14h1M15-7h1"/>',
 pear:'<path d="M-8-16Q-11-30 4-25Q14-22 12-8C36 13 16 30-3 28C-32 27-30 6-15-7Z"/><path d="M2-25 7-35"/>',
 banana:'<path d="M-24-20Q-28 30 17 24Q32 21 30-3Q5 24-17-21ZM-18-17Q-16 14 14 19"/>',
 carrot:'<path d="M-15-14Q0-24 15-14L0 30ZM0-19V-33M-5-20-15-30M6-20 16-30M-10-5H1M-6 7H4"/>',
 spoon:'<ellipse cy="-15" rx="12" ry="17"/><path d="M-4 1-5 30H5L4 1"/>',
 fork:'<path d="M-12-29V-8Q-12 3-4 4V29H4V4Q12 3 12-8V-29M-4-29V-9M4-29V-9"/>',
 cup:'<path d="M-21-18H15V17Q-3 30-21 17ZM15-13Q35-15 30 3Q28 13 15 11"/>',
 bottle:'<path d="M-8-28H8V-16L18-4V28H-18V-4L-8-16ZM-8-21H8M-18 2H18M-18 17H18"/>',
 plate:'<ellipse rx="30" ry="20"/><ellipse rx="23" ry="13"/>',
 sock:'<path d="M-14-28H9V8L25 14Q35 30 17 30L-14 18ZM-14-19H9M9 8 3 18M19 12 13 26"/>',
 hat:'<path d="M-18 8-13-18H13L18 8M-30 8Q0-1 30 8V17Q0 28-30 17ZM-16-2H16"/>',
 shoe:'<path d="M-28 5-18-16-4-6 3 6Q30 6 30 20H-30ZM-30 15H28M-9-7-15 2M-3-1-9 8"/>',
 glove:'<path d="M-17 10-29-3Q-31-12-23-12L-15-3V-23Q-13-31-7-23V-8-29Q0-36 3-28V-8-25Q9-32 13-24V-6-17Q21-25 24-15V12L15 29H-10Z"/>',
 scarf:'<path d="M-23-24H21V-10H5V30H-10V-10H-23ZM-10 20H5M-6 30V35M1 30V35M-23-18H21"/>',
 key:'<circle cx="-12" cy="-10" r="16"/><circle cx="-12" cy="-10" r="6"/><path d="M0 1 24 25 30 19 24 13 20 17 15 12 19 8 8-3"/>',
 comb:'<path d="M-29-14H29V-5H-29ZM-26-5V18M-18-5V18M-10-5V18M-2-5V18M6-5V18M14-5V18M22-5V18M29-5V18"/>',
 brush:'<rect x="-17" y="-29" width="34" height="34" rx="9"/><path d="M-5 5V29H5V5M-9-21V-4M0-21V-4M9-21V-4"/>',
 bell:'<path d="M-22 15Q-12 7-13-10Q-12-26 0-26Q12-26 13-10Q12 7 22 15ZM-6 18Q0 32 6 18M0-26V-33"/>',
 candle:'<rect x="-12" y="-7" width="24" height="35"/><path d="M0-10C-17-18 0-25 0-35C17-21 14-13 0-10ZM0-7V-14M-12 0Q-3 8 0 0Q7-6 12 3"/>',
 shell:'<path d="M0 27C-42 4-32-17-20-15C-28-31-9-33-5-22C1-39 18-28 15-18C36-28 39 5 0 27ZM0 27-20-15M0 27-5-22M0 27 15-18"/>',
 stone:'<path d="M-28 12-19-16 4-25 24-10 30 15 12 27-13 24ZM-19-16-5 3 24-10M-5 3 12 27"/>',
 leaf:'<path d="M-22 25Q-38-15 25-29Q35 27-22 25ZM-22 25 25-29M-7 7-18-7M3-4 18 1M12-14 9-23"/>',
 acorn:'<path d="M-20-4Q-21 25 0 29Q21 25 20-4ZM-24-4Q-23-25 0-24Q23-25 24-4ZM0-24 5-33M-14-17-5-6M-2-21 9-6M12-18 19-8"/>',
 pinecone:'<path d="M0-30Q-35-4-20 21Q0 39 20 21Q35-4 0-30ZM-14-14 0-3 14-14M-23 0-10 10 0-3 10 10 23 0M-20 17-10 10 0 24 10 10 20 17"/>',
 car:'<path d="M-29 5-20-1-12-17H13L22-1 30 5V18H-29ZM-17-1H18M0-17V-1"/><circle cx="-17" cy="18" r="7"/><circle cx="18" cy="18" r="7"/>',
 boat:'<path d="M-30 9H30L16 27H-15ZM0 9V-30L23 3H0M-4-24-23 3H-4"/>',
 rocket:'<path d="M0-33Q22-12 13 18H-13Q-22-12 0-33ZM-13 6-26 25-10 19M13 6 26 25 10 19M-7 22 0 35 7 22"/><circle cy="-8" r="7"/>',
 train:'<path d="M-26-21H7V15H-26ZM7-1H24V15H7M16-1V-17H24V-1M-22-16H2V-5M-30 15H30"/><circle cx="-17" cy="21" r="8"/><circle cx="14" cy="21" r="8"/>',
 robot:'<rect x="-20" y="-25" width="40" height="26" rx="4"/><rect x="-17" y="5" width="34" height="23"/><path d="M0-25V-34M-17 10-29 23M17 10 29 23M-10 28V35M10 28V35M-10-4H10"/><circle cx="-9" cy="-15" r="3"/><circle cx="9" cy="-15" r="3"/>',
 envelope:'<rect x="-30" y="-20" width="60" height="40" rx="2"/><path d="M-30-20 0 4 30-20M-30 20-10-4M30 20 10-4"/>',
 ticket:'<path d="M-30-17H30V-6Q17 0 30 6V17H-30V6Q-17 0-30-6ZM13-17V17M-14-7H4M-14 2H0"/>',
 ribbon:'<path d="M0 0Q-34-28-29 1Q-21 17 0 0Q34-28 29 1Q21 17 0 0ZM-5 5-21 30-9 25-3 30 2 8M6 5 22 29 10 25 5 30 1 8"/>',
 ring:'<circle cy="8" r="20"/><circle cy="8" r="14"/><path d="M-12-17-7-27H7L12-17 0-8ZM-12-17H12M-7-27 0-8 7-27"/>',
 bead:'<ellipse rx="25" ry="22"/><ellipse rx="9" ry="22"/><path d="M-24-6Q0-15 24-6M-24 6Q0 15 24 6"/>',
 dicecup:'<path d="M-22-24H22L16 26H-16Z"/><rect x="-13" y="-10" width="26" height="24" rx="3"/><circle cx="-6" cy="-4" r="2"/><circle cy="2" r="2"/><circle cx="6" cy="8" r="2"/>',
 puzzle:'<path d="M-25-20H-7Q-16-37 0-37Q16-37 7-20H25V-3Q8-12 8 3Q8 18 25 10V28H7Q16 11 0 11Q-16 11-7 28H-25V10Q-8 18-8 3Q-8-12-25-3Z"/>',
 ruler:'<path d="M-32-11H32V12H-32ZM-25-11V0M-15-11V-4M-5-11V0M5-11V-4M15-11V0M25-11V-4"/>',
 feather:'<path d="M-23 30 22-28M-20 21Q-39-3-5-22Q33-42 22-8Q9 29-20 21ZM-15 13-19-2M-6 3-7-15M3-9 16-8M-9 10 5 11"/>',
 drum:'<ellipse cy="-15" rx="28" ry="12"/><path d="M-28-15V19Q0 37 28 19V-15M-28 19-14-4 0 26 14-4 28 19M-19-28 10-15M19-28-10-15"/>'
};
export const ART_IDS=Object.keys(shapes);
const bottoms={ball:23,block:27,coin:24,button:24,marble:23,pencil:31,crayon:27,eraser:26,book:24,notebook:27,apple:25,orange:27,pear:29,banana:25,carrot:30,spoon:30,fork:29,cup:25,bottle:28,plate:20,sock:30,hat:25,shoe:20,glove:29,scarf:35,key:30,comb:18,brush:29,bell:29,candle:28,shell:27,stone:27,leaf:26,acorn:29,pinecone:30,car:25,boat:27,rocket:35,train:29,robot:35,envelope:20,ticket:17,ribbon:30,ring:28,bead:22,dicecup:26,puzzle:28,ruler:12,feather:30,drum:31};
const text=(x,y,s,size=16)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#173c39" stroke="none" font-family="system-ui,sans-serif" font-size="${size}">${escape(s)}</text>`;
const rect=(x,y,w,h,fill='#fff8eb',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" ${extra}/>`;
export const icon=(o,x,y,scale=1,fill='#f2b95d',opacity=1)=>`<g transform="translate(${x} ${y}) scale(${scale})" fill="${fill}" stroke="#214b47" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">${shapes[o.art]||shapes.ball}</g>`;
const box=(x=190,y=105,w=220,h=155)=>rect(x,y,w,h,'#eaf3e1')+text(x+w/2,y+h-12,'BOX',12);
const shelf=()=>`<path d="M130 172H470V188H130ZM155 188V250M445 188V250" fill="#dab68a"/>`;
const arrow=(d,color='#d65b3e')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1" marker-end="url(#tip)"/>`;
const line=(x1,y1,x2,y2)=>arrow(`M${x1} ${y1}L${x2} ${y2}`);
const ring=(x,y,r=40)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#d65b3e" stroke-width="4"/>`;
const person=(x,y,name)=>`<g transform="translate(${x} ${y})" stroke="#214b47" stroke-width="3"><circle cy="-20" r="15" fill="#b97d53"/><path d="M-23 25Q-25-3 0-3Q25-3 23 25Z" fill="#8fb5c0"/></g>`+text(x,y+47,name,14);
const stamp=(x,y,s)=>rect(x-55,y-18,110,32,'#ffffff')+text(x,y+4,s,13);
function core(s,kind){const o=s.object,n=o.noun,p=o.plural;const I=(x,y,z=1,fill,op)=>icon(o,x,y,z,fill,op);let b='';
 const spatial={in:[300,170],beside:[120,175],near:[150,175],far:[65,175],between:[300,175],beyond:[90,175],above:[300,110],on:[300,172-(bottoms[o.art]||30)*.8],under:[300,228]};
 if(kind in spatial){if(['on','under','above'].includes(kind))b=shelf();else if(['between','beyond'].includes(kind))b=box(150,110,90,140)+box(360,110,90,140);else if(['near','far'].includes(kind))b=box(210,105,120,155);else b=box();const [x,y]=spatial[kind];return b+I(x,y,.8);}
 if(['to','from','into','out','onto','off','up','down','toward','away'].includes(kind)){
 let a=[85,180],z=[300,180];b=box();if(kind==='to'||kind==='from'){b=box(400,105,140,155);a=[80,180];z=[357,180];}
 if(kind==='from'||kind==='out')[a,z]=[z,a];
 if(kind==='onto'||kind==='off'){b=shelf();a=[70,90];z=[300,172-(bottoms[o.art]||30)*.8];if(kind==='off')[a,z]=[z,a];}
 if(kind==='up'||kind==='down'){b='';a=[300,255];z=[300,90];if(kind==='down')[a,z]=[z,a];}
 if(kind==='toward'||kind==='away'){b=box(420,110,120,140);a=[65,180];z=[270,180];if(kind==='away')[a,z]=[z,a];}
 return b+I(...a,.65,undefined,.25)+line(a[0],a[1]-42,z[0],z[1]-42)+I(...z,.8)+text(a[0],a[1]+48,'START',12)+text(z[0],z[1]+48,'FINISH',12);
 }
 if(['through','around','over','across','along'].includes(kind)){
 if(kind==='across'||kind==='along'){b=rect(180,95,230,170,'#d6e6ed')+text(295,245,'MAT',12);let a=kind==='along'?[190,280]:[85,175],z=kind==='along'?[410,280]:[510,175];return b+line(...a,...z)+I(...a,.6,undefined,.25)+I(...z,.7)+text(a[0],a[1]-38,'START',12)+text(z[0],z[1]-38,'FINISH',12);}
 b=kind==='over'?box(220,140,170,130):rect(210,120,180,120,'#d6e6ed')+'<path d="M210 148H390M210 215H390" fill="none" stroke-dasharray="6 5"/>'+text(300,140,'TUNNEL',12);
 const d=kind==='through'?'M80 183H510':'M80 183C100 20 470 20 510 183';return b+arrow(d)+I(80,183,.65,undefined,.25)+I(510,183,.8)+text(80,235,'START',12)+text(510,235,'FINISH',12);
 }
 if(['any','specific','anyOrange','specificOrange'].includes(kind)){const orange=kind.includes('Orange'),specific=kind.startsWith('specific');b=I(215,180,1.2,orange?'#ffa445':undefined)+I(385,180,1.2,orange?'#ffa445':undefined);return b+(specific?line(215,70,215,132):line(300,70,220,128)+line(300,70,380,128))+text(300,285,specific?'The arrow identifies one.':'Either one would do.',18);}
 if(['this','that','these','those'].includes(kind)){const plural=kind==='these'||kind==='those',far=kind==='that'||kind==='those',target=far?460:215;b=person(65,210,'SPEAKER')+I(215,195,.8)+I(460,195,.8);if(plural)b+=I(250,240,.6)+I(495,240,.6);return b+line(90,120,target,150)+text(215,90,'NEAR',13)+text(460,90,'FARTHER',13);}
 if(kind==='reference'||kind==='referenceWrong'){return box(350,115,160,130)+I(100,170,1.1)+I(kind==='reference'?430:280,170,.8)+text(100,250,n,18)+line(150,100,420,100)+text(300,82,'same object → it',16);}
 if(kind==='owner'||kind==='otherOwner'){return (kind==='owner'?icon({art:'robot'},100,175,1)+text(100,245,'ROBOT',14):person(100,185,'MAYA'))+box(300,110,230,145)+I(415,165,.9)+line(160,160,360,160)+text(300,295,kind==='owner'?'The robot owns the object.':'Maya owns the object.',17);}
 if(kind==='at'||kind==='farStation'){return rect(310,100,240,170,'#eaf3e1')+text(430,135,'PACKING STATION',14)+I(kind==='at'?430:90,200,.9);}
 if(['and','or','with','without'].includes(kind)){b=rect(80,85,440,190,'#f5f2e7')+I(200,170,1)+box(350,125,100,105);if(kind==='without')return rect(80,85,240,190,'#f5f2e7')+I(200,170,1)+text(200,250,'PACK THIS',14)+box(390,130,100,100)+text(440,265,'LEAVE OUT',13);return b+text(200,245,kind==='or'?'A':'✓',26)+text(400,245,kind==='or'?'B':'✓',26)+(kind==='or'?text(300,70,'CHOOSE ONE OPTION',16)+text(300,177,'OR',23):text(300,70,kind==='and'?'INCLUDE BOTH':'PACK TOGETHER',16));}
 if(['recipient','sender','agent','otherAgent'].includes(kind)){b=person(95,200,kind==='otherAgent'?'LEO':'MAYA')+box(330,100,200,160)+I(430,165,.8);if(kind==='recipient')return b+line(340,80,110,80)+stamp(430,290,'TO: MAYA');if(kind==='sender')return b+line(110,80,340,80)+stamp(430,290,'FROM: MAYA');return b+line(130,165,365,165)+text(300,70,'PACKED BY '+(kind==='agent'?'MAYA':'LEO'),18);}
 if(['contents','empty'].includes(kind)){b=box(150,80,300,200);if(kind==='contents')for(let i=0;i<4;i++)b+=I(210+(i%2)*150,135+Math.floor(i/2)*85,.8);return b;}
 if(kind==='picture'||kind==='plain'){return (kind==='picture'?rect(195,85,210,190,'#e9d5ae')+rect(210,100,180,160,'#fffdf6'):'')+I(300,180,1.2)+text(300,310,kind==='picture'?'A drawing in a frame':'An object on the table',16);}
 if(kind==='topic'||kind==='otherTopic'){return rect(160,75,280,230,'#c3d9d9')+text(300,110,'A BOOK ABOUT',17)+icon(kind==='topic'?o:{art:o.art==='apple'?'book':'apple'},300,183,1.1)+text(300,275,kind==='topic'?p:o.art==='apple'?'books':'apples',20);}
 if(['all','some','none','both','onePair','each','oneDot','every','more','fewer','oneOf','halfOf'].includes(kind)){
 if(kind==='more'||kind==='fewer'){const counts=kind==='more'?[4,2]:[2,4];b=rect(45,90,235,200)+rect(320,90,235,200);counts.forEach((count,j)=>{for(let i=0;i<count;i++)b+=I(100+j*275+(i%2)*100,145+Math.floor(i/2)*90,.7);b+=text(162+j*275,320,(j?'RIGHT: ':'LEFT: ')+count,17);});return b;}
 if(kind==='each'||kind==='oneDot'){for(let i=0;i<4;i++){b+=I(100+i*130,180,.8);if(kind==='each'||i===0)b+=`<circle cx="${140+i*130}" cy="205" r="6" fill="#d65b3e"/>`;}return b;}
 if(kind==='oneOf'||kind==='halfOf'){for(let i=0;i<6;i++){const x=150+(i%3)*150,y=125+Math.floor(i/3)*120;b+=I(x,y,.8);if(i<(kind==='oneOf'?1:3))b+=ring(x,y);}return b;}
 const total=['both','onePair'].includes(kind)?2:6,inside=['all','every'].includes(kind)?6:kind==='some'?3:kind==='both'?2:kind==='onePair'?1:0;b=box(60,80,285,230)+text(460,90,'OUTSIDE',14);for(let i=0;i<total;i++){const ins=i<inside,j=ins?i:i-inside,x=ins?125+(j%2)*145:410+(j%2)*100,y=125+Math.floor(j/2)*65;b+=I(x,y,.6);}return b;
 }
 if(['packFirst','closeFirst'].includes(kind)){const lookFirst=kind==='packFirst';b=rect(30,85,230,215)+rect(340,85,230,215);for(let i=0;i<2;i++){let x=i?455:145;b+=text(x,70,'STEP '+(i+1),17);if((i===0)===lookFirst)b+=I(x,175,1)+text(x,265,'LOOK AT THE OBJECT',12);else b+=box(x-70,140,140,80)+'<path d="M'+(x-70)+' 140H'+(x+70)+'" stroke-width="8"/>'+text(x,265,'CLOSE THE BOX',12);}return b+line(275,185,320,185);}
 if(kind==='until'||kind==='tooSoon'){b=rect(25,80,240,225)+rect(335,80,240,225);b+=text(145,65,'BEFORE THE BELL',14)+text(455,65,'WHEN THE BELL RINGS',14)+box(75,125,135,120)+box(355,125,130,120);b+=I(kind==='until'?142:235,175,.6)+I(kind==='until'?530:420,175,.6)+icon({art:'bell'},455,100,.4)+line(278,185,322,185);return b;}
 throw Error('Missing scene drawing: '+kind);
}
export function illustration(s,kind=s.use.scene,{caption=true}={}){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 365" role="img" aria-label="${escape(caption?s.sentence:'Illustrated answer option; use Describe pictures for a text alternative.')}"><defs><marker id="tip" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10Z" fill="#d65b3e"/></marker></defs><rect width="600" height="365" rx="20" fill="#fffdf7"/><g stroke="#214b47" stroke-width="2">${core(s,kind)}</g>${text(300,350,s.object.noun+' • arrows show movement or pointing',12)}</svg>`;}
// Alternative text describes the actual relationship, not whether an answer is correct.
const descriptions={in:'inside the box',beside:'next to and outside the box',near:'a short distance from the box',far:'a large distance from the box',between:'in the gap between two boxes',beyond:'outside both boxes on the same side',on:'touching the top of the shelf',above:'higher than the shelf with a gap',under:'lower than the shelf',to:'moving to the box',from:'moving from the box',into:'moving from outside to inside the box',out:'moving from inside to outside the box',onto:'moving onto the shelf',off:'moving off the shelf',up:'moving upward',down:'moving downward',through:'moving inside the tunnel and out the other end',around:'following a curved route outside the tunnel',over:'following a route above the box',across:'crossing the mat from one side to the other',along:'following the edge of the mat',toward:'moving closer to the box without reaching it',away:'moving farther from the box',any:'either of two objects can be chosen',specific:'one object identified by an arrow',anyOrange:'either of two orange-colored objects can be chosen',specificOrange:'one orange-colored object identified by an arrow',this:'one indicated object near the speaker',that:'one indicated object far from the speaker',these:'an indicated group near the speaker',those:'an indicated group far from the speaker',reference:'the same object shown inside the box',referenceWrong:'the object is outside the box',owner:'the robot owns the object',otherOwner:'Maya owns the object',at:'at the marked packing station',farStation:'away from the marked packing station',and:'both the object and box are selected',or:'one option is to be chosen: object or box',with:'object and box in the same packing group',without:'object included; box left outside the group',recipient:'package addressed to Maya',sender:'package sent from Maya',agent:'Maya did the packing',otherAgent:'Leo did the packing',contents:'box containing four of the objects',empty:'box with no objects inside',picture:'a framed drawing of the object',plain:'an object with no picture frame',topic:'a book about the named objects',otherTopic:'a book about robots',all:'all six objects inside',some:'three of six objects inside',none:'zero of six objects inside',both:'two of two objects inside',onePair:'one of two objects inside',each:'four objects, each with its own dot',oneDot:'four objects, only one with a dot',every:'all six objects inside the marked area',more:'four objects on the left and two on the right',fewer:'two objects on the left and four on the right',oneOf:'one of six objects circled',halfOf:'three of six objects circled',packFirst:'look at the object first, then close the box',closeFirst:'close the box first, then look at the object',until:'object inside before the bell, outside when the bell rings',tooSoon:'object already outside before the bell, inside when it rings'};
export const describe=(s,kind=s.use.scene)=>`${s.object.noun}: ${kind==='otherTopic'?'a book about '+(s.object.art==='apple'?'books':'apples'):descriptions[kind]||kind}.`;
