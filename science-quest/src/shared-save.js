import {validateCoopSession} from './coop.js';
import {byId} from './content.js';
import {simulate} from './models.js';
import {worldUpgrades,decorations,workshopSlots} from './world.js';
export function validateSharedSave(data){
 const ids=new Set(data.profiles.map(p=>p.id)),missionIds=new Set(Object.keys(byId));
 if(data.coopSessions!==undefined&&!Array.isArray(data.coopSessions))throw Error('Invalid shared investigations.');
 const sessions=new Set();
 for(const s of data.coopSessions||[]){if(!validateCoopSession(s,missionIds,ids)||sessions.has(s.id)||s.model!==byId[s.mission].adapter||!Number.isInteger(s.round)||s.round<0)throw Error('Invalid shared investigation checkpoint.');sessions.add(s.id);simulate(s.model,s.input);
 for(const t of s.trials)if(t.model!==s.model||!Number.isFinite(t.input)||!Number.isFinite(t.value))throw Error('Invalid shared trial.');
 for(const phase of ['predict','explain']){const required=phase==='predict'?(s.stage==='predict'?s.turn:s.roster.length):(s.stage==='complete'?s.roster.length:s.stage==='explain'?s.turn:0);for(let i=0;i<required;i++){const a=s.answers[phase][s.roster[i]];if(!a||a.profile!==s.roster[i]||a.phase!==phase||typeof a.correct!=='boolean'||typeof a.assisted!=='boolean')throw Error('Missing individual contribution.');}}
 }
 if(data.coopActive&&!sessions.has(data.coopActive))throw Error('Missing active shared investigation.');
 for(const p of data.profiles){if(p.coopEvidence!==undefined&&(!Array.isArray(p.coopEvidence)||p.coopEvidence.some(e=>!e||e.profile!==p.id||!missionIds.has(e.mission)||typeof e.answer!=='string')))throw Error('Invalid individual co-op evidence.');const w=p.world;if(w&&(!Array.isArray(w.upgrades)||w.upgrades.some(x=>!worldUpgrades.some(u=>u.id===x.id))||!Array.isArray(w.decorations)||w.decorations.some(id=>!decorations.some(d=>d.id===id))||!w.placements||Object.entries(w.placements).some(([slot,id])=>!workshopSlots.includes(slot)||!w.decorations.includes(id))))throw Error('Invalid workshop save.');}
 return data;
}
export function mergeSharedSave(current,imported,profileRemap,incoming){
 const merged=structuredClone(current),sessionRemap=new Map();merged.coopSessions??=[];
 for(const source of imported.coopSessions||[]){const session=structuredClone(source);session.roster=session.roster.map(id=>profileRemap.get(id)||id);const existing=merged.coopSessions.find(x=>x.id===session.id);if(existing&&JSON.stringify(existing)===JSON.stringify(session))continue;if(existing){session.id=crypto.randomUUID();sessionRemap.set(source.id,session.id);}
 const remapRecords=round=>{for(const phase of ['predict','explain'])round.answers[phase]=Object.fromEntries(Object.entries(round.answers[phase]).map(([id,a])=>{const profile=profileRemap.get(id)||id;return[profile,{...a,profile,session:session.id}];}));for(const t of round.trials)t.tester=profileRemap.get(t.tester)||t.tester;};remapRecords(session);for(const round of session.history)remapRecords(round);for(const phase of ['predict','explain'])session.help[phase]=Object.fromEntries(Object.entries(session.help[phase]).map(([id,v])=>[profileRemap.get(id)||id,v]));merged.coopSessions.push(session);
 }
 for(const source of incoming){const p=structuredClone(source);for(const e of p.coopEvidence||[]){e.profile=p.id;e.session=sessionRemap.get(e.session)||e.session;}merged.profiles.push(p);}
 const events=(imported.events||[]).map(source=>{const e=structuredClone(source);if(profileRemap.has(e.profile)||sessionRemap.has(e.session)){e.id=crypto.randomUUID();e.profile=profileRemap.get(e.profile)||e.profile;e.session=sessionRemap.get(e.session)||e.session;}if(e.roster)e.roster=e.roster.map(id=>profileRemap.get(id)||id);return e;});
 validateSharedSave(merged);return{merged,events};
}
export function removeSharedProfile(data,id){data.coopSessions=(data.coopSessions||[]).filter(s=>!s.roster.includes(id));if(!data.coopSessions.some(s=>s.id===data.coopActive))data.coopActive=null;}
