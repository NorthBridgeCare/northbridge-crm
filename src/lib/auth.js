export async function hashPassword(pw){
  const enc=new TextEncoder();
  const data=enc.encode(pw+'nb-salt-2026');
  const hash=await crypto.subtle.digest('SHA-256',data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function verifyPassword(pw,hash){
  return (await hashPassword(pw))===hash;
}
export const SESSION_KEY='nb_crm_v3_session';
export function saveSession(user){
  localStorage.setItem(SESSION_KEY,JSON.stringify({...user,savedAt:Date.now()}));
}
export function loadSession(){
  try{
    const raw=localStorage.getItem(SESSION_KEY);
    if(!raw)return null;
    const s=JSON.parse(raw);
    if(Date.now()-s.savedAt>8*60*60*1000){localStorage.removeItem(SESSION_KEY);return null;}
    return s;
  }catch{return null;}
}
export function clearSession(){localStorage.removeItem(SESSION_KEY);}
