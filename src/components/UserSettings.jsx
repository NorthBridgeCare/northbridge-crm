import { useState } from "react";
import { updateUser } from "../lib/api";
import { NAVY, TEAL, BG, BORDER, MUTED, GOLD } from "../lib/constants";

export default function UserSettings({ lang, user, allUsers, onBack, onUsersUpdate }) {
  const [msg, setMsg] = useState("");

  const resetPassword = async (targetUser) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${targetUser.first_name} ${targetUser.last_name} ?`)) return;
    try {
      await updateUser(targetUser.id, { password_reset_required: true, is_first_login: true, password_hash: null });
      onUsersUpdate(allUsers.map(u => u.id === targetUser.id ? { ...u, password_reset_required: true } : u));
      setMsg(`✓ Mot de passe réinitialisé — ${targetUser.first_name} devra créer un nouveau mot de passe à sa prochaine connexion.`);
    } catch(e) { setMsg("Erreur: " + e.message); }
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:BG, minHeight:"100vh", padding:24 }}>
      <div style={{ maxWidth:600, margin:"0 auto" }}>
        <button onClick={onBack} style={{ background:"#fff", color:MUTED, border:`1px solid ${BORDER}`, borderRadius:8, padding:"6px 14px", fontSize:13, cursor:"pointer", marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>
          ← {lang==='FR'?'Retour au CRM':'Back to CRM'}
        </button>

        <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,.08)", marginBottom:20 }}>
          <div style={{ background:NAVY, padding:"16px 24px" }}>
            <div style={{ color:"#fff", fontWeight:700, fontSize:16 }}>{lang==='FR'?'Paramètres':'Settings'}</div>
            <div style={{ color:"#1BC4D8", fontSize:12, marginTop:2 }}>{user.first_name} {user.last_name} · {user.role}</div>
          </div>
          <div style={{ padding:24 }}>
            <div style={{ fontSize:13, fontWeight:600, color:NAVY, marginBottom:16, paddingBottom:8, borderBottom:`1px solid ${BORDER}` }}>
              {lang==='FR'?'Gestion des utilisateurs':'User Management'}
            </div>

            {msg && <div style={{ background:"#D5FFC5", color:"#3B6D11", padding:"10px 12px", borderRadius:8, fontSize:13, marginBottom:16 }}>{msg}</div>}

            {allUsers.map(u => (
              <div key={u.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:`1px solid ${BORDER}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:u.id===user.id?GOLD:NAVY, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>
                    {u.first_name[0]}{u.last_name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:NAVY }}>{u.first_name} {u.last_name}</div>
                    <div style={{ fontSize:11, color:MUTED }}>{u.role} · Langue: {u.lang_pref||'FR'}</div>
                  </div>
                </div>
                {user.role === 'super_admin' && u.id !== user.id && (
                  <button onClick={() => resetPassword(u)}
                    style={{ background:"#FEF3C7", color:"#92400E", border:"1px solid #FCD34D", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    🔑 {lang==='FR'?'Réinitialiser MDP':'Reset password'}
                  </button>
                )}
                {u.id === user.id && <span style={{ fontSize:11, color:TEAL, fontWeight:600 }}>← Vous</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
