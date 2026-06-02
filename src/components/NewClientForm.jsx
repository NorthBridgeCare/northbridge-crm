import{useState,useEffect}from"react";
import{createClient}from"../lib/api";
import{PROCEDURES,SOURCES,PROVINCE_REGIONS,PROVINCES,NAVY,TEAL,BG,BORDER,MUTED}from"../lib/constants";
const sl=(l,fr,en)=>l==="FR"?fr:en;

export default function NewClientForm({lang,user,onSave,onCancel}){
  const[f,setF]=useState({
    first_name:"",last_name:"",email:"",phone:"",language:"FR",
    province_residence:"Ontario",region:"GTA",region_custom:"",
    procedure:"Transplantation capillaire",source:"Instagram",
    company_prefix:"NB",province_code:"ON",notes:"",
  });
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const CODES={"Ontario":"ON","Québec":"QC","Autre":"CA"};

  useEffect(()=>{
    const regions=PROVINCE_REGIONS[f.province_residence]||["Autre"];
    setF(p=>({...p,province_code:CODES[p.province_residence]||"CA",region:regions[0],region_custom:""}));
  },[f.province_residence]);

  const isDPSent=f.source==="Envoyé à DP Surgery";
  const isDPReceived=f.source==="D Plastic Surgery";
  const regions=PROVINCE_REGIONS[f.province_residence]||["Autre"];

  const save=async()=>{
    if(!f.first_name.trim()||!f.last_name.trim()){setErr(sl(lang,"Prénom et nom obligatoires.","First and last name required."));return;}
    setSaving(true);
    try{
      const finalRegion=f.region==="Autre"&&f.region_custom.trim()?f.region_custom.trim():f.region;
      const stage=isDPSent?13:1;
      const dpRel=isDPSent?"sent_to_dp":isDPReceived?"received_from_dp":null;
      const data={
        first_name:f.first_name.trim(),last_name:f.last_name.trim(),
        email:f.email.trim(),phone:f.phone.trim(),
        language:f.language,province_residence:f.province_residence,
        region:finalRegion,procedure:f.procedure,source:f.source,
        company_prefix:f.company_prefix,province_code:f.province_code,
        notes:f.notes.trim(),current_stage:stage,status:"active",
        dp_relationship:dpRel,
      };
      const[nc]=await createClient(data);
      onSave(nc);
    }catch(e){setErr(e.message);}
    setSaving(false);
  };

  const S={
    wrap:{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:BG,minHeight:"100vh",padding:24},
    card:{maxWidth:720,margin:"0 auto",background:"#fff",borderRadius:14,boxShadow:"0 4px 20px rgba(0,0,0,.08)",overflow:"hidden"},
    hdr:{background:NAVY,padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"},
    body:{padding:24},
    g:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16},
    lbl:{fontSize:12,fontWeight:600,color:MUTED,display:"block",marginBottom:4},
    inp:{width:"100%",padding:"9px 12px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box"},
    sel:{width:"100%",padding:"9px 12px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,boxSizing:"border-box"},
    sec:{fontSize:13,fontWeight:600,color:NAVY,marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${BORDER}`,marginTop:16},
  };

  return(
    <div style={S.wrap}><div style={S.card}>
      <div style={S.hdr}>
        <div>
          <div style={{color:"#fff",fontWeight:700,fontSize:16}}>{sl(lang,"Nouveau dossier client","New client file")}</div>
          <div style={{color:"#1BC4D8",fontSize:12,marginTop:2}}>
            {isDPSent?sl(lang,"→ Sera envoyé à D Plastic Surgery (Étape 13)","→ Will be sent to D Plastic Surgery (Stage 13)"):sl(lang,"Étape 1 — Découverte","Stage 1 — Discovery")}
          </div>
        </div>
        <button onClick={onCancel} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>✕</button>
      </div>
      <div style={S.body}>
        {err&&<div style={{background:"#FEE2E2",color:"#991B1B",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:16}}>{err}</div>}

        {isDPSent&&(
          <div style={{background:"#FFF7ED",border:"1px solid #FCD34D",borderRadius:8,padding:"10px 14px",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#B45309"}}>🔄 {sl(lang,"Dossier Envoyé à DP Surgery","File Sent to DP Surgery")}</div>
            <div style={{fontSize:11,color:"#92400E",marginTop:4}}>{sl(lang,"Ce dossier sera automatiquement placé à l'étape 13. On envoie les informations au client qui poursuit avec D Plastic Surgery.","This file will automatically go to stage 13. We send info to the client who continues with D Plastic Surgery.")}</div>
          </div>
        )}
        {isDPReceived&&(
          <div style={{background:"#E1F5EE",border:"1px solid #9FE1CB",borderRadius:8,padding:"10px 14px",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#085041"}}>← {sl(lang,"Référence reçue de D Plastic Surgery","Reference received from D Plastic Surgery")}</div>
            <div style={{fontSize:11,color:"#0A7E8C",marginTop:4}}>{sl(lang,"Le numéro de dossier affichera (Réf. DP Surgery) automatiquement.","The dossier number will display (Ref. DP Surgery) automatically.")}</div>
          </div>
        )}

        <div style={S.sec}>{sl(lang,"Informations personnelles","Personal information")}</div>
        <div style={S.g}>
          <div><label style={S.lbl}>{sl(lang,"Prénom *","First name *")}</label><input value={f.first_name} onChange={e=>set("first_name",e.target.value)} placeholder="Jean" style={S.inp}/></div>
          <div><label style={S.lbl}>{sl(lang,"Nom *","Last name *")}</label><input value={f.last_name} onChange={e=>set("last_name",e.target.value)} placeholder="Tremblay" style={S.inp}/></div>
          <div><label style={S.lbl}>Email</label><input value={f.email} onChange={e=>set("email",e.target.value)} placeholder="jean@email.com" type="email" style={S.inp}/></div>
          <div><label style={S.lbl}>{sl(lang,"Téléphone","Phone")}</label><input value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 819 555 0100" style={S.inp}/></div>
        </div>

        <div style={S.sec}>{sl(lang,"Détails du dossier","File details")}</div>
        <div style={S.g}>
          <div><label style={S.lbl}>{sl(lang,"Procédure","Procedure")}</label><select value={f.procedure} onChange={e=>set("procedure",e.target.value)} style={S.sel}>{PROCEDURES.map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label style={S.lbl}>Source</label><select value={f.source} onChange={e=>set("source",e.target.value)} style={S.sel}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={S.lbl}>{sl(lang,"Langue client","Client language")}</label><select value={f.language} onChange={e=>set("language",e.target.value)} style={S.sel}><option value="FR">Français (FR)</option><option value="EN">English (EN)</option></select></div>
          <div><label style={S.lbl}>Province</label><select value={f.province_residence} onChange={e=>set("province_residence",e.target.value)} style={S.sel}>{PROVINCES.map(p=><option key={p}>{p}</option>)}</select></div>
          <div>
            <label style={S.lbl}>{sl(lang,"Région","Region")}</label>
            <select value={f.region} onChange={e=>set("region",e.target.value)} style={S.sel}>{regions.map(r=><option key={r}>{r}</option>)}</select>
          </div>
          {f.region==="Autre"&&<div><label style={S.lbl}>{sl(lang,"Précisez (ex: Montréal, North Bay)","Specify (e.g. Montreal, North Bay)")}</label><input value={f.region_custom} onChange={e=>set("region_custom",e.target.value)} placeholder={sl(lang,"Montréal, North Bay...","Montreal, North Bay...")} style={S.inp}/></div>}
        </div>

        <div style={{marginBottom:20}}><label style={S.lbl}>Notes</label><textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={3} style={{...S.inp,resize:"vertical"}}/></div>

        <div style={{background:"#E6F1FB",borderRadius:8,padding:"10px 12px",marginBottom:20,fontSize:12,color:"#0C447C"}}>
          ℹ️ {sl(lang,`Dossier généré automatiquement · Documents en ${f.language==="FR"?"Français":"English"} · ${isDPSent?"Étape 13 — Envoyé à DP Surgery":"Étape 1 — Découverte"}`,`Dossier auto-generated · Documents in ${f.language==="FR"?"French":"English"} · ${isDPSent?"Stage 13 — Sent to DP Surgery":"Stage 1 — Discovery"}`)}
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={save} disabled={saving||!f.first_name.trim()||!f.last_name.trim()}
            style={{flex:1,background:saving||!f.first_name.trim()?MUTED:isDPSent?"#B45309":TEAL,color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            {saving?"...":isDPSent?sl(lang,"Créer et envoyer à DP Surgery","Create & send to DP Surgery"):sl(lang,"Créer le dossier","Create file")}
          </button>
          <button onClick={onCancel} style={{background:BG,color:MUTED,border:`1px solid ${BORDER}`,borderRadius:10,padding:"11px 18px",fontSize:14,cursor:"pointer"}}>{sl(lang,"Annuler","Cancel")}</button>
        </div>
      </div>
    </div></div>
  );
}
