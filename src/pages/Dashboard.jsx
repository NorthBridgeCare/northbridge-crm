import { useState, useEffect, useCallback } from "react";
import { getClients, createClient, updateClient, lockDossier, unlockDossier, getActiveSessions, updateUser, getUsers, addAuditLog } from "../lib/api";
import { clearSession } from "../lib/auth";
import { STAGES, PROCEDURES, SOURCES, PROC_COLORS, NAVY, TEAL, CYAN, GOLD, BG, BORDER, MUTED } from "../lib/constants";
import { t, stageLabel } from "../lib/i18n";
import ClientDossier from "../components/ClientDossier";
import NewClientForm from "../components/NewClientForm";
import UserSettings from "../components/UserSettings";

export default function Dashboard({ user, onLogout }) {
  const [lang, setLang] = useState(user.lang_pref || 'FR');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterProc, setFilterProc] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterLprpde, setFilterLprpde] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(data || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getActiveSessions();
      setActiveSessions(data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchClients();
    getUsers().then(u => setAllUsers(u || []));
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchClients, fetchSessions]);

  const toggleLang = async () => {
    const newLang = lang === 'FR' ? 'EN' : 'FR';
    setLang(newLang);
    try { await updateUser(user.id, { lang_pref: newLang }); } catch {}
  };

  const openDossier = async (client) => {
    const session = activeSessions.find(s => s.client_id === client.id);
    if (session && session.user_id !== user.id) {
      const lockedUser = allUsers.find(u => u.id === session.user_id);
      const name = lockedUser ? `${lockedUser.first_name} ${lockedUser.last_name}` : "un autre utilisateur";
      if (!window.confirm(`Ce dossier est en cours d'édition par ${name}. Ouvrir en lecture seule ?`)) return;
      setSelectedClient({ ...client, readOnly: true });
    } else {
      try { await lockDossier(client.id, user.id); } catch {}
      setSelectedClient({ ...client, readOnly: false });
      await fetchSessions();
    }
  };

  const closeDossier = async () => {
    if (selectedClient && !selectedClient.readOnly) {
      try { await unlockDossier(selectedClient.id); } catch {}
    }
    setSelectedClient(null);
    await fetchSessions();
  };

  const handleClientUpdate = (updated) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedClient(prev => prev && prev.id === updated.id ? { ...updated, readOnly: prev.readOnly } : prev);
  };

  const handleNewClient = (newClient) => {
    setClients(prev => [newClient, ...prev]);
    setShowNewForm(false);
    addAuditLog(user.id, 'CREATE', 'clients', newClient.id, { dossier: newClient.dossier_number });
  };

  const filtered = clients.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      if (!`${c.first_name} ${c.last_name} ${c.dossier_number||''} ${c.procedure||''}`.toLowerCase().includes(q)) return false;
    }
    if (filterStage && c.current_stage !== parseInt(filterStage)) return false;
    if (filterProc && c.procedure !== filterProc) return false;
    if (filterSource && c.source !== filterSource) return false;
    if (filterLprpde && c.lprpde_consent) return false;
    return true;
  });

  const byStage = (n) => filtered.filter(c => c.current_stage === n);
  const activeCount = clients.filter(c => c.current_stage < 8).length;
  const confirmedRevUSD = clients.filter(c => c.current_stage >= 5).reduce((s, c) => s + (c.dossier_fee_cad || 0), 0);
  const convRate = clients.length ? Math.round(clients.filter(c => c.current_stage >= 5).length / clients.length * 100) : 0;
  const lprpdeMissing = clients.filter(c => !c.lprpde_consent && c.current_stage >= 2).length;

  const initials = (c) => `${(c.first_name||'')[0]||''}${(c.last_name||'')[0]||''}`.toUpperCase();
  const stageOf = (n) => STAGES[n-1] || STAGES[0];
  const procBg = (p) => (PROC_COLORS[p]||['#E2E8F0','#475569'])[0];
  const procTx = (p) => (PROC_COLORS[p]||['#E2E8F0','#475569'])[1];

  const sl = (key) => t(lang, key);

  if (showNewForm) return (
    <NewClientForm lang={lang} user={user} onSave={handleNewClient} onCancel={() => setShowNewForm(false)} />
  );

  if (showSettings) return (
    <UserSettings lang={lang} user={user} allUsers={allUsers} onBack={() => setShowSettings(false)} onUsersUpdate={setAllUsers} />
  );

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:BG, minHeight:"100vh", color:"#1A1A2E" }}>
      <div style={{ background:NAVY, padding:"0 16px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 8px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src="/logo-horizontal.png" alt="NorthBridge" style={{ height:28, filter:"brightness(0) invert(1)", opacity:.9 }} onError={e => { e.target.style.display='none'; }} />
          <span style={{ color:CYAN, fontSize:11, fontWeight:500, letterSpacing:".06em", textTransform:"uppercase", marginLeft:4 }}>CRM</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={sl('search')}
            style={{ background:"rgba(255,255,255,.1)", border:"0.5px solid rgba(255,255,255,.15)", borderRadius:8, padding:"5px 10px", color:"#fff", fontSize:12, width:180, outline:"none" }} />
          <div style={{ display:"flex", background:"rgba(255,255,255,.1)", borderRadius:8, overflow:"hidden", border:"0.5px solid rgba(255,255,255,.15)" }}>
            <button onClick={() => setView('list')} style={{ padding:"5px 10px", color:view==='list'?"#fff":"rgba(255,255,255,.4)", background:view==='list'?"rgba(255,255,255,.15)":"transparent", border:"none", cursor:"pointer", fontSize:12, fontWeight:500 }}>☰ {sl('clientList')}</button>
            <button onClick={() => setView('grid')} style={{ padding:"5px 10px", color:view==='grid'?"#fff":"rgba(255,255,255,.4)", background:view==='grid'?"rgba(255,255,255,.15)":"transparent", border:"none", cursor:"pointer", fontSize:12, fontWeight:500 }}>⊞ {lang==='FR'?'Étapes':'Stages'}</button>
          </div>
          <button onClick={() => setShowNewForm(true)} style={{ background:TEAL, color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>{sl('newClient')}</button>
          <button onClick={toggleLang} style={{ background:"rgba(255,255,255,.1)", color:"#fff", border:"0.5px solid rgba(255,255,255,.2)", borderRadius:8, padding:"5px 10px", fontSize:12, fontWeight:600, cursor:"pointer" }}>{lang==='FR'?'EN':'FR'}</button>
          <div onClick={() => setShowSettings(true)} style={{ width:30, height:30, borderRadius:"50%", background:GOLD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:NAVY, cursor:"pointer" }}>
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <button onClick={() => { clearSession(); onLogout(); }} style={{ background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.5)", border:"none", borderRadius:8, padding:"5px 8px", fontSize:11, cursor:"pointer" }}>⏻</button>
        </div>
      </div>

      <div style={{ background:"#fff", borderBottom:`1px solid ${BORDER}`, padding:"10px 16px", display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
        {[
          { label:sl('activeClients'), val:activeCount, color:TEAL },
          { label:sl('totalPipeline'), val:clients.length, color:NAVY },
          { label:sl('convRate'), val:`${convRate}%`, color:"#3B6D11" },
          { label:sl('confirmedRev'), val:`${confirmedRevUSD.toLocaleString()} USD`, color:GOLD },
          { label:sl('lprpdeMissing'), val:lprpdeMissing, color:lprpdeMissing>0?"#991B1B":"#3B6D11" },
        ].map((st,i) => (
          <div key={i} style={{ background:BG, borderRadius:8, padding:"8px 12px" }}>
            <div style={{ fontSize:11, color:MUTED, marginBottom:2 }}>{st.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:st.color }}>{st.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff", borderBottom:`1px solid ${BORDER}`, padding:"8px 16px", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ fontSize:12, padding:"5px 10px", border:`1px solid ${BORDER}`, borderRadius:8 }}>
          <option value="">{sl('allStages')}</option>
          {STAGES.map(st => <option key={st.id} value={st.id}>{st.id} — {stageLabel(st,lang)}</option>)}
        </select>
        <select value={filterProc} onChange={e => setFilterProc(e.target.value)} style={{ fontSize:12, padding:"5px 10px", border:`1px solid ${BORDER}`, borderRadius:8 }}>
          <option value="">{sl('allProcs')}</option>
          {PROCEDURES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ fontSize:12, padding:"5px 10px", border:`1px solid ${BORDER}`, borderRadius:8 }}>
          <option value="">{sl('allSources')}</option>
          {SOURCES.map(sr => <option key={sr}>{sr}</option>)}
        </select>
        <label style={{ fontSize:12, color:MUTED, display:"flex", alignItems:"center", gap:5, marginLeft:"auto", cursor:"pointer" }}>
          <input type="checkbox" checked={filterLprpde} onChange={e => setFilterLprpde(e.target.checked)} />{sl('lprpdeOnly')}
        </label>
      </div>

      {error && <div style={{ background:"#FEE2E2", padding:"8px 16px", color:"#991B1B", fontSize:13 }}>⚠️ {error} <button onClick={() => setError(null)} style={{ background:"none", border:"none", cursor:"pointer", marginLeft:8, fontWeight:700 }}>×</button></div>}

      <div style={{ display:"flex", height:"calc(100vh - 165px)" }}>
        {view === 'list' && (
          <div style={{ flex:1, overflowY:"auto", background:"#fff" }}>
            {loading ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>{sl('loading')}</div>
             : filtered.length === 0 ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>{sl('noClients')}</div>
             : filtered.map((c, i) => {
              const st = stageOf(c.current_stage);
              const session = activeSessions.find(s => s.client_id === c.id && s.user_id !== user.id);
              const lockedUser = session ? allUsers.find(u => u.id === session.user_id) : null;
              const isSelected = selectedClient?.id === c.id;
              return (
                <div key={c.id} onClick={() => openDossier(c)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:`1px solid ${BORDER}`, cursor:"pointer", background:isSelected?"#E6F1FB":i%2===0?"#fff":"#FAFAFA" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:procBg(c.procedure), color:procTx(c.procedure), display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, flexShrink:0 }}>{initials(c)}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:2, display:"flex", alignItems:"center", gap:8 }}>
                      {c.first_name} {c.last_name}
                      {lockedUser && <span style={{ fontSize:10, background:"#FEF3C7", color:"#92400E", borderRadius:4, padding:"1px 6px", fontWeight:500 }}>🔒 {lockedUser.first_name}</span>}
                    </div>
                    <div style={{ fontSize:11, color:MUTED, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      {c.dossier_number && <span style={{ color:TEAL, fontWeight:600 }}>{c.dossier_number}</span>}
                      {c.dossier_number && <span style={{ width:3, height:3, borderRadius:"50%", background:BORDER, display:"inline-block" }} />}
                      <span>{c.procedure}</span>
                      <span style={{ width:3, height:3, borderRadius:"50%", background:BORDER, display:"inline-block" }} />
                      <span>{c.source}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                    <span style={{ background:st.bg, color:st.tx, borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{st.id} — {stageLabel(st,lang)}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {!c.lprpde_consent && c.current_stage >= 2 && <span style={{ fontSize:10, color:"#A32D2D", fontWeight:600 }}>⚠ LPRPDE</span>}
                      <span style={{ fontSize:10, background:c.language==='FR'?"#DBEAFE":"#FEF3C7", color:c.language==='FR'?"#1E40AF":"#92400E", borderRadius:4, padding:"1px 5px", fontWeight:600 }}>{c.language||'FR'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'grid' && (
          <div style={{ flex:1, overflowY:"auto", padding:12, background:BG, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignContent:"start" }}>
            {STAGES.map(st => {
              const sc = byStage(st.id);
              return (
                <div key={st.id} style={{ background:"#fff", border:`1px solid ${BORDER}`, borderRadius:12, overflow:"hidden" }}>
                  <div style={{ background:st.bg, padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", background:st.tx, color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{st.id}</div>
                      <span style={{ fontSize:12, fontWeight:700, color:st.tx }}>{stageLabel(st,lang)}</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, background:`${st.tx}22`, color:st.tx, borderRadius:20, padding:"1px 8px" }}>{sc.length}</span>
                  </div>
                  <div style={{ padding:8 }}>
                    {sc.length === 0 && <div style={{ fontSize:11, color:MUTED, textAlign:"center", padding:"12px 8px" }}>Aucun client</div>}
                    {sc.map(c => (
                      <div key={c.id} onClick={() => openDossier(c)} style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:"8px 10px", marginBottom:6, cursor:"pointer" }}>
                        <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{c.first_name} {c.last_name}</div>
                        {c.dossier_number && <div style={{ fontSize:10, color:TEAL, fontWeight:700, marginBottom:2 }}>{c.dossier_number}</div>}
                        <div style={{ fontSize:10, color:MUTED }}>{c.procedure}</div>
                        {!c.lprpde_consent && c.current_stage >= 2 && <div style={{ fontSize:9, color:"#A32D2D", marginTop:3, fontWeight:600 }}>⚠ LPRPDE requis</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedClient && (
          <ClientDossier client={selectedClient} user={user} lang={lang} allUsers={allUsers} onClose={closeDossier} onUpdate={handleClientUpdate} />
        )}
      </div>
    </div>
  );
}
