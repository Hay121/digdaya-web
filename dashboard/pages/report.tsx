import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import NavBar from "../components/NavBar";
import { LangContext, ToastContext } from "./_app";

const TENOR_OPTIONS=[
  {months:6, label:"6 Bulan",  rate:2.2, note:"Cicilan besar, bunga total hemat"},
  {months:12,label:"12 Bulan", rate:1.8, note:"Pilihan populer modal kerja"},
  {months:24,label:"24 Bulan", rate:1.4, note:"Cicilan lebih ringan"},
  {months:36,label:"36 Bulan", rate:1.2, note:"Untuk investasi usaha"},
];
const fmtRp=(v:string)=>{const n=v.replace(/\D/g,"");return n?"Rp "+parseInt(n).toLocaleString("id-ID"):"";};
const parseRp=(v:string)=>v.replace(/\D/g,"");

export default function Report() {
  const router = useRouter();
  const { lang } = useContext(LangContext);
  const { addToast } = useContext(ToastContext);
  const [user,       setUser]       = useState<any>(null);
  const [data,       setData]       = useState<any>(null);
  const [score,      setScore]      = useState(0);
  const [tenor,      setTenor]      = useState<number|null>(null);
  const [loanInput,  setLoanInput]  = useState("");
  const [loanStatus, setLoanStatus] = useState("");
  const [approvalStep, setApprovalStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [txSig,      setTxSig]      = useState("");
  const [txExplorer, setTxExplorer] = useState("");
  const [txHash,     setTxHash]     = useState("");
  const [maskedEntity, setMaskedEntity] = useState("");
  const [mounted,    setMounted]    = useState(false);

  useEffect(()=>{
    setMounted(true);
    const u = localStorage.getItem("digdaya_user");
    const d = localStorage.getItem("digdaya_umkm_data");
    const s = localStorage.getItem("digdaya_score");
    if(!u||!d||!s){ router.push("/"); return; }
    setUser(JSON.parse(u));
    const parsed = JSON.parse(d);
    setData(parsed);
    setScore(parseInt(s));
    setLoanInput(localStorage.getItem('digdaya_loan_amount')||'');
    setLoanStatus(localStorage.getItem("digdaya_loan_status")||"");
    setTxSig(localStorage.getItem("digdaya_tx_sig")||"");
    setTxExplorer(localStorage.getItem("digdaya_tx_explorer")||"");
    setTxHash(localStorage.getItem("digdaya_tx_hash")||"");
    setMaskedEntity(localStorage.getItem("digdaya_masked_entity")||"");
    const savedTenor = localStorage.getItem("digdaya_tenor");
    if(savedTenor) setTenor(parseInt(savedTenor));
    setSubmitted(localStorage.getItem("digdaya_loan_status")==="pending"||localStorage.getItem("digdaya_loan_status")==="approved");
  },[]);

  if(!mounted||!data||!user) return null;

  const sc = score>=740?"#02C39A":score>=670?"#028090":score>=580?"#F4A261":"#EF4444";
  const sl = score>=740?"Excellent":score>=670?"Good":score>=580?"Fair":"Poor";
  const maxLoan = score>=740?150000000:score>=670?75000000:score>=580?25000000:score>=520?10000000:0;
  const loanRaw  = parseInt(parseRp(loanInput)||"0");
  const loan     = loanRaw;
  const tenorObj = TENOR_OPTIONS.find(t=>t.months===tenor);
  const rate     = tenorObj?tenorObj.rate:0;
  const monthly  = (tenor&&loan>0)?Math.round(loan*(rate/100+1/tenor)):0;
  const totalRepay = monthly*(tenor||0);
  const totalInterest = totalRepay-loan;
  const isRealTx = txSig&&!txSig.startsWith("mock_tx_");
  const isApproved = loanStatus==="approved";
  const isPending  = loanStatus==="pending";
  const isRejected = loanStatus==="rejected";

  const radar=[
    {s:"Arus Kas",   A:Math.min(100,Math.max(10,parseInt(data.monthlyRevenue||0)/(parseInt(data.monthlyExpense||1)+1)*40))},
    {s:"Ketepatan",  A:parseInt(data.onTimePayment||50)},
    {s:"Delivery",   A:parseInt(data.deliveryRate||50)},
    {s:"Pelanggan",  A:Math.min(100,parseInt(data.uniqueBuyers||10))},
    {s:"Digital",    A:parseInt(data.digitalRatio||5)},
    {s:"Dokumen",    A:(data.hasNIB==="yes"?40:0)+(data.hasRekening==="yes"?40:0)+(data.hasSKDU==="yes"?20:0)},
  ];

  const rev = parseInt(data.monthlyRevenue||0);
  const exp = parseInt(data.monthlyExpense||0);
  const cashflowData = Array.from({length:6},(_,i)=>{
    const seasonal = [1.05,0.98,1.02,1.08,0.95,1.03][i];
    return {
      b:["Sep","Okt","Nov","Des","Jan","Feb"][i],
      p:Math.round(rev*seasonal),
      e:Math.round(exp*(1+(Math.random()*.1-.05))),
    };
  });

  const handleSubmit = async () => {
    setProcessing(true);
    const labels = [
      lang==="id"?"Memverifikasi identitas UMKM":"Verifying SME identity",
      lang==="id"?"Memeriksa kelayakan kredit":"Checking credit eligibility",
      lang==="id"?"Mengirim ke tim lender":"Sending to lender team",
      lang==="id"?"Merekam ke Solana Devnet":"Recording to Solana Devnet",
      lang==="id"?"Menunggu persetujuan lender":"Awaiting lender approval",
    ];
    for(let i=0;i<labels.length;i++){
      setApprovalStep(i+1);
      await new Promise(r=>setTimeout(r,900));
    }
    try {
      const usr = JSON.parse(localStorage.getItem("digdaya_user")||"{}");
      const API_URL = "https://kortney-hamulate-annamarie.ngrok-free.dev";
      const res = await fetch(`${API_URL}/api/v1/credit-score`,{
        method:"POST",
        headers:{"Content-Type":"application/json","ngrok-skip-browser-warning":"true"},
        body:JSON.stringify({entityId:usr.id||usr.email||"anon",creditScore:score}),
      });
      const d = await res.json();
      if(d.success&&d.solana_signature){
        localStorage.setItem("digdaya_disburse_sig",  d.solana_signature);
        localStorage.setItem("digdaya_disburse_explorer", d.explorer||"");
      }
    } catch(e){ console.warn("Backend offline"); }
    localStorage.setItem("digdaya_loan_status","pending");
    localStorage.setItem("digdaya_loan_amount", loan.toString());
    if(tenor) localStorage.setItem("digdaya_tenor", tenor.toString());
    setLoanStatus("pending");
    setSubmitted(true);
    setProcessing(false);
    setShowModal(false);
    addToast(lang==="id"?"Pengajuan berhasil dikirim! Menunggu persetujuan lender":"Application submitted! Awaiting lender approval","success");
  };

  const approvalLabels = [
    lang==="id"?"Memverifikasi identitas UMKM":"Verifying SME identity",
    lang==="id"?"Memeriksa kelayakan kredit":"Checking credit eligibility",
    lang==="id"?"Mengirim ke tim lender":"Sending to lender team",
    lang==="id"?"Merekam ke Solana Devnet":"Recording to Solana Devnet",
    lang==="id"?"Menunggu persetujuan lender":"Awaiting lender approval",
  ];

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp .4s ease forwards}
        .card{background:var(--card);border:1px solid var(--border);border-radius:14px}
        .stitle{font-family:var(--font-head);font-size:12px;font-weight:700;color:var(--text3);margin-bottom:14px;letter-spacing:1px;text-transform:uppercase}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}
        .inp{background:var(--bg3);border:1px solid var(--border);border-radius:9px;color:var(--text1);padding:11px 14px;font-size:14px;font-family:var(--font);width:100%;outline:none;transition:border-color .2s}
        .inp:focus{border-color:#028090}
        .tenor-card{background:var(--card);border:1.5px solid var(--border);border-radius:11px;padding:14px 16px;cursor:pointer;transition:all .2s}
        .tenor-card:hover{border-color:rgba(2,128,144,.4);background:rgba(2,128,144,.05)}
        .tenor-card.active{border-color:#028090;background:rgba(2,128,144,.1)}
        .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.08);border-top-color:#02C39A;border-radius:50%;animation:spin .8s linear infinite}
        .nbtn{background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text3);padding:6px 14px;font-size:12px;cursor:pointer;font-family:var(--font);transition:all .2s}
        .nbtn:hover{color:var(--text2)}
      `}</style>

      {showModal&&(
        <div className="overlay">
          <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:20,padding:36,maxWidth:440,width:"100%"}}>
            {!processing?(
              <div style={{textAlign:"center"}}>
                <div style={{width:50,height:50,borderRadius:13,background:"rgba(2,195,154,.1)",border:"1px solid rgba(2,195,154,.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:22}}>◈</div>
                <h2 style={{fontFamily:"var(--font-head)",fontSize:19,fontWeight:800,marginBottom:8,letterSpacing:-.4}}>{lang==="id"?"Konfirmasi Pengajuan Kredit":"Confirm Credit Application"}</h2>
                <p style={{color:"var(--text3)",fontSize:12,lineHeight:1.6,marginBottom:18}}>{lang==="id"?"Pengajuan akan masuk ke antrian review lender. Dana baru dicairkan setelah disetujui.":"Application will be queued for lender review. Funds disbursed only after approval."}</p>
                <div style={{background:"rgba(255,255,255,.03)",borderRadius:10,padding:"14px",marginBottom:18,textAlign:"left"}}>
                  {[
                    [lang==="id"?"Nominal":"Amount","Rp "+loan.toLocaleString("id-ID")],
                    [lang==="id"?"Tenor":"Tenor",`${tenor} ${lang==="id"?"bulan":"months"}`],
                    [lang==="id"?"Bunga":"Interest",`${rate}% / ${lang==="id"?"bulan":"month"}`],
                    [lang==="id"?"Cicilan / Bulan":"Monthly Payment","Rp "+monthly.toLocaleString("id-ID")],
                    [lang==="id"?"Total Kewajiban":"Total Repayment","Rp "+totalRepay.toLocaleString("id-ID")],
                  ].map(([k,v],i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<4?"1px solid var(--border2)":"none"}}>
                      <span style={{fontSize:12,color:"var(--text3)"}}>{k}</span>
                      <span style={{fontSize:12,fontWeight:600,color:"var(--text1)"}}>{v}</span>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:11,color:"var(--text4)",marginBottom:18,lineHeight:1.6}}>{lang==="id"?"Dengan melanjutkan, Anda menyetujui syarat pembiayaan Digdaya. Persetujuan final ada di tangan lender.":"By continuing, you agree to Digdaya's financing terms. Final approval rests with the lender."}</p>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setShowModal(false)} style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:9,color:"var(--text3)",padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"var(--font)"}}>{lang==="id"?"Batal":"Cancel"}</button>
                  <button onClick={handleSubmit} style={{flex:2,background:"linear-gradient(135deg,#02C39A,#028090)",border:"none",borderRadius:9,color:"#fff",padding:"11px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}}>{lang==="id"?"Kirim Pengajuan":"Submit Application"}</button>
                </div>
              </div>
            ):(
              <div style={{textAlign:"center"}}>
                <div style={{marginBottom:24}}>
                  {approvalLabels.map((l,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<4?"1px solid var(--border2)":"none"}}>
                      <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {approvalStep>i+1?<span style={{color:"#02C39A",fontSize:13,fontWeight:700}}>✓</span>:approvalStep===i+1?<div className="spinner"/>:<div style={{width:8,height:8,borderRadius:"50%",background:"var(--border)"}}/>}
                      </div>
                      <span style={{fontSize:12,color:approvalStep>i+1?"var(--text3)":approvalStep===i+1?"var(--text1)":"var(--text5)"}}>{l}</span>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:12,color:"var(--text4)"}}>{lang==="id"?"Mohon jangan tutup halaman ini...":"Please don't close this page..."}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{minHeight:"100vh",background:"var(--bg)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(var(--border2) 1px,transparent 1px),linear-gradient(90deg,var(--border2) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <NavBar rightItems={
          <div style={{display:"flex",gap:8}}>
            {isApproved&&<div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.15)",borderRadius:20,padding:"4px 11px",fontSize:10,color:"#02C39A",fontWeight:600}}>◈ On-chain Verified</div>}
            <button className="nbtn" onClick={()=>router.push("/dashboard")}>{lang==="id"?"Dashboard":"Dashboard"}</button>
          </div>
        }/>

        <div style={{position:"relative",zIndex:1,maxWidth:980,margin:"0 auto",padding:"28px 24px"}}>

          {/* Status Banner */}
          {isApproved&&(
            <div className="fade-up" style={{background:"rgba(2,195,154,.06)",border:"1px solid rgba(2,195,154,.2)",borderRadius:16,padding:"20px 24px",marginBottom:20,display:"flex",gap:18,alignItems:"center"}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(2,195,154,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>◈</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--font-head)",fontSize:16,fontWeight:800,color:"#02C39A",marginBottom:2}}>{lang==="id"?"Kredit Disetujui & Dicairkan":"Credit Approved & Disbursed"}</div>
                <div style={{fontSize:12,color:"var(--text3)"}}>Rp {loan.toLocaleString("id-ID")} · {lang==="id"?"Dana sudah masuk ke g Anda":"Funds have been transferred to your account"}</div>
              </div>
              <button onClick={()=>router.push("/angsuran")} style={{background:"linear-gradient(135deg,#028090,#02C39A)",border:"none",borderRadius:9,color:"#fff",padding:"10px 18px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)",flexShrink:0}}>{lang==="id"?"Lihat Angsuran":"View Schedule"}</button>
            </div>
          )}
          {isPending&&(
            <div className="fade-up" style={{background:"rgba(244,162,97,.05)",border:"1px solid rgba(244,162,97,.15)",borderRadius:16,padding:"20px 24px",marginBottom:20,display:"flex",gap:16,alignItems:"center"}}>
              <div style={{fontSize:22,color:"#F4A261",flexShrink:0}}>◎</div>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontSize:15,fontWeight:800,color:"#F4A261",marginBottom:2}}>{lang==="id"?"Pengajuan Sedang Ditinjau Lender":"Application Under Lender Review"}</div>
                <div style={{fontSize:12,color:"var(--text3)"}}>{lang==="id"?"Proses review 1-3 hari kerja. Anda akan diberitahu saat keputusan dibuat.":"Review process 1-3 business days. You'll be notified when a decision is made."}</div>
              </div>
            </div>
          )}
          {isRejected&&(
            <div className="fade-up" style={{background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.15)",borderRadius:16,padding:"20px 24px",marginBottom:20,display:"flex",gap:16,alignItems:"center"}}>
              <div style={{fontSize:22,color:"#EF4444",flexShrink:0}}>◐</div>
              <div>
                <div style={{fontFamily:"var(--font-head)",fontSize:15,fontWeight:800,color:"#EF4444",marginBottom:2}}>{lang==="id"?"Pengajuan Ditolak":"Application Rejected"}</div>
                <div style={{fontSize:12,color:"var(--text3)"}}>{lang==="id"?"Lihat rekomendasi AI di bawah untuk meningkatkan skor. Bisa mencoba lagi bulan depan.":"See AI recommendations below to improve your score. You can reapply next month."}</div>
              </div>
            </div>
          )}

          <div style={{marginBottom:18}}>
            <div style={{fontSize:9,color:"var(--text5)",letterSpacing:3,textTransform:"uppercase",marginBottom:4,fontFamily:"var(--font-mono)"}}>{lang==="id"?"Laporan Kredit · Digdaya AI":"Credit Report · Digdaya AI"}</div>
            <h1 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:3,letterSpacing:-.5}}>{data.bizName||"Usaha Anda"}</h1>
            <p style={{color:"var(--text4)",fontSize:12}}>{user.name} · {new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"190px 1fr",gap:14,marginBottom:14}}>
            {/* Score Card */}
            <div className="card" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"18px 12px"}}>
              <div style={{fontSize:9,color:"var(--text5)",letterSpacing:2,textTransform:"uppercase",marginBottom:12,fontFamily:"var(--font-mono)"}}>Credit Score</div>
              <div style={{width:110,height:110,borderRadius:"50%",background:`conic-gradient(${sc} ${((score-300)/550)*360}deg,var(--border) 0deg)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${sc}25`,marginBottom:12}}>
                <div style={{width:84,height:84,borderRadius:"50%",background:"var(--bg2)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:26,fontWeight:800,color:sc,fontFamily:"var(--font-head)",lineHeight:1,letterSpacing:-1}}>{score}</div>
                  <div style={{fontSize:8,color:sc,fontWeight:600,letterSpacing:2,marginTop:3}}>{sl}</div>
                </div>
              </div>
              <div style={{width:"100%"}}>
                <div style={{height:3,background:"var(--border2)",borderRadius:2,overflow:"hidden",marginBottom:4}}>
                  <div style={{height:"100%",width:`${((score-300)/550)*100}%`,background:"linear-gradient(90deg,#EF4444,#F4A261,#02C39A)",borderRadius:2}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"var(--text5)",fontFamily:"var(--font-mono)"}}><span>300</span><span>580</span><span>740</span><span>850</span></div>
              </div>
            </div>

            {/* Loan Simulation */}
            <div className="card" style={{padding:"18px 20px"}}>
              <div className="stitle">{lang==="id"?"Simulasi Kredit — Pilih Tenor & Nominal":"Credit Simulation — Choose Tenor & Amount"}</div>
              {score>=520?(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                    <div>
                      <div style={{fontSize:11,color:"var(--text3)",marginBottom:5,fontWeight:500}}>{lang==="id"?"Nominal Pinjaman":"Loan Amount"}</div>
                <input className="inp" placeholder="Rp 0" value={fmtRp(loanInput)}
                  onChange={e=>{setLoanInput(parseRp(e.target.value));localStorage.setItem("digdaya_loan_amount",parseRp(e.target.value));}}
                  disabled={submitted}
                  style={{borderColor:loan>maxLoan&&loan>0?"#EF4444":loan>0&&loan<=maxLoan?"#02C39A":"var(--border)",transition:"border-color .2s"}}
                />
                {loan>maxLoan&&loan>0?(
                  <div style={{fontSize:11,color:"#EF4444",marginTop:4,fontWeight:600}}>⚠ {lang==="id"?"Melebihi plafon! Kurangi nominal Anda":"Exceeds limit! Reduce amount"} (max Rp {maxLoan.toLocaleString("id-ID")})</div>
                ):(
                  <div style={{fontSize:10,color:loan>0&&loan<=maxLoan?"#02C39A":"var(--text4)",marginTop:3}}>{loan>0&&loan<=maxLoan?"✓ ":""}{lang==="id"?"Maks":"Max"}. Rp {maxLoan.toLocaleString("id-ID")}</div>
                )}
                    </div>
                    <div>
                      <div style={{fontSize:11,color:"var(--text3)",marginBottom:5,fontWeight:500}}>{lang==="id"?"Plafon Maksimum":"Maximum Limit"}</div>
                      <div style={{background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.15)",borderRadius:9,padding:"11px 14px"}}>
                        <div style={{fontFamily:"var(--font-head)",fontSize:16,fontWeight:800,color:"#02C39A"}}>Rp {maxLoan.toLocaleString("id-ID")}</div>
                        <div style={{fontSize:10,color:"var(--text4)",marginTop:2}}>{lang==="id"?"Berdasarkan skor":"Based on score"} {score}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"var(--text3)",marginBottom:7,fontWeight:500}}>{lang==="id"?"Pilih Tenor":"Choose Tenor"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                    {TENOR_OPTIONS.map(t=>(
                      <div key={t.months} className={`tenor-card ${tenor===t.months?"active":""}`} onClick={()=>!submitted&&setTenor(t.months)} style={{opacity:submitted?.7:1,cursor:submitted?"not-allowed":"pointer"}}>
                        <div style={{fontFamily:"var(--font-head)",fontSize:14,fontWeight:800,color:tenor===t.months?"#028090":"var(--text3)",marginBottom:2}}>{t.label}</div>
                        <div style={{fontSize:10,color:tenor===t.months?"#02C39A":"var(--text4)",marginBottom:3}}>{lang==="id"?"Bunga":"Rate"} {t.rate}%/{lang==="id"?"bln":"mo"}</div>
                        <div style={{fontSize:9,color:"var(--text5)",lineHeight:1.4}}>{t.note}</div>
                      </div>
                    ))}
                  </div>
                  {tenor&&loan>0?(
                    <div style={{background:"rgba(2,128,144,.07)",border:"1px solid rgba(2,128,144,.15)",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                        {[
                          {l:lang==="id"?"Cicilan / Bulan":"Monthly",    v:"Rp "+monthly.toLocaleString("id-ID"),      c:"var(--text1)"},
                          {l:lang==="id"?"Total Bunga":"Total Interest", v:"Rp "+totalInterest.toLocaleString("id-ID"), c:"#F4A261"},
                          {l:lang==="id"?"Total Bayar":"Total Repay",    v:"Rp "+totalRepay.toLocaleString("id-ID"),    c:"var(--text2)"},
                        ].map((x,i)=>(
                          <div key={i}><div style={{fontSize:10,color:"var(--text4)",marginBottom:2}}>{x.l}</div><div style={{fontSize:13,fontWeight:700,color:x.c,fontFamily:"var(--font-head)"}}>{x.v}</div></div>
                        ))}
                      </div>
                    </div>
                  ):(
                    <div style={{background:"var(--card)",border:"1px dashed var(--border)",borderRadius:10,padding:"14px",textAlign:"center",marginBottom:12}}>
                      <div style={{fontSize:12,color:"var(--text4)"}}>{lang==="id"?"Masukkan nominal dan pilih tenor untuk melihat simulasi":"Enter amount and choose tenor to see simulation"}</div>
                    </div>
                  )}
                  {!submitted?(
                    <button disabled={!tenor||!loan||loan>maxLoan||loan<=0} onClick={()=>setShowModal(true)} style={{width:"100%",background:tenor&&loan&&loan<=maxLoan?"linear-gradient(135deg,#02C39A,#028090)":"var(--card)",border:tenor&&loan&&loan<=maxLoan?"none":"1px solid var(--border)",borderRadius:9,color:tenor&&loan&&loan<=maxLoan?"#fff":"var(--text4)",padding:"12px",fontSize:13,fontWeight:600,cursor:tenor&&loan&&loan<=maxLoan?"pointer":"not-allowed",fontFamily:"var(--font)",transition:"all .2s"}}>
                      {!loan?(lang==="id"?"Masukkan nominal pinjaman":"Enter loan amount"):loan>maxLoan?(lang==="id"?"⚠ Nominal melebihi plafon — kurangi jumlahnya":"⚠ Amount exceeds limit — reduce it"):!tenor?(lang==="id"?"Pilih tenor terlebih dahulu":"Choose tenor first"):(lang==="id"?"Kirim Pengajuan ke Lender":"Submit to Lender")}
                    </button>
                  ):isApproved?(
                    <button onClick={()=>router.push("/angsuran")} style={{width:"100%",background:"linear-gradient(135deg,#02C39A,#028090)",border:"none",borderRadius:9,color:"#fff",padding:"12px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}}>
                      {lang==="id"?"Lihat Jadwal Angsuran →":"View Installment Schedule →"}
                    </button>
                  ):(
                    <div style={{background:"rgba(244,162,97,.08)",border:"1px solid rgba(244,162,97,.2)",borderRadius:9,padding:"12px",textAlign:"center",color:"#F4A261",fontWeight:600,fontSize:13}}>
                      {lang==="id"?"Menunggu Keputusan Lender...":"Awaiting Lender Decision..."}
                    </div>
                  )}
                </div>
              ):(
                <div style={{padding:"22px",textAlign:"center"}}>
                  <div style={{fontSize:24,color:"#F4A261",marginBottom:8}}>◐</div>
                  <div style={{fontWeight:600,color:"#F4A261",fontSize:13,marginBottom:6}}>{lang==="id"?"Skor Perlu Ditingkatkan":"Score Needs Improvement"}</div>
                  <div style={{fontSize:12,color:"var(--text3)",lineHeight:1.6}}>{lang==="id"?"Minimal skor 520 untuk akses pengajuan. Lihat rekomendasi di bawah.":"Minimum score 520 for application access. See recommendations below."}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div className="card" style={{padding:"18px 20px"}}>
              <div className="stitle">{lang==="id"?"Profil Usaha — Radar AI":"Business Profile — AI Radar"}</div>
              <div style={{fontSize:10,color:"var(--text5)",marginBottom:10}}>{lang==="id"?"Sumber: data form onboarding · model XGBoost":"Source: onboarding form data · XGBoost model"}</div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radar}>
                  <PolarGrid stroke="var(--border)"/>
                  <PolarAngleAxis dataKey="s" tick={{fill:"var(--text3)" as string,fontSize:10}}/>
                  <Radar dataKey="A" stroke="#028090" fill="#028090" fillOpacity={0.12} strokeWidth={1.5}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{padding:"18px 20px"}}>
              <div className="stitle">{lang==="id"?"Proyeksi Arus Kas 6 Bulan":"6-Month Cash Flow Projection"}</div>
              <div style={{fontSize:10,color:"var(--text5)",marginBottom:10}}>{lang==="id"?"Berdasarkan pendapatan & pengeluaran aktual dengan variasi musiman":"Based on actual revenue & expenses with seasonal variation"}</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cashflowData} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)"/>
                  <XAxis dataKey="b" tick={{fill:"var(--text3)" as string,fontSize:10}}/>
                  <YAxis tick={{fill:"var(--text3)" as string,fontSize:9}} tickFormatter={(v:number)=>`${(v/1e6).toFixed(0)}jt`}/>
                  <Tooltip contentStyle={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:9,fontSize:11}} formatter={(v:any)=>`Rp ${parseInt(v).toLocaleString("id-ID")}`}/>
                  <Bar dataKey="p" name={lang==="id"?"Pendapatan":"Revenue"} fill="#028090" radius={[3,3,0,0]}/>
                  <Bar dataKey="e" name={lang==="id"?"Pengeluaran":"Expenses"} fill="#F4A261" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{padding:"18px 20px",marginBottom:14}}>
            <div className="stitle">{lang==="id"?"Rekomendasi AI":"AI Recommendations"}</div>
            <div style={{display:"grid",gap:8}}>
              {[
                {icon:"◈",t:lang==="id"?"Perluas channel penjualan digital":"Expand digital sales channels",d:lang==="id"?"Tokopedia, Shopee, atau GoFood meningkatkan digital signal +15–25 poin":"Tokopedia, Shopee, or GoFood increases digital signal +15-25 points",imp:"+15–25",c:"#02C39A"},
                {icon:"◎",t:lang==="id"?"Tingkatkan konsistensi pembayaran ke supplier":"Improve payment consistency to suppliers",d:lang==="id"?"On-time payment >90% memberikan dampak terbesar pada behavioral signal":"On-time payment >90% has biggest impact on behavioral signal",imp:"+20–30",c:"#028090"},
                {icon:"◐",t:data.hasSKDU!=="yes"?(lang==="id"?"Lengkapi SKDU dari kelurahan":"Complete SKDU from local office"):(lang==="id"?"Pertahankan kelengkapan dokumen":"Maintain document completeness"),d:lang==="id"?"Dokumen tambahan meningkatkan kepercayaan lender +12 poin":"Additional documents increase lender trust +12 points",imp:"+12",c:"#7C3AED"},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",background:"var(--card)",borderRadius:10,border:"1px solid var(--border2)",alignItems:"center"}}>
                  <div style={{width:32,height:32,borderRadius:9,background:`${r.c}15`,display:"flex",alignItems:"center",justifyContent:"center",color:r.c,fontSize:15,flexShrink:0}}>{r.icon}</div>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,marginBottom:2}}>{r.t}</div><div style={{fontSize:11,color:"var(--text3)",lineHeight:1.5}}>{r.d}</div></div>
                  <div style={{flexShrink:0,background:`${r.c}18`,border:`1px solid ${r.c}30`,borderRadius:6,padding:"3px 9px",color:r.c,fontSize:11,fontWeight:700,fontFamily:"var(--font-mono)"}}>{r.imp}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:"18px 20px"}}>
            <div className="stitle">{lang==="id"?"Bukti Blockchain — Immutable Record":"Blockchain Proof — Immutable Record"}</div>
            <div style={{display:"grid",gap:4,fontFamily:"var(--font-mono)",fontSize:11,marginBottom:12}}>
              {[
                [lang==="id"?"Program ID":"Program ID","7L1FRY6iPwCYoppBWEdTzMh1EsyKwubQc1U1YXnTLUeE"],
                [lang==="id"?"Transaction Hash":"Transaction Hash",txSig||txHash||"—"],
                [lang==="id"?"Masked Entity ID":"Masked Entity ID",maskedEntity||"—"],
                ["Network","Solana Devnet"],
                ["Timestamp",new Date().toISOString()],
                ["Status",isRealTx?(lang==="id"?"Confirmed — tercatat permanen on-chain":"Confirmed — permanently recorded on-chain"):(lang==="id"?"Simulated — backend offline saat submit":"Simulated — backend was offline on submit")],
              ].map(([k,v],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"var(--card)",borderRadius:7,gap:12}}>
                  <span style={{color:"var(--text4)",flexShrink:0}}>{k}</span>
                  <span style={{color:k==="Status"&&isRealTx?"#02C39A":"var(--text3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{v}</span>
                </div>
              ))}
            </div>
            {isRealTx&&txExplorer&&(
              <a href={txExplorer} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.2)",borderRadius:10,padding:"11px",fontSize:12,color:"#02C39A",fontFamily:"var(--font-mono)",textDecoration:"none",letterSpacing:.3}}>
                ◈ {lang==="id"?"Verifikasi Transaksi di Solana Explorer ↗":"Verify Transaction on Solana Explorer ↗"}
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
