import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { ThemeContext, LangContext } from "./_app";
import NavBar from "../components/NavBar";

export default function Landing() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const { lang, t } = useContext(LangContext);
  const [mode,    setMode]    = useState("landing");
  const [form,    setForm]    = useState({name:"",email:"",phone:"",password:"",confirmPassword:""});
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [showUU,  setShowUU]  = useState(false);

  useEffect(()=>{
    setForm({name:"",email:"",phone:"",password:"",confirmPassword:""});
    setError(""); setShowPw(false); setShowPw2(false);
  },[mode]);

  const validateEmail = (e:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleRegister = async () => {
    setError("");
    if(!form.name||!form.email||!form.password) return setError(lang==="id"?"Semua field wajib diisi":"All fields are required");
    if(!validateEmail(form.email)) return setError(lang==="id"?"Format email tidak valid (contoh: nama@gmail.com)":"Invalid email format");
    if(form.password!==form.confirmPassword) return setError(lang==="id"?"Password tidak cocok":"Passwords do not match");
    if(form.password.length<6) return setError(lang==="id"?"Password minimal 6 karakter":"Password must be at least 6 characters");
    setLoading(true);
    await new Promise(r=>setTimeout(r,1200));
    const db = JSON.parse(localStorage.getItem("digdaya_users_db")||"[]");
    if(db.find((u:any)=>u.email===form.email)){ setLoading(false); return setError(lang==="id"?"Email sudah terdaftar. Silakan login.":"Email already registered."); }
    const newUser = {name:form.name,email:form.email,phone:form.phone,id:"USR-"+Date.now(),password:btoa(unescape(encodeURIComponent(form.password)))};
    db.push(newUser);
    localStorage.setItem("digdaya_users_db", JSON.stringify(db));
    localStorage.setItem("digdaya_user", JSON.stringify(newUser));
    localStorage.setItem("digdaya_step","onboarding");
    setLoading(false);
    router.push("/onboarding");
  };

  const handleLogin = async () => {
    setError("");
    if(!form.email||!form.password) return setError(lang==="id"?"Email dan password wajib diisi":"Email and password required");
    if(!validateEmail(form.email)) return setError(lang==="id"?"Format email tidak valid":"Invalid email format");
    setLoading(true);
    await new Promise(r=>setTimeout(r,900));
    const db    = JSON.parse(localStorage.getItem("digdaya_users_db")||"[]");
    const found = db.find((u:any)=>u.email===form.email&&(u.password===btoa(unescape(encodeURIComponent(form.password)))||u.password===btoa(form.password)));
    if(!found){ setLoading(false); return setError(lang==="id"?"Email atau password salah":"Wrong email or password"); }
    localStorage.setItem("digdaya_user", JSON.stringify(found));
    setLoading(false);
    const step       = localStorage.getItem("digdaya_step");
    const loanStatus = localStorage.getItem("digdaya_loan_status");
    const score      = localStorage.getItem("digdaya_score");
    if(loanStatus==="approved") { router.push("/angsuran"); return; }
    if(step==="done"&&score)    { router.push("/dashboard"); return; }
    if(step==="onboarding")     { router.push("/onboarding"); return; }
    router.push("/dashboard");
  };

  const features = [
    {icon:"◈",title:lang==="id"?"Blockchain Immutable":"Immutable Blockchain",desc:lang==="id"?"Setiap transaksi usaha tercatat permanen di Solana — tidak bisa diubah atau dipalsukan":"Every transaction is permanently recorded on Solana — tamper-proof",color:"#02C39A"},
    {icon:"◎",title:"AI Credit Scoring",desc:lang==="id"?"Model XGBoost menilai kelayakan kredit dari pola transaksi nyata, bukan slip gaji":"XGBoost model evaluates creditworthiness from real transaction patterns, not payslips",color:"#028090"},
    {icon:"◉",title:lang==="id"?"Privasi Terlindungi":"Privacy Protected",desc:lang==="id"?"Data sensitif dienkripsi lokal — lender hanya menerima skor, bukan identitas asli":"Sensitive data encrypted locally — lenders receive only scores",color:"#F4A261"},
    {icon:"◐",title:lang==="id"?"Pemantauan Inflasi":"Inflation Monitoring",desc:lang==="id"?"Harga komoditas pangan dipantau real-time sebagai faktor risiko kredit sektoral":"Food commodity prices monitored real-time as credit risk factors",color:"#7C3AED"},
  ];

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .5s ease forwards}
        .btn-p{background:linear-gradient(135deg,#028090,#02C39A);border:none;border-radius:10px;color:#fff;padding:13px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .2s;width:100%}
        .btn-p:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(2,195,154,.3)}
        .btn-p:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .btn-o{background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text1);padding:13px;font-size:14px;font-weight:500;cursor:pointer;font-family:var(--font);transition:all .2s;width:100%}
        .btn-o:hover{border-color:#02C39A;color:#02C39A}
        .inp{background:var(--bg2);border:1px solid var(--border);border-radius:10px;color:var(--text1);padding:12px 14px;font-size:14px;font-family:var(--font);width:100%;outline:none;transition:border-color .2s}
        .inp:focus{border-color:#028090}
        .inp::placeholder{color:var(--text5)}
        .card{background:var(--card);border:1px solid var(--border);border-radius:16px}
        .feat{transition:all .2s}
        .feat:hover{transform:translateX(5px)}
        label{font-size:12px;color:var(--text3);display:block;margin-bottom:5px;font-weight:500;letter-spacing:.3px}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}
      `}</style>

      {showUU&&(
        <div className="overlay" onClick={()=>setShowUU(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:18,padding:36,maxWidth:560,width:"100%",maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{fontFamily:"var(--font-head)",fontSize:18,fontWeight:800,marginBottom:16,color:"#02C39A"}}>UU No. 27 Tahun 2022 — Perlindungan Data Pribadi</div>
            <div style={{fontSize:13,color:"var(--text3)",lineHeight:1.8,display:"flex",flexDirection:"column",gap:14}}>
              <div><strong style={{color:"var(--text1)"}}>Apa itu UU PDP?</strong><br/>UU No. 27/2022 mengatur pengumpulan, pengolahan, penyimpanan, dan penggunaan data pribadi warga negara Indonesia secara komprehensif.</div>
              <div><strong style={{color:"var(--text1)"}}>Bagaimana Digdaya melindungi data Anda?</strong><br/>Seluruh data pribadi tidak pernah dikirim ke server dalam bentuk asli. Digdaya hanya menyimpan <strong style={{color:"#02C39A"}}>hash kriptografis</strong> yang tidak bisa dikembalikan ke data asli (one-way encryption).</div>
              <div><strong style={{color:"var(--text1)"}}>Hak Anda sebagai subjek data:</strong><br/>• Hak mengakses data pribadi Anda<br/>• Hak memperbaiki data yang tidak akurat<br/>• Hak menghapus data (right to be forgotten)<br/>• Hak membatasi pemrosesan data<br/>• Hak portabilitas data</div>
              <div><strong style={{color:"var(--text1)"}}>Sanksi pelanggaran:</strong><br/>Sanksi administratif hingga Rp 2 miliar dan pidana hingga 6 tahun penjara bagi pelanggar UU PDP.</div>
              <div style={{background:"rgba(2,195,154,.08)",border:"1px solid rgba(2,195,154,.15)",borderRadius:10,padding:"12px 14px",fontSize:12,color:"#02C39A"}}>Digdaya berkomitmen penuh terhadap kepatuhan UU PDP No. 27/2022 dan standar internasional GDPR.</div>
            </div>
            <button onClick={()=>setShowUU(false)} style={{marginTop:20,background:"linear-gradient(135deg,#028090,#02C39A)",border:"none",borderRadius:9,color:"#fff",padding:"11px 24px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}}>Saya Mengerti</button>
          </div>
        </div>
      )}

      <div style={{minHeight:"100vh",background:"var(--bg)",position:"relative",overflow:"hidden"}}>
        {theme==="dark"&&[["8%","10%","#028090",600],["78%","3%","#02C39A",400],["88%","60%","#F4A261",300],["3%","70%","#7C3AED",350]].map(([x,y,c,s]:any,i)=>(
          <div key={i} style={{position:"fixed",left:x,top:y,width:s,height:s,borderRadius:"50%",background:c,filter:`blur(${s*.7}px)`,opacity:.07,pointerEvents:"none",zIndex:0}}/>
        ))}
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"linear-gradient(var(--border2) 1px,transparent 1px),linear-gradient(90deg,var(--border2) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>

        <NavBar rightItems={
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(2,195,154,.08)",border:"1px solid rgba(2,195,154,.18)",borderRadius:20,padding:"5px 14px",fontSize:11}}>
            <span className="dot"/><span style={{color:"#02C39A",fontWeight:600,letterSpacing:.5}}>Solana Devnet</span>
          </div>
        }/>

        {mode==="landing"&&(
          <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"64px 48px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center",minHeight:"78vh"}}>
              <div className="fade-up">
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(2,195,154,.08)",border:"1px solid rgba(2,195,154,.18)",borderRadius:20,padding:"5px 14px",fontSize:11,color:"#02C39A",fontWeight:600,marginBottom:28,letterSpacing:.5}}>
                  Fintech Innovation · Indonesia 2026
                </div>
                <h1 style={{fontFamily:"var(--font-head)",fontSize:50,fontWeight:800,lineHeight:1.06,marginBottom:22,letterSpacing:-1.5}}>
                  <span style={{background:"linear-gradient(135deg,var(--text1),var(--text3))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{lang==="id"?"Kredit UMKM":"SME Credit"}</span><br/>
                  <span style={{background:"linear-gradient(135deg,#028090,#02C39A)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{lang==="id"?"Tanpa Agunan":"No Collateral"}</span><br/>
                  <span style={{background:"linear-gradient(135deg,#F4A261,#E53935)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{lang==="id"?"Tanpa Diskriminasi":"No Discrimination"}</span>
                </h1>
                <p style={{fontSize:15,color:"var(--text3)",lineHeight:1.75,marginBottom:36,maxWidth:460}}>
                  {lang==="id"?"Platform pertama di Indonesia yang menggabungkan AI Credit Scoring dan Blockchain Solana untuk membuka akses kredit bagi 60 juta pelaku UMKM yang selama ini tidak terjangkau sistem perbankan.":"Indonesia's first platform combining AI Credit Scoring and Solana Blockchain to unlock credit access for 60 million SMEs."}
                </p>
                <div style={{display:"flex",gap:10,marginBottom:40}}>
                  <button className="btn-p" style={{width:"auto",padding:"13px 28px"}} onClick={()=>setMode("register")}>{lang==="id"?"Daftar Gratis":"Sign Up Free"}</button>
                  <button className="btn-o" style={{width:"auto",padding:"13px 28px"}} onClick={()=>setMode("login")}>{lang==="id"?"Masuk":"Login"}</button>
                </div>
                <div style={{display:"flex",gap:36}}>
                  {[["60 Juta+",lang==="id"?"UMKM di Indonesia":"SMEs in Indonesia"],["< 3 Menit",lang==="id"?"Proses scoring AI":"AI scoring process"],["100%",lang==="id"?"Data terenkripsi":"Data encrypted"]].map(([v,l],i)=>(
                    <div key={i}>
                      <div style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,color:"var(--text1)",letterSpacing:-.5}}>{v}</div>
                      <div style={{fontSize:11,color:"var(--text3)",marginTop:3,letterSpacing:.3}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gap:12}}>
                {features.map((f,i)=>(
                  <div key={i} className="card feat" style={{padding:"16px 20px",display:"flex",gap:14,alignItems:"flex-start"}}>
                    <div style={{width:38,height:38,borderRadius:10,background:`${f.color}18`,border:`1px solid ${f.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:f.color,flexShrink:0,fontFamily:"monospace"}}>{f.icon}</div>
                    <div><div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{f.title}</div><div style={{fontSize:12,color:"var(--text3)",lineHeight:1.6}}>{f.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(mode==="login"||mode==="register")&&(
          <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 58px)",padding:24}}>
            <div className="fade-up card" style={{width:"100%",maxWidth:420,padding:"36px 40px"}}>
              <div style={{textAlign:"center",marginBottom:28}}>
                <div style={{width:48,height:48,borderRadius:13,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:24,margin:"0 auto 14px",color:"#fff"}}>D</div>
                <h2 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>{mode==="login"?(lang==="id"?"Selamat Datang":"Welcome Back"):(lang==="id"?"Buat Akun Baru":"Create Account")}</h2>
                <p style={{color:"var(--text3)",fontSize:13}}>{mode==="login"?(lang==="id"?"Masuk ke akun UMKM Anda":"Login to your SME account"):(lang==="id"?"Mulai perjalanan kredit yang adil":"Start your fair credit journey")}</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {mode==="register"&&<div><label>{lang==="id"?"Nama Lengkap":"Full Name"}</label><input className="inp" placeholder={lang==="id"?"cth. Budi Santoso":"e.g. John Doe"} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>}
                <div><label>{lang==="id"?"Alamat Email":"Email Address"}</label><input className="inp" type="email" placeholder="nama@gmail.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
                {mode==="register"&&<div><label>{lang==="id"?"Nomor WhatsApp":"WhatsApp Number"}</label><input className="inp" placeholder="08xx-xxxx-xxxx" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>}
                <div><label>Password</label>
                  <div style={{position:"relative"}}>
                    <input className="inp" type={showPw?"text":"password"} placeholder={lang==="id"?"Minimal 6 karakter":"At least 6 characters"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{paddingRight:44}}/>
                    <button onMouseDown={()=>setShowPw(true)} onMouseUp={()=>setShowPw(false)} onMouseLeave={()=>setShowPw(false)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:15,padding:4,userSelect:"none",lineHeight:1}}>
                      {showPw?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>
                {mode==="register"&&(
                  <div><label>{lang==="id"?"Konfirmasi Password":"Confirm Password"}</label>
                    <div style={{position:"relative"}}>
                      <input className="inp" type={showPw2?"text":"password"} placeholder={lang==="id"?"Ulangi password":"Repeat password"} value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} style={{paddingRight:44}}/>
                      <button onMouseDown={()=>setShowPw2(true)} onMouseUp={()=>setShowPw2(false)} onMouseLeave={()=>setShowPw2(false)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:15,padding:4,userSelect:"none",lineHeight:1}}>
                        {showPw2?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                  </div>
                )}
                {mode==="register"&&(
                  <div style={{fontSize:11,color:"var(--text4)",lineHeight:1.7,background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px"}}>
                    {lang==="id"?"Dengan mendaftar, Anda menyetujui ":"By registering, you agree to our "}
                    <span style={{color:"#02C39A",cursor:"pointer",fontWeight:600,textDecoration:"underline"}} onClick={()=>setShowUU(true)}>
                      {lang==="id"?"UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi":"Law No. 27/2022 on Personal Data Protection"}
                    </span>
                  </div>
                )}
                {error&&<div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:"10px 13px",fontSize:12,color:"#FCA5A5",lineHeight:1.5}}>{error}</div>}
                <button className="btn-p" style={{marginTop:6}} onClick={mode==="login"?handleLogin:handleRegister} disabled={loading}>
                  {loading?(lang==="id"?"Memproses...":"Processing..."):(mode==="login"?(lang==="id"?"Masuk ke Dashboard":"Login"):(lang==="id"?"Buat Akun & Lanjut":"Create Account & Continue"))}
                </button>
                <div style={{textAlign:"center",fontSize:12,color:"var(--text3)"}}>
                  {mode==="login"?(lang==="id"?"Belum punya akun? ":"Don't have an account? "):(lang==="id"?"Sudah punya akun? ":"Already have an account? ")}
                  <span style={{color:"#02C39A",cursor:"pointer",fontWeight:600}} onClick={()=>setMode(mode==="login"?"register":"login")}>
                    {mode==="login"?(lang==="id"?"Daftar sekarang":"Register"):(lang==="id"?"Masuk":"Login")}
                  </span>
                </div>
                <div style={{textAlign:"center"}}><span style={{fontSize:11,color:"var(--text4)",cursor:"pointer"}} onClick={()=>setMode("landing")}>{lang==="id"?"Kembali ke halaman utama":"Back to home"}</span></div>
              </div>
            </div>
          </div>
        )}
        <footer style={{position:"relative",zIndex:1,borderTop:"1px solid var(--border2)",padding:"14px 48px",display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--text5)",letterSpacing:.5}}>
          <span>© 2026 Digdaya · UU PDP · OJK Sandbox</span>
          <span style={{fontFamily:"var(--font-mono)"}}>7L1FRY6iPwCYoppBWEdTzMh1EsyKwubQc1U1YXnTLUeE</span>
          <span>SNAP BI v2.0</span>
        </footer>
      </div>
    </>
  );
}
