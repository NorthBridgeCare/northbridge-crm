import{useState,useEffect}from"react";
import{createClient}from"../lib/api";
import{PROCEDURES,SOURCES,PROVINCE_REGIONS,NAVY,TEAL,BG,BORDER,MUTED}from"../lib/constants";
const sl=(l,fr,en)=>l==="FR"?fr:en;
const PROVINCES=["Ontario","Québec","Alberta","Colombie-Britannique","Autre"];
export default function NewClientForm({lang,user,onSave,onCancel}){
  const[f,setF]=useState({first_name:"",last_name:"",email:"",phone:"",language:"FR",province_residence:"Ontario",region:"Ontario",region_custom:"",procedure:"Transplantation capillaire",source:"Instagram",company_prefix:"NB",province_code:"ON",is_transfer_from_dany:false,dany_dossier_number:"",travel_group:"Solo",notes:""});
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const CODES={"Ontario":"ON","Québec":"QC","Alberta":"AB","Colombie-Britannique":"BC","Autre":"CA"};
  useEffect(()=>{
    const regions=PROVINCE_REGIONS[f.province_residence]||["Autre"];
    setF(p=>({...p,province_code:CODES[p.province_residence]||"CA",region:regions[0],region_custom:""}));
  },[f.province_residence]);
  useEffect(()=>{if(f.is_transfer_from_dany)setF(p=>({...p,source:"D Plastic Surgery"}));},[f.is_transfer_from_dany]);
  const regions=PROVINCE_REGIONS[f.province_residence]||["Autre"];
  const save=async()=>{
    if(!f.first_name.trim()||!f.last_name.trim()){setErr(sl(lang,"Prénom et nom obligatoires.","First and last name required."));return;}
    setSaving(true);
    try{
      const data={...f,region:f.region==="Autre"&&f.region_custom.trim()?f.region_custom.trim():f.region,current_stage:1,status:"active"};
      delete data.region_custom;
      const[nc]=await createClient(data);
      onSave(nc);
    }catch(e){setErr(e.message);}
    setSaving(false);
  };
  const S={wrap:{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:BG,minHeight:"100vh",padding:24},card:{maxWidth:720,margin:"0 auto",background:"#fff",borderRadius:14,boxShadow:"0 4px 20px rgba(0,0,0,.08)",overflow:"hidden"},hdr:{background:NAVY,padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"},body:{padding:24},g:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16},lbl:{fontSize:12,fontWeight:600,color:MUTED,display:"block",marginBottom:4},inp:{width:"100%",padding:"9px 12px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box"},sel:{width:"100%",padding:"9px 12px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:14,boxSizing:"border-box"},sec:{fontSize:13,fontWeight:600,color:NAVY,marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${BORDER}`,marginTop:16}};
  return(
    <div style={S.wrap}><div style={S.card}>
      <div style={S.hdr}>
        <div><div style={{color:"#fff",fontWeight:700,fontSize:16}}>{sl(lang,"Nouveau dossier client","New client file")}</div><div style={{color:"#1BC4D8",fontSize:12,marginTop:2}}>{sl(lang,"Étape 1 — Découverte","Stage 1 — Discovery")}</div></div>
        <button onClick={onCancel} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>✕ {sl(lang,"Annuler","Cancel")}</button>
      </div>
      <div style={S.body}>
        {err&&<div style={{background:"#FEE2E2",color:"#991B1B",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:16}}>{err}</div>}
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
          {f.region==="Autre"&&<div><label style={S.lbl}>{sl(lang,"Précisez (ex: Montréal, North Bay)","Specify (e.g. Montreal, North Bay)")}</label><input value={f.region_custom} onChange={e=>set("region_custom",e.target.value)} placeholder={sl(lang,"Montréal, North Bay, Laval...","Montreal, North Bay, Sudbury...")} style={S.inp}/></div>}
          <div><label style={S.lbl}>{sl(lang,"Groupe de voyage","Travel group")}</label><select value={f.travel_group} onChange={e=>set("travel_group",e.target.value)} style={S.sel}><option value="Solo">Solo</option><option value="Groupe NB">Groupe NorthBridge</option><option value="Groupe Dany">Groupe D Plastic Surgery</option><option value="Groupe personnalisé">Groupe personnalisé</option></select></div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,color:NAVY}}>
            <input type="checkbox" checked={f.is_transfer_from_dany} onChange={e=>set("is_transfer_from_dany",e.target.checked)}/>
            {sl(lang,"Dossier transféré de D Plastic Surgery","File transferred from D Plastic Surgery")}
          </label>
          {f.is_transfer_from_dany&&<div style={{marginTop:10}}><label style={S.lbl}>{sl(lang,"Numéro dossier D Plastic Surgery","D Plastic Surgery file #")}</label><input value={f.dany_dossier_number} onChange={e=>set("dany_dossier_number",e.target.value)} placeholder="DP-QC-26-001" style={{...S.inp,maxWidth:280}}/></div>}
        </div>
        <div style={{marginBottom:20}}><label style={S.lbl}>Notes</label><textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={3} style={{...S.inp,resize:"vertical"}}/></div>
        <div style={{background:"#E6F1FB",borderRadius:8,padding:"10px 12px",marginBottom:20,fontSize:12,color:"#0C447C"}}>ℹ️ {sl(lang,`Numéro de dossier généré automatiquement · Documents en ${f.language==="FR"?"Français":"English"}`,`Dossier number auto-generated · Documents in ${f.language==="FR"?"French":"English"}`)}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={save} disabled={saving||!f.first_name.trim()||!f.last_name.trim()} style={{flex:1,background:saving||!f.first_name.trim()?MUTED:TEAL,color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>{saving?"...":sl(lang,"Créer le dossier","Create file")}</button>
          <button onClick={onCancel} style={{background:BG,color:MUTED,border:`1px solid ${BORDER}`,borderRadius:10,padding:"11px 18px",fontSize:14,cursor:"pointer"}}>{sl(lang,"Annuler","Cancel")}</button>
        </div>
      </div>
    </div></div>
  );
}
