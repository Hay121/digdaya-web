import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, createContext, useCallback, useContext } from "react";
import "../styles/globals.css";

type ToastType = "success"|"error"|"info"|"warning";
type Toast = { id:number; message:string; type:ToastType };

export const ThemeContext = createContext<{theme:string; toggle:()=>void}>({ theme:"dark", toggle:()=>{} });
export const ToastContext  = createContext<{addToast:(msg:string,type?:ToastType)=>void}>({ addToast:()=>{} });

export function useToast() { return useContext(ToastContext); }
export function useTheme() { return useContext(ThemeContext); }

export default function App({ Component, pageProps }: AppProps) {
  const router  = useRouter();
  const [progress, setProgress] = useState(false);
  const [fadeKey, setFadeKey]   = useState(0);
  const [toasts,  setToasts]    = useState<Toast[]>([]);
  const [theme,   setTheme]     = useState("dark");

  useEffect(()=>{
    const saved = localStorage.getItem("digdaya_theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  },[]);

  const toggle = useCallback(()=>{
    setTheme(t=>{
      const next = t==="dark"?"light":"dark";
      localStorage.setItem("digdaya_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  },[]);

  useEffect(()=>{
    const start = () => setProgress(true);
    const end   = () => { setProgress(false); setFadeKey(k=>k+1); };
    router.events.on("routeChangeStart",    start);
    router.events.on("routeChangeComplete", end);
    router.events.on("routeChangeError",    end);
    return ()=>{
      router.events.off("routeChangeStart",    start);
      router.events.off("routeChangeComplete", end);
      router.events.off("routeChangeError",    end);
    };
  },[router]);

  const addToast = useCallback((message:string, type:ToastType="success")=>{
    const id = Date.now();
    setToasts(t=>[...t,{id,message,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 3800);
  },[]);

  const TOAST_CFG:Record<ToastType,{bg:string;icon:string}> = {
    success: { bg:"linear-gradient(135deg,#02C39A,#028090)", icon:"✓" },
    error:   { bg:"linear-gradient(135deg,#EF4444,#DC2626)", icon:"✕" },
    info:    { bg:"linear-gradient(135deg,#028090,#0369A1)", icon:"ⓘ" },
    warning: { bg:"linear-gradient(135deg,#F4A261,#E58C3A)", icon:"⚠" },
  };

  return (
    <ThemeContext.Provider value={{theme,toggle}}>
      <ToastContext.Provider value={{addToast}}>
        {progress && <div className="progress-bar"/>}
        <div key={fadeKey} className="page-wrap">
          <Component {...pageProps}/>
        </div>
        <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:340}}>
          {toasts.map(t=>(
            <div key={t.id} className="toast-item" style={{background:TOAST_CFG[t.type].bg,color:"#fff",padding:"12px 18px",borderRadius:11,fontSize:13,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,.4)",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}>
              <span style={{fontSize:16,flexShrink:0}}>{TOAST_CFG[t.type].icon}</span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
}
