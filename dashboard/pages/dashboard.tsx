import { useState, useEffect, useContext } from "react";
import { ThemeContext, ToastContext, LangContext } from "./_app";
import NavBar from "../components/NavBar";
import { useRouter } from "next/router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
const gHash=()=>Array.from({length:16},()=>Math.floor(Math.random()*16).toString(16)).join("");
const TX_TYPES=["Cashflow","Logistics","AgriSale","Repayment"];
const makeTx=()=>({id:Math.random().toString(36).slice(2),entityId:"0x"+gHash().slice(0,8),type:TX_TYPES[Math.floor(Math.random()*TX_TYPES.length)],hash:gHash()+gHash(),status:Math.random()>.92?"fraud":Math.random()>.14?"verified":"pending",time:new Date().toLocaleTimeString("id-ID")});
const foodData=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return {date:d.toLocaleDateString("id-ID",{day:"2-digit",month:"short"}),beras:13800+Math.floor(Math.random()*1400-200),cabai:34000+Math.floor(Math.random()*7000-2000)};});
const sectorData=[{s:"Perdagangan",v:2840},{s:"Pertanian",v:1650},{s:"Jasa",v:2100},{s:"Manufaktur",v:980},{s:"Perikanan",v:760}];
export default function Dashboard() {
  const router=useRouter();
  const {addToast}=useContext(ToastContext);
  const {lang}=useContext(LangContext);
  const {theme}=useContext(ThemeContext);
  const [user,setUser]=useState<any>(null);
  const [umkm,setUmkm]=useState<any>(null);
  const [score,setScore]=useState(0);
  const [txs,setTxs]=useState<any[]>([]);
  const [liveCount,setLiveCount]=useState(1247);
  const [mounted,setMounted]=useState(false);
  const [loanStatus,setLoanStatus]=useState("");
  const [loanAmount,setLoanAmount]=useState(0);
  const [loanTenor,setLoanTenor]=useState(0);
  useEffect(()=>{
    setMounted(true);
    const u=localStorage.getItem("digdaya_user");
    const d=localStorage.getItem("digdaya_umkm_data");
    const s=localStorage.getItem("digdaya_score");
    if(!u){router.push("/");return;}
    setUser(JSON.parse(u));
    if(d)setUmkm(JSON.parse(d));
    if(s)setScore(parseInt(s));
    setLoanStatus(localStorage.getItem("digdaya_loan_status")||"");
    setLoanAmount(parseInt(localStorage.getItem("digdaya_loan_amount")||"0"));
    setLoanTenor(parseInt(localStorage.getItem("digdaya_tenor")||"0"));;
    setTxs(Array.from({length:8},makeTx));
  },[]);
  useEffect(()=>{
    if(!mounted)return;
    const iv=setInterval(()=>{setTxs(p=>[makeTx(),...p.slice(0,9)]);setLiveCount(c=>c+1);},4000);
    return ()=>clearInterval(iv);
  },[mounted]);
  if(!user||!mounted) return null;
  const sc=score>=740?"#02C39A":score>=670?"#028090":score>=580?"#F4A261":"#EF4444";
  const sl=score>=740?"Excellent":score>=670?"Good":score>=580?"Fair":"Poor";
  const loan=parseInt(umkm?.loanAmount||0);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0A1628}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg2)}::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:3px}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.4)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px}
        .stitle{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#64748B;margin-bottom:14px;letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:8px}
        .dot{width:7px;height:7px;border-radius:50%;background:#02C39A;animation:pulse 2s infinite;display:inline-block}
        .tx-row{animation:slideIn .25s ease}
        .nbtn{background:var(--border2);border:1px solid var(--border);border-radius:8px;color:#64748B;padding:6px 14px;font-size:12px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s}
        .nbtn:hover{background:rgba(255,255,255,.08);color:#94A3B8}
        .nbtn.p{background:linear-gradient(135deg,#028090,#02C39A);border-color:transparent;color:#fff;font-weight:600}
        .stat-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;position:relative;overflow:hidden}
      `}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)",position:"relative"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(2,128,144,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(2,128,144,.025) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <NavBar rightItems={
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:"var(--text3)"}}>Halo, <strong style={{color:"var(--text2)"}}>{user?.name}</strong></span>
          <div style={{width:1,height:16,background:"var(--border)"}}/>
          {score>0&&<button className="nbtn p" onClick={()=>router.push("/report")}>{lang==="id"?"Laporan":"Report"}</button>}
          <button className="nbtn" onClick={()=>router.push("/admin")}>{lang==="id"?"Panel Lender":"Lender Panel"}</button>
          <button className="nbtn" onClick={()=>router.push("/history")}>{lang==="id"?"Riwayat TX":"TX History"}</button>
          <button className="nbtn" onClick={()=>router.push("/profile")}>{lang==="id"?"Profil":"Profile"}</button>
          <button className="nbtn" onClick={()=>{localStorage.clear();router.push("/")}}>{lang==="id"?"Keluar":"Logout"}</button>
        </div>
      }/>

        <main style={{position:"relative",zIndex:1,padding:"22px 24px",maxWidth:1260,margin:"0 auto"}}>
          <div style={{marginBottom:20}}>
            <h1 style={{fontFamily:"var(--font-head)",fontSize:21,fontWeight:800,marginBottom:3,letterSpacing:-.4}}>{umkm?.bizName||"Dashboard UMKM"}</h1>
            <p style={{color:"var(--text5)",fontSize:12}}>{umkm?.bizType||"Belum ada data usaha"}{umkm?.city?` · ${umkm.city}`:""}{umkm?.province?`, ${umkm.province}`:""}</p>
          </div>

          {loanStatus==="approved"&&(
            <div style={{background:"rgba(2,195,154,.06)",border:"1px solid rgba(2,195,154,.2)",borderRadius:14,padding:"16px 22px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{fontSize:22}}>◈</div>
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontSize:15,fontWeight:800,color:"#02C39A",marginBottom:2}}>Kredit Anda Disetujui!</div>
                  <div style={{fontSize:12,color:"var(--text3)"}}>Dana sudah dicairkan. Lihat jadwal angsuran Anda.</div>
                </div>
              </div>
              <button onClick={()=>router.push("/angsuran")} style={{background:"linear-gradient(135deg,#028090,#02C39A)",border:"none",borderRadius:9,color:"#fff",padding:"10px 20px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)",flexShrink:0}}>Lihat Angsuran</button>
            </div>
          )}
          {loanStatus==="rejected"&&(
            <div style={{background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.15)",borderRadius:14,padding:"16px 22px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{fontSize:22,color:"#EF4444"}}>◐</div>
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontSize:15,fontWeight:800,color:"#EF4444",marginBottom:2}}>Pengajuan Ditolak</div>
                  <div style={{fontSize:12,color:"var(--text3)"}}>Tingkatkan skor kredit dan coba lagi bulan depan. Lihat rekomendasi di laporan.</div>
                </div>
              </div>
              <button onClick={()=>router.push("/report")} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:9,color:"#EF4444",padding:"10px 20px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)",flexShrink:0}}>Lihat Rekomendasi</button>
            </div>
          )}
          {loanStatus==="pending"&&(
            <div style={{background:"rgba(244,162,97,.05)",border:"1px solid rgba(244,162,97,.15)",borderRadius:14,padding:"16px 22px",marginBottom:16,display:"flex",gap:14,alignItems:"center"}}>
              <div style={{fontSize:22,color:"#F4A261"}}>◎</div>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontSize:15,fontWeight:800,color:"#F4A261",marginBottom:2}}>Pengajuan Sedang Ditinjau</div>
                <div style={{fontSize:12,color:"var(--text3)"}}>Tim lender Digdaya sedang memverifikasi pengajuan Anda. Proses 1-3 hari kerja.</div>
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
            {[
              {l:"Credit Score",v:score>0?score.toString():"—",s:score>0?sl:"Belum dianalisis",c:score>0?sc:"var(--text5)",i:"◎"},
              {l:lang==="id"?"Pengajuan Kredit":"Credit Application",v:loanAmount>0?`Rp ${(loanAmount/1e6).toFixed(0)}jt`:"—",s:loanAmount>0&&loanTenor>0?`Tenor ${loanTenor} bulan`:(umkm?.loanPurpose||"Belum diisi"),c:"#028090",i:"◈"},
              {l:"Total TX Tercatat",v:liveCount.toLocaleString("id-ID"),s:"Verified on-chain",c:"#02C39A",i:"◐"},
              {l:"Status Pengajuan",v:loanStatus==="approved"?"Disetujui":loanStatus==="pending"?"Menunggu Review":loanStatus==="rejected"?"Ditolak":score>0?"Belum Diajukan":"Pending",s:loanStatus==="approved"?"Dana siap dicairkan":loanStatus==="pending"?"Sedang ditinjau lender":loanStatus==="rejected"?"Coba lagi bulan depan":"Ajukan kredit sekarang",c:loanStatus==="approved"?"#02C39A":loanStatus==="pending"?"#F4A261":loanStatus==="rejected"?"#EF4444":"#028090",i:"◉"},
            ].map((s,i)=>(
              <div key={i} className="stat-card">
                <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${s.c}80,transparent)`}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:9,color:"var(--text5)",letterSpacing:2,textTransform:"uppercase",marginBottom:8,fontFamily:"var(--font-mono)"}}>{s.l}</div>
                    <div style={{fontSize:24,fontWeight:800,color:s.c,fontFamily:"var(--font-head)",lineHeight:1,letterSpacing:-.5}}>{s.v}</div>
                    <div style={{fontSize:11,color:"var(--text5)",marginTop:5}}>{s.s}</div>
                  </div>
                  <div style={{fontSize:20,color:s.c,opacity:.5,fontFamily:"monospace"}}>{s.i}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:14,marginBottom:14}}>
            <div className="card">
              <div className="stitle">Tren Harga Komoditas Pangan — 14 Hari</div>
              <div style={{fontSize:10,color:"var(--text5)",marginBottom:12}}>Sumber: simulasi data pasar induk · digunakan sebagai faktor risiko sektoral dalam model AI</div>
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={foodData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F4A261" stopOpacity={.25}/><stop offset="95%" stopColor="#F4A261" stopOpacity={0}/></linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={.18}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)"/>
                  <XAxis dataKey="date" tick={{fill:"var(--text5)",fontSize:9,fontFamily:"Inter"}} interval={3}/>
                  <YAxis tick={{fill:"var(--text5)",fontSize:9,fontFamily:"Inter"}} tickFormatter={(v:number)=>`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip contentStyle={{background:"var(--bg3)",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,fontSize:11,fontFamily:"Inter"}} formatter={(v:any)=>`Rp ${parseInt(v).toLocaleString("id-ID")}`}/>
                  <Area type="monotone" dataKey="beras" name="Beras" stroke="#F4A261" fill="url(#g1)" strokeWidth={1.5}/>
                  <Area type="monotone" dataKey="cabai" name="Cabai" stroke="#EF4444" fill="url(#g2)" strokeWidth={1.5}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="stitle">Status Kredit Saya</div>
              {score>0?(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
                  <div style={{width:100,height:100,borderRadius:"50%",background:`conic-gradient(${sc} ${((score-300)/550)*360}deg,var(--border2) 0deg)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 28px ${sc}25`}}>
                    <div style={{width:76,height:76,borderRadius:"50%",background:"var(--bg2)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <div style={{fontSize:24,fontWeight:800,color:sc,fontFamily:"var(--font-head)",lineHeight:1,letterSpacing:-1}}>{score}</div>
                      <div style={{fontSize:8,color:sc,fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>{sl}</div>
                    </div>
                  </div>
                  <div style={{width:"100%"}}>
                    {[["Nominal","Rp "+loan.toLocaleString("id-ID")],["Tujuan",umkm?.loanPurpose||"—"],["Wilayah",umkm?.province||"—"]].map(([k,v],i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border2)"}}>
                        <span style={{fontSize:11,color:"var(--text5)"}}>{k}</span>
                        <span style={{fontSize:11,fontWeight:500,color:"var(--text2)"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {loanStatus==="approved"
                    ?<button style={{background:"linear-gradient(135deg,#02C39A,#028090)",border:"none",borderRadius:9,color:"#fff",padding:"10px 18px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)",width:"100%"}} onClick={()=>router.push("/angsuran")}>Lihat Jadwal Angsuran</button>
                    :<button style={{background:"linear-gradient(135deg,#028090,#02C39A)",border:"none",borderRadius:9,color:"#fff",padding:"10px 18px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)",width:"100%"}} onClick={()=>router.push("/report")}>Lihat Laporan & Ajukan Kredit</button>
                  }
                </div>
              ):(
                <div style={{textAlign:"center",padding:"20px 8px"}}>
                  <div style={{fontSize:32,marginBottom:10,color:"var(--text5)",fontFamily:"monospace"}}>◎</div>
                  <div style={{fontWeight:600,marginBottom:5,fontSize:14,letterSpacing:-.2}}>Belum Ada Data</div>
                  <div style={{fontSize:12,color:"var(--text5)",marginBottom:16,lineHeight:1.6}}>Lengkapi profil usaha untuk mendapat credit score dari AI</div>
                  <button style={{background:"linear-gradient(135deg,#028090,#02C39A)",border:"none",borderRadius:9,color:"#fff",padding:"10px 18px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)",letterSpacing:.2}} onClick={()=>router.push("/onboarding")}>Mulai Pengajuan</button>
                </div>
              )}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div className="card">
              <div className="stitle">Distribusi UMKM per Sektor</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={sectorData} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)"/>
                  <XAxis dataKey="s" tick={{fill:"var(--text5)",fontSize:9,fontFamily:"Inter"}}/>
                  <YAxis tick={{fill:"var(--text5)",fontSize:9,fontFamily:"Inter"}}/>
                  <Tooltip contentStyle={{background:"var(--bg3)",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,fontSize:11,fontFamily:"Inter"}}/>
                  <Bar dataKey="v" name="Jumlah UMKM" fill="#028090" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="stitle">Compliance & Keamanan</div>
              {[
                {l:"UU No. 27/2022 — Perlindungan Data Pribadi",s:"Compliant",c:"#02C39A"},
                {l:"OJK — Residensi Data di Indonesia",s:"Verified",c:"#02C39A"},
                {l:"SNAP BI v2 — Standar Open Finance",s:"Active",c:"#02C39A"},
                {l:"Zero-Knowledge Proof (PII Masking)",s:"Enabled",c:"#028090"},
                {l:"Federated Learning — No Raw Data Transfer",s:"Active",c:"#028090"},
                {l:"Solana Devnet — Blockchain Layer",s:"Connected",c:"#7C3AED"},
              ].map((item,i,arr)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<arr.length-1?"1px solid var(--border2)":"none"}}>
                  <span style={{fontSize:11,color:"var(--text4)"}}>{item.l}</span>
                  <span style={{fontSize:10,fontWeight:600,color:item.c,background:`${item.c}18`,borderRadius:5,padding:"2px 8px",letterSpacing:.5,flexShrink:0,marginLeft:8}}>{item.s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="stitle"><span className="dot"/> Live Transaction Feed — Seluruh UMKM Digdaya<span style={{marginLeft:"auto",fontSize:9,color:"var(--text5)",fontFamily:"var(--font-mono)"}}>7L1FRY6...LUeE</span></div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{borderBottom:"1px solid var(--border2)"}}>
                  {["Entity ID","Tipe","Hash","Status","Waktu"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"7px 12px",color:"var(--text5)",fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",fontSize:9,fontFamily:"var(--font-mono)"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {txs.map((tx:any,i:number)=>{
                    const st:any={verified:{c:"#02C39A",l:"Verified"},fraud:{c:"#EF4444",l:"Fraud Alert"},pending:{c:"#F4A261",l:"Pending"}};
                    const {c,l}=st[tx.status]||st.pending;
                    return (
                      <tr key={tx.id} className="tx-row" style={{borderBottom:"1px solid var(--card)",background:i===0?"rgba(2,195,154,.03)":"transparent"}}>
                        <td style={{padding:"8px 12px",fontFamily:"var(--font-mono)",color:"var(--text4)",fontSize:10}}>{tx.entityId}</td>
                        <td style={{padding:"8px 12px"}}><span style={{background:"rgba(2,128,144,.12)",color:"#028090",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:600,letterSpacing:.5}}>{tx.type}</span></td>
                        <td style={{padding:"8px 12px",fontFamily:"var(--font-mono)",color:"var(--text5)",fontSize:9}}>{tx.hash.slice(0,20)}...</td>
                        <td style={{padding:"8px 12px"}}><span style={{background:`${c}15`,color:c,border:`1px solid ${c}30`,borderRadius:5,padding:"2px 9px",fontSize:10,fontWeight:600,letterSpacing:.3}}>{l}</span></td>
                        <td style={{padding:"8px 12px",color:"var(--text5)",fontFamily:"var(--font-mono)",fontSize:10}}>{tx.time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <footer style={{borderTop:"1px solid var(--border2)",padding:"12px 24px",display:"flex",justifyContent:"space-between",fontSize:9,color:"var(--text5)",position:"relative",zIndex:1,letterSpacing:.5}}>
          <span>© 2026 Digdaya · UU PDP Compliant</span>
          <span style={{fontFamily:"var(--font-mono)"}}>7L1FRY6iPwCYoppBWEdTzMh1EsyKwubQc1U1YXnTLUeE</span>
          <span>SNAP BI v2 · OJK Sandbox</span>
        </footer>
      </div>
    </>
  );
}
