import {earlyNatureEdits,earlyBuild,earlyComparisons,natureDiagram} from './early-nature.js';
const q=(prompt,answers)=>({prompt,options:answers.map(a=>a[0]),correct:0,pictures:answers.map(a=>({kind:a[1],label:a[2]||a[0]}))});
export const earlyMissionEdits={
 ...earlyNatureEdits,
 'first-move':{version:2,lesson:'A push can start a cart moving. Try a gentle push, then a stronger push. Use the same cart, floor and push time. Watch how far it goes.',questions:{
 predict:q('Use the same cart. Push harder for the same short time. What will happen?',[['It goes farther.','far'],['It goes a shorter distance.','near'],['It stays at the start.','still']]),
 explain:q('Why did the cart go farther?',[['The stronger push changed its motion more.','push-long'],['The cart became smaller.','shrink'],['The cart moved without a push.','self']]),
 t1:q('Try two pushes on a toy wagon. What should stay the same?',[['Use the same wagon, floor and push time.','matched'],['Use different wagons and floors.','different'],['Change everything.','many']]),
 t2:q('Two matching toy cars start still. Push each for the same short time. Which goes less far?',[['The car with the gentler push.','push-short'],['The car with the stronger push.','push-long'],['Push strength makes no difference.','equal']])}},
 'which-way':{version:2,lesson:'A push has a direction. Start with a still cart. Push right. Reset the cart, then push left. Keep the cart, push strength and push time the same.',questions:{
 predict:q('The cart moved right. Reset it. Now push left. Which way will it move?',[['To the left.','left'],['To the right.','right'],['It cannot move left.','blocked-left']]),
 explain:q('Why did the cart move to a different side?',[['We pushed in a different direction.','reverse'],['The cart disappeared.','vanish'],['Both pushes went the same way.','same-right']]),
 t1:q('A toy boat is still. Its dock is on the left. Which push sends it toward the dock?',[['Push left.','left'],['Push right.','right'],['Either direction is the same.','equal']]),
 t2:q('A crate went left. Reset it. Now make it go right. What should you change?',[['Reverse the push. Keep its strength and time the same.','reverse'],['Change the crate and push strength together.','different'],['Keep pushing left for less time.','left']])}}
};
export function earlyQuestion(m,run,question){if(!earlyMissionEdits[m.id]||!question)return question;const stage=run.stage;
 if(stage==='build'){const b=earlyBuild[m.adapter];return{...question,...q('How can we make a fair test?',[[b[0],b[1]],[b[2],b[3]],['Change everything.',['push','direction'].includes(m.adapter)?'many':'many-tools']])};}
 if(question.pictures)return question;
 const known=Object.values(m.questions).flatMap(item=>item.options.map((text,i)=>({text,picture:item.pictures?.[i]})));
 const pictures=question.options.map(text=>{const found=known.find(a=>a.text===text)?.picture;if(found)return found;const relation=text.replace(/\.$/,''),index=['greater than the first','less than the first','equal to the first'].indexOf(relation),description=earlyComparisons[m.adapter];if(index>=0)return{kind:description[index],label:description[index+3]};return ["Impossible to compare using the recorded measurements.","It is impossible to compare under the specified model.","The numbers cannot be compared."].includes(text)?{kind:'unknown',label:'Cannot compare'}:null;});
 return{...question,pictures};
}
export function earlyDiagram(kind){
 const cart=(x,y,w=35)=>`<rect x="${x}" y="${y}" width="${w}" height="20" rx="3" fill="#e8bc5f" stroke="#244b55" stroke-width="2"/><circle cx="${x+7}" cy="${y+24}" r="5" fill="#244b55"/><circle cx="${x+w-7}" cy="${y+24}" r="5" fill="#244b55"/>`;
 const arrow=(x,y,end)=>`<path d="M${x} ${y}H${end}l${end>x?-9:9} -7m${end>x?9:-9} 7l${end>x?-9:9} 7" fill="none" stroke="#244b55" stroke-width="4"/>`;
 let b=natureDiagram(kind);
 if(b!==null)return `<svg viewBox="0 0 200 90" width="200" height="90" aria-hidden="true" focusable="false">${b}</svg>`;
 b='';
 if(['far','near','still'].includes(kind)){const x=kind==='far'?132:kind==='near'?72:22;b='<path d="M22 62H185M22 55V69" stroke="#708b8f" stroke-width="2"/>'+cart(x,31)+(kind==='still'?'':arrow(25,18,x+20));}
 else if(['left','right','blocked-left','same-right','reverse'].includes(kind)){b=cart(82,40)+arrow(kind==='left'||kind==='blocked-left'?165:25,23,kind==='left'||kind==='blocked-left'?35:165);if(kind==='reverse')b+=arrow(165,75,35);if(kind==='same-right')b+=arrow(25,75,165);if(kind==='blocked-left')b+='<path d="M30 8V38" stroke="#244b55" stroke-width="5"/>';}
 else if(kind==='push-long'||kind==='push-short')b=cart(145,40)+arrow(kind==='push-long'?20:90,47,135);
 else if(kind==='equal'||kind==='matched'){b=cart(24,25)+cart(142,25)+'<path d="M85 32H115M85 46H115" stroke="#244b55" stroke-width="4"/>';}
 else if(kind==='different'||kind==='shrink'){b=cart(20,25,50)+cart(145,30,25)+'<path d="M90 32H120M90 46H120M95 55L115 20" stroke="#244b55" stroke-width="4"/>';}
 else if(kind==='one-change')b=cart(90,38)+arrow(20,45,75)+'<circle cx="43" cy="45" r="30" fill="none" stroke="#244b55" stroke-dasharray="4 4"/>';
 else if(kind==='many')b=cart(20,35)+cart(130,20,50)+arrow(30,15,80)+arrow(100,75,170);
 else if(kind==='self')b=cart(105,38)+arrow(20,20,150)+'<path d="M20 20L40 40M20 40L40 20" stroke="#244b55" stroke-width="3"/>';
 else if(kind==='vanish')b='<rect x="80" y="30" width="40" height="25" fill="none" stroke="#244b55" stroke-width="2" stroke-dasharray="4 4"/>';
 else b='<text x="100" y="65" text-anchor="middle" font-size="60" fill="#244b55">?</text>';
 return `<svg viewBox="0 0 200 90" width="200" height="90" aria-hidden="true" focusable="false">${b}</svg>`;
}
