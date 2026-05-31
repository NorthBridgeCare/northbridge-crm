import{useState,useEffect}from"react";
import{loadSession,clearSession}from"./lib/auth";
import Login from"./pages/Login";
import Dashboard from"./pages/Dashboard";
export default function App(){
  const[user,setUser]=useState(null);
  const[checking,setChecking]=useState(true);
  useEffect(()=>{const s=loadSession();if(s)setUser(s);setChecking(false);},[]);
  if(checking)return<div style={{minHeight:"100vh",background:"#1B3A5C",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,.4)",fontSize:13,fontFamily:"sans-serif"}}>Chargement...</div>;
  if(!user)return<Login onLogin={setUser}/>;
  return<Dashboard user={user} onLogout={()=>{clearSession();setUser(null);}}/>;
}
