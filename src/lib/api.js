import{SUPABASE_URL,SUPABASE_KEY}from'./constants';
const H={
  "apikey":SUPABASE_KEY,
  "Authorization":`Bearer ${SUPABASE_KEY}`,
  "Content-Type":"application/json",
};
export const api=async(ep,opts={})=>{
  const res=await fetch(`${SUPABASE_URL}/rest/v1/${ep}`,{
    headers:{...H,...(opts.prefer?{"Prefer":opts.prefer}:{}),...(opts.headers||{})},
    ...opts,
  });
  if(!res.ok)throw new Error(await res.text());
  if(res.status===204)return null;
  return res.json();
};
export const getUsers=()=>api("users?select=*&order=first_name.asc");
export const updateUser=(id,d)=>api(`users?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(d)});
export const getClients=(includeArchived=false)=>api(`clients?select=*${includeArchived?'':'&status=eq.active'}&order=created_at.desc`);
export const createClient=d=>api("clients",{method:"POST",prefer:"return=representation",body:JSON.stringify(d)});
export const updateClient=(id,d)=>api(`clients?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(d)});
export const getPayments=id=>api(`payments?client_id=eq.${id}&select=*&order=created_at.desc`);
export const createPayment=d=>api("payments",{method:"POST",prefer:"return=representation",body:JSON.stringify(d)});
export const updatePayment=(id,d)=>api(`payments?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(d)});
export const getDocuments=id=>api(`documents?client_id=eq.${id}&select=*&order=created_at.desc`);
export const createDocument=d=>api("documents",{method:"POST",prefer:"return=representation",body:JSON.stringify(d)});
export const getCommsLog=id=>api(`communications_log?client_id=eq.${id}&select=*&order=sent_at.desc`);
export const addCommsLog=d=>api("communications_log",{method:"POST",body:JSON.stringify(d)});
export const getMedicalForms=id=>api(`medical_forms?client_id=eq.${id}&select=*`);
export const createMedicalForm=d=>api("medical_forms",{method:"POST",prefer:"return=representation",body:JSON.stringify(d)});
export const updateMedicalForm=(id,d)=>api(`medical_forms?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(d)});
export const getSessions=()=>api("active_sessions?select=*");
export const lockClient=(cid,uid)=>api("active_sessions",{method:"POST",prefer:"return=representation",body:JSON.stringify({client_id:cid,user_id:uid})});
export const unlockClient=cid=>api(`active_sessions?client_id=eq.${cid}`,{method:"DELETE"});
export const addAudit=(uid,action,tbl,rid,details)=>api("audit_log",{method:"POST",body:JSON.stringify({user_id:uid,action,table_name:tbl,record_id:rid,details})});
