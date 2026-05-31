import{useState,useEffect,useRef}from"react";
import{hashPassword,verifyPassword,saveSession}from"../lib/auth";
import{getUsers,updateUser}from"../lib/api";
import{NAVY,TEAL,GOLD}from"../lib/constants";

export default function Login({onLogin}){
  const[users,setUsers]=useState([]);
  const[uid,setUid]=useState("");
  const[pw,setPw]=useState("");
  const[pw2,setPw2]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[mode,setMode]=useState("login");
  const[superChoice,setSuperChoice]=useState(false);
  // Store the fully-updated user object for super admin choice
  const readyUserRef=useRef(null);

  useEffect(()=>{getUsers().then(d=>{setUsers(d||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);

  const selected=users.find(u=>u.id===uid);
  const isSuperAdmin=selected?.role==="super_admin";
  const isFirst=selected&&(selected.is_first_login||!selected.password_hash);
  const needsReset=selected?.password_reset_required;

  useEffect(()=>{
    if(selected){
      setMode(isFirst||needsReset?"create":"login");
      setErr("");setPw("");setPw2("");setSuperChoice(false);readyUserRef.current=null;
    }
  },[uid]);

  const submit=async()=>{
    if(!selected)return;
    setErr("");setSaving(true);
    try{
      if(mode==="create"){
        if(pw.length<6){setErr("Minimum 6 caractères.");setSaving(false);return;}
        if(pw!==pw2){setErr("Les mots de passe ne correspondent pas.");setSaving(false);return;}
        const hash=await hashPassword(pw);
        await updateUser(selected.id,{password_hash:hash,is_first_login:false,password_reset_required:false});
        const u={...selected,password_hash:hash,is_first_login:false,password_reset_required:false};
        if(isSuperAdmin){readyUserRef.current=u;setSuperChoice(true);setSaving(false);return;}
        saveSession(u);onLogin(u);
      } else {
        if(!pw){setErr("Entrez votre mot de passe.");setSaving(false);return;}
        const ok=await verifyPassword(pw,selected.password_hash);
        if(!ok){setErr("Mot de passe incorrect.");setSaving(false);return;}
        const u={...selected};
        if(isSuperAdmin){readyUserRef.current=u;setSuperChoice(true);setSaving(false);return;}
        saveSession(u);onLogin(u);
      }
    }catch(e){setErr("Erreur de connexion. Réessayez.");}
    setSaving(false);
  };

  const connectAs=(asSuperAdmin)=>{
    const base=readyUserRef.current||{...selected};
    const u=asSuperAdmin?{...base,role:"super_admin"}:{...base,role:"super_user"};
    saveSession(u);onLogin(u);
  };

  const k=e=>{if(e.key==="Enter")submit();};

  const s={
    wrap:{minHeight:"100vh",background:NAVY,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24},
    card:{background:"#fff",borderRadius:16,padding:32,width:"100%",maxWidth:380,boxShadow:"0 20px 60px rgba(0,0,0,.3)"},
    label:{fontSize:12,fontWeight:600,color:"#6B7280",display:"block",marginBottom:5},
    input:{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:14,color:NAVY,boxSizing:"border-box",outline:"none",marginBottom:14},
    select:{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:14,color:NAVY,background:"#F9FAFB",marginBottom:14,boxSizing:"border-box"},
    btn:{width:"100%",background:TEAL,color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer"},
    err:{background:"#FEE2E2",color:"#991B1B",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:14},
    title:{fontSize:18,fontWeight:600,color:NAVY,marginBottom:6},
    sub:{fontSize:13,color:"#6B7280",marginBottom:24},
    choiceBtn:{width:"100%",border:"1.5px solid #E2E8F0",borderRadius:10,padding:"12px 16px",fontSize:14,cursor:"pointer",marginBottom:10,textAlign:"left",display:"flex",alignItems:"center",gap:10,background:"#F9FAFB"},
  };

  // Super Admin choice screen
  if(superChoice){
    const userName=(readyUserRef.current||selected)?.first_name||"Pascal";
    return(
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.title}>Connexion — {userName}</div>
          <div style={s.sub}>Comment souhaitez-vous vous connecter ?</div>
          <button style={{...s.choiceBtn,borderColor:NAVY}} onClick={()=>connectAs(false)}>
            <span style={{fontSize:20}}>👤</span>
            <div><div style={{fontWeight:600,color:NAVY}}>Pascal — NorthBridge</div><div style={{fontSize:12,color:"#6B7280"}}>Accès standard</div></div>
          </button>
          <button style={{...s.choiceBtn,borderColor:GOLD,background:"#FFFBEB"}} onClick={()=>connectAs(true)}>
            <span style={{fontSize:20}}>⚡</span>
            <div><div style={{fontWeight:600,color:"#92400E"}}>Super Admin</div><div style={{fontSize:12,color:"#6B7280"}}>Accès complet — tous les droits</div></div>
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={s.wrap}>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <img src="/logo-stacked.png" alt="NorthBridge" style={{height:90,filter:"brightness(0) invert(1)",opacity:.9}} onError={e=>{e.target.style.display="none";}}/>
        <div style={{color:"rgba(255,255,255,.4)",fontSize:11,marginTop:8,letterSpacing:".08em",textTransform:"uppercase"}}>CRM — Accès sécurisé</div>
      </div>
      <div style={s.card}>
        <div style={s.title}>{mode==="create"?"Créez votre mot de passe":"Bonjour 👋"}</div>
        <div style={s.sub}>{mode==="create"?"Première connexion — choisissez un mot de passe.":"Connectez-vous au CRM NorthBridge."}</div>
        {loading?<div style={{textAlign:"center",color:"#6B7280",padding:20}}>Chargement...</div>:<>
          <label style={s.label}>Qui êtes-vous ?</label>
          <select value={uid} onChange={e=>setUid(e.target.value)} style={s.select}>
            <option value="">— Sélectionner —</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
          </select>
          {uid&&<>
            <label style={s.label}>{mode==="create"?"Nouveau mot de passe":"Mot de passe"}</label>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={k}
              placeholder={mode==="create"?"Minimum 6 caractères":"Votre mot de passe"} style={s.input} autoFocus/>
            {mode==="create"&&<>
              <label style={s.label}>Confirmer le mot de passe</label>
              <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} onKeyDown={k}
                placeholder="Répétez le mot de passe" style={s.input}/>
            </>}
            {err&&<div style={s.err}>{err}</div>}
            <button onClick={submit} disabled={saving} style={{...s.btn,opacity:saving?.7:1}}>
              {saving?"...":mode==="create"?"Créer et se connecter":"Se connecter"}
            </button>
          </>}
        </>}
      </div>
      <div style={{marginTop:24,color:"rgba(255,255,255,.3)",fontSize:11}}>
        NorthBridge Medical Care Travel Inc. · Ontario Inc. #1001590313
      </div>
    </div>
  );
}
