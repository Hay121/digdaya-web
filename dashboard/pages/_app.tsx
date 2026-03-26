import Head from "next/head";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, createContext, useCallback, useContext } from "react";
import "../styles/globals.css";

type ToastType = "success"|"error"|"info"|"warning";
type Toast     = { id:number; message:string; type:ToastType };
type Lang      = "id"|"en";

export const ThemeContext = createContext<{theme:string;toggle:()=>void}>({theme:"dark",toggle:()=>{}});
export const ToastContext = createContext<{addToast:(msg:string,type?:ToastType)=>void}>({addToast:()=>{}});
export const LangContext  = createContext<{lang:Lang;setLang:(l:Lang)=>void;t:(k:string)=>string}>({lang:"id",setLang:()=>{},t:(k)=>k});

export const TRANS: Record<string,Record<Lang,string>> = {
  "Daftar Gratis":           {id:"Daftar Gratis",           en:"Sign Up Free"},
  "Masuk":                   {id:"Masuk",                   en:"Login"},
  "Kredit UMKM":             {id:"Kredit UMKM",             en:"SME Credit"},
  "Tanpa Agunan":            {id:"Tanpa Agunan",             en:"No Collateral"},
  "Tanpa Diskriminasi":      {id:"Tanpa Diskriminasi",       en:"No Discrimination"},
  "Nama Lengkap":            {id:"Nama Lengkap",             en:"Full Name"},
  "Alamat Email":            {id:"Alamat Email",             en:"Email Address"},
  "Nomor WhatsApp":          {id:"Nomor WhatsApp",           en:"WhatsApp Number"},
  "Password":                {id:"Password",                 en:"Password"},
  "Konfirmasi Password":     {id:"Konfirmasi Password",      en:"Confirm Password"},
  "Buat Akun & Lanjut":      {id:"Buat Akun & Lanjut",       en:"Create Account & Continue"},
  "Masuk ke Dashboard":      {id:"Masuk ke Dashboard",       en:"Login to Dashboard"},
  "Belum punya akun?":       {id:"Belum punya akun?",        en:"Don't have an account?"},
  "Sudah punya akun?":       {id:"Sudah punya akun?",        en:"Already have an account?"},
  "Daftar sekarang":         {id:"Daftar sekarang",          en:"Register now"},
  "Semua field wajib diisi": {id:"Semua field wajib diisi",  en:"All fields are required"},
  "Password tidak cocok":    {id:"Password tidak cocok",     en:"Passwords do not match"},
  "Password minimal 6 karakter": {id:"Password minimal 6 karakter", en:"Password must be at least 6 characters"},
  "Kembali ke halaman utama":{id:"Kembali ke halaman utama", en:"Back to home"},
  "Profil Usaha":            {id:"Profil Usaha",             en:"Business Profile"},
  "Data Keuangan":           {id:"Data Keuangan",            en:"Financial Data"},
  "Rekam Jejak":             {id:"Rekam Jejak",              en:"Track Record"},
  "Dokumen":                 {id:"Dokumen",                  en:"Documents"},
  "Konfirmasi":              {id:"Konfirmasi",               en:"Confirmation"},
  "Lanjut":                  {id:"Lanjut",                   en:"Next"},
  "Kembali":                 {id:"Kembali",                  en:"Back"},
  "Dashboard":               {id:"Dashboard",                en:"Dashboard"},
  "Keluar":                  {id:"Keluar",                   en:"Logout"},
};

export function useToast() { return useContext(ToastContext); }
export function useTheme() { return useContext(ThemeContext); }
export function useLang()  { return useContext(LangContext);  }

export default function App({ Component, pageProps }: AppProps) {
  const router   = useRouter();
  const [progress,setProgress] = useState(false);
  const [fadeKey, setFadeKey]  = useState(0);
  const [toasts,  setToasts]   = useState<Toast[]>([]);
  const [theme,   setTheme]    = useState("dark");
  const [lang,    setLangState]= useState<Lang>("id");

  useEffect(()=>{
    const savedTheme = localStorage.getItem("digdaya_theme") || "dark";
    const savedLang  = (localStorage.getItem("digdaya_lang") || "id") as Lang;
    setTheme(savedTheme);
    setLangState(savedLang);
    document.documentElement.setAttribute("data-theme", savedTheme);
  },[]);

  const toggle = useCallback(()=>{
    setTheme(t=>{
      const next = t==="dark"?"light":"dark";
      localStorage.setItem("digdaya_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  },[]);

  // Auto-save session setiap kali halaman berubah
  useEffect(()=>{
    const saveSession = () => {
      const user = localStorage.getItem("digdaya_user");
      if(!user) return;
      try {
        const { id } = JSON.parse(user);
        if(!id) return;
        const SESSION_KEYS = [
          "digdaya_step","digdaya_score","digdaya_umkm_data",
          "digdaya_loan_status","digdaya_loan_amount","digdaya_tenor",
          "digdaya_tx_sig","digdaya_tx_hash","digdaya_tx_explorer",
          "digdaya_masked_entity","digdaya_disburse_sig","digdaya_disburse_explorer",
          "digdaya_approved_date","digdaya_paid_installments","digdaya_theme","digdaya_lang",
        ];
        const session: Record<string,string> = {};
        SESSION_KEYS.forEach(k=>{ const v=localStorage.getItem(k); if(v) session[k]=v; });
        localStorage.setItem("digdaya_session_"+id, JSON.stringify(session));
      } catch(e){}
    };
    router.events.on("routeChangeComplete", saveSession);
    return ()=>router.events.off("routeChangeComplete", saveSession);
  },[router]);

  const setLang = useCallback((l:Lang)=>{
    setLangState(l);
    localStorage.setItem("digdaya_lang", l);
  },[]);

  const t = useCallback((key:string)=>{
    return TRANS[key]?.[lang] || key;
  },[lang]);

  useEffect(()=>{
    const start = ()=>setProgress(true);
    const end   = ()=>{ setProgress(false); setFadeKey(k=>k+1); };
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
    setToasts(ts=>[...ts,{id,message,type}]);
    setTimeout(()=>setToasts(ts=>ts.filter(x=>x.id!==id)), 3800);
  },[]);

  const TOAST_CFG:Record<ToastType,{bg:string;icon:string}> = {
    success: {bg:"linear-gradient(135deg,#02C39A,#028090)", icon:"✓"},
    error:   {bg:"linear-gradient(135deg,#EF4444,#DC2626)", icon:"✕"},
    info:    {bg:"linear-gradient(135deg,#028090,#0369A1)", icon:"ⓘ"},
    warning: {bg:"linear-gradient(135deg,#F4A261,#E58C3A)", icon:"⚠"},
  };

  return (
    <ThemeContext.Provider value={{theme,toggle}}>
      <ToastContext.Provider value={{addToast}}>
        <LangContext.Provider value={{lang,setLang,t}}>
          <Head>
            <title>DIGDAYA</title>
          </Head>
          {progress && <div className="progress-bar"/>}
          <div key={fadeKey} className="page-wrap">
            <Component {...pageProps}/>
          </div>
          <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:340}}>
            {toasts.map(toast=>(
              <div key={toast.id} className="toast-item" onClick={()=>setToasts(ts=>ts.filter(x=>x.id!==toast.id))} style={{background:TOAST_CFG[toast.type].bg,color:"#fff",padding:"12px 18px",borderRadius:11,fontSize:13,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,.4)",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <span style={{fontSize:16,flexShrink:0}}>{TOAST_CFG[toast.type].icon}</span>
                <span>{toast.message}</span>
              </div>
            ))}
          </div>
        </LangContext.Provider>
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
}
