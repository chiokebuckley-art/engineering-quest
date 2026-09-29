/** API double for lock behavior, not evidence of real multi-tab browser acceptance. */
export function testLocks(){const held=new Set();return{async request(name,options,callback){if(held.has(name))return callback(null);held.add(name);try{return await callback({name,mode:'exclusive'});}finally{held.delete(name);}}};}
