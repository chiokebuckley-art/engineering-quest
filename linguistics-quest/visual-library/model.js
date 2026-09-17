export const VERSION=1;
export const ROADMAP=['Astronomy','Earth','Plants and plantlike organisms','Animals','Human being','Food and kitchen','House','Do-it-yourself and gardening','Clothing','Personal accessories and articles','Arts and architecture','Communications','Office automation','Transport and machinery','Energy','Science','Society','Sports and games'];
export const DAY=86400000;
const text=(v,n=20000)=>typeof v==='string'&&v.length>0&&v.length<=n;
export function validatePack(p){
 if(!p||p.format!=='visual-library-pack'||p.version!==VERSION||!text(p.id,100)||!text(p.title,200)||!Array.isArray(p.pages)||!Array.isArray(p.cards)||p.pages.length>1500||p.cards.length>20000)throw Error('This is not a supported visual-library study pack.');
 const pages=new Set(),cards=new Set();
 for(const x of p.pages){if(!text(x.id,150)||pages.has(x.id)||!Number.isInteger(x.number)||x.number<1||!text(x.title,250)||!ROADMAP.includes(x.chapter)&&x.chapter!=='Book guide'||!text(x.image,4000000)||!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(x.image)||typeof x.ocr!=='string'||x.ocr.length>60000)throw Error('A page in this pack is invalid. Nothing was imported.');pages.add(x.id);}
 for(const c of p.cards){if(!text(c.id,150)||cards.has(c.id)||!pages.has(c.pageId)||!text(c.term,200)||!text(c.meaning,2000)||!text(c.example,2000)||!text(c.notice,2000)||!ROADMAP.includes(c.chapter))throw Error('A meaning card in this pack is invalid. Nothing was imported.');cards.add(c.id);if(c.image&&!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(c.image))throw Error('Invalid item image.');if(c.sourceDefinition&&!text(c.sourceDefinition,4000))throw Error('Invalid source definition.');}
 for(const c of p.cards){const visited=new Set([c.id]);let parent=c.parentId;while(parent){if(!cards.has(parent)||visited.has(parent))throw Error('Invalid or circular topic hierarchy.');visited.add(parent);parent=p.cards.find(x=>x.id===parent).parentId;}}
 if(!p.pages.length)throw Error('This pack has no pages.');return p;
}
export function recordAttempt(prior,correct,now=Date.now()){
 const p=prior||{},stage=correct?Math.min((p.stage||0)+1,5):0;
 return {attempts:(p.attempts||0)+1,correct:(p.correct||0)+(correct?1:0),stage,seen:true,due:now+(correct?[1,3,7,14,30][stage-1]*DAY:0),last:now};
}
export function validateProgress(p){
 if(!p||p.format!=='visual-library-progress'||p.version!==1||!Array.isArray(p.records)||p.records.length>100000)throw Error('Choose a visual-library progress backup.');
 for(const r of p.records)if(!r||!text(r.id,500)||!r.value||!Number.isInteger(r.value.attempts)||r.value.attempts<0||!Number.isInteger(r.value.correct)||r.value.correct<0||r.value.correct>r.value.attempts||!Number.isInteger(r.value.stage)||r.value.stage<0||r.value.stage>5||!Number.isFinite(r.value.due)||!Number.isFinite(r.value.last))throw Error('The progress backup contains an invalid record.');return p;
}
export function mergeProgress(old,incoming){return !old||(incoming.last||0)>(old.last||0)?incoming:old;}
