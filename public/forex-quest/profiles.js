import {fresh,valid,migrate} from './engine.js';
export const PROFILE_KEY='forex-quest.profiles.v1';
export function profileStore(storage,legacy){
 let data={active:'original',players:[{id:'original',name:'Guest',progress:legacy}]};
 const raw=storage.getItem(PROFILE_KEY);
 if(raw){
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed.players)||!parsed.players.length||!parsed.players.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&p.name.length>0&&p.name.length<=40&&valid(p.progress))||new Set(parsed.players.map(p=>p.id)).size!==parsed.players.length||!parsed.players.some(p=>p.id===parsed.active))throw Error('Player profiles could not be read.');
  data=parsed;
 }
 const current=()=>data.players.find(p=>p.id===data.active);
 const write=next=>{storage.setItem(PROFILE_KEY,JSON.stringify(next));data=next;};
 const clean=name=>{name=name.trim();if(!name||name.length>40)throw Error('Enter a name between 1 and 40 characters.');return name;};
 return {
  current, list:()=>data.players.map(({id,name})=>({id,name})), load:()=>migrate(current().progress),
  save(progress){const next=structuredClone(data);next.players.find(p=>p.id===next.active).progress=progress;write(next);},
  rename(name){const next=structuredClone(data);next.players.find(p=>p.id===next.active).name=clean(name);write(next);},
  add(name){name=clean(name);if(data.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('That player name already exists.');const next=structuredClone(data),id=crypto.randomUUID();next.players.push({id,name,progress:fresh()});next.active=id;write(next);},
  switch(id){if(!data.players.some(p=>p.id===id))throw Error('Player not found.');write({...data,active:id});}
 };
}
