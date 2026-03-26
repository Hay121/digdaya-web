import { useContext } from "react";
import { useRouter } from "next/router";
import { ThemeContext, LangContext } from "../pages/_app";

interface NavBarProps {
  rightItems?: React.ReactNode;
}

export default function NavBar({ rightItems }: NavBarProps) {
  const router = useRouter();
  const { theme, toggle } = useContext(ThemeContext);
  const { lang, setLang } = useContext(LangContext);

  return (
    <>
      <style>{`
        .nbtn{background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text3);padding:6px 14px;font-size:12px;cursor:pointer;font-family:var(--font);transition:all .2s;font-weight:500}
        .nbtn:hover{color:var(--text2);background:var(--bg2)}
      `}</style>
      <nav style={{position:"sticky",top:0,zIndex:100,background:theme==="dark"?"rgba(6,14,28,.97)":"rgba(240,244,248,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border2)",padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={()=>router.push("/")}>
          <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:"#fff",flexShrink:0}}>D</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,letterSpacing:-.3,color:"var(--text1)"}}>DIGDAYA</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {rightItems}
          <div style={{display:"flex",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",fontSize:11,fontWeight:700}}>
            <button onClick={()=>setLang("id")} style={{padding:"5px 11px",background:lang==="id"?"linear-gradient(135deg,#028090,#02C39A)":"transparent",color:lang==="id"?"#fff":"var(--text3)",border:"none",cursor:"pointer",fontFamily:"var(--font)",fontWeight:700,transition:"all .2s"}}>ID</button>
            <button onClick={()=>setLang("en")} style={{padding:"5px 11px",background:lang==="en"?"linear-gradient(135deg,#028090,#02C39A)":"transparent",color:lang==="en"?"#fff":"var(--text3)",border:"none",cursor:"pointer",fontFamily:"var(--font)",fontWeight:700,transition:"all .2s"}}>EN</button>
          </div>
          <button onClick={toggle} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"5px 10px",fontSize:15,cursor:"pointer",color:"var(--text2)",lineHeight:1}}>
            {theme==="dark"?"☀️":"🌙"}
          </button>
        </div>
      </nav>
    </>
  );
}
