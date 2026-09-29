import {createSyncKey,syncEndpoint} from './cloud-client.js';
export function createRoomClient(storage,fetcher=fetch){const key='science-quest.room.v1';let busy=false;const read=()=>JSON.parse(storage.getItem(key)||'null'),save=s=>storage.setItem(key,JSON.stringify(s));
 async function request(method,body){const s=read();if(!s)throw Error('Create or join a room first.');const response=await fetcher(s.url,{method,headers:{Authorization:'Bearer '+s.invite,'X-Player-Key':s.playerKey,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok){const error=Error(data.error||'Room service unavailable.');error.rejected=response.status>=400&&response.status<500;throw error;}return data;}
 async function retry(){if(busy)throw Error('Wait for the current room action.');const s=read();if(!s?.pending)return null;busy=true;try{const view=await request('POST',s.pending);s.pending=null;save(s);return view;}catch(e){if(e.rejected){s.pending=null;save(s);}throw e;}finally{busy=false;}}
 return{connection:()=>{const s=read();return s?{url:s.url,profile:s.profile,invite:s.invite,pending:!!s.pending}:null;},
 async connect({url,invite,profile,name,mission}){if(read())throw Error('Leave the current connection first.');if(invite&&!/^[a-f0-9]{64}$/.test(invite))throw Error('Invalid room invitation.');const creating=!invite;const s={url:syncEndpoint(url).replace('/v1/sync','/v1/room'),invite:invite||createSyncKey(),playerKey:createSyncKey(),profile,pending:{id:crypto.randomUUID(),type:creating?'create':'join',name,...(creating?{mission}:{})}};save(s);return retry();},
 async action(type,extra={}){if(busy)throw Error('Wait for the current room action.');const s=read();if(!s)throw Error('Join a room first.');if(s.pending)throw Error('Retry the saved action first.');s.pending={...extra,id:crypto.randomUUID(),type};save(s);return retry();},retry,
 async refresh(){if(busy)return null;return request('GET');},
 async close(){if(busy||read()?.pending)throw Error('Finish the pending action first.');await request('DELETE');storage.removeItem(key);},
 leave(){if(busy)throw Error('Wait for the current action.');storage.removeItem(key);}
 };
}
