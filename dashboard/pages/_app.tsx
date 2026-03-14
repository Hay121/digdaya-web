import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, createContext, useCallback } from "react";
import "../styles/globals.css";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };
export const ToastContext = createContext<{ addToast: (msg: string, type?: ToastType) => void }>({ addToast: () => {} });

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const start = () => setProgress(true);
    const end = () => { setProgress(false); setFadeKey(k => k + 1); };
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", end);
    router.events.on("routeChangeError", end);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", end);
      router.events.off("routeChangeError", end);
    };
  }, [router]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const colors: Record<ToastType, string> = {
    success: "linear-gradient(135deg,#02C39A,#028090)",
    error: "linear-gradient(135deg,#EF4444,#DC2626)",
    info: "linear-gradient(135deg,#028090,#0369A1)",
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {progress && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2.5, zIndex: 9999, background: "linear-gradient(90deg,#028090,#02C39A)", animation: "progressBar 1.5s ease", borderRadius: "0 2px 2px 0" }} />
      )}
      <div key={fadeKey} className="page-wrap">
        <Component {...pageProps} />
      </div>
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 340 }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{ background: colors[t.type], color: "#fff", padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,.4)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ⓘ"}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
