import { useState } from "react";
import { createClient, addAuditLog } from "../lib/api";
import { PROCEDURES, SOURCES, NAVY, TEAL, BG, BORDER, MUTED } from "../lib/constants";
import { t } from "../lib/i18n";

const PROVINCES = ["Ontario","Québec","Alberta","Colombie-Britannique","Autre"];
const REGIONS   = ["Ontario","Gatineau","Québec","GTA","Autre"];

export default function NewClientForm({ lang, user, onSave, onCancel }) {
  const sl = (k) => t(lang, k);
  const [form, setForm] = useState({
    first_name:"", last_name:"", email:"", phone:"",
    language:"FR", province_residence:"Ontario", region:"Ontario",
    procedure:"Transplantation capillaire", source:"Instagram",
    company_prefix:"NB", province_code:"ON",
    is_transfer_from_dany:false, dany_dossier_number:"",
    travel_group:"Solo", notes:"",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) { setError("Prénom et nom obligatoires."); return; }
    setSaving(true);
    try {
      const [newClient] = await createClient({ ...form, current_stage:1 });
      onSave(newClient);
    } catch(e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:BG, minHeight:"100vh", padding:24, color:"#1A1A2E" }}>
      <div style={{ maxWidth:700, margin:"0 auto", background:"#fff", borderRadius:14, boxShadow:"0 4px 20px rgba(0,0,0,.08)", overflow:"hidden" }}>
        <div style={{ background:NAVY, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"#fff", fontWeight:700, fontSize:16 }}>{sl('newClient').replace('+ ','')}</div>
            <div style={{ color:"#1BC4D8", fontSize:12, marginTop:2 }}>Étape 1 — Découverte</div>
          </div>
          <button onClick={onCancel} style={{ background:"rgba(255,255,255,.1)", color:"#fff", border:"0.5px solid rgba(255,255,255,.2)", borderRadius:8, padding:"5px 12px", fontSize:12, cursor:"pointer" }}>✕ Annuler</button>
        </div>

        <div style={{ padding:24 }}>
          {error && <div style={{ background:"#FEE2E2", color:"#991B1B", padding:"8px 12px", borderRadius:8, fontSize:13, marginBottom:16 }}>{error}</div>}

          <div style={{ fontSize:13, fontWeight:600, color:NAVY, marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>Informations personnelles</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            {[
              { k:"first_name", l:sl('firstName'), ph:"John" },
              { k:"last_name",  l:sl('lastName'),  ph:"Doe"  },
              { k:"email",      l:"Email",          ph:"john@email.com" },
              { k:"phone",      l:sl('phone'),      ph:"613-555-0100"   },
            ].map(f => (
              <div key={f.k}>
                <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>{f.l}</label>
                <input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph}
                  style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>

          <div style={{ fontSize:13, fontWeight:600, color:NAVY, marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${BORDER}` }}>Détails du dossier</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>{sl('procedure')}</label>
              <select value={form.procedure} onChange={e => set('procedure', e.target.value)}
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14 }}>
                {PROCEDURES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>{sl('source')}</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14 }}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>{sl('clientLang')}</label>
              <select value={form.language} onChange={e => set('language', e.target.value)}
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14 }}>
                <option value="FR">Français (FR)</option>
                <option value="EN">English (EN)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>Province</label>
              <select value={form.province_residence} onChange={e => set('province_residence', e.target.value)}
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14 }}>
                {PROVINCES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>Région</label>
              <select value={form.region} onChange={e => set('region', e.target.value)}
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14 }}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>Groupe de voyage</label>
              <select value={form.travel_group} onChange={e => set('travel_group', e.target.value)}
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14 }}>
                <option value="Solo">Solo</option>
                <option value="Groupe NB">Groupe NorthBridge</option>
                <option value="Groupe Dany">Groupe Dany</option>
                <option value="Groupe personnalisé">Groupe personnalisé</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, fontWeight:600, color:NAVY }}>
              <input type="checkbox" checked={form.is_transfer_from_dany} onChange={e => set('is_transfer_from_dany', e.target.checked)} />
              Dossier transféré de D Plastic Surgery (Dany)
            </label>
            {form.is_transfer_from_dany && (
              <div style={{ marginTop:10 }}>
                <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>Numéro de dossier Dany (DP-QC-XX-XXX)</label>
                <input value={form.dany_dossier_number} onChange={e => set('dany_dossier_number', e.target.value)} placeholder="DP-QC-26-001"
                  style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:12, fontWeight:600, color:MUTED, display:"block", marginBottom:4 }}>Notes internes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              style={{ width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, resize:"vertical", boxSizing:"border-box" }} />
          </div>

          <div style={{ background:"#E6F1FB", borderRadius:8, padding:"10px 12px", marginBottom:20, fontSize:12, color:"#0C447C" }}>
            ℹ️ Le numéro de dossier sera généré automatiquement. Le client recevra ses documents en <strong>{form.language === 'FR' ? 'Français' : 'English'}</strong>.
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleSave} disabled={saving || !form.first_name.trim() || !form.last_name.trim()}
              style={{ background:saving||!form.first_name.trim()?MUTED:TEAL, color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:14, fontWeight:700, cursor:"pointer", flex:1 }}>
              {saving ? "Création..." : sl('createDossier')}
            </button>
            <button onClick={onCancel} style={{ background:BG, color:MUTED, border:`1px solid ${BORDER}`, borderRadius:10, padding:"11px 18px", fontSize:14, cursor:"pointer" }}>
              {sl('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
