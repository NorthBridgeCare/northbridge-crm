import { useState, useEffect } from "react";
import { loadSession, clearSession } from "./lib/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session) setUser(session);
    setChecking(false);
  }, []);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { clearSession(); setUser(null); };

  if (checking) {
    return (
      <div style={{ minHeight:"100vh", background:"#1B3A5C", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"rgba(255,255,255,.4)", fontSize:13 }}>Chargement...</div>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
