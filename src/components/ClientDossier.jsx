import { useState, useEffect } from "react";
import { updateClient, getPayments, createPayment, getDocuments, getCommsLog, addCommsLog, addAuditLog } from "../lib/api";
import { STAGES, PROCEDURES, NAVY, TEAL, CYAN, GOLD, BG, BORDER, MUTED, GREEN, RED } from "../lib/constants";
import { t, stageLabel } from "../lib/i18n";

const TABS = [
  { id:'info',     icon:'👤', fr:'Informations', en:'Information' },
  { id:'payments', icon:'💳', fr:'Paiements',    en:'Payments'    },
  { id:'whatsapp', icon:'📱', fr:'WhatsApp',     en:'WhatsApp'    },
  { id:'docs',     icon:'📁', fr:'Documents',    en:'Documents'   },
  { id:'photos',   icon:'📷', fr:'Photos',       en:'Photos'      },
  { id:'journal',  icon:'📋', fr:'Journal',      en:'Journal'     },
];

const PHOTO_ANGLES = {
  "Transplantation capillaire": ["Face","Profil gauche","Profil droit","Dessus","Arrière","Zone donneuse"],
  "Rhinoplastie":               ["Face","Profil gauche","Profil droit","3/4 gauche","3/4 droit","Vue dessous"],
  "Augmentation mammaire":      ["Face","Profil gauche","Profil droit","3/4 gauche","3/4 droit"],
  "LipoHD Vaser":              ["Face debout","Profil gauche","Profil droit","Dos","Zone ciblée"],
  "Chirurgie obésité":         ["Face","Profil gauche","Profil droit","Dos"],
  "Soins dentaires":            ["Sourire face","Dents ouvertes","Profil sourire","Radiographie panoramique"],
};

const DOC_TYPES = [
  { type:"Medical-History",    fr:"Formulaire médical",    req:true  },
  { type:"Waiver-Signed",      fr:"Waiver signé",          req:true  },
  { type:"LPRPDE-Consent",     fr:"Consentement LPRPDE",   req:true  },
  { type:"Service-Agreement",  fr:"Service Agreement",     req:true  },
  { type:"Warranty-Certificate",fr:"Warranty Certificate", req:false },
  { type:"Quote",              fr:"Devis MedArt",          req:false },
  { type:"Invoice",            fr:"Facture",               req:false },
];

function docFilename(lang, dossierNum, type) {
  return `${lang}-${dossierNum}-${type}.pdf`;
}

export default function ClientDossier({ client, user, lang, allUsers, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [commsLog, setCommsLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);
  const [stage, setStage] = useState(client.current_stage);
  const [newPayment, setNewPayment] = useState({ amount_usd:'', currency_conversion_rate:'', direction:'nb_demande', method:'e-transfer', notes:'' });
  const [showPayForm, setShowPayForm] = useState(false);

  const sl = (key) => t(lang, key);
  const clientLang = client.language || 'FR';

  useEffect(() => {
    if (activeTab === 'payments') getPayments(client.id).then(d => setPayments(d||[])).catch(()=>{});
    if (activeTab === 'docs') getDocuments(client.id).then(d => setDocuments(d||[])).catch(()=>{});
    if (activeTab === 'journal') getCommsLog(client.id).then(d => setCommsLog(d||[])).catch(()=>{});
  }, [activeTab, client.id]);

  const updateStage = async (newStage) => {
    if (client.readOnly) return;
    setStage(parseInt(newStage));
    try {
      await updateClient(client.id, { current_stage: parseInt(newStage) });
      await addAuditLog(user.id, 'STAGE_CHANGE', 'clients', client.id, { from: client.current_stage, to: parseInt(newStage) });
      onUpdate({ ...client, current_stage: parseInt(newStage) });
    } catch(e) { alert("Erreur: " + e.message); }
  };

  const toggleConsent = async (field, dateField) => {
    if (client.readOnly) return;
    const val = !client[field];
    const update = { [field]: val, [dateField]: val ? new Date().toISOString() : null };
    try {
      await updateClient(client.id, update);
      await addAuditLog(user.id, 'UPDATE', 'clients', client.id, update);
      onUpdate({ ...client, ...update });
    } catch(e) { alert("Erreur: " + e.message); }
  };

  const savePayment = async () => {
    if (!newPayment.amount_usd) return;
    setSaving(true);
    try {
      const rate = parseFloat(newPayment.currency_conversion_rate) || 1;
      const usd = parseFloat(newPayment.amount_usd);
      const cad = (usd * rate).toFixed(2);
      const dossierRef = client.dossier_number || '';
      const [saved] = await createPayment({
        client_id: client.id,
        amount_usd: usd,
        amount_cad: parseFloat(cad),
        currency_conversion_rate: rate,
        currency: 'USD',
        direction: newPayment.direction,
        method: newPayment.method,
        stripe_dossier_ref: dossierRef,
        etransfer_transaction_number: dossierRef,
        status: 'pending',
        notes: newPayment.notes,
        created_by: user.id,
      });
      setPayments(prev => [saved, ...prev]);
      setNewPayment({ amount_usd:'', currency_conversion_rate:'', direction:'nb_demande', method:'e-transfer', notes:'' });
      setShowPayForm(false);
    } catch(e) { alert("Erreur: " + e.message); }
    setSaving(false);
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const whatsappMsg = (type) => {
    const n = client.first_name;
    const dos = client.dossier_number || '—';
    const contact = "contact@northbridgemedicalcare.ca";
    if (clientLang === 'EN') {
      const msgs = {
        welcome: `Hello ${n},\n\nThank you for reaching out to NorthBridge Medical Care Travel!\n\nYour file number: ${dos}\n\nPlease click the link below to book your consultation:\n📅 [CALENDAR LINK]\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
        payment: `Hello ${n},\n\nTo confirm your reservation, please send your deposit via Interac e-transfer:\n\n📧 To: ${contact}\n💵 Amount: [AMOUNT] USD\n📋 Reference: ${dos} (mandatory in the message)\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
        quote: `Hello ${n},\n\nHere is your personalized estimate from MedArt Istanbul.\n\n📋 File: ${dos}\n\nWe are available to answer your questions.\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
      };
      return msgs[type];
    }
    const msgs = {
      welcome: `Bonjour ${n},\n\nMerci de nous avoir contactés ! Nous avons hâte de vous accompagner dans votre transformation.\n\nVotre numéro de dossier : ${dos}\n\nCliquez ici pour choisir votre rendez-vous :\n📅 [LIEN CALENDRIER]\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
      payment: `Bonjour ${n},\n\nPour confirmer votre réservation, veuillez envoyer votre dépôt par Interac e-transfer :\n\n📧 À : ${contact}\n💵 Montant : [MONTANT] USD\n📋 Référence : ${dos} (obligatoire dans le message)\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
      quote: `Bonjour ${n},\n\nVoici votre estimation personnalisée de MedArt Istanbul.\n\n📋 Dossier : ${dos}\n\nNous sommes disponibles pour répondre à vos questions.\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`,
    };
    return msgs[type];
  };

  const currentStage = STAGES[stage-1] || STAGES[0];
  const nextStage = STAGES[stage];
  const photos = PHOTO_ANGLES[client.procedure] || [];
  const userInitials = `${user.first_name[0]}${user.last_name[0]}`;

  return (
    <div style={{ width:340, background:"#fff", borderLeft:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", flexShrink:0, height:"100%", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ background:NAVY, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ color:"#fff", fontWeight:700, fontSize:14 }}>{client.first_name} {client.last_name}</div>
          <div style={{ color:CYAN, fontSize:11, fontWeight:600 }}>{client.dossier_number}</div>
          {client.readOnly && <div style={{ color:GOLD, fontSize:10, marginTop:2 }}>👁 Lecture seule</div>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:10, background:clientLang==='FR'?"#DBEAFE":"#FEF3C7", color:clientLang==='FR'?"#1E40AF":"#92400E", borderRadius:4, padding:"2px 7px", fontWeight:600 }}>{clientLang}</span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"rgba(255,255,255,.6)", cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
        </div>
      </div>

      {/* Stage */}
      <div style={{ padding:"10px 14px", borderBottom:`1px solid ${BORDER}`, flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:".05em", marginBottom:5 }}>{sl('pipelineStage')}</div>
        <select value={stage} onChange={e => updateStage(e.target.value)} disabled={client.readOnly}
          style={{ width:"100%", padding:"7px 10px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:12, fontWeight:600, color:NAVY, background:client.readOnly?"#F9FAFB":"#fff" }}>
          {STAGES.map(st => <option key={st.id} value={st.id}>{st.id}. {stageLabel(st, lang)}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${BORDER}`, overflowX:"auto", flexShrink:0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding:"8px 10px", border:"none", borderBottom:activeTab===tab.id?`2px solid ${TEAL}`:"2px solid transparent", background:"transparent", cursor:"pointer", fontSize:11, fontWeight:activeTab===tab.id?700:400, color:activeTab===tab.id?TEAL:MUTED, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:3 }}>
            <span>{tab.icon}</span><span>{lang==='EN'?tab.en:tab.fr}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex:1, overflowY:"auto", padding:14 }}>

        {/* INFO */}
        {activeTab === 'info' && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {[
                { l:"Email", v:client.email||"—" },
                { l:lang==='FR'?"Téléphone":"Phone", v:client.phone||"—" },
                { l:lang==='FR'?"Procédure":"Procedure", v:client.procedure||"—" },
                { l:"Source", v:client.source||"—" },
                { l:"Province", v:client.province_residence||"—" },
                { l:lang==='FR'?"Langue client":"Client lang.", v:clientLang },
                { l:"LPRPDE", v:client.lprpde_consent?"✓ Signé":"✗ Requis", c:client.lprpde_consent?"#3B6D11":"#A32D2D" },
                { l:"Waiver", v:client.waiver_signed?"✓ Signé":"✗ Requis", c:client.waiver_signed?"#3B6D11":"#A32D2D" },
              ].map((f,i) => (
                <div key={i} style={{ background:BG, borderRadius:7, padding:"8px 10px" }}>
                  <div style={{ fontSize:10, color:MUTED, marginBottom:2 }}>{f.l}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:f.c||"#1A1A2E" }}>{f.v}</div>
                </div>
              ))}
            </div>

            {!client.readOnly && (
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
                {!client.lprpde_consent && (
                  <button onClick={() => toggleConsent('lprpde_consent','lprpde_consent_date')}
                    style={{ background:"#FEF3C7", color:"#92400E", border:"1px solid #FCD34D", borderRadius:8, padding:"9px 12px", fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                    ✓ Marquer LPRPDE comme signé
                  </button>
                )}
                {!client.waiver_signed && (
                  <button onClick={() => toggleConsent('waiver_signed','waiver_signed_date')}
                    style={{ background:"#FEF3C7", color:"#92400E", border:"1px solid #FCD34D", borderRadius:8, padding:"9px 12px", fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                    ✓ Marquer Waiver comme signé
                  </button>
                )}
              </div>
            )}

            {client.notes && (
              <div style={{ background:BG, borderLeft:`3px solid ${TEAL}`, borderRadius:"0 8px 8px 0", padding:"10px 12px", fontSize:12, color:MUTED, lineHeight:1.6, marginBottom:14 }}>
                <div style={{ fontWeight:600, color:NAVY, marginBottom:4, fontSize:11 }}>Notes</div>
                {client.notes}
              </div>
            )}

            {!client.readOnly && nextStage && (
              <button onClick={() => updateStage(stage+1)}
                style={{ background:TEAL, color:"#fff", border:"none", borderRadius:8, padding:"10px", fontSize:12, fontWeight:700, cursor:"pointer", width:"100%", marginBottom:6 }}>
                → {lang==='FR'?'Étape suivante':'Next stage'} : {stageLabel(nextStage,lang)}
              </button>
            )}
            {!client.readOnly && stage > 1 && (
              <button onClick={() => updateStage(stage-1)}
                style={{ background:BG, color:MUTED, border:`1px solid ${BORDER}`, borderRadius:8, padding:"8px", fontSize:11, cursor:"pointer", width:"100%" }}>
                ← {lang==='FR'?'Étape précédente':'Previous stage'}
              </button>
            )}
          </>
        )}

        {/* PAYMENTS */}
        {activeTab === 'payments' && (
          <>
            <div style={{ background:"#E6F1FB", borderRadius:8, padding:"10px 12px", marginBottom:14, fontSize:12, color:"#0C447C" }}>
              💡 {lang==='FR'?'Toujours inscrire le numéro de dossier':'Always include the dossier number'} <strong>{client.dossier_number}</strong> {lang==='FR'?'dans le message de chaque transaction.':'in every transaction message.'}
            </div>

            {payments.length > 0 && (
              <div style={{ marginBottom:14 }}>
                {payments.map((p,i) => (
                  <div key={p.id||i} style={{ background:i%2===0?BG:"#fff", borderRadius:8, padding:"10px 12px", marginBottom:6, border:`1px solid ${BORDER}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:NAVY }}>{p.amount_usd} USD</span>
                      <span style={{ fontSize:11, background:p.status==='received'?"#D5FFC5":"#FEF3C7", color:p.status==='received'?"#3B6D11":"#92400E", borderRadius:20, padding:"2px 8px", fontWeight:600 }}>{p.status==='received'?'✓ Reçu':'⏳ En attente'}</span>
                    </div>
                    {p.amount_cad && <div style={{ fontSize:11, color:MUTED }}>≈ {parseFloat(p.amount_cad).toFixed(2)} CAD @ {p.currency_conversion_rate}</div>}
                    <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{p.direction==='nb_demande'?'📤 NB a demandé':'📥 Client a envoyé'} · {p.method}</div>
                    <div style={{ fontSize:10, color:TEAL, marginTop:2, fontWeight:600 }}>Réf: {p.stripe_dossier_ref||client.dossier_number}</div>
                  </div>
                ))}
              </div>
            )}

            {!showPayForm ? (
              <button onClick={() => setShowPayForm(true)} style={{ background:TEAL, color:"#fff", border:"none", borderRadius:8, padding:"9px", fontSize:12, fontWeight:700, cursor:"pointer", width:"100%" }}>
                + {lang==='FR'?'Enregistrer un paiement':'Record payment'}
              </button>
            ) : (
              <div style={{ background:BG, borderRadius:10, padding:12, border:`1px solid ${BORDER}` }}>
                <div style={{ fontWeight:600, color:NAVY, fontSize:13, marginBottom:10 }}>{lang==='FR'?'Nouveau paiement':'New payment'}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  {[
                    { l:"Montant (USD)", key:"amount_usd", ph:"Ex: 1200" },
                    { l:"Taux CAD (ex: 1.38)", key:"currency_conversion_rate", ph:"1.38" },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize:11, color:MUTED, marginBottom:3 }}>{f.l}</div>
                      <input value={newPayment[f.key]} onChange={e => setNewPayment(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                        style={{ width:"100%", padding:"7px 10px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:12, boxSizing:"border-box" }} />
                    </div>
                  ))}
                </div>
                {newPayment.amount_usd && newPayment.currency_conversion_rate && (
                  <div style={{ background:"#D5FFC5", borderRadius:7, padding:"7px 10px", fontSize:12, fontWeight:600, color:"#3B6D11", marginBottom:10 }}>
                    ≈ {(parseFloat(newPayment.amount_usd)*parseFloat(newPayment.currency_conversion_rate)).toFixed(2)} CAD
                  </div>
                )}
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:MUTED, marginBottom:3 }}>{lang==='FR'?'Direction':'Direction'}</div>
                  <select value={newPayment.direction} onChange={e => setNewPayment(p=>({...p,direction:e.target.value}))}
                    style={{ width:"100%", padding:"7px 10px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:12 }}>
                    <option value="nb_demande">📤 NB demande (Interac Request)</option>
                    <option value="client_envoie">📥 Client a envoyé</option>
                  </select>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:MUTED, marginBottom:3 }}>Méthode</div>
                  <select value={newPayment.method} onChange={e => setNewPayment(p=>({...p,method:e.target.value}))}
                    style={{ width:"100%", padding:"7px 10px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:12 }}>
                    <option value="e-transfer">Interac e-transfer</option>
                    <option value="stripe">Stripe (carte)</option>
                    <option value="other">Comptant</option>
                  </select>
                </div>
                <div style={{ background:"#FEF3C7", borderRadius:7, padding:"7px 10px", fontSize:11, color:"#92400E", marginBottom:10 }}>
                  ⚠️ Réf. dossier <strong>{client.dossier_number}</strong> ajoutée automatiquement dans toutes les transactions.
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={savePayment} disabled={saving} style={{ flex:1, background:TEAL, color:"#fff", border:"none", borderRadius:8, padding:"8px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    {saving?"...":lang==='FR'?'Enregistrer':'Save'}
                  </button>
                  <button onClick={() => setShowPayForm(false)} style={{ background:BG, color:MUTED, border:`1px solid ${BORDER}`, borderRadius:8, padding:"8px 12px", fontSize:12, cursor:"pointer" }}>✕</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <>
            <div style={{ background:"#E1F5EE", borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:12, color:"#085041" }}>
              📱 {lang==='FR'?'Messages générés en':'Messages generated in'} <strong>{clientLang === 'FR' ? 'Français' : 'English'}</strong> {lang==='FR'?'(langue du client)':'(client language)'}
            </div>
            {[
              { key:'welcome', label:lang==='FR'?'Message de bienvenue':'Welcome message' },
              { key:'payment', label:lang==='FR'?'Instructions de paiement':'Payment instructions' },
              { key:'quote',   label:lang==='FR'?'Envoi du devis':'Sending the quote' },
            ].map(msg => (
              <div key={msg.key} style={{ background:"#F0FFF4", border:"1px solid #83C365", borderRadius:10, padding:12, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#3B6D11" }}>📋 {msg.label}</div>
                  <button onClick={() => copyText(whatsappMsg(msg.key), msg.key)}
                    style={{ background:copied===msg.key?"#3B6D11":"#83C365", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer", transition:"background .2s" }}>
                    {copied===msg.key?'✓ Copié !':'Copier'}
                  </button>
                </div>
                <div style={{ fontSize:11, fontFamily:"monospace", color:"#1B5E20", background:"#fff", borderRadius:7, padding:"9px", lineHeight:1.8, whiteSpace:"pre-line", border:"0.5px solid #C0DD97" }}>
                  {whatsappMsg(msg.key)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'docs' && (
          <>
            <div style={{ marginBottom:12, fontSize:12, color:MUTED }}>
              Nomenclature : <strong style={{ color:TEAL }}>{clientLang}-{client.dossier_number}-[TYPE].pdf</strong>
            </div>
            {DOC_TYPES.map((dt, i) => {
              const filename = docFilename(clientLang, client.dossier_number||'DOSSIER', dt.type);
              const exists = documents.find(d => d.document_type === dt.type);
              return (
                <div key={dt.type} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${BORDER}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:7, background:exists?"#D5FFC5":"#F1F5F9", color:exists?"#3B6D11":MUTED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
                      {exists?"✓":"📄"}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:NAVY }}>{dt.fr}</div>
                      <div style={{ fontSize:10, color:MUTED }}>{filename}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, color:exists?TEAL:"#A32D2D", cursor:"pointer" }}>
                    {exists?"↓ Télécharger":dt.req?"Requis":"Ajouter"}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* PHOTOS */}
        {activeTab === 'photos' && (
          <>
            <div style={{ fontSize:12, color:MUTED, marginBottom:12 }}>
              {photos.length} {lang==='FR'?'angles requis pour':'angles required for'} {client.procedure}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {photos.map((angle,i) => (
                <div key={angle} style={{ background:i<2?"#E1F5EE":BG, border:`0.5px dashed ${i<2?"#9FE1CB":BORDER}`, borderRadius:9, aspectRatio:"1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer", fontSize:10, color:i<2?"#085041":MUTED, textAlign:"center", padding:4 }}>
                  <span style={{ fontSize:18 }}>{i<2?"✓":"+"}</span>
                  <span>{angle}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* JOURNAL */}
        {activeTab === 'journal' && (
          <>
            <div style={{ fontSize:12, color:MUTED, marginBottom:12 }}>{lang==='FR'?'Historique automatique de toutes les modifications':'Automatic log of all changes'}</div>
            {[
              { time:"2026-05-27 09:00", user:"PT", action:"Étape changée : 3 → 4 Devis reçu" },
              { time:"2026-05-16 10:15", user:"OB", action:"Waiver signé — document classé SharePoint" },
              { time:"2026-05-16 10:10", user:"OB", action:"LPRPDE signé — consentement confirmé" },
              { time:"2026-05-15 16:45", user:"PT", action:"Étape changée : 2 → 3 Soumis Dany" },
              { time:"2026-05-15 09:00", user:"PT", action:"Dossier créé — Source : Dany (Québec)" },
            ].map((log,i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:`1px solid ${BORDER}`, fontSize:11 }}>
                <div style={{ color:MUTED, whiteSpace:"nowrap", minWidth:110 }}>{log.time}</div>
                <div style={{ fontWeight:600, color:TEAL, minWidth:26 }}>{log.user}</div>
                <div style={{ color:MUTED, flex:1 }}>{log.action}</div>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}
