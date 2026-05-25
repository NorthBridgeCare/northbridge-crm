import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://aasaurziblltwyrykipv.supabase.co";
const SUPABASE_KEY = "sb_publishable_c4DWHq93Ts6Lzy_pRMz-lw_j256n5Kp";

const C = {
  navy: "#1B3A5C", teal: "#0A7E8C", tealLight: "#1BC4D8",
  gold: "#C49A3C", white: "#FFFFFF", bg: "#F0F4F8",
  text: "#010101", muted: "#606060", border: "#E2E8F0",
  green: "#83C365", greenLight: "#D5FFC5",
  cardBg: "#FFFFFF"
};

const STAGES = [
  { id: 1, fr: "Découverte",            en: "Discovery",          color: "#E1F5EE", accent: "#0A7E8C" },
  { id: 2, fr: "Qualification",         en: "Qualification",      color: "#E6F1FB", accent: "#1B3A5C" },
  { id: 3, fr: "Soumis Dany/MedArt",   en: "Submitted to Dany",  color: "#FEF3C7", accent: "#D97706" },
  { id: 4, fr: "Devis reçu",           en: "Quote Received",      color: "#EDE9FE", accent: "#6D28D9" },
  { id: 5, fr: "Confirmé / Réservé",   en: "Confirmed / Booked",  color: "#D5FFC5", accent: "#3B6D11" },
  { id: 6, fr: "Istanbul",             en: "In Treatment",        color: "#FEE2E2", accent: "#991B1B" },
  { id: 7, fr: "Retour & Récup.",      en: "Return & Recovery",   color: "#FCE7F3", accent: "#9D174D" },
  { id: 8, fr: "Témoignage",          en: "Testimonial",          color: "#F1F5F9", accent: "#475569" },
];

const PROCEDURES = [
  "Transplantation capillaire","Rhinoplastie","Augmentation mammaire",
  "LipoHD Vaser","Chirurgie obésité","Soins dentaires"
];
const SOURCES = [
  "Instagram","Facebook","TikTok","Dany (Québec)","Référence client","Organique","Autre"
];
const PROC_COLORS = {
  "Transplantation capillaire": ["#A4E988","#1B5E20"],
  "Rhinoplastie":               ["#A2F5FF","#006064"],
  "Augmentation mammaire":      ["#FFB3C6","#880E4F"],
  "LipoHD Vaser":               ["#FFD9A0","#7B3800"],
  "Chirurgie obésité":          ["#FFCCBC","#BF360C"],
  "Soins dentaires":            ["#B3E5FC","#01579B"],
};

const api = async (endpoint, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.method === "POST" ? { "Prefer": "return=representation" } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
};

const sl = (lang, fr, en) => lang === "FR" ? fr : en;

const EMPTY_CLIENT = {
  first_name: "", last_name: "", email: "", phone: "",
  language: "FR", province_residence: "Ontario",
  procedure: "Transplantation capillaire", source: "Instagram",
  company_prefix: "NB", province_code: "ON", notes: "",
  dany_content_trigger: false, is_group_travel: false,
};

export default function App() {
  const [lang, setLang] = useState("FR");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("pipeline");
  const [selectedClient, setSelectedClient] = useState(null);
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api("clients?select=*&order=created_at.desc");
      setClients(data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const createClient = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    setSaving(true);
    try {
      const [newClient] = await api("clients", {
        method: "POST",
        body: JSON.stringify({ ...form, current_stage: 1 }),
      });
      setClients(prev => [newClient, ...prev]);
      setView("pipeline");
      setForm(EMPTY_CLIENT);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const updateStage = async (clientId, newStage) => {
    try {
      await api(`clients?id=eq.${clientId}`, {
        method: "PATCH",
        body: JSON.stringify({ current_stage: newStage }),
      });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, current_stage: newStage } : c));
      if (selectedClient?.id === clientId) setSelectedClient(prev => ({ ...prev, current_stage: newStage }));
    } catch (e) { setError(e.message); }
  };

  const updateField = async (clientId, fields) => {
    try {
      await api(`clients?id=eq.${clientId}`, {
        method: "PATCH",
        body: JSON.stringify(fields),
      });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...fields } : c));
      if (selectedClient?.id === clientId) setSelectedClient(prev => ({ ...prev, ...fields }));
    } catch (e) { setError(e.message); }
  };

  const copyWhatsApp = (client) => {
    const msg = client.language === "FR"
      ? `Bonjour ${client.first_name},\n\nVotre dossier NorthBridge est maintenant ouvert.\n📋 Numéro de dossier : ${client.dossier_number || "En cours..."}\n\nVeuillez inscrire ce numéro dans le message de votre e-transfer.\n\nNous vous contacterons sous peu.\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`
      : `Hello ${client.first_name},\n\nYour NorthBridge file is now open.\n📋 File number: ${client.dossier_number || "Processing..."}\n\nPlease include this number in your e-transfer message.\n\nWe will contact you shortly.\n\nNorthBridge Medical Care Travel\n📞 613.366.9941`;
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = clients.filter(c =>
    !search || `${c.first_name} ${c.last_name} ${c.dossier_number || ""} ${c.procedure || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const byStage = (sid) => filtered.filter(c => c.current_stage === sid);
  const totalRevenue = clients.filter(c => c.current_stage >= 5).reduce((s, c) => s + (c.dossier_fee_cad || 0), 0);
  const convRate = clients.length ? Math.round(clients.filter(c => c.current_stage >= 5).length / clients.length * 100) : 0;
  const missingConsent = clients.filter(c => !c.lprpde_consent && c.current_stage >= 2).length;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>

      {/* HEADER */}
      <div style={{ background: C.navy, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 5, height: 28, background: C.gold, borderRadius: 3 }} />
          <div>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>NorthBridge</span>
            <span style={{ color: C.tealLight, fontSize: 13, marginLeft: 6 }}>CRM</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={sl(lang, "Rechercher un client...", "Search client...")}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px", color: C.white, fontSize: 13, width: 220, outline: "none" }} />
          <button onClick={() => { setView("new"); setSelectedClient(null); }}
            style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
            + {sl(lang, "Nouveau client", "New client")}
          </button>
          <button onClick={() => setLang(l => l === "FR" ? "EN" : "FR")}
            style={{ background: "rgba(255,255,255,0.12)", color: C.white, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
            {lang === "FR" ? "EN" : "FR"}
          </button>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.navy, flexShrink: 0 }}>PT</div>
        </div>
      </div>

      {/* NAV */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex" }}>
        {[
          { id: "pipeline", fr: "Pipeline", en: "Pipeline" },
          { id: "list", fr: "Liste clients", en: "Client List" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            style={{ padding: "12px 18px", border: "none", borderBottom: view === tab.id ? `3px solid ${C.teal}` : "3px solid transparent", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: view === tab.id ? 700 : 400, color: view === tab.id ? C.teal : C.muted }}>
            {sl(lang, tab.fr, tab.en)}
          </button>
        ))}
      </div>

      {/* STATS */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "10px 20px", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {[
          { label: sl(lang, "Clients actifs", "Active clients"), val: clients.filter(c => c.current_stage < 8).length, color: C.teal },
          { label: sl(lang, "Total pipeline", "Total pipeline"), val: clients.length, color: C.navy },
          { label: sl(lang, "Taux conversion", "Conv. rate"), val: `${convRate}%`, color: "#3B6D11" },
          { label: sl(lang, "Revenus confirmés", "Confirmed revenue"), val: `${totalRevenue.toLocaleString()} $`, color: C.gold },
          { label: sl(lang, "LPRPDE manquant", "LPRPDE missing"), val: missingConsent, color: missingConsent > 0 ? "#991B1B" : "#3B6D11" },
        ].map((s, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", padding: "10px 20px", color: "#991B1B", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}

      {/* NEW CLIENT FORM */}
      {view === "new" && (
        <div style={{ maxWidth: 700, margin: "24px auto", background: C.white, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ background: C.navy, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>{sl(lang, "Nouveau dossier client", "New Client File")}</span>
            <span style={{ color: C.tealLight, fontSize: 12 }}>Étape 1 — Découverte</span>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {[
                { key: "first_name", label: sl(lang, "Prénom *", "First name *"), ph: "John" },
                { key: "last_name", label: sl(lang, "Nom *", "Last name *"), ph: "Doe" },
                { key: "email", label: "Email", ph: "john@email.com" },
                { key: "phone", label: sl(lang, "Téléphone", "Phone"), ph: "613-555-0100" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.ph}
                    style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: "none" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {[
                { key: "procedure", label: sl(lang, "Procédure", "Procedure"), opts: PROCEDURES },
                { key: "source", label: "Source", opts: SOURCES },
                { key: "language", label: sl(lang, "Langue client", "Client language"), opts: ["FR", "EN"] },
                { key: "province_residence", label: "Province", opts: ["Ontario", "Québec", "Autre"] },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{f.label}</label>
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14 }}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={3} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={createClient} disabled={saving || !form.first_name.trim() || !form.last_name.trim()}
                style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving || !form.first_name.trim() ? 0.6 : 1 }}>
                {saving ? sl(lang, "Création...", "Creating...") : sl(lang, "Créer le dossier", "Create file")}
              </button>
              <button onClick={() => { setView("pipeline"); setForm(EMPTY_CLIENT); }}
                style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
                {sl(lang, "Annuler", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIPELINE + DETAIL */}
      {!["new","list"].includes(view) && (
        <div style={{ display: "flex", height: "calc(100vh - 170px)" }}>
          {/* Kanban */}
          <div style={{ flex: 1, overflowX: "auto", padding: "16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            {loading ? (
              <div style={{ margin: "80px auto", color: C.muted }}>{sl(lang, "Chargement...", "Loading...")}</div>
            ) : STAGES.map(stage => (
              <div key={stage.id} style={{ minWidth: 185, width: 185, flexShrink: 0 }}>
                <div style={{ background: stage.color, borderRadius: 8, padding: "7px 10px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: stage.accent }}>{sl(lang, stage.fr, stage.en)}</span>
                  <span style={{ background: stage.accent, color: C.white, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{byStage(stage.id).length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {byStage(stage.id).map(client => {
                    const [pb, pt] = PROC_COLORS[client.procedure] || ["#E2E8F0","#475569"];
                    const isSel = selectedClient?.id === client.id;
                    return (
                      <div key={client.id} onClick={() => { setSelectedClient(client); setView("detail"); }}
                        style={{ background: C.white, border: isSel ? `2px solid ${C.teal}` : `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", boxShadow: isSel ? `0 0 0 3px #1BC4D833` : "0 1px 3px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{client.first_name} {client.last_name}</div>
                        {client.dossier_number && <div style={{ fontSize: 10, color: C.teal, fontWeight: 700, marginBottom: 4 }}>{client.dossier_number}</div>}
                        <div style={{ display: "inline-block", background: pb, color: pt, fontSize: 9, fontWeight: 700, borderRadius: 20, padding: "2px 7px", marginBottom: 4 }}>{client.procedure}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: C.muted }}>{client.source}</span>
                          <span style={{ fontSize: 10, background: client.language === "FR" ? "#DBEAFE" : "#FEF3C7", color: client.language === "FR" ? "#1E40AF" : "#92400E", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>{client.language}</span>
                        </div>
                        {!client.lprpde_consent && client.current_stage >= 2 && (
                          <div style={{ marginTop: 5, fontSize: 9, color: "#92400E", background: "#FEF3C7", borderRadius: 4, padding: "2px 6px" }}>⚠ LPRPDE requis</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* DETAIL PANEL */}
          {selectedClient && view === "detail" && (
            <div style={{ width: 330, background: C.white, borderLeft: `1px solid ${C.border}`, overflowY: "auto", flexShrink: 0 }}>
              <div style={{ background: C.navy, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{selectedClient.first_name} {selectedClient.last_name}</div>
                  {selectedClient.dossier_number && <div style={{ color: C.tealLight, fontSize: 11, fontWeight: 600 }}>{selectedClient.dossier_number}</div>}
                </div>
                <button onClick={() => { setSelectedClient(null); setView("pipeline"); }}
                  style={{ background: "transparent", border: "none", color: C.white, cursor: "pointer", fontSize: 20, opacity: 0.7 }}>×</button>
              </div>

              <div style={{ padding: 16 }}>
                {/* Stage */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sl(lang, "Étape du pipeline", "Pipeline stage")}</label>
                  <select value={selectedClient.current_stage}
                    onChange={e => updateStage(selectedClient.id, parseInt(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.navy }}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.id}. {sl(lang, s.fr, s.en)}</option>)}
                  </select>
                </div>

                {/* Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[
                    { label: sl(lang, "Procédure", "Procedure"), val: selectedClient.procedure },
                    { label: "Source", val: selectedClient.source },
                    { label: "Email", val: selectedClient.email || "—" },
                    { label: sl(lang, "Téléphone", "Phone"), val: selectedClient.phone || "—" },
                    { label: "Province", val: selectedClient.province_residence || "—" },
                    { label: sl(lang, "Langue", "Language"), val: selectedClient.language },
                    { label: "LPRPDE", val: selectedClient.lprpde_consent ? "✓ Signé" : "✗ Requis", c: selectedClient.lprpde_consent ? "#3B6D11" : "#991B1B" },
                    { label: "Waiver", val: selectedClient.waiver_signed ? "✓ Signé" : "✗ Requis", c: selectedClient.waiver_signed ? "#3B6D11" : "#991B1B" },
                  ].map((f, i) => (
                    <div key={i} style={{ background: C.bg, borderRadius: 6, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: f.c || C.text }}>{f.val}</div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sl(lang, "Actions rapides", "Quick actions")}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {!selectedClient.lprpde_consent && (
                      <button onClick={() => updateField(selectedClient.id, { lprpde_consent: true, lprpde_consent_date: new Date().toISOString() })}
                        style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                        ✓ {sl(lang, "Marquer LPRPDE comme signé", "Mark LPRPDE as signed")}
                      </button>
                    )}
                    {!selectedClient.waiver_signed && (
                      <button onClick={() => updateField(selectedClient.id, { waiver_signed: true, waiver_signed_date: new Date().toISOString() })}
                        style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                        ✓ {sl(lang, "Marquer Waiver comme signé", "Mark Waiver as signed")}
                      </button>
                    )}
                  </div>
                </div>

                {/* WhatsApp template */}
                <div style={{ background: "#F0FFF4", borderRadius: 8, padding: "12px", marginBottom: 14, border: "1px solid #83C365" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#3B6D11", marginBottom: 8 }}>📱 {sl(lang, "Message WhatsApp prêt", "WhatsApp message ready")}</div>
                  <div style={{ fontSize: 11, color: "#1B5E20", background: C.white, borderRadius: 6, padding: "10px", lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap", marginBottom: 8 }}>
                    {selectedClient.language === "FR"
                      ? `Bonjour ${selectedClient.first_name},\n\nVotre dossier NorthBridge est ouvert.\n📋 ${selectedClient.dossier_number || "En cours..."}\n\nInscrivez ce numéro dans le message de votre e-transfer.\n\nNorthBridge | 613.366.9941`
                      : `Hello ${selectedClient.first_name},\n\nYour NorthBridge file is open.\n📋 ${selectedClient.dossier_number || "Processing..."}\n\nPlease include this number in your e-transfer.\n\nNorthBridge | 613.366.9941`}
                  </div>
                  <button onClick={() => copyWhatsApp(selectedClient)}
                    style={{ width: "100%", background: copied ? "#3B6D11" : "#83C365", color: C.white, border: "none", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}>
                    {copied ? sl(lang, "✓ Copié !", "✓ Copied!") : sl(lang, "Copier le message", "Copy message")}
                  </button>
                </div>

                {/* Notes */}
                {selectedClient.notes && (
                  <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 14, borderLeft: `3px solid ${C.teal}` }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4 }}>Notes</div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{selectedClient.notes}</div>
                  </div>
                )}

                {/* Navigation */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedClient.current_stage < 8 && (
                    <button onClick={() => updateStage(selectedClient.id, selectedClient.current_stage + 1)}
                      style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      {sl(lang, "→ Étape suivante", "→ Next stage")} : {sl(lang, STAGES[selectedClient.current_stage]?.fr, STAGES[selectedClient.current_stage]?.en)}
                    </button>
                  )}
                  {selectedClient.current_stage > 1 && (
                    <button onClick={() => updateStage(selectedClient.id, selectedClient.current_stage - 1)}
                      style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer" }}>
                      {sl(lang, "← Étape précédente", "← Previous stage")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div style={{ padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.navy }}>
                  {[sl(lang,"Dossier","File"), sl(lang,"Client","Client"), sl(lang,"Procédure","Procedure"), "Source", sl(lang,"Étape","Stage"), "LPRPDE", sl(lang,"Langue","Lang."), sl(lang,"Créé le","Created")].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: C.white, fontSize: 12, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const stage = STAGES.find(s => s.id === c.current_stage);
                  return (
                    <tr key={c.id} onClick={() => { setSelectedClient(c); setView("detail"); }}
                      style={{ background: i % 2 === 0 ? C.white : C.bg, cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: C.teal }}>{c.dossier_number || "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12 }}>{c.procedure}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>{c.source}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {stage && <span style={{ background: stage.color, color: stage.accent, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 9px", whiteSpace: "nowrap" }}>{sl(lang, stage.fr, stage.en)}</span>}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 14, color: c.lprpde_consent ? "#3B6D11" : "#991B1B" }}>{c.lprpde_consent ? "✓" : "✗"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: c.language === "FR" ? "#DBEAFE" : "#FEF3C7", color: c.language === "FR" ? "#1E40AF" : "#92400E", fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "2px 7px" }}>{c.language}</span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: C.muted }}>{new Date(c.created_at).toLocaleDateString(lang === "FR" ? "fr-CA" : "en-CA")}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 50, textAlign: "center", color: C.muted }}>{sl(lang, "Aucun client trouvé.", "No clients found.")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
