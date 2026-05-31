import{useState}from"react";
import{createClient,addAudit}from"../lib/api";
import{PROCEDURES,SOURCES,NAVY,TEAL,BG,BORDER,MUTED}from"../lib/constants";
const sl=(l,fr,en)=>l==="FR"?fr:en;
const PROVINCES=["Ontario","Québec","Alberta","Colombie-Britannique","Autre"];
const REGIONS=["Ontario","Gatineau","Québec","GTA","Autre"];
export default function NewClientForm({lang,user,onSave,onCancel}){
  const[f,setF]=useState({first_name:"",last_name:"",email:"",phone:"",language:"FR",province_residence:"Ontario",region:"Ontario",procedure:"Transplantation capillaire",source:"Instagram",company_prefix:"NB",province_code:"ON",is_transfer_from_dany:false,dany_dossier_number:"",travel_group:"Solo",notes:""});
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const save=async()=>{
    if(!f.first_name.trim()||!f.last_name.trim()){setErr(sl(lang,"Prénom et nom obligatoires.","First name and last name required."));return;}
    setSaving(true);
    try{const[nc]=await createClient({...f,current_stage:1});onSave(nc);}
    catch(e){setErr(e.message);}
    setSaving(false);
  };
  const s={
    wrap:{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:BG,minHeight:"100vh",padding:24},
    card:{maxWidth:720,margin:"0 auto",background:"#fff",borderRadius:14,boxShadow:"0 4px 20px rgba(0,0,0,.08)",overflow:"hidden"},
    hdr:{background:NAVY,padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"},
    body:{padding:24},
    grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14},
    field:{},
    label:{fontSize:12,fontWeight:600,color:MUTED,display:"block",marginBottom:4},
    input:{width:"100%",padding:"9px 12px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box"},
    select:{width:"100%",padding:"9px 12px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,boxSizing:"border-box"},
    btn:{background:TEAL,color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer"},
    btnSec:{background:BG,color:MUTED,border:`1px solid ${BORDER}`,borderRadius:10,padding:"11px 18px",fontSize:14,cursor:"pointer"},
  };
  return(
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.hdr}>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:16}}>{sl(lang,"Nouveau dossier client","New client file")}</div>
            <div style={{color:"#1BC4D8",fontSize:12,marginTop:2}}>{sl(lang,"Étape 1 — Découverte","Stage 1 — Discovery")}</div>
          </div>
          <button onClick={onCancel} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>✕ {sl(lang,"Annuler","Cancel")}</button>
        </div>
        <div style={s.body}>
          {err&&<div style={{background:"#FEE2E2",color:"#991B1B",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:16}}>{err}</div>}
          <div style={{fontSize:13,fontWeight:600,color:NAVY,marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${BORDER}`}}>{sl(lang,"Informations personnelles","Personal information")}</div>
          <div style={s.grid}>
            {[{k:"first_name",l:sl(lang,"Prénom *","First name *"),ph:"Jean"},{k:"last_name",l:sl(lang,"Nom *","Last name *"),ph:"Tremblay"},{k:"email",l:"Email",ph:"jean@email.com"},{k:"phone",l:sl(lang,"Téléphone","Phone"),ph:"+1 514 555 0100"}].map(fd=>(
              <div key={fd.k}><label style={s.label}>{fd.l}</label><input value={f[fd.k]} onChange={e=>set(fd.k,e.target.value)} placeholder={fd.ph} style={s.input}/></div>
            ))}
          </div>
          <div style={{fontSize:13,fontWeight:600,color:NAVY,marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${BORDER}`}}>{sl(lang,"Détails du dossier","File details")}</div>
          <div style={s.grid}>
            <div><label style={s.label}>{sl(lang,"Procédure","Procedure")}</label><select value={f.procedure} onChange={e=>set("procedure",e.target.value)} style={s.select}>{PROCEDURES.map(p=><option key={p}>{p}</option>)}</select></div>
            <div><label style={s.label}>Source</label><select value={f.source} onChange={e=>set("source",e.target.value)} style={s.select}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label style={s.label}>{sl(lang,"Langue client","Client language")}</label><select value={f.language} onChange={e=>set("language",e.target.value)} style={s.select}><option value="FR">Français (FR)</option><option value="EN">English (EN)</option></select></div>
            <div><label style={s.label}>Province</label><select value={f.province_residence} onChange={e=>set("province_residence",e.target.value)} style={s.select}>{PROVINCES.map(p=><option key={p}>{p}</option>)}</select></div>
            <div><label style={s.label}>{sl(lang,"Région","Region")}</label><select value={f.region} onChange={e=>set("region",e.target.value)} style={s.select}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></div>
            <div><label style={s.label}>{sl(lang,"Groupe de voyage","Travel group")}</label><select value={f.travel_group} onChange={e=>set("travel_group",e.target.value)} style={s.select}><option value="Solo">Solo</option><option value="Groupe NB">Groupe NorthBridge</option><option value="Groupe Dany">Groupe Dany</option><option value="Groupe personnalisé">Groupe personnalisé</option></select></div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,color:NAVY}}>
              <input type="checkbox" checked={f.is_transfer_from_dany} onChange={e=>set("is_transfer_from_dany",e.target.checked)}/>
              {sl(lang,"Dossier transféré de D Plastic Surgery (Dany)","File transferred from D Plastic Surgery (Dany)")}
            </label>
            {f.is_transfer_from_dany&&<div style={{marginTop:10}}><label style={s.label}>{sl(lang,"Numéro de dossier Dany","Dany file number")}</label><input value={f.dany_dossier_number} onChange={e=>set("dany_dossier_number",e.target.value)} placeholder="DP-QC-26-001" style={s.input}/></div>}
          </div>
          <div style={{marginBottom:20}}><label style={s.label}>Notes</label><textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={3} style={{...s.input,resize:"vertical"}}/></div>
          <div style={{background:"#E6F1FB",borderRadius:8,padding:"10px 12px",marginBottom:20,fontSize:12,color:"#0C447C"}}>
            ℹ️ {sl(lang,`Numéro de dossier généré automatiquement. Documents envoyés en ${f.language==="FR"?"Français":"English"}.`,`Dossier number generated automatically. Documents sent in ${f.language==="FR"?"French":"English"}.`)}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} disabled={saving||!f.first_name.trim()||!f.last_name.trim()} style={{...s.btn,opacity:saving||!f.first_name.trim()?.6:1,flex:1}}>
              {saving?"...":sl(lang,"Créer le dossier","Create file")}
            </button>
            <button onClick={onCancel} style={s.btnSec}>{sl(lang,"Annuler","Cancel")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
