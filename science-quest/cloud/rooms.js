import {byId} from '../src/content.js';import {simulate} from '../src/models.js';import {createCoopSession,currentCoopActor,rolesFor,recordCoopAnswer,markCoopHelp,runCoopTrial,explainTogether,nextCoopRound} from '../src/coop.js';
export function roomView(room,credential){const player=room.players.find(p=>p.credential===credential);if(!player)throw Error('Join this private room first.');const session=room.session?structuredClone(room.session):null;if(session&&session.stage!=='complete'){for(const phase of ['predict','explain'])session.answers[phase]=Object.fromEntries(Object.entries(session.answers[phase]).filter(([id])=>id===player.id));session.history=[];}return {revision:room.revision,expiresAt:room.expiresAt,mission:room.mission,self:player.id,host:room.host,players:room.players.map(p=>({id:p.id,name:p.name})),session,evidence:structuredClone(player.coopEvidence||[]),roles:session?rolesFor(session):[],actor:session?currentCoopActor(session):null};}
export function actOnRoom(existing,credential,action,now=Date.now()){
 if(!/^[a-f0-9]{64}$/.test(credential)||!action||typeof action.id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(action.id))throw Error('Invalid room action.');
 let room=existing?structuredClone(existing):null;
 if(room&&room.expiresAt<=now)throw Error('This room has expired. Create a new private room.');
 if(!room){if(action.type!=='create'||!byId[action.mission])throw Error('Room not found.');room={revision:0,mission:action.mission,expiresAt:now+86400000,players:[],session:null,operations:[]};}
 const replay=room.operations.find(o=>o.id===action.id);if(replay){if(replay.credential!==credential||replay.payload!==JSON.stringify(action))throw Error('Action ID already used.');return{room,view:roomView(room,credential),replayed:true};}
 let player=room.players.find(p=>p.credential===credential);
 if(['create','join'].includes(action.type)){if(!player){if(room.session||room.players.length>=4)throw Error('This room is full or already started.');if(typeof action.name!=='string'||!action.name.trim()||action.name.length>30)throw Error('Use a short explorer nickname.');player={id:crypto.randomUUID(),name:action.name.trim(),credential,coopEvidence:[]};room.players.push(player);room.host??=player.id;}else if(action.type==='create'&&room.host!==player.id)throw Error('Only the host created this room.');}
 else{if(!player)throw Error('Join this room before acting.');const m=byId[room.mission],s=room.session;
 switch(action.type){
 case 'start':if(player.id!==room.host||s)throw Error('Only the host can start an unstarted room.');room.session=createCoopSession(room.players.map(p=>p.id),m,room.players);break;
 case 'answer':if(!s)throw Error('The room has not started.');recordCoopAnswer(s,m,player.id,action.choice,room.players);break;
 case 'hint':if(!s)throw Error('The room has not started.');markCoopHelp(s,player.id);break;
 case 'configure':if(s?.stage!=='experiment'||rolesFor(s).find(r=>r.role==='Builder').profile!==player.id)throw Error('Only the current builder can change this experiment.');simulate(s.model,action.input);s.input=action.input;break;
 case 'trial':if(!s)throw Error('The room has not started.');if(s.trials.length>=100)throw Error('Trial limit reached for this round.');runCoopTrial(s,player.id);break;
 case 'explain':if(!s||rolesFor(s).find(r=>r.role==='Explainer').profile!==player.id)throw Error('The explainer opens the explanation round.');explainTogether(s);break;
 case 'next':if(player.id!==room.host||!s)throw Error('Only the host can start the next round.');if(s.round>=9)throw Error('Create a new room after ten rounds.');nextCoopRound(s,m);break;
 default:throw Error('Unsupported room action.');
 }}
 room.revision++;room.operations.push({id:action.id,credential,payload:JSON.stringify(action)});room.operations=room.operations.slice(-500);return {room,view:roomView(room,credential),replayed:false};
}
