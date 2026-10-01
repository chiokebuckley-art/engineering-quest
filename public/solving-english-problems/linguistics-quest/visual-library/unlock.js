export function normalizeCode(value){return String(value).replace(/[\s-]/g,'').toUpperCase();}
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function decryptBook(cipher,manifest,code,cryptoAPI=globalThis.crypto){
 const normalized=normalizeCode(code);
 if(!/^[A-Z0-9]{4,64}$/.test(normalized))throw Error('Paste the complete unlock code from our conversation.');
 if(manifest.format!=='visual-library-encrypted-book'||manifest.version!==1||manifest.iterations!==210000)throw Error('This book version is unsupported. Reload the app.');
 const password=await cryptoAPI.subtle.importKey('raw',new TextEncoder().encode(normalized),'PBKDF2',false,['deriveKey']);
 const key=await cryptoAPI.subtle.deriveKey({name:'PBKDF2',salt:bytes(manifest.salt),iterations:manifest.iterations,hash:'SHA-256'},password,{name:'AES-GCM',length:256},false,['decrypt']);
 let clear;
 try{clear=await cryptoAPI.subtle.decrypt({name:'AES-GCM',iv:bytes(manifest.iv),additionalData:new TextEncoder().encode('visual-library-book-v1')},key,cipher);}catch{throw Error('That code could not unlock this book. Check the code and try again.');}
 return JSON.parse(new TextDecoder().decode(clear));
}
