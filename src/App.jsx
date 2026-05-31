import{useState,useEffect,Component}from"react";
import{loadSession,clearSession}from"./lib/auth";
import Login from"./pages/Login";
import Dashboard from"./pages/Dashboard";

class ErrorBoundary extends Component{
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return{hasError:true,error};}
  componentDidCatch(error,info){console.error("CRM Error:",error,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{minHeight:"100vh",background:"#1B3A5C",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"sans-serif",padding:24}}>
          <div style={{fontSize:32,marginBottom:16}}>⚠️</div>
          <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>Une erreur s'est produite</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:24,maxWidth:400,textAlign:"center"}}>
            {this.state.error?.message||"Erreur inconnue"}
          </div>
          <button onClick={()=>{clearSession();window.location.reload();}}
            style={{background:"#0A7E8C",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>
            Se déconnecter et réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App(){
  const[user,setUser]=useState(null);
  const[checking,setChecking]=useState(true);
  useEffect(()=>{
    try{const s=loadSession();if(s)setUser(s);}catch{clearSession();}
    setChecking(false);
  },[]);
  if(checking)return<div style={{minHeight:"100vh",background:"#1B3A5C",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,.4)",fontSize:13,fontFamily:"sans-serif"}}>Chargement...</div>;
  if(!user)return<ErrorBoundary><Login onLogin={setUser}/></ErrorBoundary>;
  return<ErrorBoundary><Dashboard user={user} onLogout={()=>{clearSession();setUser(null);}}/></ErrorBoundary>;
}
