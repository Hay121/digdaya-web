import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { ThemeContext, LangContext } from "./_app";

export default function Angsuran() {
  const router  = useRouter();
  const { theme, toggle } = useContext(ThemeContext);
  const { lang, setLang } = useContext(LangContext);
  const [data,   setData]    = useState<any>(null);
  const [user,   setUser]    = useState<any>(null);
  const [score,  setScore]   = useState(0);
  const [mounted,setMounted] = useState(false);
  const [paidIdx,setPaidIdx] = useState<number[]>([]);

  useEffect(()=>{
    setMounted(true);
    const u = localStorage.getItem("digdaya_user");
    const d = localStorage.getItem("digdaya_umkm_data");
    const s = localStorage.getItem("digdaya_score");
    const loanStatus = localStorage.getItem("digdaya_loan_status");
    if(!u||!d||!s){ router.push("/"); return; }
    setUser(JSON.parse(u));
    setData(JSON.parse(d));
    setScore(parseInt(s));
    // Jika belum approved, redirect ke dashboard
    if(loanStatus!=="approved"){ router.push("/dashboard"); return; }
    const savedPaid = localStorage.getItem("digdaya_paid_installments");
    if(savedPaid) setPaidIdx(JSON.parse(savedPaid));
  },[]);

  if(!mounted||!data) return null;

  const loan   = parseInt(localStorage.getItem("digdaya_loan_amount")||data.loanAmount||'0');
  const tenor  = parseInt(localStorage.getItem("digdaya_tenor")||"12");
  const rate   = tenor===6?2.2:tenor===12?1.8:tenor===24?1.4:1.2;
  const monthly = Math.round(loan*(rate/100+1/tenor));
  const startDate = new Date(localStorage.getItem("digdaya_approved_date")||new Date().toISOString());

  const schedule = Array.from({length:tenor},(_,i)=>{
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth()+i+1);
    const pokok  = Math.round(loan/tenor);
    const bunga  = Math.round((loan-(pokok*i))*(rate/100));
    const sisaPokok = Math.max(0, loan-(pokok*(i+1)));
    return { no:i+1, dueDate, pokok, bunga, cicilan:pokok+bunga, sisaPokok };
  });

  const today = new Date();
  const totalPaid  = paidIdx.reduce((s,i)=>s+schedule[i]?.cicilan||0,0);
  const totalLeft  = schedule.reduce((s,r)=>s+r.cicilan,0)-totalPaid;
  const nextDue    = schedule.find(r=>!paidIdx.includes(r.no-1));
  const sc = score>=740?"#02C39A":score>=670?"#028090":score>=580?"#F4A261":"#EF4444";

  const markPaid = (idx:number) => {
    const updated = [...paidIdx, idx];
    setPaidIdx(updated);
    localStorage.setItem("digdaya_paid_installments", JSON.stringify(updated));
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:3px}
        .card{background:var(--card);border:1px solid var(--border);border-radius:14px}
        .nbtn{background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text3);padding:6px 14px;font-size:12px;cursor:pointer;font-family:var(--font);transition:all .2s}
        .nbtn:hover{color:var(--text2)}
        .row:hover{background:var(--card)}
        .row{transition:background .15s}
      `}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(var(--border2) 1px,transparent 1px),linear-gradient(90deg,var(--border2) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <nav style={{position:"sticky",top:0,zIndex:100,background:"var(--bg)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border2)",padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,color:"#fff"}}>D</div>
            <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,letterSpacing:-.3}}>DIGDAYA</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
     <div style={{display:"flex",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",fontSize:11,fontWeight:600}}>
              <button onClick={()=>setLang("id")} style={{padding:"4px 10px",background:lang==="id"?"linear-gradient(135deg,#028090,#02C39A)":"transparent",color:lang==="id"?"#fff":"var(--text3)",border:"none",cursor:"pointer",fontFamily:"var(--font)"}}>ID</button>
              <button onClick={()=>setLang("en")} style={{padding:"4px 10px",background:lang==="en"?"linear-gradient(135deg,#028090,#02C39A)":"transparent",color:lang==="en"?"#fff":"var(--text3)",border:"none",cursor:"pointer",fontFamily:"var(--font)"}}>EN</button>
            </div>
            <button className="nbtn" onClick={toggle} style={{fontSize:16,padding:"5px 10px"}}>{theme==="dark"?"☀️":"🌙"}</button>
            <button className="nbtn" onClick={()=>router.push("/dashboard")}>{lang==="id"?"Dashboard":"Dashboard"}</button>
          </div>
        </nav>
        <main style={{position:"relative",zIndex:1,maxWidth:1000,margin:"0 auto",padding:"28px 24px"}}>
          <div style={{marginBottom:22}}>
            <div style={{fontSize:9,color:"var(--text5)",letterSpacing:3,textTransform:"uppercase",marginBottom:5,fontFamily:"var(--font-mono)"}}>
              {lang==="id"?"Jadwal Angsuran · Digdaya":"Installment Schedule · Digdaya"}
            </div>
            <h1 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:3,letterSpacing:-.4}}>
              {lang==="id"?"Jadwal Pembayaran Angsuran":"Installment Payment Schedule"}
            </h1>
            <p style={{color:"var(--text3)",fontSize:12}}>{user?.name} · {data?.bizName} · {new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
          </div>

          <div style={{background:"rgba(2,195,154,.06)",border:"1px solid rgba(2,195,154,.2)",borderRadius:14,padding:"18px 22px",marginBottom:20,display:"flex",gap:16,alignItems:"center"}}>
            <div style={{width:44,height:44,borderRadius:12,background:"rgba(2,195,154,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>◈</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--font-head)",fontSize:16,fontWeight:800,color:"#02C39A",marginBottom:2}}>
                {lang==="id"?"Kredit Disetujui & Dicairkan":"Credit Approved & Disbursed"}
              </div>
              <div style={{fontSize:12,color:"var(--text3)"}}>
                {lang==="id"?"Dana":"Funds"} <strong style={{color:"var(--text1)"}}>Rp {loan.toLocaleString("id-ID")}</strong> {lang==="id"?"telah diterima":"have been received"} · {lang==="id"?"Tenor":"Tenor"} {tenor} {lang==="id"?"bulan":"months"} · {lang==="id"?"Bunga":"Interest"} {rate}%/{lang==="id"?"bln":"mo"}
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {[
              {l:lang==="id"?"Total Pinjaman":"Total Loan",         v:"Rp "+loan.toLocaleString("id-ID"),           c:"#028090"},
              {l:lang==="id"?"Sudah Dibayar":"Amount Paid",         v:"Rp "+totalPaid.toLocaleString("id-ID"),       c:"#02C39A"},
              {l:lang==="id"?"Sisa Kewajiban":"Remaining Balance",  v:"Rp "+totalLeft.toLocaleString("id-ID"),       c:"#F4A261"},
              {l:lang==="id"?"Cicilan / Bulan":"Monthly Payment",   v:"Rp "+monthly.toLocaleString("id-ID"),         c:sc},
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:"14px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${s.c}80,transparent)`}}/>
                <div style={{fontSize:9,color:"var(--text5)",letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontFamily:"var(--font-mono)"}}>{s.l}</div>
                <div style={{fontSize:18,fontWeight:800,color:s.c,fontFamily:"var(--font-head)",letterSpacing:-.3}}>{s.v}</div>
              </div>
            ))}
          </div>

          {nextDue&&(
            <div style={{background:"rgba(2,128,144,.07)",border:"1px solid rgba(2,128,144,.15)",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:"var(--text3)",marginBottom:3}}>{lang==="id"?"Jatuh Tempo Berikutnya":"Next Due Date"}</div>
                <div style={{fontFamily:"var(--font-head)",fontSize:18,fontWeight:800,color:"#028090",letterSpacing:-.3}}>
                  {nextDue.dueDate.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:"var(--text3)",marginBottom:3}}>{lang==="id"?"Angsuran ke":"Installment"} {nextDue.no}</div>
                <div style={{fontFamily:"var(--font-head)",fontSize:18,fontWeight:800,color:"#F4A261",letterSpacing:-.3}}>Rp {nextDue.cicilan.toLocaleString("id-ID")}</div>
              </div>
            </div>
          )}

          <div className="card" style={{overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border2)"}}>
              <div style={{fontFamily:"var(--font-head)",fontSize:12,fontWeight:700,color:"var(--text3)",letterSpacing:1,textTransform:"uppercase"}}>
                {lang==="id"?"Rincian Jadwal Angsuran":"Installment Schedule Detail"}
              </div>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"1px solid var(--border2)"}}>
                    {[
                      lang==="id"?"Bulan ke":"Month",
                      lang==="id"?"Jatuh Tempo":"Due Date",
                      lang==="id"?"Pokok":"Principal",
                      lang==="id"?"Bunga":"Interest",
                      lang==="id"?"Cicilan":"Installment",
                      lang==="id"?"Sisa Pokok":"Balance",
                      "Status"
                    ].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 16px",color:"var(--text5)",fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",fontSize:9,fontFamily:"var(--font-mono)"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row,i)=>{
                    const isPaid    = paidIdx.includes(i);
                    const isOverdue = !isPaid&&row.dueDate<today;
                    const isNext    = !isPaid&&!isOverdue&&nextDue?.no===row.no;
                    return (
                      <tr key={i} className="row" style={{borderBottom:"1px solid var(--border2)",background:isPaid?"rgba(2,195,154,.04)":isOverdue?"rgba(239,68,68,.04)":"transparent"}}>
                        <td style={{padding:"10px 16px",fontFamily:"var(--font-mono)",color:"var(--text3)",fontSize:11,fontWeight:600}}>{String(row.no).padStart(2,"0")}</td>
                        <td style={{padding:"10px 16px",color:"var(--text2)",fontSize:11}}>{row.dueDate.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}</td>
                        <td style={{padding:"10px 16px",color:"var(--text2)",fontSize:11}}>Rp {row.pokok.toLocaleString("id-ID")}</td>
                        <td style={{padding:"10px 16px",color:"#F4A261",fontSize:11}}>Rp {row.bunga.toLocaleString("id-ID")}</td>
                        <td style={{padding:"10px 16px",fontWeight:700,color:"var(--text1)",fontSize:12,fontFamily:"var(--font-head)"}}>Rp {row.cicilan.toLocaleString("id-ID")}</td>
                        <td style={{padding:"10px 16px",color:"var(--text3)",fontSize:11}}>Rp {row.sisaPokok.toLocaleString("id-ID")}</td>
                        <td style={{padding:"10px 16px"}}>
                          {isPaid?(
                            <span style={{background:"rgba(2,195,154,.1)",color:"#02C39A",border:"1px solid rgba(2,195,154,.2)",borderRadius:5,padding:"3px 9px",fontSize:10,fontWeight:600}}>
                              {lang==="id"?"Lunas":"Paid"}
                            </span>
                          ):isOverdue?(
                            <span style={{background:"rgba(239,68,68,.1)",color:"#EF4444",border:"1px solid rgba(239,68,68,.2)",borderRadius:5,padding:"3px 9px",fontSize:10,fontWeight:600}}>
                              {lang==="id"?"Terlambat":"Overdue"}
                            </span>
                          ):isNext?(
                            <button onClick={()=>markPaid(i)} style={{background:"linear-gradient(135deg,#028090,#02C39A)",border:"none",borderRadius:5,color:"#fff",padding:"3px 10px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}}>
                              {lang==="id"?"Bayar":"Pay Now"}
                            </button>
                          ):(
                            <span style={{color:"var(--text5)",fontSize:10}}>{lang==="id"?"Belum Jatuh Tempo":"Upcoming"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
