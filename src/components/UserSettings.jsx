import{useState}from"react";
import{updateUser}from"../lib/api";
import{NAVY,TEAL,BG,BORDER,MUTED,GOLD}from"../lib/constants";
const sl=(l,fr,en)=>l==="FR"?fr:en;
export default function UserSettings({lang,user,allUsers,onBack,onUsersUpdate}){
  const[msg,setMsg]=useState("");
  const resetPw=async u=>{
    if(!window.confirm(`${sl(lang,"Réinitialiser le mot de passe de","Reset password for")} ${u.first_name} ${u.last_name} ?`))return;
    try{
      await updateUser(u.id,{password_hash:null,is_first_login:true,password_reset_required:true});
      onUsersUpdate(allUsers.map(x=>x.id===u.id?{...x,password_reset_required:true,is_first_login:true}:x));
      setMsg(`✓ ${sl(lang,`Mot de passe réinitialisé — ${u.first_name} devra créer un nouveau mot de passe à sa prochaine connexion.`,`Password reset — ${u.first_name} will create a new password on next login.`)}`);
    }catch(e){setMsg("Erreur: "+e.message);}
  };
  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:BG,minHeight:"100vh",padding:24}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <button onClick={onBack} style={{background:"#fff",color:MUTED,border:`1px solid ${BORDER}`,borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
          ← {sl(lang,"Retour au CRM","Back to CRM")}
        </button>
        <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,.08)"}}>
          <div style={{background:NAVY,padding:"16px 24px"}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:16}}>{sl(lang,"Paramètres","Settings")}</div>
            <div style={{color:"#1BC4D8",fontSize:12,marginTop:2}}>{user.first_name} {user.last_name} · {user.role}</div>
          </div>
          <div style={{padding:24}}>
            <div style={{fontSize:13,fontWeight:600,color:NAVY,marginBottom:16,paddingBottom:8,borderBottom:`1px solid ${BORDER}`}}>
              {sl(lang,"Gestion des utilisateurs","User management")}
            </div>
            {msg&&<div style={{background:"#D5FFC5",color:"#3B6D11",padding:"10px 12px",borderRadius:8,fontSize:13,marginBottom:16}}>{msg}</div>}
            {allUsers.map(u=>(
              <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${BORDER}`}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:u.id===user.id?GOLD:NAVY,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>
                    {u.first_name[0]}{u.last_name[0]}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{u.first_name} {u.last_name}</div>
                    <div style={{fontSize:11,color:MUTED}}>{u.role} · {sl(lang,"Langue","Language")}: {u.lang_pref||"FR"}</div>
                    {u.password_reset_required&&<div style={{fontSize:10,color:"#92400E",fontWeight:600}}>⚠ {sl(lang,"Réinitialisation en attente","Reset pending")}</div>}
                  </div>
                </div>
                {user.role==="super_admin"&&u.id!==user.id
                  ?<button onClick={()=>resetPw(u)} style={{background:"#FEF3C7",color:"#92400E",border:"1px solid #FCD34D",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    🔑 {sl(lang,"Réinitialiser MDP","Reset password")}
                  </button>
                  :u.id===user.id&&<span style={{fontSize:11,color:TEAL,fontWeight:600}}>← {sl(lang,"Vous","You")}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
