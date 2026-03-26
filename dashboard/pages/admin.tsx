import { useState, useEffect } from "react";
import { useRouter } from "next/router";
const MOCK = [
  {id:"UM-001",name:"Warung Bu Sari",type:"Warung / Toko Sembako",city:"Banyumas, Jawa Tengah",score:742,loan:50000000,purpose:"Tambah stok barang",status:"pending",date:"2026-03-14",sig:"",explorer:"",isLive:false},
  {id:"UM-002",name:"CV Maju Bersama",type:"Jasa Transportasi",city:"Surabaya, Jawa Timur",score:681,loan:120000000,purpose:"Pembelian kendaraan",status:"approved",date:"2026-03-13",sig:"",explorer:"",isLive:false},
  {id:"UM-003",name:"Tani Subur Makmur",type:"Pertanian",city:"Malang, Jawa Timur",score:558,loan:30000000,purpose:"Modal kerja",status:"review",date:"2026-03-12",sig:"",explorer:"",isLive:false},
  {id:"UM-004",name:"Kerajinan Nusantara",type:"Kerajinan / Manufaktur",city:"Yogyakarta, DIY",score:795,loan:200000000,purpose:"Ekspansi produksi",status:"approved",date:"2026-03-11",sig:"",explorer:"",isLive:false},
  {id:"UM-005",name:"Depot Pak Haji",type:"Kuliner / Makanan",city:"Semarang, Jawa Tengah",score:490,loan:25000000,purpose:"Renovasi tempat",status:"rejected",date:"2026-03-10",sig:"",explorer:"",isLive:false},
];
const SC:any = {
  pending:{c:"#F4A261",bg:"rgba(244,162,97,.1)",label:"Menunggu"},
  approved:{c:"#02C39A",bg:"rgba(2,195,154,.1)",label:"Disetujui"},
  review:{c:"#028090",bg:"rgba(2,128,144,.1)",label:"Dalam Review"},
  rejected:{c:"#EF4444",bg:"rgba(239,68,68,.1)",label:"Ditolak"},
};
export default function Admin() {
  const router = useRouter();
  const [apps, setApps] = useState<any[]>(MOCK);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{
    setMounted(true);
    const user = localStorage.getItem("digdaya_user");
    const umkm = localStorage.getItem("digdaya_umkm_data");
    const score = localStorage.getItem("digdaya_score");
    const sig = localStorage.getItem("digdaya_tx_sig") || "";
    const explorer = localStorage.getItem("digdaya_tx_explorer") || "";
    if(user && umkm && score) {
      const u = JSON.parse(user);
      const d = JSON.parse(umkm);
      const realApp = {
        id:"UM-LIVE", name:d.bizName||u.name, type:d.bizType||"UMKM",
        city:`${d.cityName||d.city||""}, ${d.provinceName||d.province||""}`, score:parseInt(score),
        loan:parseInt(localStorage.getItem("digdaya_loan_amount")||d.loanAmount||"0"), purpose:d.loanPurpose||"—",
        status:"pending", date:new Date().toISOString().split("T")[0],
        sig, explorer, isLive:true,
      };
      setApps(a=>[realApp,...a]);
    }
  },[]);
  if(!mounted) return null;
  const filtered = filter==="all" ? apps : apps.filter(a=>a.status===filter);
  const stats = {
    total:apps.length,
    pending:apps.filter(a=>a.status==="pending").length,
    approved:apps.filter(a=>a.status==="approved").length,
    totalLoan:apps.reduce((s,a)=>s+a.loan,0),
  };
  const handleAction = async (id:string, action:"approved"|"rejected") => {
    setProcessing(true);
    await new Promise(r=>setTimeout(r,1200));
    setApps(a=>a.map(x=>x.id===id?{...x,status:action}:x));
    if(selected?.id===id) setSelected((s:any)=>({...s,status:action}));
    // Jika LIVE app → update localStorage agar user bisa redirect
    const liveApp = apps.find(a=>a.id==="UM-LIVE"&&a.id===id);
    if(liveApp||id==="UM-LIVE"){
      localStorage.setItem("digdaya_loan_status", action);
      if(action==="approved"){
        localStorage.setItem("digdaya_approved_date", new Date().toISOString());
      }
    }
    setProcessing(false);
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .3s ease forwards}
        .card{background:var(--card);border:1px solid var(--border);border-radius:14px}
        .row{transition:background .15s;cursor:pointer}
        .row:hover{background:var(--card)}
        .nbtn{background:r5,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:8px;color:#64748B;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .nbtn:hover{background:rgba(255,255,255,.08);color:#94A3B8}
        .fbtn{padding:6px 14px;border-radius:7px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#475569;font-size:12px;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .fbtn.active{border-color:#028090;background:rgba(2,128,144,.1);color:#02C39A}
      `}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)",position:"relative"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(2,128,144,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(2,128,144,.025) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <nav style={{position:"sticky",top:0,zIndex:100,background:"var(--bg)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-head)",fontWeight:800,fontSize:15}}>D</div>
            <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:15,letterSpacing:-.3}}>DIGDAYA</span>
            <span style={{fontSize:10,color:"#028090",background:"rgba(2,128,144,.1)",border:"1px solid rgba(2,128,144,.2)",borderRadius:5,padding:"2px 8px",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginLeft:4}}>Lender Panel</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="nbtn" onClick={()=>router.push("/dashboard")}>Dashboard</button>
            <button className="nbtn" onClick={()=>router.push("/")}>Beranda</button>
          </div>
        </nav>
        <main style={{position:"relative",zIndex:1,padding:"24px 28px",maxWidth:1280,margin:"0 auto"}}>
          <div style={{marginBottom:22}}>
            <h1 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:3,letterSpacing:-.4}}>Panel Lender — Kelola Pengajuan UMKM</h1>
            <p style={{color:"var(--text5)",fontSize:12}}>Tinjau, verifikasi, dan setujui pengajuan kredit berbasis AI dan blockchain</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {[
              {l:"Total Pengajuan",v:stats.total,c:"#028090",i:"◎"},
              {l:"Menunggu Review",v:stats.pending,c:"#F4A261",i:"◐"},
              {l:"Disetujui",v:stats.approved,c:"#02C39A",i:"◈"},
              {l:"Total Kredit",v:`Rp ${(stats.totalLoan/1e9).toFixed(1)}M`,c:"#7C3AED",i:"◉"},
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:"16px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,transparent,${s.c}80,transparent)`}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:9,color:"var(--text5)",letterSpacing:2,textTransform:"uppercase",marginBottom:8,fontFamily:"var(--font-mono)"}}>{s.l}</div>
                    <div style={{fontSize:26,fontWeight:800,color:s.c,fontFamily:"var(--font-head)",letterSpacing:-.5}}>{s.v}</div>
                  </div>
                  <div style={{fontSize:20,color:s.c,opacity:.4,fontFamily:"monospace"}}>{s.i}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:16}}>
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontFamily:"var(--font-head)",fontSize:13,fontWeight:700,color:"var(--text3)",letterSpacing:1,textTransform:"uppercase"}}>Daftar Pengajuan</div>
                <div style={{display:"flex",gap:6}}>
                  {["all","pending","review","approved","rejected"].map(f=>(
                    <button key={f} className={`fbtn${filter===f?" active":""}`} onClick={()=>setFilter(f)}>
                      {f==="all"?"Semua":SC[f]?.label||f}
                    </button>
                  ))}
                </div>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:"1px solid var(--border2)"}}>
                    {["ID","Nama Usaha","Skor","Nominal","Status","Aksi"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 16px",color:"var(--text5)",fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",fontSize:9,fontFamily:"var(--font-mono)"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a=>(
                    <tr key={a.id} className="row" onClick={()=>setSelected(a)} style={{borderBottom:"1px solid var(--card)",background:selected?.id===a.id?"rgba(2,128,144,.06)":"transparent"}}>
                      <td style={{padding:"11px 16px",fontFamily:"var(--font-mono)",color:"var(--text5)",fontSize:10}}>
                        {a.id}
                        {a.isLive&&<span style={{marginLeft:5,fontSize:8,color:"#02C39A",background:"rgba(2,195,154,.1)",borderRadius:4,padding:"1px 5px"}}>LIVE</span>}
                      </td>
                      <td style={{padding:"11px 16px"}}>
                        <div style={{fontWeight:600,fontSize:12,marginBottom:2}}>{a.name}</div>
                        <div style={{fontSize:10,color:"var(--text5)"}}>{a.city}</div>
                      </td>
                      <td style={{padding:"11px 16px"}}>
                        <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:16,color:a.score>=740?"#02C39A":a.score>=670?"#028090":a.score>=580?"#F4A261":"#EF4444"}}>{a.score}</span>
                      </td>
                      <td style={{padding:"11px 16px",fontWeight:600,color:"var(--text2)"}}>Rp {(a.loan/1e6).toFixed(0)}jt</td>
                      <td style={{padding:"11px 16px"}}>
                        <span style={{background:SC[a.status]?.bg,color:SC[a.status]?.c,border:`1px solid ${SC[a.status]?.c}30`,borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:600}}>{SC[a.status]?.label}</span>
                      </td>
                      <td style={{padding:"11px 16px"}}>
                        {(a.status==="pending"||a.status==="review")?(
                          <div style={{display:"flex",gap:5}} onClick={e=>e.stopPropagation()}>
                            <button onClick={()=>handleAction(a.id,"approved")} style={{background:"rgba(2,195,154,.1)",border:"1px solid rgba(2,195,154,.2)",borderRadius:6,color:"#02C39A",padding:"4px 10px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}}>Setujui</button>
                            <button onClick={()=>handleAction(a.id,"rejected")} style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:6,color:"#EF4444",padding:"4px 10px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)"}}>Tolak</button>
                          </div>
                        ):(
                          <span style={{fontSize:10,color:"var(--text5)"}}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              {selected?(
                <div className="card fade-up" style={{padding:"20px"}}>
                  <div style={{fontSize:9,color:"var(--text5)",letterSpacing:2,textTransform:"uppercase",marginBottom:14,fontFamily:"var(--font-mono)"}}>Detail Pengajuan</div>
                  <div style={{fontFamily:"var(--font-head)",fontSize:18,fontWeight:800,marginBottom:3,letterSpacing:-.3}}>{selected.name}</div>
                  <div style={{fontSize:12,color:"var(--text5)",marginBottom:18}}>{selected.type} · {selected.city}</div>
                  <div style={{width:"100%",height:4,background:"var(--border2)",borderRadius:2,overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",width:`${((selected.score-300)/550)*100}%`,background:"linear-gradient(90deg,#EF4444,#F4A261,#02C39A)",borderRadius:2}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--text5)",marginBottom:18}}>
                    <span>300</span>
                    <span style={{color:selected.score>=740?"#02C39A":selected.score>=670?"#028090":"#F4A261",fontWeight:700,fontSize:13}}>Skor: {selected.score}</span>
                    <span>850</span>
                  </div>
                  <div style={{display:"grid",gap:6,marginBottom:16}}>
                    {[
                      ["Nominal",`Rp ${selected.loan.toLocaleString("id-ID")}`],
                      ["Tujuan",selected.purpose],
                      ["Tanggal",selected.date],
                      ["Status",SC[selected.status]?.label],
                    ].map(([k,v],i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"var(--card)",borderRadius:8}}>
                        <span style={{fontSize:11,color:"var(--text4)"}}>{k}</span>
                        <span style={{fontSize:11,fontWeight:600,color:"#E2E8F0"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {selected.explorer&&(
                    <a href={selected.explorer} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:6,background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.15)",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#02C39A",textDecoration:"none",marginBottom:12,fontFamily:"var(--font-mono)"}}>
                      ◈ Verifikasi di Solana Explorer ↗
                    </a>
                  )}
                  {(selected.status==="pending"||selected.status==="review")&&(
                    <div style={{display:"grid",gap:8}}>
                      <button disabled={processing} onClick={()=>handleAction(selected.id,"approved")} style={{background:"linear-gradient(135deg,#02C39A,#028090)",border:"none",borderRadius:9,color:"#fff",padding:"12px",fontSize:13,fontWeight:600,cursor:processing?"not-allowed":"pointer",fontFamily:"var(--font)",opacity:processing?0.6:1}}>
                        {processing?"Memproses...":"✓ Setujui Pengajuan"}
                      </button>
                      <button disabled={processing} onClick={()=>handleAction(selected.id,"rejected")} style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:9,color:"#EF4444",padding:"12px",fontSize:13,fontWeight:600,cursor:processing?"not-allowed":"pointer",fontFamily:"var(--font)"}}>
                        ✕ Tolak Pengajuan
                      </button>
                    </div>
                  )}
                </div>
              ):(
                <div className="card" style={{padding:"32px 20px",textAlign:"center"}}>
                  <div style={{fontSize:32,color:"var(--text5)",fontFamily:"monospace",marginBottom:10}}>◎</div>
                  <div style={{fontSize:13,color:"var(--text5)"}}>Pilih pengajuan untuk melihat detail</div>
                </div>
              )}
            </div>
          </div>
        </main>
        <footer style={{borderTop:"1px solid var(--border2)",padding:"12px 28px",display:"flex",justifyContent:"space-between",fontSize:9,color:"var(--text5)",fontFamily:"var(--font-mono)"}}>
          <span>© 2026 Digdaya · Lender Panel</span>
          <span>7L1FRY6iPwCYoppBWEdTzMh1EsyKwubQc1U1YXnTLUeE</span>
          <span>SNAP BI v2 · OJK Sandbox</span>
        </footer>
      </div>
    </>
  );
}
