import{useState,useEffect,useRef}from"react";
import{updateClient,getPayments,createPayment,updatePayment,getDocuments,getAuditLog,addAudit}from"../../lib/api";
import{STAGES,PROCEDURES,SOURCES,PROVINCE_REGIONS,NAVY,TEAL,GOLD,BG,BORDER,MUTED,GREEN,RED}from"../../lib/constants";
const sl=(l,fr,en)=>l==="FR"?fr:en;
const stageOf=n=>STAGES[n-1]||STAGES[0];
const PROVINCES=["Ontario","Québec","Alberta","Colombie-Britannique","Autre"];
const fmtPhone=p=>{if(!p)return"—";const d=p.replace(/\D/g,"");if(d.length===10)return`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;if(d.length===11&&d[0]==="1")return`+1 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;return p;};
const TABS=[{id:"info",fr:"Informations",en:"Information"},{id:"pay",fr:"Paiements",en:"Payments"},{id:"forms",fr:"Formulaires",en:"Forms"},{id:"docs",fr:"Documents",en:"Documents"},{id:"photos",fr:"Photos",en:"Photos"},{id:"log",fr:"Journal",en:"Log"}];
const PHOTO_ANGLES={"Transplantation capillaire":["Face","Profil gauche","Profil droit","Dessus","Arrière","Zone frontale","Zone donneuse"],"Rhinoplastie":["Face","Profil gauche","Profil droit","3/4 gauche","3/4 droit","Vue dessous","Sourire"],"Augmentation mammaire":["Face","Profil gauche","Profil droit","3/4 gauche","3/4 droit"],"LipoHD Vaser":["Face debout","Profil gauche","Profil droit","Dos","Zone ciblée"],"Chirurgie obésité":["Face","Profil gauche","Profil droit","Dos"],"Soins dentaires":["Sourire face","Dents ouvertes","Profil sourire","Radio panoramique"]};

function WA({client,lang}){
  const cl=client.language||"FR";const dos=client.dossier_number||"—";const n=client.first_name;
  const M={
    welcome:{fr:`Bonjour ${n} 👋\n\nMerci de nous avoir contactés ! Votre dossier NorthBridge : *${dos}*\n\nRéservez votre consultation ici :\n📅 [LIEN BOOKINGS]\n🌐 northbridgemedicalcare.ca\n\n_NorthBridge Medical Care Travel_\n📞 613.366.9941`,en:`Hello ${n} 👋\n\nThank you for contacting us! Your NorthBridge file: *${dos}*\n\nBook your consultation here:\n📅 [BOOKINGS LINK]\n🌐 northbridgemedicalcare.ca\n\n_NorthBridge Medical Care Travel_\n📞 613.366.9941`},
    photos:{fr:`Bonjour ${n},\n\nPour préparer votre devis personnalisé, envoyez vos photos via :\n\n📤 Upload : [LIEN UPLOAD]\n📧 contact@northbridgemedicalcare.ca\n📱 WhatsApp : 613.366.9941\n\nRéférence : *${dos}*\n\n_NorthBridge Medical Care Travel_`,en:`Hello ${n},\n\nTo prepare your quote, please send photos via:\n\n📤 Upload: [UPLOAD LINK]\n📧 contact@northbridgemedicalcare.ca\n📱 WhatsApp: 613.366.9941\n\nReference: *${dos}*\n\n_NorthBridge Medical Care Travel_`},
    quote:{fr:`Bonjour ${n},\n\nVotre devis personnalisé est prêt ! 🎉\nDossier : *${dos}*\n\nRéservez votre 2e consultation (60 min) :\n📅 [LIEN BOOKINGS]\n\nSans nouvelles dans 7 jours, nous ferons un suivi.\n\n_NorthBridge Medical Care Travel_\n📞 613.366.9941`,en:`Hello ${n},\n\nYour personalized quote is ready! 🎉\nFile: *${dos}*\n\nBook your 2nd consultation (60 min):\n📅 [BOOKINGS LINK]\n\nWe'll follow up in 7 days if we don't hear from you.\n\n_NorthBridge Medical Care Travel_\n📞 613.366.9941`},
    ticket:{fr:`Bonjour ${n},\n\nExcellente nouvelle ! 🎊 Confirmez-nous l'achat de votre billet et partagez-le via :\n\n📤 Upload : [LIEN UPLOAD]\n📧 contact@northbridgemedicalcare.ca\n📱 WhatsApp : 613.366.9941\n\nDossier : *${dos}*\n\nÀ réception, nous vous enverrons le formulaire médical.\n\n_NorthBridge Medical Care Travel_`,en:`Hello ${n},\n\nExcellent news! 🎊 Please confirm your ticket purchase and share it via:\n\n📤 Upload: [UPLOAD LINK]\n📧 contact@northbridgemedicalcare.ca\n📱 WhatsApp: 613.366.9941\n\nFile: *${dos}*\n\nOnce received, we'll send your medical form.\n\n_NorthBridge Medical Care Travel_`},
    payment:{fr:`Bonjour ${n},\n\nVotre premier versement de *[MONTANT] USD* est maintenant dû.\n\nOptions de paiement :\n💳 Stripe : [LIEN STRIPE]\n🔄 Interac e-transfer : demande envoyée\n\n📋 Référence obligatoire : *${dos}*\n⚠️ Frais de conversion : 3% applicables\n\n⏰ Délai : 30 jours. Un rappel sera envoyé à J+16.\n\n_NorthBridge Medical Care Travel_\n📞 613.366.9941`,en:`Hello ${n},\n\nYour first payment of *[AMOUNT] USD* is now due.\n\nPayment options:\n💳 Stripe: [STRIPE LINK]\n🔄 Interac e-transfer: request sent\n\n📋 Mandatory reference: *${dos}*\n⚠️ Conversion fee: 3% applies\n\n⏰ Deadline: 30 days. Reminder at J+16.\n\n_NorthBridge Medical Care Travel_\n📞 613.366.9941`},
  };
  const KEYS=["welcome","photos","quote","ticket","payment"];
  const LABS={fr:["Bienvenue","Demande photos","Envoi devis","Achat billet","Paiement"],en:["Welcome","Photo request","Quote","Ticket purchase","Payment"]};
  const[cp,setCp]=useState(null);
  const copy=(k,txt)=>{navigator.clipboard.writeText(txt).catch(()=>{});setCp(k);setTimeout(()=>setCp(null),2000);};
  return(
    <div>
      <div style={{background:"#E1F5EE",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:"#085041"}}>
        📱 {sl(lang,"Messages en","Messages in")} <strong>{cl==="FR"?"Français":"English"}</strong>
      </div>
      {KEYS.map((k,i)=>(
        <div key={k} style={{border:"1px solid #C0DD97",borderRadius:10,padding:12,marginBottom:10,background:"#F0FFF4"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:700,color:"#3B6D11"}}>{cl==="FR"?LABS.fr[i]:LABS.en[i]}</div>
            <button onClick={()=>copy(k,cl==="FR"?M[k].fr:M[k].en)} style={{background:cp===k?"#3B6D11":"#83C365",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{cp===k?"✓ Copié !":"Copier"}</button>
          </div>
          <div style={{fontSize:11,fontFamily:"monospace",color:"#1B5E20",background:"#fff",borderRadius:7,padding:9,lineHeight:1.8,whiteSpace:"pre-line",border:"0.5px solid #C0DD97"}}>{cl==="FR"?M[k].fr:M[k].en}</div>
        </div>
      ))}
    </div>
  );
}

export default function ClientDossier({client,user,lang,allUsers,onClose,onUpdate,onArchive}){
  const[tab,setTab]=useState("info");
  const[stage,setStage]=useState(client.current_stage);
  const[stageSaving,setStageSaving]=useState(false);
  const[stageMsg,setStageMsg]=useState("");
  const[payments,setPayments]=useState([]);
  const[docs,setDocs]=useState([]);
  const[log,setLog]=useState([]);
  const[saving,setSaving]=useState(false);
  const[showPayForm,setShowPayForm]=useState(false);
  const[newPay,setNewPay]=useState({amount_usd:"",rate:"",direction:"nb_demande",method:"e-transfer"});
  const[editingBase,setEditingBase]=useState(false);
  const[baseEdits,setBaseEdits]=useState({procedure:client.procedure,source:client.source,province_residence:client.province_residence,region:client.region});
  const[regionCustom,setRegionCustom]=useState("");

  useEffect(()=>{
    if(tab==="pay")getPayments(client.id).then(d=>setPayments(d||[])).catch(()=>{});
    if(tab==="docs")getDocuments(client.id).then(d=>setDocs(d||[])).catch(()=>{});
    if(tab==="log")getAuditLog(client.id).then(d=>setLog(d||[])).catch(()=>{});
  },[tab,client.id]);

  const updateStage=async n=>{
    if(client.readOnly||stageSaving)return;
    const ns=parseInt(n);
    const prev=stage;
    setStage(ns);setStageSaving(true);setStageMsg("");
    try{
      await updateClient(client.id,{current_stage:ns});
      onUpdate({...client,current_stage:ns});
      setStageMsg(sl(lang,"✓ Étape sauvegardée","✓ Stage saved"));
      setTimeout(()=>setStageMsg(""),3000);
      try{addAudit(user.id,"STAGE_CHANGE","clients",client.id,{from:prev,to:ns});}catch{}
    }catch(e){
      setStage(prev);
      setStageMsg("⚠ "+e.message);
    }
    setStageSaving(false);
  };

  const saveBaseEdits=async()=>{
    const data={...baseEdits,region:baseEdits.region==="Autre"&&regionCustom.trim()?regionCustom.trim():baseEdits.region};
    await updateClient(client.id,data);
    onUpdate({...client,...data});
    setEditingBase(false);
  };

  const toggleField=async(field,dateField)=>{
    if(client.readOnly)return;
    const val=!client[field];
    const update={[field]:val};
    if(dateField)update[dateField]=val?new Date().toISOString():null;
    try{await updateClient(client.id,update);onUpdate({...client,...update});}
    catch(e){alert("Erreur: "+e.message);}
  };

  const savePay=async()=>{
    setSaving(true);
    try{
      const usd=parseFloat(newPay.amount_usd)||0;
      const rate=parseFloat(newPay.rate)||1;
      const cad=+(usd*rate).toFixed(2);
      const deadline=new Date(Date.now()+30*24*60*60*1000).toISOString().split("T")[0];
      const[saved]=await createPayment({client_id:client.id,amount_usd:usd,amount_cad:cad,currency_conversion_rate:rate,conversion_fee_pct:3,direction:newPay.direction,method:newPay.method,dossier_ref:client.dossier_number||"",status:"pending",created_by:user.id});
      await updateClient(client.id,{payment_request_sent:true,payment_request_sent_at:new Date().toISOString(),payment_deadline:deadline});
      setPayments(prev=>[saved,...prev]);
      onUpdate({...client,payment_request_sent:true,payment_deadline:deadline});
      setShowPayForm(false);setNewPay({amount_usd:"",rate:"",direction:"nb_demande",method:"e-transfer"});
    }catch(e){alert("Erreur: "+e.message);}
    setSaving(false);
  };

  const cl=client.language||"FR";
  const st=stageOf(stage);
  const nextSt=STAGES[stage];
  const photos=PHOTO_ANGLES[client.procedure]||[];
  const payDeadline=client.payment_deadline?new Date(client.payment_deadline):null;
  const daysLeft=payDeadline?Math.ceil((payDeadline-new Date())/(1000*60*60*24)):null;
  const card={background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,padding:"16px 20px",marginBottom:12};
  const fBox={background:BG,borderRadius:7,padding:"8px 10px"};
  const availRegions=PROVINCE_REGIONS[baseEdits.province_residence]||["Autre"];

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",minHeight:"100vh",background:BG,color:"#1A1A2E"}}>
      {/* FULL SCREEN HEADER */}
      <div style={{background:NAVY,padding:"0 20px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.12)",color:"#fff",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>← {sl(lang,"Retour","Back")}</button>
          <div style={{width:1,height:24,background:"rgba(255,255,255,.2)"}}/>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:15}}>{client.first_name} {client.last_name}</div>
            <div style={{color:"#1BC4D8",fontSize:11,fontWeight:600}}>{client.dossier_number||"—"} {client.readOnly?`· 👁 ${sl(lang,"Lecture seule","Read only")}`:`· ✏️ ${sl(lang,"En édition","Editing")}`}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{background:st.bg,color:st.tx,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>{st.id} — {lang==="FR"?st.fr:st.en}</span>
          <span style={{fontSize:11,background:cl==="FR"?"#DBEAFE":"#FEF3C7",color:cl==="FR"?"#1E40AF":"#92400E",borderRadius:4,padding:"3px 8px",fontWeight:600}}>{cl}</span>
          {!client.readOnly&&user.role==="super_admin"&&(
            <button onClick={()=>{if(window.confirm(sl(lang,"Archiver ce dossier ?","Archive this file?")))onArchive(client);}} style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.7)",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>
              📦 {sl(lang,"Archiver","Archive")}
            </button>
          )}
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:20}}>
        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>

          {/* LEFT SIDEBAR */}
          <div>
            {/* Stage selector */}
            <div style={card}>
              <div style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>{sl(lang,"Étape du pipeline","Pipeline stage")}</div>
              <select value={stage} onChange={e=>updateStage(e.target.value)} disabled={client.readOnly||stageSaving}
                style={{width:"100%",padding:"8px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,fontWeight:600,color:NAVY,background:client.readOnly?"#F9FAFB":"#fff"}}>
                {STAGES.map(s=><option key={s.id} value={s.id}>{s.id}. {lang==="FR"?s.fr:s.en}</option>)}
              </select>
              {stageMsg&&<div style={{fontSize:11,marginTop:6,padding:"4px 8px",borderRadius:6,background:stageMsg.startsWith("✓")?"#D5FFC5":"#FEE2E2",color:stageMsg.startsWith("✓")?GREEN:RED}}>{stageMsg}</div>}
              {!client.readOnly&&nextSt&&(
                <button onClick={()=>updateStage(stage+1)} disabled={stageSaving}
                  style={{marginTop:10,width:"100%",background:stageSaving?MUTED:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {stageSaving?sl(lang,"Sauvegarde...","Saving..."):`→ ${lang==="FR"?nextSt.fr:nextSt.en}`}
                </button>
              )}
            </div>

            {/* Quick info + edit base at stage 1 */}
            <div style={card}>
              <div style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:".05em",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {sl(lang,"Résumé","Summary")}
                {stage===1&&!client.readOnly&&!editingBase&&<button onClick={()=>setEditingBase(true)} style={{fontSize:10,background:"#E1F5EE",color:TEAL,border:"none",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontWeight:600}}>✏️ {sl(lang,"Modifier","Edit")}</button>}
              </div>
              {editingBase?(
                <div>
                  <div style={{marginBottom:8}}>
                    <label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>{sl(lang,"Procédure","Procedure")}</label>
                    <select value={baseEdits.procedure} onChange={e=>setBaseEdits(p=>({...p,procedure:e.target.value}))} style={{width:"100%",fontSize:12,padding:"6px 8px",border:`1px solid ${BORDER}`,borderRadius:6}}>
                      {PROCEDURES.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>Source</label>
                    <select value={baseEdits.source} onChange={e=>setBaseEdits(p=>({...p,source:e.target.value}))} style={{width:"100%",fontSize:12,padding:"6px 8px",border:`1px solid ${BORDER}`,borderRadius:6}}>
                      {SOURCES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>Province</label>
                    <select value={baseEdits.province_residence} onChange={e=>setBaseEdits(p=>({...p,province_residence:e.target.value,region:PROVINCE_REGIONS[e.target.value]?.[0]||"Autre"}))} style={{width:"100%",fontSize:12,padding:"6px 8px",border:`1px solid ${BORDER}`,borderRadius:6}}>
                      {["Ontario","Québec","Alberta","Colombie-Britannique","Autre"].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:8}}>
                    <label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>{sl(lang,"Région","Region")}</label>
                    <select value={baseEdits.region} onChange={e=>setBaseEdits(p=>({...p,region:e.target.value}))} style={{width:"100%",fontSize:12,padding:"6px 8px",border:`1px solid ${BORDER}`,borderRadius:6}}>
                      {availRegions.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  {baseEdits.region==="Autre"&&<div style={{marginBottom:8}}><label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>{sl(lang,"Précisez","Specify")}</label><input value={regionCustom} onChange={e=>setRegionCustom(e.target.value)} placeholder="Montréal, North Bay..." style={{width:"100%",fontSize:12,padding:"6px 8px",border:`1px solid ${BORDER}`,borderRadius:6,boxSizing:"border-box"}}/></div>}
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    <button onClick={saveBaseEdits} style={{flex:1,background:TEAL,color:"#fff",border:"none",borderRadius:7,padding:"7px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{sl(lang,"Sauvegarder","Save")}</button>
                    <button onClick={()=>setEditingBase(false)} style={{background:BG,color:MUTED,border:`1px solid ${BORDER}`,borderRadius:7,padding:"7px 10px",fontSize:12,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
              ):(
                <div>
                  {[
                    {l:"Email",v:client.email||"—"},
                    {l:sl(lang,"Téléphone","Phone"),v:fmtPhone(client.phone)},
                    {l:sl(lang,"Procédure","Procedure"),v:client.procedure||"—"},
                    {l:"Source",v:client.source||"—"},
                    {l:"Province",v:client.province_residence||"—"},
                    {l:sl(lang,"Région","Region"),v:client.region||"—"},
                    ...(client.is_transfer_from_dany&&client.dany_dossier_number?[{l:"Dossier DP",v:client.dany_dossier_number}]:[]),
                  ].map((f,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${BORDER}`,fontSize:12}}>
                      <span style={{color:MUTED,flexShrink:0}}>{f.l}</span>
                      <span style={{fontWeight:600,color:"#1A1A2E",maxWidth:150,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compliance — LPRPDE + médical ensemble, waiver sur facture */}
            <div style={card}>
              <div style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:".05em",marginBottom:10}}>Conformité</div>
              
              {/* LPRPDE + Formulaire médical — toujours groupés */}
              <div style={{background:client.lprpde_consent&&client.medical_form_signed?"#D5FFC5":(client.lprpde_consent||client.medical_form_signed?"#FEF3C7":"#FEE2E2"),border:`1px solid ${client.lprpde_consent&&client.medical_form_signed?"#97C459":(client.lprpde_consent||client.medical_form_signed?"#FCD34D":"#F09595")}`,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:NAVY,marginBottom:8}}>🩺 {sl(lang,"Formulaire médical + LPRPDE","Medical Form + PIPEDA")}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:12,color:MUTED}}>LPRPDE</span>
                  {client.lprpde_consent
                    ?<span style={{fontSize:12,color:GREEN,fontWeight:700}}>✓ {sl(lang,"Signé","Signed")}</span>
                    :!client.readOnly
                      ?<button onClick={()=>toggleField("lprpde_consent","lprpde_consent_date")} style={{fontSize:10,background:"#FEF3C7",color:"#92400E",border:"1px solid #FCD34D",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontWeight:600}}>Marquer ✓</button>
                      :<span style={{fontSize:11,color:RED,fontWeight:600}}>✗ {sl(lang,"Requis","Required")}</span>
                  }
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:MUTED}}>{sl(lang,"Formulaire médical","Medical form")}</span>
                  {client.medical_form_signed
                    ?<span style={{fontSize:12,color:GREEN,fontWeight:700}}>✓ {sl(lang,"Signé","Signed")}</span>
                    :<span style={{fontSize:12,color:RED,fontWeight:600}}>✗ {sl(lang,"En attente","Pending")}</span>
                  }
                </div>
                {client.medical_form_signed_at&&<div style={{fontSize:10,color:MUTED,marginTop:4}}>{new Date(client.medical_form_signed_at).toLocaleDateString(lang==="FR"?"fr-CA":"en-CA")}</div>}
              </div>

              {/* Service Agreement */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}>
                <span style={{fontSize:12,color:MUTED}}>Service Agreement</span>
                {client.service_agreement_signed
                  ?<span style={{fontSize:12,color:GREEN,fontWeight:700}}>✓ {sl(lang,"Signé","Signed")}</span>
                  :<span style={{fontSize:12,color:RED,fontWeight:600}}>✗ {sl(lang,"Requis","Required")}</span>
                }
              </div>

              <div style={{fontSize:10,color:MUTED,marginTop:8,fontStyle:"italic"}}>* {sl(lang,"Waiver inclus automatiquement sur la facture client","Waiver automatically included on client invoice")}</div>
            </div>

            {/* Payment status */}
            {client.payment_deadline&&(
              <div style={{...card,background:daysLeft<=7?"#FEE2E2":daysLeft<=16?"#FEF3C7":"#D5FFC5",border:`1px solid ${daysLeft<=7?"#F09595":daysLeft<=16?"#FAC775":"#97C459"}`}}>
                <div style={{fontSize:12,fontWeight:700,color:daysLeft<=7?RED:daysLeft<=16?"#633806":GREEN}}>
                  💳 {sl(lang,"Paiement dû","Payment due")}<br/>
                  <span style={{fontSize:14}}>{payDeadline?.toLocaleDateString(lang==="FR"?"fr-CA":"en-CA")}</span>
                </div>
                {daysLeft!==null&&<div style={{fontSize:11,marginTop:4,color:daysLeft<=7?RED:daysLeft<=16?"#633806":GREEN}}>{daysLeft>0?`J-${daysLeft}`:sl(lang,"⚠ En retard !","⚠ Overdue!")}</div>}
              </div>
            )}
          </div>

          {/* RIGHT MAIN */}
          <div>
            {/* Tabs */}
            <div style={{display:"flex",background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden",marginBottom:16}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{flex:1,padding:"11px 8px",border:"none",borderBottom:tab===t.id?`2px solid ${TEAL}`:"2px solid transparent",background:"transparent",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:400,color:tab===t.id?TEAL:MUTED}}>
                  {lang==="FR"?t.fr:t.en}
                </button>
              ))}
            </div>

            {/* INFO TAB */}
            {tab==="info"&&(
              <div>
                {client.current_stage>=6&&(
                  <div style={card}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>🏥 {sl(lang,"Date de chirurgie","Surgery date")}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div>
                        <label style={{fontSize:12,color:MUTED,display:"block",marginBottom:4}}>{sl(lang,"Date proposée","Proposed date")}</label>
                        <input type="date" defaultValue={client.surgery_date||""} disabled={client.readOnly}
                          onBlur={e=>{if(e.target.value){updateClient(client.id,{surgery_date:e.target.value}).then(()=>onUpdate({...client,surgery_date:e.target.value})).catch(()=>{});}}}
                          style={{width:"100%",padding:"8px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13}}/>
                      </div>
                      <div style={fBox}>
                        <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{sl(lang,"Statut","Status")}</div>
                        <div style={{fontSize:13,fontWeight:600,color:client.surgery_date_confirmed?GREEN:MUTED}}>{client.surgery_date_confirmed?sl(lang,"✓ Confirmée","✓ Confirmed"):sl(lang,"En attente","Pending")}</div>
                      </div>
                    </div>
                  </div>
                )}
                {client.flight_arrival_number&&(
                  <div style={card}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>✈️ {sl(lang,"Informations de vol","Flight information")}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><div style={{fontSize:11,color:MUTED,fontWeight:600,marginBottom:4}}>🛬 {sl(lang,"Arrivée Istanbul","Arrival Istanbul")}</div><div style={{fontSize:13,fontWeight:600}}>{client.flight_arrival_number}</div><div style={{fontSize:12,color:MUTED}}>{client.flight_arrival_date}</div></div>
                      <div><div style={{fontSize:11,color:MUTED,fontWeight:600,marginBottom:4}}>🛫 {sl(lang,"Départ Istanbul","Departure Istanbul")}</div><div style={{fontSize:13,fontWeight:600}}>{client.flight_departure_number||"—"}</div><div style={{fontSize:12,color:MUTED}}>{client.flight_departure_date||""}</div></div>
                    </div>
                  </div>
                )}
                {client.notes&&(
                  <div style={{...card,borderLeft:`3px solid ${TEAL}`,borderRadius:"0 12px 12px 0"}}>
                    <div style={{fontSize:11,fontWeight:700,color:NAVY,marginBottom:6}}>Notes</div>
                    <div style={{fontSize:13,color:MUTED,lineHeight:1.6}}>{client.notes}</div>
                  </div>
                )}
                {client.current_stage===11&&(
                  <div style={card}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>🔄 {sl(lang,"Suivis post-opératoires","Post-op follow-ups")}</div>
                    {[{l:"J+7",f:"followup_7_sent"},{l:"J+14",f:"followup_14_sent"},{l:"J+30",f:"followup_30_sent"}].map(fu=>(
                      <div key={fu.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}>
                        <span style={{fontSize:13,fontWeight:600}}>{sl(lang,"Suivi","Follow-up")} {fu.l}</span>
                        {client[fu.f]
                          ?<span style={{color:GREEN,fontSize:12,fontWeight:600}}>✓ {sl(lang,"Envoyé","Sent")}</span>
                          :!client.readOnly&&<button onClick={()=>toggleField(fu.f,null).then(()=>onUpdate({...client,[fu.f]:true}))} style={{fontSize:11,background:"#E1F5EE",color:"#085041",border:"1px solid #9FE1CB",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:600}}>{sl(lang,"Marquer envoyé","Mark sent")}</button>
                        }
                      </div>
                    ))}
                  </div>
                )}
                <div style={card}>
                  <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>📱 WhatsApp</div>
                  <WA client={client} lang={lang}/>
                </div>
              </div>
            )}

            {/* PAYMENTS TAB */}
            {tab==="pay"&&(
              <div>
                <div style={{...card,background:"#E6F1FB",border:"1px solid #B5D4F4"}}>
                  <div style={{fontSize:12,color:"#0C447C",fontWeight:600,marginBottom:4}}>⚠️ {sl(lang,"Règle importante","Important rule")}</div>
                  <div style={{fontSize:12,color:"#185FA5",lineHeight:1.6}}>{sl(lang,`Référence obligatoire : ${client.dossier_number}. Premier versement seulement après réception du billet d'avion confirmé.`,`Mandatory reference: ${client.dossier_number}. First payment only after confirmed flight ticket received.`)}</div>
                </div>
                {payments.map((p,i)=>(
                  <div key={p.id||i} style={{...card,borderLeft:`3px solid ${p.status==="received"?GREEN:GOLD}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:700}}>{p.amount_usd} USD</span>
                      <span style={{fontSize:11,background:p.status==="received"?"#D5FFC5":"#FEF3C7",color:p.status==="received"?GREEN:"#92400E",borderRadius:20,padding:"2px 8px",fontWeight:600}}>{p.status==="received"?sl(lang,"✓ Reçu","✓ Received"):sl(lang,"⏳ En attente","⏳ Pending")}</span>
                    </div>
                    {p.amount_cad&&<div style={{fontSize:12,color:MUTED}}>≈ {parseFloat(p.amount_cad).toFixed(2)} CAD · Taux {p.currency_conversion_rate} · +3%</div>}
                    <div style={{fontSize:11,color:MUTED,marginTop:4}}>{p.direction==="nb_demande"?sl(lang,"📤 NB a envoyé la demande","📤 NB sent the request"):sl(lang,"📥 Client a envoyé","📥 Client sent")} · {p.method}</div>
                    <div style={{fontSize:10,color:TEAL,marginTop:4,fontWeight:600}}>Réf: {p.dossier_ref||client.dossier_number}</div>
                    {p.status==="pending"&&!client.readOnly&&(
                      <button onClick={()=>updatePayment(p.id,{status:"received",received_date:new Date().toISOString().split("T")[0]}).then(()=>setPayments(prev=>prev.map(x=>x.id===p.id?{...x,status:"received"}:x)))} style={{marginTop:8,fontSize:11,background:"#D5FFC5",color:GREEN,border:"1px solid #97C459",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontWeight:600}}>✓ {sl(lang,"Marquer reçu","Mark received")}</button>
                    )}
                  </div>
                ))}
                {!showPayForm&&!client.readOnly&&(
                  <button onClick={()=>setShowPayForm(true)} style={{background:TEAL,color:"#fff",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>+ {sl(lang,"Enregistrer un paiement","Record payment")}</button>
                )}
                {showPayForm&&(
                  <div style={{...card,border:`1px solid ${TEAL}`}}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>{sl(lang,"Nouveau paiement","New payment")}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                      {[{l:"Montant (USD)",k:"amount_usd",ph:"1200"},{l:"Taux CAD (ex: 1.38)",k:"rate",ph:"1.38"}].map(fd=>(
                        <div key={fd.k}><label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>{fd.l}</label><input value={newPay[fd.k]} onChange={e=>setNewPay(p=>({...p,[fd.k]:e.target.value}))} placeholder={fd.ph} style={{width:"100%",padding:"8px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div>
                      ))}
                    </div>
                    {newPay.amount_usd&&newPay.rate&&<div style={{background:"#D5FFC5",borderRadius:7,padding:"7px 10px",fontSize:12,fontWeight:600,color:GREEN,marginBottom:10}}>≈ {(parseFloat(newPay.amount_usd)*parseFloat(newPay.rate)).toFixed(2)} CAD (+3% frais)</div>}
                    <div style={{marginBottom:10}}><label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>{sl(lang,"Direction","Direction")}</label><select value={newPay.direction} onChange={e=>setNewPay(p=>({...p,direction:e.target.value}))} style={{width:"100%",padding:"8px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:12}}><option value="nb_demande">📤 {sl(lang,"NB demande (Interac Request)","NB requests")}</option><option value="client_envoie">📥 {sl(lang,"Client a envoyé","Client sent")}</option></select></div>
                    <div style={{display:"flex",gap:8}}><button onClick={savePay} disabled={saving} style={{flex:1,background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:9,fontSize:12,fontWeight:700,cursor:"pointer"}}>{saving?"...":sl(lang,"Enregistrer","Save")}</button><button onClick={()=>setShowPayForm(false)} style={{background:BG,color:MUTED,border:`1px solid ${BORDER}`,borderRadius:8,padding:"9px 14px",fontSize:12,cursor:"pointer"}}>✕</button></div>
                  </div>
                )}
              </div>
            )}

            {/* FORMS TAB */}
            {tab==="forms"&&(
              <div>
                <div style={card}>
                  <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:14}}>📋 {sl(lang,"Formulaires client","Client forms")}</div>
                  {[
                    {l:sl(lang,"Formulaire médical + LPRPDE","Medical form + PIPEDA"),sent:"medical_form_sent",signed:"medical_form_signed",icon:"🩺",note:sl(lang,"Envoyé après confirmation du billet d'avion","Sent after flight ticket confirmation")},
                    {l:"Service Agreement",sent:"service_agreement_signed",signed:"service_agreement_signed",icon:"📄",note:""},
                  ].map(f=>(
                    <div key={f.l} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div><div style={{fontSize:13,fontWeight:600,color:NAVY}}>{f.icon} {f.l}</div><div style={{fontSize:11,color:MUTED,marginTop:2}}>{client[f.signed]?sl(lang,"✓ Signé par le client","✓ Signed by client"):client[f.sent]?sl(lang,"⏳ En attente de signature","⏳ Awaiting signature"):sl(lang,"Non envoyé","Not sent")}</div></div>
                        {!client[f.signed]&&!client.readOnly&&(
                          <button onClick={()=>{const u={[f.sent]:true,[`${f.sent}_at`]:new Date().toISOString()};updateClient(client.id,u).then(()=>onUpdate({...client,...u})).catch(()=>{});}} style={{background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>📤 {sl(lang,"Envoyer le lien","Send link")}</button>
                        )}
                        {client[f.signed]&&<span style={{color:GREEN,fontWeight:700,fontSize:18}}>✓</span>}
                      </div>
                      {f.note&&<div style={{fontSize:10,color:MUTED,marginTop:6,fontStyle:"italic"}}>ℹ️ {f.note}</div>}
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>🏆 {sl(lang,"Certificat de garantie MedArt","MedArt Guarantee Certificate")}</div>
                  {client.guarantee_certificate_received
                    ?<div style={{color:GREEN,fontSize:12,fontWeight:600}}>✓ {sl(lang,"Reçu et partagé avec le client","Received and shared with client")}</div>
                    :<div style={{fontSize:12,color:MUTED}}>{sl(lang,"En attente de MedArt après la chirurgie.","Waiting from MedArt after surgery.")}</div>
                  }
                  {!client.guarantee_certificate_received&&!client.readOnly&&client.current_stage>=10&&(
                    <button onClick={()=>updateClient(client.id,{guarantee_certificate_received:true}).then(()=>onUpdate({...client,guarantee_certificate_received:true})).catch(()=>{})} style={{marginTop:10,background:"#D5FFC5",color:GREEN,border:"1px solid #97C459",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>✓ {sl(lang,"Marquer reçu","Mark received")}</button>
                  )}
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {tab==="docs"&&(
              <div style={card}>
                <div style={{fontSize:11,color:MUTED,marginBottom:10}}>{sl(lang,"Nomenclature","Naming")}: <strong style={{color:TEAL}}>{cl}-{client.dossier_number}-[TYPE].pdf</strong></div>
                {["Medical-History","LPRPDE-Consent","Service-Agreement","Warranty-Certificate","Quote","Invoice"].map((dt)=>{
                  const fn=`${cl}-${client.dossier_number||"DOSSIER"}-${dt}.pdf`;
                  const ex=docs.find(d=>d.document_type===dt);
                  return(
                    <div key={dt} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${BORDER}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:7,background:ex?"#D5FFC5":"#F1F5F9",color:ex?GREEN:MUTED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{ex?"✓":"📄"}</div>
                        <div><div style={{fontSize:12,fontWeight:600,color:NAVY}}>{dt.replace(/-/g," ")}</div><div style={{fontSize:10,color:MUTED}}>{fn}</div></div>
                      </div>
                      <div style={{fontSize:11,fontWeight:600,color:ex?TEAL:"#A32D2D",cursor:"pointer"}}>{ex?sl(lang,"↓ Télécharger","↓ Download"):sl(lang,"Ajouter","Add")}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PHOTOS TAB */}
            {tab==="photos"&&(
              <div>
                <div style={card}>
                  <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:4}}>{sl(lang,"Photos initiales","Initial photos")} — {client.procedure}</div>
                  <div style={{fontSize:12,color:MUTED,marginBottom:12}}>{photos.length} {sl(lang,"angles requis","angles required")}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {photos.map((a,i)=>(
                      <div key={a} style={{background:BG,border:`0.5px dashed ${BORDER}`,borderRadius:9,aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",fontSize:11,color:MUTED,textAlign:"center",padding:6}}>
                        <span style={{fontSize:20}}>+</span><span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={card}>
                  <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>{sl(lang,"Photos post-opératoires","Post-op photos")}</div>
                  {["J+7","J+14","J+30","J+90","J+180","J+365"].map(j=>(
                    <div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}>
                      <span style={{fontSize:12,fontWeight:600}}>{j}</span>
                      <div style={{width:60,height:60,background:BG,border:`0.5px dashed ${BORDER}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",color:MUTED}}>+</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOG TAB */}
            {tab==="log"&&(
              <div style={card}>
                <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>📋 {sl(lang,"Journal des modifications","Change log")}</div>
                {log.length===0
                  ?<div style={{padding:"20px 0",textAlign:"center",color:MUTED,fontSize:13}}>{sl(lang,"Aucune entrée dans le journal.","No log entries yet.")}</div>
                  :log.map((e,i)=>{
                    const u=allUsers.find(u=>u.id===e.user_id);
                    const uName=u?`${u.first_name} ${u.last_name[0]}.`:"?";
                    return(
                      <div key={e.id||i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${BORDER}`,fontSize:12}}>
                        <div style={{color:MUTED,whiteSpace:"nowrap",minWidth:110,fontSize:11}}>{new Date(e.created_at).toLocaleString(lang==="FR"?"fr-CA":"en-CA",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                        <div style={{width:28,height:28,borderRadius:"50%",background:"#E1F5EE",color:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{(u?.first_name||"?")[0]}</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,color:NAVY,marginBottom:2}}>{e.action}</div>
                          <div style={{color:MUTED,fontSize:11}}>{uName} {e.details?JSON.stringify(e.details):""}</div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
