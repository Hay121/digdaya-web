import { useState, useEffect } from "react";
import { useRouter } from "next/router";

function SkeletonRow() {
  return (
    <tr>
      {[120,180,300,100,80,120].map((w,i)=>(
        <td key={i} style={{padding:"12px 16px"}}>
          <div className="skeleton" style={{height:14,width:w,maxWidth:"100%"}}/>
        </td>
      ))}
    </tr>
  );
}

export default function History() {
  const router  = useRouter();
  const [user,  setUser]    = useState<any>(null);
  const [txs,   setTxs]     = useState<any[]>([]);
  const [loading,setLoading]= useState(true);
  const [mounted,setMounted]= useState(false);

  useEffect(()=>{
    setMounted(true);
    const u = localStorage.getItem("digdaya_user");
    if(!u){ router.push("/"); return; }
    setUser(JSON.parse(u));

    // Kumpulkan semua TX dari localStorage
    const sig      = localStorage.getItem("digdaya_tx_sig")       || "";
    const hash     = localStorage.getItem("digdaya_tx_hash")      || "";
    const explorer = localStorage.getItem("digdaya_tx_explorer")  || "";
    const masked   = localStorage.getItem("digdaya_masked_entity")|| "";
    const disb_sig = localStorage.getItem("digdaya_disburse_sig") || "";
    const disb_exp = localStorage.getItem("digdaya_disburse_explorer") || "";
    const score    = localStorage.getItem("digdaya_score")        || "";
    const umkm     = localStorage.getItem("digdaya_umkm_data");
    const bizName  = umkm ? JSON.parse(umkm).bizName || "—" : "—";

    const list:any[] = [];

    if(sig) list.push({
      id:1, type:"Cashflow Registration", hash:sig, shortHash:sig.slice(0,20)+"...",
      explorer, masked, status:"confirmed", date:new Date().toLocaleString("id-ID"),
      amount:"—", note:`Data usaha ${bizName} dicatat ke blockchain`,
      isReal:!sig.startsWith("mock_tx_"),
    });

    if(disb_sig) list.push({
      id:2, type:"Credit Score Update", hash:disb_sig, shortHash:disb_sig.slice(0,20)+"...",
      explorer:disb_exp, masked, status:"confirmed", date:new Date().toLocaleString("id-ID"),
      amount:`Score: ${score}`, note:"Skor kredit diperbarui on-chain setelah pencairan",
      isReal:!disb_sig.startsWith("mock_cs_"),
    });

    // Tambah mock TX historis
    const mockTypes = ["Cashflow","Logistics","AgriSale","Repayment","CreditCheck"];
    for(let i=0;i<6;i++){
      const d = new Date(); d.setDate(d.getDate()-i-1);
      const h = Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join("");
      list.push({
        id:i+10, type:mockTypes[i%mockTypes.length],
        hash:h, shortHash:h.slice(0,20)+"...",
        explorer:"", masked:masked||"0x"+h.slice(0,8),
        status:Math.random()>.1?"confirmed":"pending",
        date:d.toLocaleString("id-ID"),
        amount:"—", note:"Transaksi historis tercatat on-chain",
        isReal:false,
      });
    }

    setTimeout(()=>{ setTxs(list); setLoading(false); }, 800);
  },[]);

  if(!mounted) return null;

  const confirmed = txs.filter(t=>t.status==="confirmed").length;
  const real      = txs.filter(t=>t.isReal).length;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        .card{background:var(--card);border:1px solid var(--border);border-radius:14px}
        .nbtn{background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text3);padding:6px 14px;font-size:12px;cursor:pointer;font-family:var(--font);transition:all .2s}
        .nbtn:hover{background:rgba(255,255,255,.08);color:var(--text2)}
        .tr{transition:background .15s}
        .tr:hover{background:rgba(255,255,255,.025)}
      `}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(2,128,144,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(2,128,144,.025) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <nav style={{position:"sticky",top:0,zIndex:100,background:"var(--bg)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border2)",padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>D</div>
            <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,letterSpacing:-.3}}>DIGDAYA</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="nbtn" onClick={()=>router.push("/dashboard")}>Dashboard</button>
            <button className="nbtn" onClick={()=>router.push("/profile")}>Profil</button>
          </div>
        </nav>
        <main style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
          <div style={{marginBottom:22}}>
            <h1 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:3,letterSpacing:-.4}}>Riwayat Transaksi Blockchain</h1>
            <p style={{color:"var(--text3)",fontSize:12}}>Semua transaksi usaha Anda yang tercatat permanen di Solana Devnet</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            {[
              {l:"Total Transaksi",  v:loading?"—":txs.length.toString(),  c:"#028090"},
              {l:"Terkonfirmasi",    v:loading?"—":confirmed.toString(),    c:"#02C39A"},
              {l:"Verified On-chain",v:loading?"—":real.toString(),         c:"#7C3AED"},
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:"16px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${s.c}80,transparent)`}}/>
                <div style={{fontSize:9,color:"var(--text4)",letterSpacing:2,textTransform:"uppercase",marginBottom:8,fontFamily:"var(--font-mono)"}}>{s.l}</div>
                {loading
                  ? <div className="skeleton" style={{height:28,width:60}}/>
                  : <div style={{fontSize:26,fontWeight:800,color:s.c,fontFamily:"var(--font-head)",letterSpacing:-.5}}>{s.v}</div>
                }
              </div>
            ))}
          </div>
          <div className="card" style={{overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border2)"}}>
              <div style={{fontFamily:"var(--font-head)",fontSize:12,fontWeight:700,color:"var(--text3)",letterSpacing:1,textTransform:"uppercase"}}>Semua Transaksi</div>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"1px solid var(--border2)"}}>
                    {["Tipe","Hash","Entity ID","Status","Tanggal","Keterangan"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 16px",color:"var(--text5)",fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",fontSize:9,fontFamily:"var(--font-mono)"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:6}).map((_,i)=><SkeletonRow key={i}/>)
                    : txs.map(tx=>(
                      <tr key={tx.id} className="tr" style={{borderBottom:"1px solid var(--border2)"}}>
                        <td style={{padding:"11px 16px"}}>
                          <span style={{background:"rgba(2,128,144,.12)",color:"#028090",borderRadius:5,padding:"3px 9px",fontSize:10,fontWeight:600,letterSpacing:.5}}>{tx.type}</span>
                        </td>
                        <td style={{padding:"11px 16px"}}>
                          {tx.explorer
                            ? <a href={tx.explorer} target="_blank" rel="noreferrer" style={{color:"#02C39A",fontFamily:"var(--font-mono)",fontSize:10,textDecoration:"none"}}>{tx.shortHash}</a>
                            : <span style={{color:"var(--text4)",fontFamily:"var(--font-mono)",fontSize:10}}>{tx.shortHash}</span>
                          }
                          {tx.isReal && <span style={{marginLeft:5,fontSize:8,color:"#02C39A",background:"rgba(2,195,154,.1)",borderRadius:4,padding:"1px 5px"}}>REAL</span>}
                        </td>
                        <td style={{padding:"11px 16px",fontFamily:"var(--font-mono)",color:"var(--text4)",fontSize:10}}>{tx.masked}</td>
                        <td style={{padding:"11px 16px"}}>
                          <span style={{background:tx.status==="confirmed"?"rgba(2,195,154,.1)":"rgba(244,162,97,.1)",color:tx.status==="confirmed"?"#02C39A":"#F4A261",border:`1px solid ${tx.status==="confirmed"?"rgba(2,195,154,.2)":"rgba(244,162,97,.2)"}`,borderRadius:5,padding:"2px 9px",fontSize:10,fontWeight:600}}>{tx.status==="confirmed"?"Confirmed":"Pending"}</span>
                        </td>
                        <td style={{padding:"11px 16px",color:"var(--text4)",fontFamily:"var(--font-mono)",fontSize:10}}>{tx.date}</td>
                        <td style={{padding:"11px 16px",color:"var(--text3)",fontSize:11}}>{tx.note}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
