import { useState, useEffect } from "react";
import { useRouter } from "next/router";
export default function Landing() {
  const router = useRouter();
  const [mode, setMode] = useState("landing");
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirmPassword:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(()=>{ setForm({ name:"", email:"", phone:"", password:"", confirmPassword:"" }); setError(""); },[mode]);
  const handleRegister = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) return setError("Semua field wajib diisi.");
    if (form.password !== form.confirmPassword) return setError("Password tidak cocok.");
    if (form.password.length < 6) return setError("Password minimal 6 karakter.");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const newUser = { name: form.name, email: form.email, phone: form.phone, id: "USR-" + Date.now(), password: btoa(form.password) };
    const db = JSON.parse(localStorage.getItem("digdaya_users_db") || "[]");
    db.push(newUser);
    localStorage.setItem("digdaya_users_db", JSON.stringify(db));
    localStorage.setItem("digdaya_user", JSON.stringify(newUser));
    localStorage.setItem("digdaya_step", "onboarding");
    setLoading(false);
    router.push("/onboarding");
  };
  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) return setError("Email dan password wajib diisi.");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const db = JSON.parse(localStorage.getItem("digdaya_users_db") || "[]");
    const found = db.find((u: any) => u.email === form.email && u.password === btoa(form.password));
    if (!found) { setLoading(false); return setError("Email atau password salah. Belum punya akun? Silakan daftar."); }
    localStorage.setItem("digdaya_user", JSON.stringify(found));
    setLoading(false);
    router.push(localStorage.getItem("digdaya_step") === "done" ? "/dashboard" : "/onboarding");
  };
  const features = [
    { icon:"◈", title:"Blockchain Immutable", desc:"Setiap transaksi usaha tercatat permanen di Solana — tidak bisa diubah atau dipalsukan", color:"#02C39A" },
    { icon:"◎", title:"AI Credit Scoring", desc:"Model XGBoost menilai kelayakan kredit dari pola transaksi nyata, bukan slip gaji", color:"#028090" },
    { icon:"◉", title:"Privasi Terlindungi", desc:"Data sensitif dienkripsi lokal — lender hanya menerima skor, bukan identitas asli", color:"#F4A261" },
    { icon:"◐", title:"Pemantauan Inflasi", desc:"Harga komoditas pangan dipantau real-time sebagai faktor risiko kredit sektoral", color:"#7C3AED" },
  ];
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060E1C;color:#F1F5F9;font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.4)}}
        .fade-up{animation:fadeUp .5s ease forwards}
        .btn-primary{background:linear-gradient(135deg,#028090,#02C39A);border:none;border-radius:10px;color:#fff;padding:13px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;width:100%;letter-spacing:.3px}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(2,195,154,.3)}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .btn-outline{background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#E2E8F0;padding:13px;font-size:14px;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s;width:100%}
        .btn-outline:hover{border-color:#02C39A;color:#02C39A}
        .input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:10px;color:#F1F5F9;padding:12px 14px;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;width:100%;outline:none;transition:border-color .2s}
        .input:focus{border-color:#028090;background:rgba(255,255,255,.06)}
        .input::placeholder{color:#3D4F63}
        .card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;backdrop-filter:blur(12px)}
        .dot{width:7px;height:7px;border-radius:50%;background:#02C39A;animation:pulse 2s infinite;display:inline-block}
        .feat:hover{transform:translateX(6px);border-color:rgba(255,255,255,.12)!important}
        .feat{transition:all .2s}
        label{font-size:12px;color:#64748B;display:block;margin-bottom:5px;font-weight:500;letter-spacing:.3px}
      `}</style>
      <div style={{minHeight:"100vh",background:"#060E1C",position:"relative",overflow:"hidden"}}>
        {[["8%","10%","#028090",600],["78%","3%","#02C39A",400],["88%","60%","#F4A261",300],["3%","70%","#7C3AED",350]].map(([x,y,c,s]:any,i)=>(
          <div key={i} style={{position:"fixed",left:x,top:y,width:s,height:s,borderRadius:"50%",background:c,filter:`blur(${s*.7}px)`,opacity:.07,pointerEvents:"none",zIndex:0}}/>
        ))}
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"linear-gradient(rgba(2,128,144,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(2,128,144,.03) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <nav style={{position:"relative",zIndex:10,padding:"0 48px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17}}>D</div>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,letterSpacing:-.3}}>DIGDAYA</div>
              <div style={{fontSize:8,color:"#334155",letterSpacing:2.5,textTransform:"uppercase"}}>Hybrid AI · Blockchain</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(2,195,154,.08)",border:"1px solid rgba(2,195,154,.18)",borderRadius:20,padding:"5px 14px",fontSize:11}}>
            <span className="dot"/><span style={{color:"#02C39A",fontWeight:600,letterSpacing:.5}}>Solana Devnet</span>
          </div>
        </nav>
        {mode === "landing" && (
          <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"64px 48px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center",minHeight:"78vh"}}>
              <div className="fade-up">
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(2,195,154,.08)",border:"1px solid rgba(2,195,154,.18)",borderRadius:20,padding:"5px 14px",fontSize:11,color:"#02C39A",fontWeight:600,marginBottom:28,letterSpacing:.5}}>
                  Fintech Innovation · Indonesia 2026
                </div>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:50,fontWeight:800,lineHeight:1.06,marginBottom:22,letterSpacing:-1.5}}>
                  <span style={{background:"linear-gradient(135deg,#F1F5F9,#64748B)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Kredit UMKM</span><br/>
                  <span style={{background:"linear-gradient(135deg,#028090,#02C39A)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Tanpa Agunan.</span><br/>
                  <span style={{background:"linear-gradient(135deg,#F4A261,#E53935)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Tanpa Diskriminasi.</span>
                </h1>
                <p style={{fontSize:15,color:"#64748B",lineHeight:1.75,marginBottom:36,maxWidth:460}}>
                  Platform pertama di Indonesia yang menggabungkan <strong style={{color:"#94A3B8"}}>AI Credit Scoring</strong> dan <strong style={{color:"#94A3B8"}}>Blockchain Solana</strong> untuk membuka akses kredit bagi 60 juta pelaku UMKM yang selama ini tidak terjangkau sistem perbankan konvensional.
                </p>
                <div style={{display:"flex",gap:10,marginBottom:40}}>
                  <button className="btn-primary" style={{width:"auto",padding:"13px 28px"}} onClick={()=>setMode("register")}>Daftar Gratis</button>
                  <button className="btn-outline" style={{width:"auto",padding:"13px 28px"}} onClick={()=>setMode("login")}>Masuk</button>
                </div>
                <div style={{display:"flex",gap:36}}>
                  {[["60 Juta+","UMKM di Indonesia"],["< 3 Menit","Proses scoring AI"],["100%","Data terenkripsi"]].map(([v,l],i)=>(
                    <div key={i}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#F1F5F9",letterSpacing:-.5}}>{v}</div>
                      <div style={{fontSize:11,color:"#475569",marginTop:3,letterSpacing:.3}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gap:12}}>
                {features.map((f,i)=>(
                  <div key={i} className="card feat" style={{padding:"16px 20px",display:"flex",gap:14,alignItems:"flex-start",border:"1px solid rgba(255,255,255,.06)"}}>
                    <div style={{width:38,height:38,borderRadius:10,background:`${f.color}18`,border:`1px solid ${f.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:f.color,flexShrink:0,fontFamily:"monospace"}}>{f.icon}</div>
                    <div><div style={{fontWeight:600,fontSize:14,marginBottom:4,letterSpacing:-.2}}>{f.title}</div><div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>{f.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {(mode === "login" || mode === "register") && (
          <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 64px)",padding:24}}>
            <div className="fade-up card" style={{width:"100%",maxWidth:420,padding:"36px 40px"}}>
              <div style={{textAlign:"center",marginBottom:28}}>
                <div style={{width:48,height:48,borderRadius:13,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,margin:"0 auto 14px"}}>D</div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>{mode==="login"?"Selamat Datang":"Buat Akun Baru"}</h2>
                <p style={{color:"#475569",fontSize:13}}>{mode==="login"?"Masuk ke akun UMKM Anda":"Mulai perjalanan kredit yang adil"}</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {mode==="register"&&(<div><label>Nama Lengkap</label><input className="input" placeholder="cth. Budi Santoso" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>)}
                <div><label>Alamat Email</label><input className="input" type="email" placeholder="nama@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
                {mode==="register"&&(<div><label>Nomor WhatsApp</label><input className="input" placeholder="08xx-xxxx-xxxx" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>)}
                <div><label>Password</label><input className="input" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
                {mode==="register"&&(<div><label>Konfirmasi Password</label><input className="input" type="password" placeholder="Ulangi password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})}/></div>)}
                {error&&(<div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:"10px 13px",fontSize:12,color:"#FCA5A5",lineHeight:1.5}}>{error}</div>)}
                <button className="btn-primary" style={{marginTop:6}} onClick={mode==="login"?handleLogin:handleRegister} disabled={loading}>
                  {loading?"Memproses...":mode==="login"?"Masuk ke Dashboard":"Buat Akun & Lanjut"}
                </button>
                <div style={{textAlign:"center",fontSize:12,color:"#475569"}}>
                  {mode==="login"?"Belum punya akun? ":"Sudah punya akun? "}
                  <span style={{color:"#02C39A",cursor:"pointer",fontWeight:600}} onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Daftar sekarang":"Masuk"}</span>
                </div>
                <div style={{textAlign:"center"}}><span style={{fontSize:11,color:"#334155",cursor:"pointer"}} onClick={()=>setMode("landing")}>Kembali ke halaman utama</span></div>
              </div>
            </div>
          </div>
        )}
        <footer style={{position:"relative",zIndex:1,borderTop:"1px solid rgba(255,255,255,.04)",padding:"14px 48px",display:"flex",justifyContent:"space-between",fontSize:10,color:"#1E293B",letterSpacing:.5}}>
          <span>© 2026 Digdaya · UU PDP · OJK Sandbox</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace"}}>7L1FRY6iPwCYoppBWEdTzMh1EsyKwubQc1U1YXnTLUeE</span>
          <span>SNAP BI v2.0</span>
        </footer>
      </div>
    </>
  );
}
