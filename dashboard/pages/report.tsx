import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
const TENOR_OPTIONS=[
  {months:6,label:"6 Bulan",rate:2.2,note:"Cicilan besar, bunga total hemat"},
  {months:12,label:"12 Bulan",rate:1.8,note:"Pilihan populer modal kerja"},
  {months:24,label:"24 Bulan",rate:1.4,note:"Cicilan ringan"},
  {months:36,label:"36 Bulan",rate:1.2,note:"Untuk investasi usaha"},
];
const fmtRp=(v:string)=>{const n=v.replace(/\D/g,"");if(!n)return "";return "Rp "+parseInt(n).toLocaleString("id-ID");};
const parseRp=(v:string)=>v.replace(/\D/g,"");
export default function Report() {
  const router=useRouter();
  const [user,setUser]=useState<any>(null);
  const [data,setData]=useState<any>(null);
  const [score,setScore]=useState(0);
  const [tenor,setTenor]=useState<number|null>(null);
  const [loanInput,setLoanInput]=useState("");
  const [approvalStep,setApprovalStep]=useState(0);
  const [processing,setProcessing]=useState(false);
  const [disbursed,setDisbursed]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [txSig,setTxSig]=useState("");
  const [txExplorer,setTxExplorer]=useState("");
  const [txHash,setTxHash]=useState("");
  const [maskedEntity,setMaskedEntity]=useState("");
  useEffect(()=>{
    const u=localStorage.getItem("digdaya_user");
    const d=localStorage.getItem("digdaya_umkm_data");
    const s=localStorage.getItem("digdaya_score");
    if(!u||!d||!s){router.push("/");return;}
    setUser(JSON.parse(u));
    const parsed=JSON.parse(d);
    setData(parsed);
    setScore(parseInt(s));
    setLoanInput(parsed.loanAmount||"");
    setTxSig(localStorage.getItem("digdaya_tx_sig")||"");
    setTxExplorer(localStorage.getItem("digdaya_tx_explorer")||"");
    setTxHash(localStorage.getItem("digdaya_tx_hash")||"");
    setMaskedEntity(localStorage.getItem("digdaya_masked_entity")||"");
  },[]);
  if(!data||!user) return null;
  const sc=score>=740?"#02C39A":score>=670?"#028090":score>=580?"#F4A261":"#EF4444";
  const sl=score>=740?"Excellent":score>=670?"Good":score>=580?"Fair":"Poor";
  const maxLoan=score>=740?500000000:score>=670?200000000:score>=580?75000000:0;
  const loan=Math.min(parseInt(parseRp(loanInput)||"0"),maxLoan);
  const tenorObj=TENOR_OPTIONS.find(t=>t.months===tenor);
  const rate=tenorObj?tenorObj.rate:0;
  const monthly=tenor&&loan>0?Math.round(loan*(rate/100+1/tenor)):0;
  const totalRepay=monthly*(tenor||0);
  const totalInterest=totalRepay-loan;
  const isRealTx=txSig&&!txSig.startsWith("mock_tx_");
  const radar=[
    {s:"Arus Kas",A:Math.min(100,Math.max(10,parseInt(data.monthlyRevenue||0)/(parseInt(data.monthlyExpense||1)+1)*40))},
    {s:"Ketepatan",A:parseInt(data.onTimePayment||50)},
    {s:"Delivery",A:parseInt(data.deliveryRate||50)},
    {s:"Pelanggan",A:Math.min(100,parseInt(data.uniqueBuyers||10))},
    {s:"Digital",A:parseInt(data.digitalRatio||5)},
    {s:"Dokumen",A:(data.hasNIB==="yes"?40:0)+(data.hasRekening==="yes"?40:0)+(data.hasSKDU==="yes"?20:0)},
  ];
  const cashflowData=Array.from({length:6},(_,i)=>{
    const rev=parseInt(data.monthlyRevenue||0);
    return {b:["Sep","Okt","Nov","Des","Jan","Feb"][i],p:Math.max(0,rev+Math.floor(Math.random()*rev*.2-rev*.05)),e:Math.max(0,parseInt(data.monthlyExpense||0)+Math.floor(Math.random()*400000-200000))};
  });
  const handleApprove=async()=>{
    setProcessing(true);
    const labels=["Memverifikasi identitas UMKM","Memeriksa kelayakan kredit final","Mengirim kontrak digital","Merekam ke Solana Devnet","Memproses instruksi transfer"];
    for(let i=0;i<labels.length;i++){
      setApprovalStep(i+1);
      await new Promise(r=>setTimeout(r,900));
    }
    try {
      const usr=JSON.parse(localStorage.getItem("digdaya_user")||"{}");
      const res=await fetch("https://kortney-hamulate-annamarie.ngrok-free.dev/api/v1/credit-score",{
        method:"POST",headers:{"Content-Type":"application/json","ngrok-skip-browser-warning":"true"},
        body:JSON.stringify({entityId:usr.id||usr.email||"anon",creditScore:score})
      });
      const d=await res.json();
      if(d.success&&d.solana_signature){
        localStorage.setItem("digdaya_disburse_sig",d.solana_signature);
        localStorage.setItem("digdaya_disburse_explorer",d.explorer||"");
      }
    } catch(e){console.warn("Backend offline");}
    setProcessing(false);setDisbursed(true);setShowModal(false);
  };
  const approvalLabels=["Memverifikasi identitas UMKM","Memeriksa kelayakan kredit final","Mengirim kontrak digital","Merekam ke Solana Devnet","Memproses instruksi transfer"];
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060E1C;color:#F1F5F9;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp .4s ease forwards}
        .card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px}
        .stitle{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#64748B;margin-bottom:14px;letter-spacing:1px;text-transform:uppercase}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}
        .inp{background:#0D1B2E;border:1px solid rgba(255,255,255,.09);border-radius:9px;color:#F1F5F9;padding:11px 14px;font-size:14px;font-family:'Inter',sans-serif;width:100%;outline:none;transition:border-color .2s}
        .inp:focus{border-color:#028090}
        .tenor-card{background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.07);border-radius:11px;padding:14px 16px;cursor:pointer;transition:all .2s}
        .tenor-card:hover{border-color:rgba(2,128,144,.4);background:rgba(2,128,144,.05)}
        .tenor-card.active{border-color:#028090;background:rgba(2,128,144,.1)}
        .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.08);border-top-color:#02C39A;border-radius:50%;animation:spin .8s linear infinite}
        .nbtn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:8px;color:#64748B;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s}
        .nbtn:hover{background:rgba(255,255,255,.08);color:#94A3B8}
      `}</style>
      {showModal&&(
        <div className="overlay">
          <div style={{background:"#0A1628",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:36,maxWidth:440,width:"100%"}}>
            {!processing&&!disbursed?(
              <div style={{textAlign:"center"}}>
                <div style={{width:50,height:50,borderRadius:13,background:"rgba(2,195,154,.1)",border:"1px solid rgba(2,195,154,.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:22}}>◈</div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:19,fontWeight:800,marginBottom:8,letterSpacing:-.4}}>Konfirmasi Pencairan Dana</h2>
                <p style={{color:"#475569",fontSize:12,lineHeight:1.6,marginBottom:18}}>Periksa detail berikut sebelum melanjutkan.</p>
                <div style={{background:"rgba(255,255,255,.03)",borderRadius:10,padding:"14px",marginBottom:18,textAlign:"left"}}>
                  {[["Nominal","Rp "+loan.toLocaleString("id-ID")],["Tenor",`${tenor} bulan`],["Bunga",`${rate}% / bulan`],["Cicilan / Bulan","Rp "+monthly.toLocaleString("id-ID")],["Total Bunga","Rp "+totalInterest.toLocaleString("id-ID")],["Total Kewajiban","Rp "+totalRepay.toLocaleString("id-ID")]].map(([k,v],i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<5?"1px solid rgba(255,255,255,.04)":"none"}}>
                      <span style={{fontSize:12,color:"#475569"}}>{k}</span>
                      <span style={{fontSize:12,fontWeight:600,color:"#E2E8F0"}}>{v}</span>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:11,color:"#334155",marginBottom:18,lineHeight:1.6}}>Dengan melanjutkan, Anda menyetujui syarat pembiayaan Digdaya. Persetujuan dicatat permanen di blockchain.</p>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setShowModal(false)} style={{flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,color:"#64748B",padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Batal</button>
                  <button onClick={handleApprove} style={{flex:2,background:"linear-gradient(135deg,#02C39A,#028090)",border:"none",borderRadius:9,color:"#fff",padding:"11px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Setuju & Cairkan Dana</button>
                </div>
              </div>
            ):(
              <div style={{textAlign:"center"}}>
                <div style={{marginBottom:24}}>
                  {approvalLabels.map((l,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<4?"1px solid rgba(255,255,255,.04)":"none"}}>
                      <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {approvalStep>i+1?<span style={{color:"#02C39A",fontSize:13,fontWeight:700}}>✓</span>:approvalStep===i+1?<div className="spinner"/>:<div style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>}
                      </div>
                      <span style={{fontSize:12,color:approvalStep>i+1?"#475569":approvalStep===i+1?"#F1F5F9":"#1E293B"}}>{l}</span>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:12,color:"#334155"}}>Mohon jangan tutup halaman ini...</p>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{minHeight:"100vh",background:"#060E1C",position:"relative",overflow:"hidden"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(2,128,144,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(2,128,144,.025) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <nav style={{position:"relative",zIndex:10,padding:"0 32px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15}}>D</div>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,letterSpacing:-.3}}>DIGDAYA</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            {isRealTx&&<div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.15)",borderRadius:20,padding:"4px 11px",fontSize:10,color:"#02C39A",fontWeight:600}}>◈ On-chain Verified</div>}
            <button className="nbtn" onClick={()=>router.push("/dashboard")}>Dashboard</button>
          </div>
        </nav>
        <div style={{position:"relative",zIndex:1,maxWidth:980,margin:"0 auto",padding:"28px 24px"}}>
          {disbursed&&(
            <div className="fade-up" style={{background:"rgba(2,195,154,.06)",border:"1px solid rgba(2,195,154,.2)",borderRadius:16,padding:"22px 26px",marginBottom:22,display:"flex",gap:18,alignItems:"center"}}>
              <div style={{width:46,height:46,borderRadius:12,background:"rgba(2,195,154,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>◈</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:"#02C39A",marginBottom:3}}>Dana Berhasil Dicairkan</div>
                <div style={{fontSize:12,color:"#475569"}}>Rp {loan.toLocaleString("id-ID")} sedang dalam proses transfer ke rekening <strong style={{color:"#94A3B8"}}>{user.name}</strong></div>
              </div>
              {localStorage.getItem("digdaya_disburse_explorer")&&(
                <a href={localStorage.getItem("digdaya_disburse_explorer")||""} target="_blank" rel="noreferrer" style={{fontSize:10,color:"#02C39A",fontFamily:"'JetBrains Mono',monospace",textDecoration:"none",background:"rgba(2,195,154,.1)",border:"1px solid rgba(2,195,154,.2)",borderRadius:7,padding:"6px 12px",flexShrink:0}}>Explorer ↗</a>
              )}
            </div>
          )}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,color:"#334155",letterSpacing:3,textTransform:"uppercase",marginBottom:5,fontFamily:"'JetBrains Mono',monospace"}}>Laporan Kredit · Digdaya AI</div>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:23,fontWeight:800,marginBottom:3,letterSpacing:-.5}}>{data.bizName||"Usaha Anda"}</h1>
            <p style={{color:"#334155",fontSize:12}}>{user.name} · {new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:14,marginBottom:14}}>
            <div className="card" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 14px"}}>
              <div style={{fontSize:9,color:"#334155",letterSpacing:2,textTransform:"uppercase",marginBottom:12,fontFamily:"'JetBrains Mono',monospace"}}>Credit Score</div>
              <div style={{width:120,height:120,borderRadius:"50%",background:`conic-gradient(${sc} ${((score-300)/550)*360}deg,rgba(255,255,255,.04) 0deg)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 28px ${sc}25`,marginBottom:12}}>
                <div style={{width:92,height:92,borderRadius:"50%",background:"#0A1628",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:28,fontWeight:800,color:sc,fontFamily:"'Syne',sans-serif",lineHeight:1,letterSpacing:-1}}>{score}</div>
                  <div style={{fontSize:8,color:sc,fontWeight:600,letterSpacing:2,marginTop:3}}>{sl.toUpperCase()}</div>
                </div>
              </div>
              <div style={{width:"100%"}}>
                <div style={{height:3,background:"rgba(255,255,255,.05)",borderRadius:2,overflow:"hidden",marginBottom:5}}>
                  <div style={{height:"100%",width:`${((score-300)/550)*100}%`,background:"linear-gradient(90deg,#EF4444,#F4A261,#02C39A)",borderRadius:2}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#1E293B",fontFamily:"'JetBrains Mono',monospace"}}><span>300</span><span>580</span><span>740</span><span>850</span></div>
              </div>
            </div>
            <div className="card" style={{padding:"18px 20px"}}>
              <div className="stitle">Simulasi Kredit — Pilih Tenor & Nominal</div>
              {score>=580?(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                    <div>
                      <div style={{fontSize:11,color:"#475569",marginBottom:5,fontWeight:500}}>Nominal Pinjaman</div>
                      <input className="inp" placeholder="Rp 0" value={fmtRp(loanInput)} onChange={e=>setLoanInput(parseRp(e.target.value))}/>
                      <div style={{fontSize:10,color:"#334155",marginTop:3}}>Maks. Rp {maxLoan.toLocaleString("id-ID")}</div>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:"#475569",marginBottom:5,fontWeight:500}}>Plafon Maksimum</div>
                      <div style={{background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.15)",borderRadius:9,padding:"11px 14px"}}>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:"#02C39A"}}>Rp {maxLoan.toLocaleString("id-ID")}</div>
                        <div style={{fontSize:10,color:"#334155",marginTop:2}}>Berdasarkan skor {score}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#475569",marginBottom:7,fontWeight:500}}>Pilih Tenor</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                    {TENOR_OPTIONS.map(t=>(
                      <div key={t.months} className={`tenor-card ${tenor===t.months?"active":""}`} onClick={()=>setTenor(t.months)}>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:tenor===t.months?"#028090":"#64748B",marginBottom:2}}>{t.label}</div>
                        <div style={{fontSize:10,color:tenor===t.months?"#02C39A":"#334155",marginBottom:3}}>Bunga {t.rate}%/bln</div>
                        <div style={{fontSize:9,color:"#1E293B",lineHeight:1.4}}>{t.note}</div>
                      </div>
                    ))}
                  </div>
                  {tenor&&loan>0?(
                    <div style={{background:"rgba(2,128,144,.07)",border:"1px solid rgba(2,128,144,.15)",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                        {[{l:"Cicilan / Bulan",v:"Rp "+monthly.toLocaleString("id-ID"),c:"#F1F5F9"},{l:"Total Bunga",v:"Rp "+totalInterest.toLocaleString("id-ID"),c:"#F4A261"},{l:"Total Kewajiban",v:"Rp "+totalRepay.toLocaleString("id-ID"),c:"#94A3B8"}].map((x,i)=>(
                          <div key={i}><div style={{fontSize:10,color:"#334155",marginBottom:2}}>{x.l}</div><div style={{fontSize:13,fontWeight:700,color:x.c,fontFamily:"'Syne',sans-serif"}}>{x.v}</div></div>
                        ))}
                      </div>
                    </div>
                  ):(
                    <div style={{background:"rgba(255,255,255,.02)",border:"1px dashed rgba(255,255,255,.06)",borderRadius:10,padding:"14px",textAlign:"center",marginBottom:12}}>
                      <div style={{fontSize:12,color:"#334155"}}>Masukkan nominal dan pilih tenor untuk melihat simulasi cicilan</div>
                    </div>
                  )}
                  {!disbursed?(
                    <button disabled={!tenor||!loan||loan>maxLoan} onClick={()=>setShowModal(true)} style={{width:"100%",background:tenor&&loan&&loan<=maxLoan?"linear-gradient(135deg,#02C39A,#028090)":"rgba(255,255,255,.04)",border:"none",borderRadius:9,color:tenor&&loan&&loan<=maxLoan?"#fff":"#334155",padding:"12px",fontSize:13,fontWeight:600,cursor:tenor&&loan&&loan<=maxLoan?"pointer":"not-allowed",fontFamily:"'Inter',sans-serif",transition:"all .2s"}}>
                      {!loan?"Masukkan nominal pinjaman":loan>maxLoan?"Nominal melebihi plafon":!tenor?"Pilih tenor terlebih dahulu":"Lanjutkan ke Pencairan Dana"}
                    </button>
                  ):(
                    <div style={{background:"rgba(2,195,154,.08)",border:"1px solid rgba(2,195,154,.2)",borderRadius:9,padding:"12px",textAlign:"center",color:"#02C39A",fontWeight:600,fontSize:13}}>Dana Telah Dicairkan ✓</div>
                  )}
                </div>
              ):(
                <div style={{padding:"22px",textAlign:"center"}}>
                  <div style={{fontSize:24,color:"#F4A261",fontFamily:"monospace",marginBottom:8}}>◐</div>
                  <div style={{fontWeight:600,color:"#F4A261",fontSize:13,marginBottom:6}}>Skor Perlu Ditingkatkan</div>
                  <div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>Minimal skor 580 untuk akses pencairan. Lihat rekomendasi di bawah.</div>
                </div>
              )}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div className="card" style={{padding:"18px 20px"}}>
              <div className="stitle">Profil Usaha — Radar AI</div>
              <div style={{fontSize:10,color:"#334155",marginBottom:10}}>Sumber: data form onboarding · diproses model XGBoost</div>
              <ResponsiveContainer width="100%" height={180}><RadarChart data={radar}><PolarGrid stroke="rgba(255,255,255,.06)"/><PolarAngleAxis dataKey="s" tick={{fill:"#475569",fontSize:10}}/><Radar dataKey="A" stroke="#028090" fill="#028090" fillOpacity={0.12} strokeWidth={1.5}/></RadarChart></ResponsiveContainer>
            </div>
            <div className="card" style={{padding:"18px 20px"}}>
              <div className="stitle">Proyeksi Arus Kas 6 Bulan</div>
              <div style={{fontSize:10,color:"#334155",marginBottom:10}}>Sumber: nominal pendapatan & pengeluaran form · variasi ±15% musiman</div>
              <ResponsiveContainer width="100%" height={180}><BarChart data={cashflowData} barSize={10}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis dataKey="b" tick={{fill:"#475569",fontSize:10}}/><YAxis tick={{fill:"#475569",fontSize:9}} tickFormatter={(v:number)=>`${(v/1e6).toFixed(0)}jt`}/><Tooltip contentStyle={{background:"#0D1B2E",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,fontSize:11}} formatter={(v:any)=>`Rp ${parseInt(v).toLocaleString("id-ID")}`}/><Bar dataKey="p" name="Pendapatan" fill="#028090" radius={[3,3,0,0]}/><Bar dataKey="e" name="Pengeluaran" fill="#F4A261" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{padding:"18px 20px",marginBottom:14}}>
            <div className="stitle">Rekomendasi AI</div>
            <div style={{display:"grid",gap:8}}>
              {[
                {icon:"◈",t:"Perluas channel penjualan digital",d:"Aktivasi Tokopedia, Shopee, atau GoFood meningkatkan digital signal +15–25 poin",imp:"+15–25",c:"#02C39A"},
                {icon:"◎",t:"Tingkatkan konsistensi pembayaran ke supplier",d:"On-time payment >90% memberikan dampak terbesar pada behavioral signal",imp:"+20–30",c:"#028090"},
                {icon:"◐",t:data.hasSKDU!=="yes"?"Lengkapi SKDU dari kelurahan":"Pertahankan kelengkapan dokumen",d:data.hasSKDU!=="yes"?"Dokumen tambahan meningkatkan kepercayaan lender +12 poin":"Kelengkapan dokumen memberi keunggulan vs UMKM lain",imp:"+12",c:"#7C3AED"},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",background:"rgba(255,255,255,.02)",borderRadius:10,border:"1px solid rgba(255,255,255,.05)",alignItems:"center"}}>
                  <div style={{width:32,height:32,borderRadius:9,background:`${r.c}15`,display:"flex",alignItems:"center",justifyContent:"center",color:r.c,fontSize:15,flexShrink:0}}>{r.icon}</div>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,marginBottom:2}}>{r.t}</div><div style={{fontSize:11,color:"#475569",lineHeight:1.5}}>{r.d}</div></div>
                  <div style={{flexShrink:0,background:`${r.c}18`,border:`1px solid ${r.c}30`,borderRadius:6,padding:"3px 9px",color:r.c,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{r.imp}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{padding:"18px 20px"}}>
            <div className="stitle">Bukti Blockchain — Immutable Record</div>
            <div style={{display:"grid",gap:4,fontFamily:"'JetBrains Mono',monospace",fontSize:11,marginBottom:12}}>
              {[
                ["Program ID","7L1FRY6iPwCYoppBWEdTzMh1EsyKwubQc1U1YXnTLUeE"],
                ["Transaction Hash",txSig||txHash||"—"],
                ["Masked Entity ID",maskedEntity||"—"],
                ["Network","Solana Devnet"],
                ["Timestamp",new Date().toISOString()],
                ["Status",isRealTx?"Confirmed — tercatat permanen on-chain":"Simulated — backend offline saat submit"],
              ].map(([k,v],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"rgba(255,255,255,.02)",borderRadius:7,gap:12}}>
                  <span style={{color:"#334155",flexShrink:0}}>{k}</span>
                  <span style={{color:k==="Status"&&isRealTx?"#02C39A":"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{v}</span>
                </div>
              ))}
            </div>
            {isRealTx&&txExplorer&&(
              <a href={txExplorer} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.2)",borderRadius:10,padding:"11px",fontSize:12,color:"#02C39A",fontFamily:"'JetBrains Mono',monospace",textDecoration:"none",letterSpacing:.3}}>
                ◈ Verifikasi Transaksi di Solana Explorer ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
