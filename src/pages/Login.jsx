import { useState, useEffect } from "react";
import { hashPassword, verifyPassword, saveSession } from "../lib/auth";
import { getUsers, updateUser } from "../lib/api";
import { NAVY, TEAL, GOLD, CYAN } from "../lib/constants";

export default function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [needsReset, setNeedsReset] = useState(false);

  useEffect(() => {
    getUsers().then(data => {
      setUsers(data || []);
      setLoadingUsers(false);
    }).catch(() => setLoadingUsers(false));
  }, []);

  const selectedUser = users.find(u => u.id === selectedUserId);

  useEffect(() => {
    if (selectedUser) {
      setIsFirstLogin(selectedUser.is_first_login || !selectedUser.password_hash);
      setNeedsReset(selectedUser.password_reset_required || false);
      setError("");
      setPassword("");
      setConfirm("");
    }
  }, [selectedUserId]);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    setError("");
    setLoading(true);
    try {
      if (isFirstLogin || needsReset) {
        if (password.length < 6) { setError("Minimum 6 caractères."); setLoading(false); return; }
        if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); setLoading(false); return; }
        const hash = await hashPassword(password);
        await updateUser(selectedUser.id, {
          password_hash: hash,
          is_first_login: false,
          password_reset_required: false,
        });
        const updated = { ...selectedUser, password_hash: hash, is_first_login: false };
        saveSession(updated);
        onLogin(updated);
      } else {
        if (!password) { setError("Entrez votre mot de passe."); setLoading(false); return; }
        const ok = await verifyPassword(password, selectedUser.password_hash);
        if (!ok) { setError("Mot de passe incorrect."); setLoading(false); return; }
        saveSession(selectedUser);
        onLogin(selectedUser);
      }
    } catch (e) {
      setError("Erreur de connexion. Réessayez.");
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div style={{ minHeight:"100vh", background:NAVY, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ marginBottom:32, textAlign:"center" }}>
        <img src="/logo-stacked.png" alt="NorthBridge Medical Care Travel" style={{ height:100, filter:"brightness(0) invert(1)", opacity:.9 }} onError={e => { e.target.style.display='none'; }} />
        <div style={{ color:"rgba(255,255,255,.4)", fontSize:11, marginTop:8, letterSpacing:".08em", textTransform:"uppercase" }}>CRM — Accès sécurisé</div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:32, width:"100%", maxWidth:380, boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ fontSize:18, fontWeight:600, color:NAVY, marginBottom:6 }}>
          {isFirstLogin || needsReset ? "Créez votre mot de passe" : "Bonjour 👋"}
        </div>
        <div style={{ fontSize:13, color:"#6B7280", marginBottom:24 }}>
          {isFirstLogin || needsReset ? "Première connexion — choisissez un mot de passe sécurisé." : "Connectez-vous pour accéder au CRM NorthBridge."}
        </div>

        {loadingUsers ? (
          <div style={{ textAlign:"center", color:"#6B7280", padding:20 }}>Chargement...</div>
        ) : (
          <>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", display:"block", marginBottom:5 }}>Qui êtes-vous ?</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, color:NAVY, background:"#F9FAFB", outline:"none" }}
              >
                <option value="">— Sélectionner —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                ))}
              </select>
            </div>

            {selectedUserId && (
              <>
                {isFirstLogin || needsReset ? (
                  <>
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", display:"block", marginBottom:5 }}>Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Minimum 6 caractères"
                        style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box" }}
                      />
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", display:"block", marginBottom:5 }}>Confirmer le mot de passe</label>
                      <input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Répétez le mot de passe"
                        style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box" }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom:20 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:"#6B7280", display:"block", marginBottom:5 }}>Mot de passe</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Entrez votre mot de passe"
                      style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box" }}
                      autoFocus
                    />
                  </div>
                )}

                {error && (
                  <div style={{ background:"#FEE2E2", color:"#991B1B", padding:"8px 12px", borderRadius:8, fontSize:13, marginBottom:14 }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width:"100%", background:loading?"#9CA3AF":TEAL, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", transition:"background .15s" }}
                >
                  {loading ? "Connexion..." : isFirstLogin || needsReset ? "Créer et se connecter" : "Se connecter"}
                </button>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop:24, color:"rgba(255,255,255,.3)", fontSize:11 }}>
        NorthBridge Medical Care Travel Inc. · Ontario Inc. #1001590313
      </div>
    </div>
  );
}
