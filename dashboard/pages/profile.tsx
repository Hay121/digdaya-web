import { useState, useEffect, useContext } from "react";
import NavBar from "../components/NavBar";
import { useRouter } from "next/router";
import { ThemeContext, ToastContext } from "./_app";

export default function Profile() {
  const router = useRouter();
  const { theme, toggle } = useContext(ThemeContext);
  const { addToast }      = useContext(ToastContext);
  const [user,    setUser]    = useState<any>(null);
  const [umkm,    setUmkm]    = useState<any>(null);
  const [score,   setScore]   = useState(0);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ name:"", phone:"", bizName:"", bizType:"", city:"", province:"" });
  const [pwForm,  setPwForm]  = useState({ current:"", next:"", confirm:"" });
  const [pwError, setPwError] = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(()=>{
    setMounted(true);
    const u = localStorage.getItem("digdaya_user");
    const d = localStorage.getItem("digdaya_umkm_data");
    const s = localStorage.getItem("digdaya_score");
    if(!u){ router.push("/"); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setForm({ name:parsed.name||"", phone:parsed.phone||"", bizName:"", bizType:"", city:"", province:"" });
    if(d){
      const pd = JSON.parse(d);
      setUmkm(pd);
      setForm(f=>({...f, bizName:pd.bizName||"", bizType:pd.bizType||"", city:pd.city||"", province:pd.province||""}));
    }
    if(s) setScore(parseInt(s));
  },[]);

  if(!mounted) return null;
  const sc = score>=740?"#02C39A":score>=670?"#028090":score>=580?"#F4A261":"#EF4444";

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,900));
    const updated = {...user, name:form.name, phone:form.phone};
    localStorage.setItem("digdaya_user", JSON.stringify(updated));
    if(umkm){
      const updatedUmkm = {...umkm, bizName:form.bizName, bizType:form.bizType, city:form.city, province:form.province};
      localStorage.setItem("digdaya_umkm_data", JSON.stringify(updatedUmkm));
      setUmkm(updatedUmkm);
    }
    setUser(updated);
    setSaving(false);
    setEditing(false);
    addToast("Profil berhasil diperbarui", "success");
  };

  const handleChangePassword = async () => {
    setPwError("");
    if(!pwForm.current){ setPwError("Masukkan password saat ini"); return; }
    if(pwForm.next.length < 6){ setPwError("Password baru minimal 6 karakter"); return; }
    if(pwForm.next !== pwForm.confirm){ setPwError("Password baru tidak cocok"); return; }
    if(btoa(pwForm.current) !== user.password){ setPwError("Password saat ini salah"); return; }
    setSaving(true);
    await new Promise(r=>setTimeout(r,900));
    const updated = {...user, password:btoa(pwForm.next)};
    localStorage.setItem("digdaya_user", JSON.stringify(updated));
    const db = JSON.parse(localStorage.getItem("digdaya_users_db")||"[]");
    const idx = db.findIndex((u:any)=>u.email===user.email);
    if(idx>-1){ db[idx]=updated; localStorage.setItem("digdaya_users_db",JSON.stringify(db)); }
    setUser(updated);
    setPwForm({current:"",next:"",confirm:""});
    setSaving(false);
    addToast("Password berhasil diubah", "success");
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        .card{background:var(--card);border:1px solid var(--border);border-radius:14px}
        .inp{background:var(--bg2);border:1px solid var(--border);border-radius:9px;color:var(--text1);padding:11px 14px;font-size:14px;font-family:var(--font);width:100%;outline:none;transition:border-color .2s}
        .inp:focus{border-color:var(--primary)}
        .inp:disabled{opacity:.5;cursor:not-allowed}
        .btn{background:linear-gradient(135deg,#028090,#02C39A);border:none;border-radius:9px;color:#fff;padding:11px 22px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .2s}
        .btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(2,195,154,.25)}
        .btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .nbtn{background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text3);padding:6px 14px;font-size:12px;cursor:pointer;font-family:var(--font);transition:all .2s}
        .nbtn:hover{color:var(--text2)}
        label{font-size:11px;color:var(--text3);display:block;margin-bottom:5px;font-weight:500;letter-spacing:.4px;text-transform:uppercase}
      `}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(2,128,144,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(2,128,144,.025) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(6,14,28,.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border2)",padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>D</div>
            <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,letterSpacing:-.3}}>DIGDAYA</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button className="nbtn" onClick={toggle} style={{fontSize:16,padding:"5px 10px"}}>{theme==="dark"?"☀️":"🌙"}</button>
            <button className="nbtn" onClick={()=>router.push("/dashboard")}>Dashboard</button>
            <button className="nbtn" onClick={()=>router.push("/history")}>Riwayat TX</button>
          </div>
        </nav>
        <main style={{position:"relative",zIndex:1,maxWidth:800,margin:"0 auto",padding:"28px 24px"}}>
          <div style={{marginBottom:22}}>
            <h1 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:3,letterSpacing:-.4}}>Profil Saya</h1>
            <p style={{color:"var(--text3)",fontSize:12}}>Kelola data akun dan informasi usaha Anda</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16,marginBottom:16}}>
            <div className="card" style={{padding:"20px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:12}}>
              <div style={{width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:28,color:"#fff"}}>{user?.name?.[0]?.toUpperCase()||"U"}</div>
              <div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{user?.name}</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>{user?.email}</div>
              </div>
              {score>0&&(
                <div style={{background:`${sc}15`,border:`1px solid ${sc}30`,borderRadius:10,padding:"10px 14px",width:"100%"}}>
                  <div style={{fontSize:9,color:"var(--text4)",letterSpacing:2,textTransform:"uppercase",marginBottom:4,fontFamily:"var(--font-mono)"}}>Credit Score</div>
                  <div style={{fontFamily:"var(--font-head)",fontSize:28,fontWeight:800,color:sc,letterSpacing:-1}}>{score}</div>
                </div>
              )}
              <div style={{width:"100%",borderTop:"1px solid var(--border2)",paddingTop:12}}>
                <div style={{fontSize:10,color:"var(--text4)",marginBottom:4}}>ID Akun</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text3)"}}>{user?.id}</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div className="card" style={{padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontFamily:"var(--font-head)",fontSize:12,fontWeight:700,color:"var(--text3)",letterSpacing:1,textTransform:"uppercase"}}>Data Pribadi</div>
                  <button className="nbtn" onClick={()=>setEditing(!editing)}>{editing?"Batal":"Edit"}</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><label>Nama Lengkap</label><input className="inp" value={form.name} disabled={!editing} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
                  <div><label>Email</label><input className="inp" value={user?.email||""} disabled/></div>
                  <div><label>No. WhatsApp</label><input className="inp" value={form.phone} disabled={!editing} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
                  <div><label>Nama Usaha</label><input className="inp" value={form.bizName} disabled={!editing} onChange={e=>setForm(f=>({...f,bizName:e.target.value}))}/></div>
                  <div><label>Jenis Usaha</label><input className="inp" value={form.bizType} disabled={!editing} onChange={e=>setForm(f=>({...f,bizType:e.target.value}))}/></div>
                  <div><label>Kota</label><input className="inp" value={form.city} disabled={!editing} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></div>
                </div>
                {editing&&(
                  <button className="btn" style={{marginTop:14}} disabled={saving} onClick={handleSave}>{saving?"Menyimpan...":"Simpan Perubahan"}</button>
                )}
              </div>
              <div className="card" style={{padding:"18px 20px"}}>
                <div style={{fontFamily:"var(--font-head)",fontSize:12,fontWeight:700,color:"var(--text3)",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Ganti Password</div>
                <div style={{display:"grid",gap:10}}>
                  <div><label>Password Saat Ini</label><input className="inp" type="password" placeholder="••••••" value={pwForm.current} onChange={e=>setPwForm(f=>({...f,current:e.target.value}))}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><label>Password Baru</label><input className="inp" type="password" placeholder="Min. 6 karakter" value={pwForm.next} onChange={e=>setPwForm(f=>({...f,next:e.target.value}))}/></div>
                    <div><label>Konfirmasi Password</label><input className="inp" type="password" placeholder="Ulangi password baru" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))}/></div>
                  </div>
                  {pwError&&<div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:"9px 12px",fontSize:12,color:"#FCA5A5"}}>{pwError}</div>}
                  <button className="btn" style={{width:"fit-content"}} disabled={saving} onClick={handleChangePassword}>{saving?"Memproses...":"Ubah Password"}</button>
                </div>
              </div>

              <div className="card" style={{padding:"18px 20px"}}>
                <div style={{fontFamily:"var(--font-head)",fontSize:12,fontWeight:700,color:"var(--text3)",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Zona Bahaya</div>
                <button onClick={()=>{localStorage.clear();router.push("/");}} style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:9,color:"#EF4444",padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}}>Keluar dari Akun</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
