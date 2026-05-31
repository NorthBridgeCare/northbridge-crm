import{useState,useEffect}from"react";
import{updateClient,getPayments,createPayment,updatePayment,getDocuments,getCommsLog,addCommsLog,addAudit}from"../../lib/api";
import{STAGES,PROCEDURES,NAVY,TEAL,CYAN,GOLD,BG,BORDER,MUTED,GREEN,RED}from"../../lib/constants";

const sl=(l,fr,en)=>l==="FR"?fr:en;
const stageOf=n=>STAGES[n-1]||STAGES[0];

const TABS=[
  {id:"info",   icon:"👤", fr:"Informations",  en:"Information"},
  {id:"pay",    icon:"💳", fr:"Paiements",      en:"Payments"},
  {id:"forms",  icon:"📋", fr:"Formulaires",   en:"Forms"},
  {id:"docs",   icon:"📁", fr:"Documents",      en:"Documents"},
  {id:"photos", icon:"📷", fr:"Photos",         en:"Photos"},
  {id:"log",    icon:"📋", fr:"Journal",        en:"Log"},
];

const PHOTO_ANGLES={
  "Transplantation capillaire":["Face","Profil gauche","Profil droit","Dessus","Arrière","Zone frontale","Zone donneuse"],
  "Rhinoplastie":["Face","Profil gauche","Profil droit","3/4 gauche","3/4 droit","Vue dessous","Sourire face"],
  "Augmentation mammaire":["Face","Profil gauche","Profil droit","3/4 gauche","3/4 droit"],
  "LipoHD Vaser":["Face debout","Profil gauche","Profil droit","Dos","Zone ciblée"],
  "Chirurgie obésité":["Face","Profil gauche","Profil droit","Dos"],
  "Soins dentaires":["Sourire face","Dents ouvertes","Profil sourire","Radiographie panoramique"],
};

const docFilename=(cLang,dos,type)=>`${cLang}-${dos}-${type}.pdf`;

function WA({client,lang,onCopy}){
  const cl=client.language||"FR";
  const dos=client.dossier_number||"—";
  const n=client.first_name;
  const msgs={
    welcome:{fr:`Bonjour ${n},\n\nMerci de nous avoir contactés !\nVotre dossier NorthBridge : ${dos}\n\nVeuillez cliquer ci-dessous pour réserver votre consultation :\n📅 [LIEN BOOKINGS]\n🌐 northbridgemedicalcare.ca\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
             en:`Hello ${n},\n\nThank you for contacting us!\nYour NorthBridge file: ${dos}\n\nPlease click below to book your consultation:\n📅 [BOOKINGS LINK]\n🌐 northbridgemedicalcare.ca\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`},
    photos:{fr:`Bonjour ${n},\n\nPour préparer votre devis personnalisé, veuillez nous envoyer vos photos via l'un des canaux suivants :\n\n📤 Lien d'upload : [LIEN UPLOAD]\n📧 Email : contact@northbridgemedicalcare.ca\n📱 WhatsApp : 613.366.9941\n\nInscrivez votre dossier ${dos} en référence.\n\nNorthBridge Medical Care Travel`,
           en:`Hello ${n},\n\nTo prepare your personalized quote, please send your photos via one of the following:\n\n📤 Upload link: [UPLOAD LINK]\n📧 Email: contact@northbridgemedicalcare.ca\n📱 WhatsApp: 613.366.9941\n\nInclude your file reference ${dos}.\n\nNorthBridge Medical Care Travel`},
    quote:{fr:`Bonjour ${n},\n\nVotre devis personnalisé est prêt ! Dossier : ${dos}\n\nPour en discuter en détail, réservez votre 2e consultation (60 min) :\n📅 [LIEN BOOKINGS]\n\nSans nouvelles de votre part d'ici 7 jours, nous vous ferons un suivi.\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
           en:`Hello ${n},\n\nYour personalized quote is ready! File: ${dos}\n\nTo discuss it in detail, book your 2nd consultation (60 min):\n📅 [BOOKINGS LINK]\n\nIf we don't hear from you within 7 days, we'll follow up.\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`},
    ticket:{fr:`Bonjour ${n},\n\nExcellent ! Confirmez-nous l'achat de votre billet et partagez-nous le via :\n\n📤 Lien d'upload : [LIEN UPLOAD]\n📧 Email : contact@northbridgemedicalcare.ca\n📱 WhatsApp : 613.366.9941\n\nDossier : ${dos}\n\nÀ réception, nous vous enverrons le formulaire médical à compléter.\n\nNorthBridge Medical Care Travel`,
            en:`Hello ${n},\n\nExcellent! Please confirm your ticket purchase and share it via:\n\n📤 Upload link: [UPLOAD LINK]\n📧 Email: contact@northbridgemedicalcare.ca\n📱 WhatsApp: 613.366.9941\n\nFile: ${dos}\n\nUpon receipt, we'll send you the medical form to complete.\n\nNorthBridge Medical Care Travel`},
    payment:{fr:`Bonjour ${n},\n\nVotre premier versement de [MONTANT] USD est maintenant dû.\n\nVous pouvez payer via :\n💳 Stripe : [LIEN STRIPE — expire le DATE]\n🔄 Interac e-transfer : Demande envoyée à [EMAIL]\n\n📋 Référence obligatoire : ${dos}\n⚠️ Frais de conversion : 3% applicables\n\nDélai : 30 jours. Un rappel sera envoyé à J+16 si le paiement n'est pas reçu.\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
             en:`Hello ${n},\n\nYour first payment of [AMOUNT] USD is now due.\n\nYou can pay via:\n💳 Stripe: [STRIPE LINK — expires DATE]\n🔄 Interac e-transfer: Request sent to [EMAIL]\n\n📋 Mandatory reference: ${dos}\n⚠️ Conversion fee: 3% applies\n\nDeadline: 30 days. A reminder will be sent at J+16 if payment is not received.\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`},
  };
  const keys=["welcome","photos","quote","ticket","payment"];
  const labels={
    fr:["Message de bienvenue","Demande de photos","Envoi du devis","Achat du billet","Instructions de paiement"],
    en:["Welcome message","Photo request","Sending the quote","Ticket purchase","Payment instructions"],
  };
  const[copied,setCopied]=useState(null);
  const copy=(k,txt)=>{navigator.clipboard.writeText(txt);setCopied(k);setTimeout(()=>setCopied(null),2000);};
  return(
    <div>
      <div style={{background:"#E1F5EE",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#085041"}}>
        📱 {sl(lang,"Messages générés en","Messages generated in")} <strong>{cl==="FR"?"Français":"English"}</strong> ({sl(lang,"langue du client","client language")})
      </div>
      {keys.map((k,i)=>(
        <div key={k} style={{background:"#F0FFF4",border:"1px solid #83C365",borderRadius:10,padding:12,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:700,color:"#3B6D11"}}>{cl==="FR"?labels.fr[i]:labels.en[i]}</div>
            <button onClick={()=>copy(k,cl==="FR"?msgs[k].fr:msgs[k].en)}
              style={{background:copied===k?"#3B6D11":"#83C365",color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
              {copied===k?"✓ Copié !":"Copier"}
            </button>
          </div>
          <div style={{fontSize:11,fontFamily:"monospace",color:"#1B5E20",background:"#fff",borderRadius:7,padding:"9px",lineHeight:1.8,whiteSpace:"pre-line",border:"0.5px solid #C0DD97"}}>
            {cl==="FR"?msgs[k].fr:msgs[k].en}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClientDossier({client,user,lang,allUsers,onClose,onUpdate,onArchive}){
  const[tab,setTab]=useState("info");
  const[stage,setStage]=useState(client.current_stage);
  const[payments,setPayments]=useState([]);
  const[docs,setDocs]=useState([]);
  const[log,setLog]=useState([]);
  const[saving,setSaving]=useState(false);
  const[showPayForm,setShowPayForm]=useState(false);
  const[newPay,setNewPay]=useState({amount_usd:"",rate:"",direction:"nb_demande",method:"e-transfer"});

  useEffect(()=>{
    if(tab==="pay")getPayments(client.id).then(d=>setPayments(d||[])).catch(()=>{});
    if(tab==="docs")getDocuments(client.id).then(d=>setDocs(d||[])).catch(()=>{});
    if(tab==="log")getCommsLog(client.id).then(d=>setLog(d||[])).catch(()=>{});
  },[tab,client.id]);

  const[stageErr,setStageErr]=useState("");
  const[stageErr,setStageErr]=useState("");
  const updateStage=async n=>{
    if(client.readOnly)return;
    const ns=parseInt(n);
    const prevStage=stage;
    setStage(ns);setStageErr("");
    try{
      await updateClient(client.id,{current_stage:ns});
      onUpdate({...client,current_stage:ns});
    }catch(e){
      setStage(prevStage);
      setStageErr("Erreur sauvegarde: "+e.message);
      setTimeout(()=>setStageErr(""),5000);
    }
  };

  const toggleField=async(field,dateField)=>{
    if(client.readOnly)return;
    const val=!client[field];
    const update={[field]:val,[dateField]:val?new Date().toISOString():null};
    await updateClient(client.id,update);
    onUpdate({...client,...update});
  };

  const savePay=async()=>{
    setSaving(true);
    try{
      const usd=parseFloat(newPay.amount_usd)||0;
      const rate=parseFloat(newPay.rate)||1;
      const cad=+(usd*rate).toFixed(2);
      const ref=client.dossier_number||"";
      const deadline=new Date(Date.now()+30*24*60*60*1000).toISOString().split("T")[0];
      const[saved]=await createPayment({client_id:client.id,amount_usd:usd,amount_cad:cad,currency_conversion_rate:rate,conversion_fee_pct:3,direction:newPay.direction,method:newPay.method,dossier_ref:ref,status:"pending",created_by:user.id});
      await updateClient(client.id,{payment_request_sent:true,payment_request_sent_at:new Date().toISOString(),payment_deadline:deadline,payment_method_preference:newPay.method==="e-transfer"?"e-transfer":"stripe"});
      setPayments(prev=>[saved,...prev]);
      onUpdate({...client,payment_request_sent:true,payment_deadline:deadline});
      setShowPayForm(false);
      setNewPay({amount_usd:"",rate:"",direction:"nb_demande",method:"e-transfer"});
      await addAudit(user.id,"PAYMENT_REQUEST","payments",saved.id,{amount_usd:usd,ref});
    }catch(e){alert("Erreur: "+e.message);}
    setSaving(false);
  };

  const cl=client.language||"FR";
  const st=stageOf(stage);
  const nextSt=STAGES[stage];
  const photos=PHOTO_ANGLES[client.procedure]||[];
  const payDeadline=client.payment_deadline?new Date(client.payment_deadline):null;
  const daysLeft=payDeadline?Math.ceil((payDeadline-new Date())/(1000*60*60*24)):null;

  const cardStyle={background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,padding:"16px 20px",marginBottom:12};
  const fieldGrid={display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14};
  const fieldBox={background:BG,borderRadius:7,padding:"8px 10px"};

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",minHeight:"100vh",background:BG,color:"#1A1A2E"}}>
      {/* FULL SCREEN HEADER */}
      <div style={{background:NAVY,padding:"0 20px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            ← {sl(lang,"Retour","Back")}
          </button>
          <div style={{width:1,height:24,background:"rgba(255,255,255,.2)"}}/>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:15}}>{client.first_name} {client.last_name}</div>
            <div style={{color:CYAN,fontSize:11,fontWeight:600}}>{client.dossier_number} {client.readOnly?`· 👁 ${sl(lang,"Lecture seule","Read only")}`:`· ${sl(lang,"En édition","Editing")}`}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{background:st.bg,color:st.tx,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600}}>{st.id} — {lang==="FR"?st.fr:st.en}</span>
          <span style={{fontSize:11,background:cl==="FR"?"#DBEAFE":"#FEF3C7",color:cl==="FR"?"#1E40AF":"#92400E",borderRadius:4,padding:"3px 8px",fontWeight:600}}>{cl}</span>
          {!client.readOnly&&user.role==="super_admin"&&(
            <button onClick={()=>{if(window.confirm(sl(lang,"Archiver ce dossier ?","Archive this file?")))onArchive(client);}}
              style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.7)",border:"0.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>
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
            <div style={cardStyle}>
              <div style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>{sl(lang,"Étape du pipeline","Pipeline stage")}</div>
              <select value={stage} onChange={e=>updateStage(e.target.value)} disabled={client.readOnly}
                style={{width:"100%",padding:"8px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,fontWeight:600,color:NAVY,background:client.readOnly?"#F9FAFB":"#fff"}}>
                {STAGES.map(s=><option key={s.id} value={s.id}>{s.id}. {lang==="FR"?s.fr:s.en}</option>)}
              </select>
              {!client.readOnly&&nextSt&&(
                <button onClick={()=>updateStage(stage+1)}
                  style={{marginTop:10,width:"100%",background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  → {sl(lang,"Étape suivante","Next")} : {lang==="FR"?nextSt.fr:nextSt.en}
                </button>
              )}
            </div>

            {/* Quick info */}
            <div style={cardStyle}>
              <div style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:".05em",marginBottom:10}}>{sl(lang,"Résumé","Summary")}</div>
              {[
                {l:"Email",v:client.email||"—"},
                {l:sl(lang,"Téléphone","Phone"),v:client.phone||"—"},
                {l:sl(lang,"Procédure","Procedure"),v:client.procedure||"—"},
                {l:"Source",v:client.source||"—"},
                {l:"Province",v:client.province_residence||"—"},
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${BORDER}`,fontSize:12}}>
                  <span style={{color:MUTED}}>{f.l}</span>
                  <span style={{fontWeight:600,color:"#1A1A2E",maxWidth:140,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.v}</span>
                </div>
              ))}
            </div>

            {/* Compliance */}
            <div style={cardStyle}>
              <div style={{fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:".05em",marginBottom:10}}>Conformité</div>
              {/* LPRPDE + Formulaire médical — toujours ensemble */}
              <div style={{background:client.lprpde_consent&&client.medical_form_signed?"#D5FFC5":"#FEF3C7",border:`1px solid ${client.lprpde_consent&&client.medical_form_signed?"#97C459":"#FCD34D"}`,borderRadius:8,padding:"8px 10px",marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:NAVY,marginBottom:6}}>🩺 {sl(lang,"Formulaire médical + LPRPDE","Medical form + PIPEDA")}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:11,color:MUTED}}>LPRPDE</span>
                  {client.lprpde_consent
                    ?<span style={{fontSize:11,color:GREEN,fontWeight:600}}>✓</span>
                    :!client.readOnly&&<button onClick={()=>toggleField("lprpde_consent","lprpde_consent_date")} style={{fontSize:10,background:"#FEF3C7",color:"#92400E",border:"1px solid #FCD34D",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontWeight:600}}>Marquer ✓</button>
                  }
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:MUTED}}>{sl(lang,"Formulaire médical","Medical form")}</span>
                  {client.medical_form_signed
                    ?<span style={{fontSize:11,color:GREEN,fontWeight:600}}>✓</span>
                    :<span style={{fontSize:11,color:RED,fontWeight:600}}>✗</span>
                  }
                </div>
              </div>
              {/* Service Agreement */}
              {[
                {l:"Service Agreement",ok:client.service_agreement_signed},
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${BORDER}`}}>
                  <span style={{fontSize:12,color:MUTED}}>{f.l}</span>
                  {f.ok
                    ?<span style={{fontSize:11,color:GREEN,fontWeight:600}}>✓ Signé</span>
                    :<span style={{fontSize:11,color:RED,fontWeight:600}}>✗ {sl(lang,"Requis","Required")}</span>
                  }
                </div>
              ))}
              <div style={{fontSize:10,color:MUTED,marginTop:6,fontStyle:"italic"}}>* Waiver inclus sur la facture client</div>
            </div>

            {/* Payment status */}
            {client.payment_deadline&&(
              <div style={{...cardStyle,background:daysLeft<=7?"#FEE2E2":daysLeft<=16?"#FEF3C7":"#D5FFC5",border:`1px solid ${daysLeft<=7?"#F09595":daysLeft<=16?"#FAC775":"#97C459"}`}}>
                <div style={{fontSize:12,fontWeight:700,color:daysLeft<=7?RED:daysLeft<=16?"#633806":GREEN}}>
                  💳 {sl(lang,"Paiement dû","Payment due")}<br/>
                  <span style={{fontSize:14}}>{payDeadline?.toLocaleDateString(lang==="FR"?"fr-CA":"en-CA")}</span>
                </div>
                {daysLeft!==null&&<div style={{fontSize:11,marginTop:4,color:daysLeft<=7?RED:daysLeft<=16?"#633806":GREEN}}>
                  {daysLeft>0?`J-${daysLeft}`:sl(lang,"En retard !","Overdue!")}
                </div>}
              </div>
            )}
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div>
            {/* Tabs */}
            <div style={{display:"flex",background:"#fff",border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden",marginBottom:16}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{flex:1,padding:"11px 8px",border:"none",borderBottom:tab===t.id?`2px solid ${TEAL}`:"2px solid transparent",background:"transparent",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:400,color:tab===t.id?TEAL:MUTED,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <span>{t.icon}</span><span>{lang==="FR"?t.fr:t.en}</span>
                </button>
              ))}
            </div>

            {/* INFO TAB */}
            {tab==="info"&&(
              <div>
                {/* Surgery date */}
                {(client.current_stage>=6)&&(
                  <div style={cardStyle}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>🏥 {sl(lang,"Date de chirurgie","Surgery date")}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div>
                        <label style={{fontSize:12,color:MUTED,display:"block",marginBottom:4}}>{sl(lang,"Date proposée","Proposed date")}</label>
                        <input type="date" defaultValue={client.surgery_date||""} disabled={client.readOnly}
                          onBlur={e=>updateClient(client.id,{surgery_date:e.target.value}).then(()=>onUpdate({...client,surgery_date:e.target.value}))}
                          style={{width:"100%",padding:"8px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13}}/>
                      </div>
                      <div style={fieldBox}>
                        <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{sl(lang,"Statut","Status")}</div>
                        <div style={{fontSize:13,fontWeight:600,color:client.surgery_date_confirmed?GREEN:MUTED}}>
                          {client.surgery_date_confirmed?sl(lang,"✓ Confirmée","✓ Confirmed"):sl(lang,"En attente","Pending")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Flight info */}
                {client.flight_arrival_number&&(
                  <div style={cardStyle}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>✈️ {sl(lang,"Informations de vol","Flight information")}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div>
                        <div style={{fontSize:11,color:MUTED,fontWeight:600,marginBottom:6}}>🛬 {sl(lang,"Arrivée Istanbul","Arrival Istanbul")}</div>
                        <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{client.flight_arrival_number}</div>
                        <div style={{fontSize:12,color:MUTED}}>{client.flight_arrival_date} {client.flight_arrival_time&&`· ${client.flight_arrival_time}`}</div>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:MUTED,fontWeight:600,marginBottom:6}}>🛫 {sl(lang,"Départ Istanbul","Departure Istanbul")}</div>
                        <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{client.flight_departure_number||"—"}</div>
                        <div style={{fontSize:12,color:MUTED}}>{client.flight_departure_date||""} {client.flight_departure_time&&`· ${client.flight_departure_time}`}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {client.notes&&(
                  <div style={{...cardStyle,borderLeft:`3px solid ${TEAL}`,borderRadius:"0 12px 12px 0"}}>
                    <div style={{fontSize:11,fontWeight:700,color:NAVY,marginBottom:6}}>Notes</div>
                    <div style={{fontSize:13,color:MUTED,lineHeight:1.6}}>{client.notes}</div>
                  </div>
                )}

                {/* Follow-ups (stage 11) */}
                {client.current_stage===11&&(
                  <div style={cardStyle}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>🔄 {sl(lang,"Suivis post-opératoires","Post-op follow-ups")}</div>
                    {[{l:"J+7",f:"followup_7_sent"},{l:"J+14",f:"followup_14_sent"},{l:"J+30",f:"followup_30_sent"}].map(fu=>(
                      <div key={fu.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${BORDER}`}}>
                        <span style={{fontSize:13,fontWeight:600}}>{sl(lang,"Suivi","Follow-up")} {fu.l}</span>
                        {client[fu.f]
                          ?<span style={{color:GREEN,fontSize:12,fontWeight:600}}>✓ {sl(lang,"Envoyé","Sent")}</span>
                          :!client.readOnly&&<button onClick={()=>updateClient(client.id,{[fu.f]:true}).then(()=>onUpdate({...client,[fu.f]:true}))}
                            style={{fontSize:11,background:"#E1F5EE",color:"#085041",border:"1px solid #9FE1CB",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:600}}>
                            {sl(lang,"Marquer envoyé","Mark sent")}
                          </button>
                        }
                      </div>
                    ))}
                    <div style={{marginTop:10}}>
                      <label style={{fontSize:12,color:MUTED,display:"block",marginBottom:4}}>{sl(lang,"Date de retour au Canada","Return date to Canada")}</label>
                      <input type="date" defaultValue={client.return_date||""}
                        onBlur={e=>updateClient(client.id,{return_date:e.target.value}).then(()=>onUpdate({...client,return_date:e.target.value}))}
                        style={{padding:"7px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:12,width:"100%"}}/>
                    </div>
                  </div>
                )}

                {/* Review (stage 12) */}
                {client.current_stage===12&&(
                  <div style={cardStyle}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>⭐ {sl(lang,"Évaluation & témoignage","Review & testimonial")}</div>
                    {[
                      {l:sl(lang,"Coordination","Coordination"),k:"score_coordination"},
                      {l:sl(lang,"Communication","Communication"),k:"score_communication"},
                      {l:sl(lang,"Qualité information","Information quality"),k:"score_information"},
                      {l:sl(lang,"Expérience globale","Overall experience"),k:"score_overall"},
                    ].map(r=>(
                      <div key={r.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${BORDER}`}}>
                        <span style={{fontSize:12,color:MUTED}}>{r.l}</span>
                        <span style={{fontSize:14}}>{client[r.k]?`${"⭐".repeat(client[r.k])}`:"—"}</span>
                      </div>
                    ))}
                    {client.testimonial_text&&<div style={{marginTop:10,background:BG,borderRadius:8,padding:"10px 12px",fontSize:12,color:MUTED,fontStyle:"italic"}}>"{client.testimonial_text}"</div>}
                    {client.testimonial_authorized&&<div style={{marginTop:8,fontSize:11,color:GREEN,fontWeight:600}}>✓ {sl(lang,"Autorisation de publication accordée","Publication authorized")}</div>}
                    {!client.review_link_sent&&!client.readOnly&&(
                      <button onClick={()=>updateClient(client.id,{review_link_sent:true,review_link_sent_at:new Date().toISOString()}).then(()=>onUpdate({...client,review_link_sent:true}))}
                        style={{marginTop:12,background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%"}}>
                        📤 {sl(lang,"Envoyer le lien d'évaluation","Send review link")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS TAB */}
            {tab==="pay"&&(
              <div>
                <div style={{...cardStyle,background:"#E6F1FB",border:"1px solid #B5D4F4"}}>
                  <div style={{fontSize:12,color:"#0C447C",fontWeight:600,marginBottom:4}}>
                    ⚠️ {sl(lang,"Règle importante","Important rule")}
                  </div>
                  <div style={{fontSize:12,color:"#185FA5",lineHeight:1.6}}>
                    {sl(lang,
                      `Toujours inclure le numéro de dossier ${client.dossier_number} dans chaque transaction. Premier versement demandé seulement après réception du billet d'avion.`,
                      `Always include dossier number ${client.dossier_number} in every transaction. First payment requested only after receiving the flight ticket.`
                    )}
                  </div>
                </div>

                {/* Payment preference */}
                {!client.payment_method_preference&&!client.readOnly&&(
                  <div style={cardStyle}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>{sl(lang,"Préférence de paiement du client","Client payment preference")}</div>
                    <div style={{display:"flex",gap:10}}>
                      {["stripe","e-transfer"].map(m=>(
                        <button key={m} onClick={()=>updateClient(client.id,{payment_method_preference:m}).then(()=>onUpdate({...client,payment_method_preference:m}))}
                          style={{flex:1,padding:"10px",border:`1px solid ${BORDER}`,borderRadius:8,cursor:"pointer",background:"#F9FAFB",fontSize:13,fontWeight:600}}>
                          {m==="stripe"?"💳 Stripe":"🔄 Interac e-transfer"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {client.payment_method_preference&&(
                  <div style={{...cardStyle,background:"#D5FFC5",border:"1px solid #97C459"}}>
                    <div style={{fontSize:12,color:GREEN,fontWeight:600}}>
                      ✓ {sl(lang,"Méthode choisie","Chosen method")} : {client.payment_method_preference==="stripe"?"💳 Stripe":"🔄 Interac e-transfer"}
                      {!client.readOnly&&<button onClick={()=>{if(window.confirm(sl(lang,"Changer la méthode ?","Change method?")))updateClient(client.id,{payment_method_preference:null}).then(()=>onUpdate({...client,payment_method_preference:null}));}}
                        style={{marginLeft:10,fontSize:10,background:"rgba(0,0,0,.1)",border:"none",borderRadius:4,padding:"2px 6px",cursor:"pointer"}}>
                        {sl(lang,"Changer","Change")}
                      </button>}
                    </div>
                  </div>
                )}

                {payments.map((p,i)=>(
                  <div key={p.id||i} style={{...cardStyle,borderLeft:`3px solid ${p.status==="received"?GREEN:GOLD}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:700,color:NAVY}}>{p.amount_usd} USD</span>
                      <span style={{fontSize:11,background:p.status==="received"?"#D5FFC5":"#FEF3C7",color:p.status==="received"?GREEN:"#92400E",borderRadius:20,padding:"2px 8px",fontWeight:600}}>
                        {p.status==="received"?sl(lang,"✓ Reçu","✓ Received"):sl(lang,"⏳ En attente","⏳ Pending")}
                      </span>
                    </div>
                    {p.amount_cad&&<div style={{fontSize:12,color:MUTED}}>≈ {parseFloat(p.amount_cad).toFixed(2)} CAD · Taux : {p.currency_conversion_rate} · Frais : 3%</div>}
                    <div style={{fontSize:11,color:MUTED,marginTop:4}}>
                      {p.direction==="nb_demande"?sl(lang,"📤 NB a envoyé la demande","📤 NB sent the request"):sl(lang,"📥 Client a envoyé","📥 Client sent")} · {p.method}
                    </div>
                    <div style={{fontSize:10,color:TEAL,marginTop:4,fontWeight:600}}>Réf: {p.dossier_ref||client.dossier_number}</div>
                    {p.status==="pending"&&!client.readOnly&&(
                      <button onClick={()=>updatePayment(p.id,{status:"received",received_date:new Date().toISOString().split("T")[0]}).then(()=>setPayments(prev=>prev.map(x=>x.id===p.id?{...x,status:"received"}:x)))}
                        style={{marginTop:8,fontSize:11,background:"#D5FFC5",color:GREEN,border:"1px solid #97C459",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontWeight:600}}>
                        ✓ {sl(lang,"Marquer comme reçu","Mark as received")}
                      </button>
                    )}
                  </div>
                ))}

                {!showPayForm&&!client.readOnly&&(
                  <button onClick={()=>setShowPayForm(true)} style={{background:TEAL,color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>
                    + {sl(lang,"Enregistrer un paiement","Record payment")}
                  </button>
                )}

                {showPayForm&&(
                  <div style={{...cardStyle,border:`1px solid ${TEAL}`}}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>{sl(lang,"Nouveau paiement","New payment")}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                      {[{l:"Montant (USD)",k:"amount_usd",ph:"1200"},{l:"Taux CAD (ex: 1.38)",k:"rate",ph:"1.38"}].map(f=>(
                        <div key={f.k}>
                          <label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>{f.l}</label>
                          <input value={newPay[f.k]} onChange={e=>setNewPay(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                            style={{width:"100%",padding:"8px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:13,boxSizing:"border-box"}}/>
                        </div>
                      ))}
                    </div>
                    {newPay.amount_usd&&newPay.rate&&(
                      <div style={{background:"#D5FFC5",borderRadius:7,padding:"7px 10px",fontSize:12,fontWeight:600,color:GREEN,marginBottom:10}}>
                        ≈ {(parseFloat(newPay.amount_usd)*parseFloat(newPay.rate)).toFixed(2)} CAD (+3% frais conversion)
                      </div>
                    )}
                    <div style={{marginBottom:10}}>
                      <label style={{fontSize:11,color:MUTED,display:"block",marginBottom:3}}>{sl(lang,"Direction","Direction")}</label>
                      <select value={newPay.direction} onChange={e=>setNewPay(p=>({...p,direction:e.target.value}))}
                        style={{width:"100%",padding:"8px 10px",border:`1px solid ${BORDER}`,borderRadius:8,fontSize:12}}>
                        <option value="nb_demande">📤 {sl(lang,"NB demande (Interac Request)","NB requests (Interac Request)")}</option>
                        <option value="client_envoie">📥 {sl(lang,"Client a envoyé","Client sent")}</option>
                      </select>
                    </div>
                    <div style={{background:"#FEF3C7",borderRadius:7,padding:"7px 10px",fontSize:11,color:"#92400E",marginBottom:10}}>
                      ⚠️ Réf. dossier <strong>{client.dossier_number}</strong> sera automatiquement incluse dans la transaction.
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={savePay} disabled={saving} style={{flex:1,background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        {saving?"...":sl(lang,"Enregistrer","Save")}
                      </button>
                      <button onClick={()=>setShowPayForm(false)} style={{background:BG,color:MUTED,border:`1px solid ${BORDER}`,borderRadius:8,padding:"9px 14px",fontSize:12,cursor:"pointer"}}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORMS TAB */}
            {tab==="forms"&&(
              <div>
                <div style={cardStyle}>
                  <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:14}}>📋 {sl(lang,"Formulaires client","Client forms")}</div>
                  {[
                    {k:"medical",l:sl(lang,"Formulaire médical + LPRPDE","Medical form + PIPEDA"),sent:"medical_form_sent",signed:"medical_form_signed",trigger:7,icon:"🩺"},
                    {k:"sa",l:"Service Agreement",sent:"service_agreement_signed",signed:"service_agreement_signed",trigger:9,icon:"📄"},
                  ].map(f=>(
                    <div key={f.k} style={{...fieldBox,marginBottom:10,border:`1px solid ${BORDER}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:NAVY}}>{f.icon} {f.l}</div>
                          <div style={{fontSize:11,color:MUTED,marginTop:2}}>
                            {client[f.signed]?sl(lang,"✓ Signé par le client","✓ Signed by client"):
                             client[f.sent]?sl(lang,"⏳ Lien envoyé — en attente","⏳ Link sent — pending"):
                             sl(lang,"Non envoyé","Not sent")}
                          </div>
                        </div>
                        {!client[f.signed]&&!client.readOnly&&(
                          <button onClick={()=>{
                            const update={[f.sent]:true,[`${f.sent}_at`]:new Date().toISOString()};
                            updateClient(client.id,update).then(()=>onUpdate({...client,...update}));
                          }} style={{background:TEAL,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                            📤 {sl(lang,"Envoyer le lien","Send link")}
                          </button>
                        )}
                        {client[f.signed]&&<span style={{color:GREEN,fontWeight:700,fontSize:14}}>✓</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Guarantee certificate */}
                <div style={cardStyle}>
                  <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>🏆 {sl(lang,"Certificat de garantie MedArt","MedArt guarantee certificate")}</div>
                  {client.guarantee_certificate_received
                    ?<div style={{color:GREEN,fontSize:12,fontWeight:600}}>✓ {sl(lang,"Reçu de MedArt — partagé avec le client","Received from MedArt — shared with client")}</div>
                    :<div>
                      <div style={{fontSize:12,color:MUTED,marginBottom:10}}>{sl(lang,"En attente de réception depuis MedArt après la chirurgie.","Waiting to receive from MedArt after surgery.")}</div>
                      {!client.readOnly&&client.current_stage>=10&&(
                        <button onClick={()=>updateClient(client.id,{guarantee_certificate_received:true}).then(()=>onUpdate({...client,guarantee_certificate_received:true}))}
                          style={{background:"#D5FFC5",color:GREEN,border:"1px solid #97C459",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                          ✓ {sl(lang,"Marquer reçu et partagé","Mark received & shared")}
                        </button>
                      )}
                    </div>
                  }
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {tab==="docs"&&(
              <div style={cardStyle}>
                <div style={{fontSize:11,color:MUTED,marginBottom:10}}>
                  {sl(lang,"Nomenclature","Naming")}: <strong style={{color:TEAL}}>{cl}-{client.dossier_number}-[TYPE].pdf</strong>
                </div>
                {["Medical-History","LPRPDE-Consent","Service-Agreement","Warranty-Certificate","Quote","Invoice"].map((dt,i)=>{
                  const fn=docFilename(cl,client.dossier_number||"DOSSIER",dt);
                  const ex=docs.find(d=>d.document_type===dt);
                  return(
                    <div key={dt} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${BORDER}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:7,background:ex?"#D5FFC5":"#F1F5F9",color:ex?GREEN:MUTED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
                          {ex?"✓":"📄"}
                        </div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:NAVY}}>{dt.replace(/-/g," ")}</div>
                          <div style={{fontSize:10,color:MUTED}}>{fn}</div>
                        </div>
                      </div>
                      <div style={{fontSize:11,fontWeight:600,color:ex?TEAL:"#A32D2D",cursor:"pointer"}}>
                        {ex?sl(lang,"↓ Télécharger","↓ Download"):sl(lang,"Ajouter","Add")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PHOTOS TAB */}
            {tab==="photos"&&(
              <div>
                <div style={cardStyle}>
                  <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:4}}>{sl(lang,"Photos initiales","Initial photos")} — {client.procedure}</div>
                  <div style={{fontSize:12,color:MUTED,marginBottom:12}}>{photos.length} {sl(lang,"angles requis","angles required")}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {photos.map((a,i)=>(
                      <div key={a} style={{background:i<2?"#E1F5EE":BG,border:`0.5px dashed ${i<2?"#9FE1CB":BORDER}`,borderRadius:9,aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",fontSize:11,color:i<2?"#085041":MUTED,textAlign:"center",padding:6}}>
                        <span style={{fontSize:20}}>{i<2?"✓":"+"}</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={cardStyle}>
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
              <div style={cardStyle}>
                <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>📋 {sl(lang,"Journal des modifications","Change log")}</div>
                {log.length===0&&(
                  <div style={{padding:"20px 0",textAlign:"center",color:MUTED,fontSize:13}}>
                    {sl(lang,"Aucune entrée dans le journal.","No log entries.")}
                  </div>
                )}
                {log.map((l,i)=>(
                  <div key={l.id||i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${BORDER}`,fontSize:11}}>
                    <div style={{color:MUTED,whiteSpace:"nowrap",minWidth:130}}>{new Date(l.sent_at).toLocaleString(lang==="FR"?"fr-CA":"en-CA")}</div>
                    <div style={{fontWeight:600,color:TEAL,minWidth:30}}>
                      {allUsers.find(u=>u.id===l.sent_by)?.first_name?.[0]||"?"}{allUsers.find(u=>u.id===l.sent_by)?.last_name?.[0]||""}
                    </div>
                    <div style={{color:MUTED,flex:1}}>{l.body||l.subject||l.template_used}</div>
                  </div>
                ))}
              </div>
            )}

            {/* WHATSAPP (accessible from info) */}
            {tab==="info"&&(
              <div style={cardStyle}>
                <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:12}}>📱 WhatsApp</div>
                <WA client={client} lang={lang}/>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
