import{useState,useEffect,useCallback}from"react";
import{getClients,createClient,updateClient,getSessions,lockClient,unlockClient,getUsers,updateUser,addAudit}from"../lib/api";
import{clearSession}from"../lib/auth";
import{STAGES,PROCEDURES,SOURCES,PROC_COLORS,NAVY,TEAL,CYAN,GOLD,BG,BORDER,MUTED}from"../lib/constants";
import ClientDossier from"../components/ClientDossier/index";
import NewClientForm from"../components/NewClientForm";
import UserSettings from"../components/UserSettings";

const sl=(lang,fr,en)=>lang==="FR"?fr:en;
const stageOf=n=>STAGES[n-1]||STAGES[0];
const procBg=p=>(PROC_COLORS[p]||["#E2E8F0","#475569"])[0];
const procTx=p=>(PROC_COLORS[p]||["#E2E8F0","#475569"])[1];
const initials=c=>`${(c.first_name||"")[0]||""}${(c.last_name||"")[0]||""}`.toUpperCase();

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
  const[sessions,setSessions]=useState([]);
  const[allUsers,setAllUsers]=useState([]);
  const[search,setSearch]=useState("");
  const[fStage,setFStage]=useState("");
  const[fProc,setFProc]=useState("");
  const[fSrc,setFSrc]=useState("");
  const[fLprpde,setFLprpde]=useState(false);
  const[err,setErr]=useState(null);

  const fetchAll=useCallback(async()=>{
    try{
      const[a,s,u]=await Promise.all([
        getClients(false),
        getSessions(),
        getUsers(),
      ]);
      setClients(a||[]);
      setSessions(s||[]);
      setAllUsers(u||[]);
    }catch(e){setErr(e.message);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{fetchAll();const i=setInterval(()=>getSessions().then(s=>setSessions(s||[])).catch(()=>{}),30000);return()=>clearInterval(i);},[fetchAll]);

  const toggleLang=async()=>{
    const nl=lang==="FR"?"EN":"FR";
    setLang(nl);
    try{await updateUser(user.id,{lang_pref:nl});}catch{}
  };

  const openDossier=async(client)=>{
    const sess=sessions.find(s=>s.client_id===client.id);
    if(sess&&sess.user_id!==user.id){
      const lu=allUsers.find(u=>u.id===sess.user_id);
      const name=lu?`${lu.first_name}`:"quelqu'un";
      if(!window.confirm(`Ce dossier est en cours d'édition par ${name}. Ouvrir en lecture seule ?`))return;
      setSelected({...client,readOnly:true});
    } else {
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
  };

  const handleUpdate=u=>{
    setClients(prev=>prev.map(c=>c.id===u.id?u:c));
    setSelected(prev=>prev?.id===u.id?{...u,readOnly:prev.readOnly}:prev);
  };

  const handleNew=nc=>{
    setClients(prev=>[nc,...prev]);
    setShowNew(false);
    addAudit(user.id,"CREATE","clients",nc.id,{dossier:nc.dossier_number});
  };

  const handleArchive=async(client)=>{
    await updateClient(client.id,{status:"archived",archived_at:new Date().toISOString(),archived_by:user.id});
    setClients(prev=>prev.filter(c=>c.id!==client.id));
    setSelected(null);
    setSessions(prev=>prev.filter(s=>s.client_id!==client.id));
    try{await unlockClient(client.id);}catch{}
  };

  const filtered=clients.filter(c=>{
    if(search){const q=search.toLowerCase();if(!`${c.first_name} ${c.last_name} ${c.dossier_number||""} ${c.procedure||""}`.toLowerCase().includes(q))return false;}
    if(fStage&&c.current_stage!==parseInt(fStage))return false;
    if(fProc&&c.procedure!==fProc)return false;
    if(fSrc&&c.source!==fSrc)return false;
    if(fLprpde&&c.lprpde_consent)return false;
    return true;
  });

  const byStage=n=>filtered.filter(c=>c.current_stage===n);
  const active=clients.filter(c=>c.current_stage<12).length;
  const confirmed=clients.filter(c=>c.current_stage>=9);
  const revUSD=confirmed.reduce((s,c)=>s+(c.dossier_fee_usd||0),0);
  const conv=clients.length?Math.round(confirmed.length/clients.length*100):0;
  const lmiss=clients.filter(c=>!c.lprpde_consent&&c.current_stage>=2).length;
  const payAlert=clients.filter(c=>{
    if(!c.payment_deadline||c.current_stage<8)return false;
    const d=new Date(c.payment_deadline);
    const diff=Math.ceil((d-new Date())/(1000*60*60*24));
    return diff<=16&&diff>=0;
  }).length;

  if(selected)return(
    <ClientDossier client={selected} user={user} lang={lang} allUsers={allUsers}
      onClose={closeDossier} onUpdate={handleUpdate} onArchive={handleArchive}/>
  );
  if(showNew)return<NewClientForm lang={lang} user={user} onSave={handleNew} onCancel={()=>setShowNew(false)}/>;
  if(showSettings)return<UserSettings lang={lang} user={user} allUsers={allUsers} onBack={()=>setShowSettings(false)} onUsersUpdate={setAllUsers}/>;

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:BG,minHeight:"100vh",color:"#1A1A2E"}}>
      {/* HEADER */}
      <div style={{background:NAVY,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/logo-horizontal.png" alt="NorthBridge" style={{height:26,filter:"brightness(0) invert(1)",opacity:.9}} onError={e=>{e.target.style.display="none";}}/>
          <span style={{color:CYAN,fontSize:10,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",marginLeft:4}}>CRM</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={sl(lang,"Rechercher...","Search...")}
            style={{background:"rgba(255,255,255,.1)",border:"0.5px solid rgba(255,255,255,.15)",borderRadius:8,padding:"5px 10px",color:"#fff",fontSize:12,width:180,outline:"none"}}/>
          <div style={{display:"flex",background:"rgba(255,255,255,.1)",borderRadius:8,overflow:"hidden",border:"0.5px solid rgba(255,255,255,.15)"}}>
            <button onClick={()=>setView("list")} style={{padding:"5px 10px",color:view==="list"?"#fff":"rgba(255,255,255,.4)",background:view==="list"?"rgba(255,255,255,.15)":"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:500}}>
              ☰ {sl(lang,"Liste","List")}
            </button>
            <button onClick={()=>setView("grid")} style={{padding:"5px 10px",color:view==="grid"?"#fff":"rgba(255,255,255,.4)",background:view==="grid"?"rgba(255,255,255,.15)":"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:500}}>
              ⊞ {sl(lang,"Étapes","Stages")}
            </button>
          </div>
          <button onClick={()=>setShowNew(true)} style={{background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            + {sl(lang,"Nouveau client","New client")}
          </button>
          <button onClick={toggleLang} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            {lang==="FR"?"EN":"FR"}
          </button>
          <div onClick={()=>setShowSettings(true)} style={{width:30,height:30,borderRadius:"50%",background:GOLD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:NAVY,cursor:"pointer"}}>
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <button onClick={()=>{clearSession();onLogout();}} style={{background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.5)",border:"none",borderRadius:8,padding:"5px 8px",fontSize:11,cursor:"pointer"}} title="Déconnexion">⏻</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{background:"#fff",borderBottom:`1px solid ${BORDER}`,padding:"10px 16px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        {[
          {l:sl(lang,"Clients actifs","Active clients"),v:active,c:TEAL},
          {l:sl(lang,"Total pipeline","Total pipeline"),v:clients.length,c:NAVY},
          {l:sl(lang,"Taux conversion","Conv. rate"),v:`${conv}%`,c:GREEN},
          {l:sl(lang,"Revenus USD","Revenue USD"),v:`${revUSD.toLocaleString()} $`,c:GOLD},
          {l:sl(lang,"Alertes paiement","Payment alerts"),v:payAlert+lmiss,c:(payAlert+lmiss)>0?RED:GREEN},
        ].map((st,i)=>(
          <div key={i} style={{background:BG,borderRadius:8,padding:"8px 12px"}}>
            <div style={{fontSize:11,color:MUTED,marginBottom:2}}>{st.l}</div>
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
        <label style={{fontSize:12,color:MUTED,display:"flex",alignItems:"center",gap:5,cursor:"pointer",marginLeft:"auto"}}>
          <input type="checkbox" checked={fLprpde} onChange={e=>setFLprpde(e.target.checked)}/>
          LPRPDE {sl(lang,"manquant","missing")}
        </label>
        <button onClick={()=>setShowArchived(v=>!v)} style={{fontSize:12,padding:"5px 10px",border:`1px solid ${BORDER}`,borderRadius:8,cursor:"pointer",background:showArchived?"#FEF3C7":"#fff",color:showArchived?"#92400E":MUTED}}>
          📦 {sl(lang,"Archivés","Archived")} ({archived.length})
        </button>
      </div>

      {err&&<div style={{background:"#FEE2E2",padding:"8px 16px",color:RED,fontSize:13}}>⚠️ {err}<button onClick={()=>setErr(null)} style={{background:"none",border:"none",cursor:"pointer",marginLeft:8,fontWeight:700}}>×</button></div>}

      {/* LIST VIEW */}
      {view==="list"&&(
        <div style={{background:"#fff"}}>
          {loading?<div style={{padding:40,textAlign:"center",color:MUTED}}>{sl(lang,"Chargement...","Loading...")}</div>
          :filtered.length===0?<div style={{padding:40,textAlign:"center",color:MUTED}}>{sl(lang,"Aucun client trouvé.","No clients found.")}</div>
          :filtered.map((c,i)=>{
            const st=stageOf(c.current_stage);
            const sess=sessions.find(s=>s.client_id===c.id&&s.user_id!==user.id);
            const lu=sess?allUsers.find(u=>u.id===sess.user_id):null;
            const payPending=c.payment_deadline&&c.current_stage===8&&Math.ceil((new Date(c.payment_deadline)-new Date())/(1000*60*60*24))<=16;
            return(
              <div key={c.id} onClick={()=>openDossier(c)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",background:i%2===0?"#fff":"#FAFAFA",transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#EAF3DE"}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#FAFAFA"}>
                <div style={{width:36,height:36,borderRadius:"50%",background:procBg(c.procedure),color:procTx(c.procedure),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,flexShrink:0}}>
                  {initials(c)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:2,display:"flex",alignItems:"center",gap:8}}>
                    {c.first_name} {c.last_name}
                    {lu&&<span style={{fontSize:10,background:"#FEF3C7",color:"#92400E",borderRadius:4,padding:"1px 6px"}}>🔒 {lu.first_name}</span>}
                    {payPending&&<span style={{fontSize:10,background:"#FEE2E2",color:RED,borderRadius:4,padding:"1px 6px"}}>⚠ Paiement J-{Math.ceil((new Date(c.payment_deadline)-new Date())/(1000*60*60*24))}</span>}
                  </div>
                  <div style={{fontSize:11,color:MUTED,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    {c.dossier_number&&<span style={{color:TEAL,fontWeight:600}}>{c.dossier_number}</span>}
                    {c.dossier_number&&<span style={{width:3,height:3,borderRadius:"50%",background:BORDER,display:"inline-block"}}/>}
                    <span>{c.procedure}</span>
                    <span style={{width:3,height:3,borderRadius:"50%",background:BORDER,display:"inline-block"}}/>
                    <span>{c.source}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                  <span style={{background:st.bg,color:st.tx,borderRadius:20,padding:"3px 9px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                    {st.id} — {lang==="FR"?st.fr:st.en}
                  </span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {!c.lprpde_consent&&c.current_stage>=2&&<span style={{fontSize:10,color:"#A32D2D",fontWeight:600}}>⚠ LPRPDE</span>}
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
        <div style={{padding:12,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {STAGES.map(st=>{
            const sc=byStage(st.id);
            return(
              <div key={st.id} style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{background:st.bg,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:st.tx,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{st.id}</div>
                    <span style={{fontSize:11,fontWeight:700,color:st.tx}}>{lang==="FR"?st.fr:st.en}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,background:`${st.tx}22`,color:st.tx,borderRadius:20,padding:"1px 8px"}}>{sc.length}</span>
                </div>
                <div style={{padding:8}}>
                  {sc.length===0&&<div style={{fontSize:11,color:MUTED,textAlign:"center",padding:"10px 8px"}}>{sl(lang,"Aucun client","No clients")}</div>}
                  {sc.map(c=>(
                    <div key={c.id} onClick={()=>openDossier(c)} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:8,padding:"8px 10px",marginBottom:6,cursor:"pointer"}}>
                      <div style={{fontSize:12,fontWeight:600,marginBottom:2}}>{c.first_name} {c.last_name}</div>
                      {c.dossier_number&&<div style={{fontSize:10,color:TEAL,fontWeight:700,marginBottom:2}}>{c.dossier_number}</div>}
                      <div style={{fontSize:10,color:MUTED}}>{c.procedure}</div>
                      {!c.lprpde_consent&&c.current_stage>=2&&<div style={{fontSize:9,color:"#A32D2D",marginTop:3,fontWeight:600}}>⚠ LPRPDE requis</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
