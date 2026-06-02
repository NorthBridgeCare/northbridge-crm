import{useState,useEffect,useCallback}from"react";
import{getClients,getArchivedClients,updateClient,getSessions,lockClient,unlockClient,getUsers,updateUser,addAudit}from"../lib/api";
import{clearSession}from"../lib/auth";
import{STAGES,PROCEDURES,SOURCES,PROC_COLORS,NAVY,TEAL,CYAN,GOLD,BG,BORDER,MUTED,GREEN,RED}from"../lib/constants";
import ClientDossier from"../components/ClientDossier/index";
import NewClientForm from"../components/NewClientForm";
import UserSettings from"../components/UserSettings";

const sl=(lang,fr,en)=>lang==="FR"?fr:en;
const stageOf=n=>STAGES[(n||1)-1]||STAGES[0];
const procBg=p=>(PROC_COLORS[p]||["#E2E8F0","#475569"])[0];
const procTx=p=>(PROC_COLORS[p]||["#E2E8F0","#475569"])[1];
const initials=c=>`${(c.first_name||"")[0]||""}${(c.last_name||"")[0]||""}`.toUpperCase();

const dpLabel=(c)=>{
  if(c.source==="Envoyé à DP Surgery"||c.dp_relationship==="sent_to_dp") return "sent";
  if(c.source==="D Plastic Surgery"||c.dp_relationship==="received_from_dp") return "received";
  return null;
};

const NB_LOGO=()=>(
  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
    <span style={{color:"#fff",fontSize:16,fontWeight:700,letterSpacing:"-.3px"}}>NorthBridge</span>
    <span style={{color:"#1BC4D8",fontSize:11,fontWeight:400}}>Medical</span>
  </div>
);

export default function Dashboard({user,onLogout}){
  const[lang,setLang]=useState(user.lang_pref||"FR");
  const[clients,setClients]=useState([]);
  const[archived,setArchived]=useState([]);
  const[loading,setLoading]=useState(true);
  const[view,setView]=useState("list");
  const[showArchived,setShowArchived]=useState(false);
  const[selected,setSelected]=useState(null);
  const[showNew,setShowNew]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[showAlerts,setShowAlerts]=useState(false);
  const[sessions,setSessions]=useState([]);
  const[allUsers,setAllUsers]=useState([]);
  const[search,setSearch]=useState("");
  const[fStage,setFStage]=useState("");
  const[fProc,setFProc]=useState("");
  const[fSrc,setFSrc]=useState("");
  const[err,setErr]=useState(null);
  const[toast,setToast]=useState("");

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),4000);};

  const checkAutoStages=async(list)=>{
    const now=new Date();
    const updates=[];
    for(const c of list){
      if(c.status!=="active")continue;
      if(c.current_stage>=9&&c.current_stage<10&&c.flight_departure_date){
        const dep=new Date(c.flight_departure_date);
        if(dep<=now) updates.push({id:c.id,stage:10});
      }
      if(c.current_stage===10&&c.flight_arrival_date){
        const arr=new Date(c.flight_arrival_date);
        const returnCheck=new Date(arr);
        returnCheck.setDate(returnCheck.getDate()+5);
        if(returnCheck<=now) updates.push({id:c.id,stage:11});
      }
    }
    for(const u of updates){
      try{
        await updateClient(u.id,{current_stage:u.stage});
        setClients(prev=>prev.map(c=>c.id===u.id?{...c,current_stage:u.stage}:c));
      }catch{}
    }
  };

  const fetchAll=useCallback(async()=>{
    try{
      const[a,s,u]=await Promise.all([getClients(false),getSessions(),getUsers()]);
      const list=a||[];
      setClients(list);setSessions(s||[]);setAllUsers(u||[]);
      checkAutoStages(list);
    }catch(e){setErr(e.message);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{
    fetchAll();
    const i=setInterval(()=>getSessions().then(s=>setSessions(s||[])).catch(()=>{}),30000);
    return()=>clearInterval(i);
  },[fetchAll]);

  const loadArchived=async()=>{
    try{const a=await getArchivedClients();setArchived(a||[]);}
    catch{setArchived([]);}
  };

  const toggleLang=async()=>{
    const nl=lang==="FR"?"EN":"FR";setLang(nl);
    try{await updateUser(user.id,{lang_pref:nl});}catch{}
  };

  const openDossier=async(client)=>{
    const sess=sessions.find(s=>s.client_id===client.id);
    if(sess&&sess.user_id!==user.id){
      const lu=allUsers.find(u=>u.id===sess.user_id);
      if(!window.confirm(`Ce dossier est ouvert par ${lu?.first_name||"quelqu'un"}. Ouvrir en lecture seule ?`))return;
      setSelected({...client,readOnly:true});
    }else{
      try{await lockClient(client.id,user.id);}catch{}
      setSelected({...client,readOnly:false});
      setSessions(prev=>[...prev.filter(s=>s.client_id!==client.id),{client_id:client.id,user_id:user.id}]);
    }
  };

  const closeDossier=async()=>{
    if(selected&&!selected.readOnly){
      try{await unlockClient(selected.id);}catch{}
      setSessions(prev=>prev.filter(s=>s.client_id!==selected.id));
    }
    setSelected(null);
    try{const a=await getClients(false);setClients(a||[]);}catch{}
  };

  const handleUpdate=u=>{
    setClients(prev=>prev.map(c=>c.id===u.id?u:c));
    setSelected(prev=>prev?.id===u.id?{...u,readOnly:prev.readOnly}:prev);
  };

  const handleNew=nc=>{
    setClients(prev=>[nc,...prev]);
    setShowNew(false);
  };

  const handleArchive=async(client)=>{
    try{
      await updateClient(client.id,{status:"archived",archived_at:new Date().toISOString(),archived_by:user.id});
      setClients(prev=>prev.filter(c=>c.id!==client.id));
      setSelected(null);
      try{await unlockClient(client.id);}catch{}
      setSessions(prev=>prev.filter(s=>s.client_id!==client.id));
      showToast(`✓ ${sl(lang,"Dossier archivé","File archived")} — ${client.first_name} ${client.last_name}`);
    }catch(e){alert("Erreur: "+e.message);}
  };

  const reactivate=async(client)=>{
    try{
      await updateClient(client.id,{status:"active",archived_at:null,archived_by:null});
      setArchived(prev=>prev.filter(c=>c.id!==client.id));
      showToast(`✓ ${sl(lang,"Réactivé","Reactivated")} — ${client.first_name} ${client.last_name}`);
    }catch(e){alert("Erreur: "+e.message);}
  };

  // Alerts calculation
  const alertsLprpde=clients.filter(c=>c.current_stage===8&&(!c.lprpde_consent||!c.medical_form_signed));
  const alertsPay=clients.filter(c=>{
    if(!c.payment_deadline||c.current_stage<8)return false;
    return Math.ceil((new Date(c.payment_deadline)-new Date())/(1000*60*60*24))<=16;
  });
  const alertsDP=clients.filter(c=>c.current_stage===13);
  const totalAlerts=alertsLprpde.length+alertsPay.length+alertsDP.length;

  const filtered=clients.filter(c=>{
    if(search){const q=search.toLowerCase();if(!`${c.first_name} ${c.last_name} ${c.dossier_number||""} ${c.procedure||""}`.toLowerCase().includes(q))return false;}
    if(fStage&&c.current_stage!==parseInt(fStage))return false;
    if(fProc&&c.procedure!==fProc)return false;
    if(fSrc&&c.source!==fSrc)return false;
    return true;
  });

  const gridStages=fStage?STAGES.filter(s=>s.id===parseInt(fStage)):STAGES;
  const byStage=n=>filtered.filter(c=>c.current_stage===n);
  const confirmed=clients.filter(c=>c.current_stage>=9&&c.current_stage!==13);
  const revUSD=confirmed.reduce((s,c)=>s+(c.dossier_fee_usd||0),0);
  const conv=clients.filter(c=>c.current_stage!==13).length?Math.round(confirmed.length/clients.filter(c=>c.current_stage!==13).length*100):0;

  const fmtDossier=(c)=>{
    const num=c.dossier_number||"—";
    if(c.source==="Envoyé à DP Surgery"||c.dp_relationship==="sent_to_dp") return `${num} (Envoyé DP)`;
    if(c.source==="D Plastic Surgery"||c.dp_relationship==="received_from_dp") return `${num} (Réf. DP)`;
    return num;
  };

  if(selected)return(<ClientDossier client={selected} user={user} lang={lang} allUsers={allUsers} onClose={closeDossier} onUpdate={handleUpdate} onArchive={handleArchive}/>);
  if(showNew)return<NewClientForm lang={lang} user={user} onSave={handleNew} onCancel={()=>setShowNew(false)}/>;
  if(showSettings)return<UserSettings lang={lang} user={user} allUsers={allUsers} onBack={()=>setShowSettings(false)} onUsersUpdate={setAllUsers}/>;

  // ARCHIVE PAGE
  if(showArchived)return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:BG,minHeight:"100vh"}}>
      <div style={{background:NAVY,padding:"0 20px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setShowArchived(false)} style={{background:"rgba(255,255,255,.12)",color:"#fff",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>← {sl(lang,"Retour","Back")}</button>
          <span style={{color:"#fff",fontWeight:600,fontSize:14}}>📦 {sl(lang,"Dossiers archivés","Archived files")}</span>
        </div>
      </div>
      <div style={{maxWidth:800,margin:"24px auto",padding:"0 16px"}}>
        {archived.length===0?(
          <div style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,padding:40,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:12}}>📦</div>
            <div style={{fontSize:15,fontWeight:600,color:NAVY,marginBottom:8}}>{sl(lang,"Aucun dossier archivé","No archived files")}</div>
            <button onClick={()=>setShowArchived(false)} style={{background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{sl(lang,"Retour","Back")}</button>
          </div>
        ):archived.map((c,i)=>{
          const st=stageOf(c.current_stage);
          return(
            <div key={c.id} style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:10,padding:"14px 18px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:procBg(c.procedure),color:procTx(c.procedure),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,flexShrink:0}}>{initials(c)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{c.first_name} {c.last_name}</div>
                <div style={{fontSize:11,color:MUTED}}>{fmtDossier(c)} · {c.procedure}</div>
              </div>
              <span style={{background:st.bg,color:st.tx,borderRadius:20,padding:"3px 9px",fontSize:11,fontWeight:600}}>{lang==="FR"?st.fr:st.en}</span>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>openDossier({...c,readOnly:true})} style={{fontSize:11,background:BG,color:NAVY,border:`1px solid ${BORDER}`,borderRadius:7,padding:"5px 10px",cursor:"pointer"}}>👁 {sl(lang,"Voir","View")}</button>
                <button onClick={()=>reactivate(c)} style={{fontSize:11,background:"#E1F5EE",color:GREEN,border:"1px solid #9FE1CB",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontWeight:600}}>♻️ {sl(lang,"Réactiver","Reactivate")}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ALERTS PANEL
  const AlertsPanel=()=>(
    <div style={{position:"fixed",top:52,right:0,width:380,maxHeight:"calc(100vh - 52px)",overflowY:"auto",background:"#fff",borderLeft:`1px solid ${BORDER}`,boxShadow:"-4px 0 20px rgba(0,0,0,.1)",zIndex:200}}>
      <div style={{background:NAVY,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{color:"#fff",fontWeight:600,fontSize:14}}>⚠ {sl(lang,"Alertes actives","Active alerts")} ({totalAlerts})</div>
        <button onClick={()=>setShowAlerts(false)} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:12}}>✕</button>
      </div>
      <div style={{padding:12}}>
        {/* Group A: LPRPDE */}
        {alertsLprpde.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:RED,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              🩺 {sl(lang,"Formulaires manquants","Missing forms")} ({alertsLprpde.length})
            </div>
            {alertsLprpde.map(c=>(
              <div key={c.id} onClick={()=>openDossier(c)} style={{background:"#FEE2E2",border:"1px solid #F09595",borderRadius:8,padding:"8px 12px",marginBottom:6,cursor:"pointer"}}>
                <div style={{fontSize:12,fontWeight:600,color:NAVY}}>{c.first_name} {c.last_name}</div>
                <div style={{fontSize:11,color:RED,marginTop:2}}>
                  {!c.lprpde_consent&&<span>⚠ LPRPDE non signé · </span>}
                  {!c.medical_form_signed&&<span>⚠ Formulaire médical manquant</span>}
                </div>
                <div style={{fontSize:10,color:MUTED,marginTop:2}}>{fmtDossier(c)} · Étape 8 — Formulaires</div>
              </div>
            ))}
          </div>
        )}
        {/* Group B: Paiements */}
        {alertsPay.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#B45309",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>
              💳 {sl(lang,"Paiements urgents","Urgent payments")} ({alertsPay.length})
            </div>
            {alertsPay.map(c=>{
              const days=c.payment_deadline?Math.ceil((new Date(c.payment_deadline)-new Date())/(1000*60*60*24)):null;
              return(
                <div key={c.id} onClick={()=>openDossier(c)} style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:8,padding:"8px 12px",marginBottom:6,cursor:"pointer"}}>
                  <div style={{fontSize:12,fontWeight:600,color:NAVY}}>{c.first_name} {c.last_name}</div>
                  <div style={{fontSize:11,color:"#92400E",marginTop:2}}>
                    {days!==null&&(days>0?`⏰ J-${days} — Échéance le ${new Date(c.payment_deadline).toLocaleDateString(lang==="FR"?"fr-CA":"en-CA")}`:"⚠ Paiement en retard!")}
                  </div>
                  <div style={{fontSize:10,color:MUTED,marginTop:2}}>{fmtDossier(c)}</div>
                </div>
              );
            })}
          </div>
        )}
        {/* Group C: Envoyé DP */}
        {alertsDP.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#B45309",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>
              🔄 {sl(lang,"Suivi — Envoyé à DP Surgery","Follow-up — Sent to DP Surgery")} ({alertsDP.length})
            </div>
            {alertsDP.map(c=>(
              <div key={c.id} onClick={()=>openDossier(c)} style={{background:"#FFF7ED",border:"1px solid #FCD34D",borderRadius:8,padding:"8px 12px",marginBottom:6,cursor:"pointer"}}>
                <div style={{fontSize:12,fontWeight:600,color:NAVY}}>{c.first_name} {c.last_name}</div>
                <div style={{fontSize:11,color:"#B45309",marginTop:2}}>
                  {c.dp_commission_expected&&!c.dp_commission_received?"💰 Commission 25% à recevoir":"🔄 Vérifier statut dans calendrier MedArt"}
                </div>
                <div style={{fontSize:10,color:MUTED,marginTop:2}}>{fmtDossier(c)}</div>
              </div>
            ))}
          </div>
        )}
        {totalAlerts===0&&(
          <div style={{padding:"24px 0",textAlign:"center",color:GREEN,fontSize:13}}>
            ✓ {sl(lang,"Aucune alerte active","No active alerts")}
          </div>
        )}
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:BG,minHeight:"100vh",color:"#1A1A2E"}}>
      {/* HEADER */}
      <div style={{background:NAVY,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <NB_LOGO/>
          <span style={{color:CYAN,fontSize:10,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",borderLeft:"1px solid rgba(255,255,255,.2)",paddingLeft:8}}>CRM</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={sl(lang,"Rechercher...","Search...")}
            style={{background:"rgba(255,255,255,.1)",border:"0.5px solid rgba(255,255,255,.15)",borderRadius:8,padding:"5px 10px",color:"#fff",fontSize:12,width:180,outline:"none"}}/>
          <div style={{display:"flex",background:"rgba(255,255,255,.1)",borderRadius:8,overflow:"hidden",border:"0.5px solid rgba(255,255,255,.15)"}}>
            <button onClick={()=>setView("list")} style={{padding:"5px 10px",color:view==="list"?"#fff":"rgba(255,255,255,.4)",background:view==="list"?"rgba(255,255,255,.15)":"transparent",border:"none",cursor:"pointer",fontSize:12}}>☰ {sl(lang,"Liste","List")}</button>
            <button onClick={()=>setView("grid")} style={{padding:"5px 10px",color:view==="grid"?"#fff":"rgba(255,255,255,.4)",background:view==="grid"?"rgba(255,255,255,.15)":"transparent",border:"none",cursor:"pointer",fontSize:12}}>⊞ {sl(lang,"Étapes","Stages")}</button>
          </div>
          <button onClick={()=>setShowNew(true)} style={{background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ {sl(lang,"Nouveau","New")}</button>
          <button onClick={toggleLang} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{lang==="FR"?"EN":"FR"}</button>
          <div onClick={()=>setShowSettings(true)} style={{width:30,height:30,borderRadius:"50%",background:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:NAVY,cursor:"pointer"}}>
            {(user.first_name||"?")[0]}{(user.last_name||"")[0]}
          </div>
          <button onClick={()=>{clearSession();onLogout();}} style={{background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.5)",border:"none",borderRadius:8,padding:"5px 8px",fontSize:11,cursor:"pointer"}} title={sl(lang,"Déconnexion","Sign out")}>⏻</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"10px 16px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        {[
          {l:sl(lang,"Clients actifs","Active clients"),v:clients.filter(c=>c.current_stage!==13).length,c:TEAL},
          {l:sl(lang,"Confirmés","Confirmed"),v:confirmed.length,c:NAVY},
          {l:sl(lang,"Conversion","Conversion"),v:`${conv}%`,c:GREEN},
          {l:sl(lang,"Revenus USD","Revenue USD"),v:`${revUSD.toLocaleString()} $`,c:GOLD},
          {l:sl(lang,"Alertes","Alerts"),v:totalAlerts,c:totalAlerts>0?RED:GREEN,click:true},
        ].map((st,i)=>(
          <div key={i} onClick={st.click?()=>setShowAlerts(v=>!v):undefined}
            style={{background:BG,borderRadius:8,padding:"8px 12px",cursor:st.click?"pointer":"default",border:st.click&&showAlerts?`2px solid ${RED}`:`1px solid ${st.click&&totalAlerts>0?"#F09595":"transparent"}`}}>
            <div style={{fontSize:11,color:MUTED,marginBottom:2}}>{st.l}{st.click&&" ↗"}</div>
            <div style={{fontSize:20,fontWeight:700,color:st.c}}>{st.v}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"8px 16px",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <select value={fStage} onChange={e=>setFStage(e.target.value)} style={{fontSize:12,padding:"5px 10px",border:`1px solid ${BORDER}`,borderRadius:8}}>
          <option value="">{sl(lang,"Toutes les étapes","All stages")}</option>
          {STAGES.map(st=><option key={st.id} value={st.id}>{st.id} — {lang==="FR"?st.fr:st.en}</option>)}
        </select>
        <select value={fProc} onChange={e=>setFProc(e.target.value)} style={{fontSize:12,padding:"5px 10px",border:`1px solid ${BORDER}`,borderRadius:8}}>
          <option value="">{sl(lang,"Toutes procédures","All procedures")}</option>
          {PROCEDURES.map(p=><option key={p}>{p}</option>)}
        </select>
        <select value={fSrc} onChange={e=>setFSrc(e.target.value)} style={{fontSize:12,padding:"5px 10px",border:`1px solid ${BORDER}`,borderRadius:8}}>
          <option value="">{sl(lang,"Toutes sources","All sources")}</option>
          {SOURCES.map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={()=>{setShowArchived(true);loadArchived();}} style={{marginLeft:"auto",fontSize:12,padding:"5px 12px",border:`1px solid ${BORDER}`,borderRadius:8,cursor:"pointer",background:"#fff",color:MUTED}}>
          📦 {sl(lang,"Dossiers archivés","Archived files")}
        </button>
      </div>

      {toast&&<div style={{background:"#D5FFC5",padding:"8px 16px",color:GREEN,fontSize:13,fontWeight:500,borderBottom:`1px solid #97C459`}}>{toast}</div>}
      {err&&<div style={{background:"#FEE2E2",padding:"8px 16px",color:RED,fontSize:13}}>{err}<button onClick={()=>setErr(null)} style={{background:"none",border:"none",cursor:"pointer",marginLeft:8,fontWeight:700}}>×</button></div>}

      {showAlerts&&<AlertsPanel/>}

      {/* LIST VIEW */}
      {view==="list"&&(
        <div style={{background:"#fff"}}>
          {loading?<div style={{padding:40,textAlign:"center",color:MUTED}}>{sl(lang,"Chargement...","Loading...")}</div>
          :filtered.length===0?<div style={{padding:40,textAlign:"center",color:MUTED}}>{sl(lang,"Aucun client trouvé.","No clients found.")}</div>
          :filtered.map((c,i)=>{
            const st=stageOf(c.current_stage);
            const sess=sessions.find(s=>s.client_id===c.id&&s.user_id!==user.id);
            const lu=sess?allUsers.find(u=>u.id===sess.user_id):null;
            const payAlert=c.payment_deadline&&Math.ceil((new Date(c.payment_deadline)-new Date())/(1000*60*60*24))<=16;
            const dp=dpLabel(c);
            return(
              <div key={c.id} onClick={()=>openDossier(c)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",background:i%2===0?"#fff":"#FAFAFA"}}
                onMouseEnter={e=>e.currentTarget.style.background="#EAF3DE"}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#FAFAFA"}>
                <div style={{width:36,height:36,borderRadius:"50%",background:procBg(c.procedure),color:procTx(c.procedure),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,flexShrink:0}}>{initials(c)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:2,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    {c.first_name} {c.last_name}
                    {lu&&<span style={{fontSize:10,background:"#FEF3C7",color:"#92400E",borderRadius:4,padding:"1px 6px"}}>🔒 {lu.first_name}</span>}
                    {payAlert&&<span style={{fontSize:10,background:"#FEE2E2",color:RED,borderRadius:4,padding:"1px 6px"}}>⚠ Paiement</span>}
                    {dp==="sent"&&<span style={{fontSize:10,background:"#FFF7ED",color:"#B45309",borderRadius:4,padding:"1px 6px",fontWeight:700}}>→ DP Surgery</span>}
                    {dp==="received"&&<span style={{fontSize:10,background:"#E1F5EE",color:GREEN,borderRadius:4,padding:"1px 6px",fontWeight:700}}>← Réf. DP</span>}
                  </div>
                  <div style={{fontSize:11,color:MUTED,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    {c.dossier_number&&<span style={{color:TEAL,fontWeight:600}}>{fmtDossier(c)}</span>}
                    <span>·</span><span>{c.procedure}</span><span>·</span><span>{c.source}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                  <span style={{background:st.bg,color:st.tx,borderRadius:20,padding:"3px 9px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{st.id} — {lang==="FR"?st.fr:st.en}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {!c.lprpde_consent&&c.current_stage===8&&<span style={{fontSize:10,color:RED,fontWeight:600}}>⚠ LPRPDE</span>}
                    <span style={{fontSize:10,background:c.language==="FR"?"#DBEAFE":"#FEF3C7",color:c.language==="FR"?"#1E40AF":"#92400E",borderRadius:4,padding:"1px 5px",fontWeight:600}}>{c.language||"FR"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GRID VIEW */}
      {view==="grid"&&(
        <div style={{padding:12,display:"grid",gridTemplateColumns:fStage?"1fr":"repeat(3,1fr)",gap:10}}>
          {gridStages.map(st=>{
            const sc=byStage(st.id);
            return(
              <div key={st.id} style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{background:st.bg,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:st.tx,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{st.id}</div>
                    <span style={{fontSize:12,fontWeight:700,color:st.tx}}>{lang==="FR"?st.fr:st.en}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,background:`${st.tx}22`,color:st.tx,borderRadius:20,padding:"2px 8px"}}>{sc.length}</span>
                </div>
                <div style={{padding:10,minHeight:60}}>
                  {sc.length===0&&<div style={{fontSize:12,color:MUTED,textAlign:"center",padding:"16px 8px"}}>{sl(lang,"Aucun client","No clients")}</div>}
                  {sc.map(c=>{
                    const dp=dpLabel(c);
                    return(
                      <div key={c.id} onClick={()=>openDossier(c)} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 12px",marginBottom:8,cursor:"pointer"}}>
                        <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{c.first_name} {c.last_name}</div>
                        {c.dossier_number&&<div style={{fontSize:11,color:TEAL,fontWeight:700,marginBottom:2}}>{fmtDossier(c)}</div>}
                        <div style={{fontSize:11,color:MUTED}}>{c.procedure}</div>
                        {dp==="sent"&&<div style={{fontSize:10,color:"#B45309",marginTop:3,fontWeight:600}}>→ DP Surgery</div>}
                        {dp==="received"&&<div style={{fontSize:10,color:GREEN,marginTop:3,fontWeight:600}}>← Réf. DP</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
