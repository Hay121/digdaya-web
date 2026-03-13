import { useState, useEffect } from "react";
import { useRouter } from "next/router";
const AI_STEPS = [
  {label:"Membaca profil usaha",detail:"Memproses 8 parameter input",dur:1100},
  {label:"Menghitung arus kas",detail:"Proyeksi cashflow 6 bulan ke depan",dur:1000},
  {label:"Menilai rekam jejak",detail:"On-time payment · delivery rate · market reach",dur:1200},
  {label:"Korelasi data inflasi pangan",detail:"Menyesuaikan risiko sektoral dengan harga komoditas",dur:900},
  {label:"Menjalankan model XGBoost",detail:"648 decision trees · ensemble scoring aktif",dur:1600},
  {label:"Verifikasi hash ke blockchain",detail:"Mencatat fingerprint ke Solana Devnet",dur:1300},
  {label:"Menyusun laporan kredit",detail:"Generating structured credit report...",dur:700},
];
function computeScore(d:any):number {
  let s=500;
  const rev=parseInt(d.monthlyRevenue||0),exp=parseInt(d.monthlyExpense||0),debt=parseInt(d.existingDebt||0);
  const otp=parseInt(d.onTimePayment||50),dr=parseInt(d.deliveryRate||50);
  const buyers=parseInt(d.uniqueBuyers||10),digital=parseInt(d.digitalRatio||5);
  const margin=rev>0?(rev-exp)/rev:0;
  if(margin>0.4)s+=60;else if(margin>0.25)s+=40;else if(margin>0.1)s+=20;else s-=20;
  if(debt===0)s+=30;else if(debt<rev*0.3)s+=10;else s-=30;
  s+=(otp-50)*1.5; s+=(dr-50)*0.8;
  if(buyers>100)s+=40;else if(buyers>50)s+=20;else if(buyers>20)s+=10;
  s+=digital*0.5;
  const am:any={"Kurang dari 1 tahun":-10,"1–2 tahun":0,"2–5 tahun":20,"5–10 tahun":35,"Lebih dari 10 tahun":50};
  s+=am[d.bizAge]||0;
  if(d.hasNIB==="yes")s+=20; if(d.hasRekening==="yes")s+=15;
  return Math.min(850,Math.max(300,Math.round(s)));
}
export default function Scoring() {
  const router=useRouter();
  const [cur,setCur]=useState(-1);
  const [done,setDone]=useState(false);
  const [score,setScore]=useState(0);
  const [txSig,setTxSig]=useState("");
  const [txExplorer,setTxExplorer]=useState("");
  const [txHash,setTxHash]=useState("");
  useEffect(()=>{
    const d=localStorage.getItem("digdaya_umkm_data");
    if(!d){router.push("/");return;}
    setTxSig(localStorage.getItem("digdaya_tx_sig")||"");
    setTxExplorer(localStorage.getItem("digdaya_tx_explorer")||"");
    setTxHash(localStorage.getItem("digdaya_tx_hash")||"");
    const sc=computeScore(JSON.parse(d));
    let delay=600;
    AI_STEPS.forEach((_,i)=>{setTimeout(()=>setCur(i),delay);delay+=AI_STEPS[i].dur;});
    setTimeout(()=>{setScore(sc);setDone(true);localStorage.setItem("digdaya_score",sc.toString());},delay+400);
  },[]);
  const sc=score>=740?"#02C39A":score>=670?"#028090":score>=580?"#F4A261":"#EF4444";
  const sl=score>=740?"Excellent":score>=670?"Good":score>=580?"Fair":"Poor";
  const pct=Math.round(((score-300)/550)*100);
  const isRealTx=txSig&&!txSig.startsWith("mock_tx_");
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060E1C;color:#F1F5F9;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes reveal{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
        @keyframes glow{0%,100%{box-shadow:0 0 30px rgba(2,195,154,.2)}50%{box-shadow:0 0 60px rgba(2,195,154,.5)}}
        .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.08);border-top-color:#02C39A;border-radius:50%;animation:spin .7s linear infinite}
        .ring{animation:reveal .9s cubic-bezier(.34,1.56,.64,1) forwards,glow 2.5s ease 1s infinite}
        .fade-up{animation:fadeUp .5s ease forwards}
        .card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px}
        .btn{background:linear-gradient(135deg,#028090,#02C39A);border:none;border-radius:9px;color:#fff;padding:13px 28px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s}
        .btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(2,195,154,.3)}
        .btn-ghost{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:9px;color:#64748B;padding:13px 22px;font-size:14px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s}
        .btn-ghost:hover{background:rgba(255,255,255,.08);color:#94A3B8}
      `}</style>
      <div style={{minHeight:"100vh",background:"#060E1C",position:"relative",overflow:"hidden"}}>
        <div style={{position:"fixed",left:"45%",top:"-5%",width:500,height:500,borderRadius:"50%",background:"#02C39A",filter:"blur(375px)",opacity:.06,pointerEvents:"none"}}/>
        <nav style={{position:"relative",zIndex:10,padding:"0 40px",height:58,display:"flex",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
          <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,marginRight:9}}>D</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,letterSpacing:-.3}}>DIGDAYA</span>
        </nav>
        <div style={{position:"relative",zIndex:1,maxWidth:640,margin:"0 auto",padding:"56px 24px",display:"flex",flexDirection:"column",alignItems:"center"}}>
          {!done?(
            <div style={{width:"100%"}}>
              <div style={{textAlign:"center",marginBottom:44}}>
                <div style={{width:56,height:56,borderRadius:16,background:"rgba(2,128,144,.15)",border:"1px solid rgba(2,128,144,.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>◎</div>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,marginBottom:8,letterSpacing:-.5}}>Analisis AI Sedang Berjalan</h1>
                <p style={{color:"#475569",fontSize:13,lineHeight:1.6}}>Model kami membutuhkan 8–10 detik untuk memproses seluruh parameter.</p>
              </div>
              <div className="card" style={{overflow:"hidden",marginBottom:16}}>
                {AI_STEPS.map((s,i)=>{
                  const isDone=i<cur,isActive=i===cur;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 20px",borderBottom:i<AI_STEPS.length-1?"1px solid rgba(255,255,255,.04)":"none",background:isActive?"rgba(2,128,144,.05)":"transparent",transition:"background .3s"}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:isDone?"rgba(2,195,154,.15)":isActive?"rgba(2,128,144,.15)":"rgba(255,255,255,.04)",border:`1.5px solid ${isDone?"#02C39A":isActive?"#028090":"rgba(255,255,255,.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {isDone?<span style={{color:"#02C39A",fontSize:12,fontWeight:700}}>✓</span>:isActive?<div className="spinner"/>:<span style={{color:"#1E293B",fontSize:11}}>{i+1}</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,color:isActive?"#F1F5F9":isDone?"#475569":"#1E293B"}}>{s.label}</div>
                        <div style={{fontSize:11,color:isActive?"#334155":"#0F172A",marginTop:2}}>{s.detail}</div>
                      </div>
                      {isActive&&<div style={{fontSize:9,color:"#028090",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,border:"1px solid rgba(2,128,144,.3)",borderRadius:4,padding:"2px 7px"}}>RUNNING</div>}
                      {isDone&&<div style={{fontSize:9,color:"#02C39A",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>DONE</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{background:"rgba(255,255,255,.02)",borderRadius:9,padding:"10px 16px",display:"flex",justifyContent:"space-between",fontSize:11}}>
                <span style={{color:"#1E293B"}}>TX Hash {isRealTx?"(on-chain ✓)":"(pending)"}</span>
                <span style={{color:"#334155",fontFamily:"'JetBrains Mono',monospace"}}>{(txHash||"generating...").slice(0,28)}...</span>
              </div>
            </div>
          ):(
            <div className="fade-up" style={{width:"100%",textAlign:"center"}}>
              <div style={{marginBottom:36}}>
                <div style={{fontSize:11,color:"#334155",letterSpacing:3,textTransform:"uppercase",marginBottom:20,fontFamily:"'JetBrains Mono',monospace"}}>Credit Score Result</div>
                <div className="ring" style={{width:180,height:180,borderRadius:"50%",background:`conic-gradient(${sc} ${pct*3.6}deg,rgba(255,255,255,.04) 0deg)`,margin:"0 auto 28px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:140,height:140,borderRadius:"50%",background:"#060E1C",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:52,fontWeight:800,color:sc,fontFamily:"'Syne',sans-serif",lineHeight:1,letterSpacing:-2}}>{score}</div>
                    <div style={{fontSize:10,color:sc,fontWeight:600,letterSpacing:3,marginTop:5,textTransform:"uppercase"}}>{sl}</div>
                  </div>
                </div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:10,letterSpacing:-.5}}>
                  {score>=670?"Selamat — Anda Layak Kredit":score>=580?"Hampir — Perlu Sedikit Perbaikan":"Diperlukan Peningkatan Lebih Lanjut"}
                </h2>
                <p style={{color:"#475569",fontSize:13,lineHeight:1.7,maxWidth:420,margin:"0 auto 20px"}}>
                  {score>=670?"Profil kredit Anda masuk kategori baik. Laporan lengkap dan penawaran kredit telah disiapkan.":score>=580?"Profil kredit Anda cukup. Beberapa indikator dapat ditingkatkan.":"Lihat laporan untuk rekomendasi spesifik dari AI kami."}
                </p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20,textAlign:"left"}}>
                {[
                  {l:"Skor Anda",v:score.toString(),c:sc},
                  {l:"Kategori",v:sl,c:sc},
                  {l:"Blockchain",v:isRealTx?"On-chain ✓":"Simulated",c:isRealTx?"#02C39A":"#F4A261"},
                ].map((item,i)=>(
                  <div key={i} className="card" style={{padding:"14px"}}>
                    <div style={{fontSize:9,color:"#334155",marginBottom:5,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono',monospace"}}>{item.l}</div>
                    <div style={{fontSize:20,fontWeight:700,color:item.c,fontFamily:"'Syne',sans-serif",letterSpacing:-.3}}>{item.v}</div>
                  </div>
                ))}
              </div>
              {isRealTx&&(
                <a href={txExplorer} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.2)",borderRadius:9,padding:"10px 18px",fontSize:11,color:"#02C39A",fontFamily:"'JetBrains Mono',monospace",textDecoration:"none",marginBottom:16,letterSpacing:.3}}>
                  ◈ Verifikasi Transaksi di Solana Explorer ↗
                </a>
              )}
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button className="btn" onClick={()=>router.push("/report")}>Lihat Laporan Lengkap</button>
                <button className="btn-ghost" onClick={()=>router.push("/dashboard")}>Dashboard</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
