import { useState, useEffect } from "react";
import { useRouter } from "next/router";
const PROVINCES = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Jambi","Sumatera Selatan",
  "Bengkulu","Lampung","Kepulauan Bangka Belitung","Kepulauan Riau","DKI Jakarta",
  "Jawa Barat","Jawa Tengah","DI Yogyakarta","Jawa Timur","Banten","Bali",
  "Nusa Tenggara Barat","Nusa Tenggara Timur","Kalimantan Barat","Kalimantan Tengah",
  "Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara","Sulawesi Utara",
  "Sulawesi Tengah","Sulawesi Selatan","Sulawesi Tenggara","Gorontalo","Sulawesi Barat",
  "Maluku","Maluku Utara","Papua Barat","Papua","Papua Selatan","Papua Tengah",
  "Papua Pegunungan","Papua Barat Daya",
];

function ProvinceSearch({value, onChange}: {value:string, onChange:(v:string)=>void}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const filtered = PROVINCES.filter(p => p.toLowerCase().includes(query.toLowerCase())).slice(0,8);
  return (
    <div style={{position:"relative"}}>
      <input
        className="inp"
        placeholder="Ketik nama provinsi..."
        value={query}
        onChange={e=>{setQuery(e.target.value);setOpen(true);onChange("");}}
        onFocus={()=>setOpen(true)}
        onBlur={()=>setTimeout(()=>setOpen(false),150)}
        autoComplete="off"
      />
      {open && query && filtered.length>0 && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#0D1B2E",border:"1px solid rgba(255,255,255,.12)",borderRadius:9,zIndex:100,marginTop:4,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.5)"}}>
          {filtered.map(p=>(
            <div key={p} onMouseDown={()=>{setQuery(p);onChange(p);setOpen(false);}}
              style={{padding:"10px 14px",fontSize:13,color:p===value?"#02C39A":"#94A3B8",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,.04)",background:p===value?"rgba(2,195,154,.08)":"transparent",fontWeight:p===value?600:400,transition:"background .15s"}}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(2,128,144,.1)")}
              onMouseLeave={e=>(e.currentTarget.style.background=p===value?"rgba(2,195,154,.08)":"transparent")}
            >
              {p.split("").map((ch,i)=>{
                const qi=p.toLowerCase().indexOf(query.toLowerCase());
                const inMatch=i>=qi&&i<qi+query.length&&qi>-1;
                return <span key={i} style={{color:inMatch?"#02C39A":undefined,fontWeight:inMatch?700:undefined}}>{ch}</span>;
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const steps = ["Profil Usaha","Data Keuangan","Rekam Jejak","Dokumen","Konfirmasi"];
const fmtRp=(v:string)=>{const n=v.replace(/\D/g,"");if(!n)return "";return "Rp "+parseInt(n).toLocaleString("id-ID");};
const parseRp=(v:string)=>v.replace(/\D/g,"");
export default function Onboarding() {
  const router=useRouter();
  const [step,setStep]=useState(0);
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({
    bizName:"",bizType:"",bizAge:"",province:"",city:"",address:"",
    monthlyRevenue:"",monthlyExpense:"",existingDebt:"",loanAmount:"",loanPurpose:"",
    onTimePayment:"",deliveryRate:"",uniqueBuyers:"",digitalRatio:"",
    hasNIB:"yes",hasSKDU:"no",hasRekening:"yes",selfDeclaration:false,
  });
  useEffect(()=>{
    const u=localStorage.getItem("digdaya_user");
    if(!u){router.push("/");return;}
    setUser(JSON.parse(u));
  },[]);
  const u=(k:string,v:any)=>setForm(f=>({...f,[k]:v}));
  const cashflow=parseInt(parseRp(form.monthlyRevenue)||"0")-parseInt(parseRp(form.monthlyExpense)||"0");
  const handleSubmit=async()=>{
    setLoading(true);
    localStorage.setItem("digdaya_umkm_data",JSON.stringify(form));
    localStorage.setItem("digdaya_step","done");
    try {
      const usr=JSON.parse(localStorage.getItem("digdaya_user")||"{}");
      const res=await fetch("https://kortney-hamulate-annamarie.ngrok-free.dev/api/v1/transactions",{
        method:"POST",
        headers:{"Content-Type":"application/json","ngrok-skip-browser-warning":"true"},
        body:JSON.stringify({
          entityId:usr.id||usr.email||"anon",
          transactionType:"Cashflow",
          amountIdr:parseInt(parseRp(form.monthlyRevenue)||"0"),
          hashData:form.bizName+":"+form.bizType+":"+form.loanAmount,
        })
      });
      const d=await res.json();
      if(d.success){
        localStorage.setItem("digdaya_tx_sig",d.solana_signature||"");
        localStorage.setItem("digdaya_tx_hash",d.hash||"");
        localStorage.setItem("digdaya_tx_explorer",d.explorer||"");
        localStorage.setItem("digdaya_masked_entity",d.masked_entity||"");
        console.log("✅ TX on-chain:",d.solana_signature);
      }
    } catch(e){console.warn("Backend offline — lanjut offline");}
    setLoading(false);
    router.push("/scoring");
  };
  return (
    <>
      <style>{`
        /* fonts via _app.tsx */
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060E1C;color:#F1F5F9;font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .4s ease forwards}
        .inp{background:#0D1B2E;border:1px solid rgba(255,255,255,.09);border-radius:9px;color:#F1F5F9;padding:11px 14px;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;width:100%;outline:none;transition:border-color .2s}
        .inp:focus{border-color:#028090;background:#0F2035}
        .inp::placeholder{color:#2D3F55}
        select.inp{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center}
        select.inp option{background:#0D1B2E;color:#F1F5F9}
        .lbl{font-size:11px;color:#64748B;display:block;margin-bottom:5px;font-weight:500;letter-spacing:.4px;text-transform:uppercase}
        .btn{background:linear-gradient(135deg,#028090,#02C39A);border:none;border-radius:9px;color:#fff;padding:12px 26px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(2,195,154,.25)}
        .btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
        .btn-back{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:9px;color:#64748B;padding:12px 26px;font-size:14px;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}
        .btn-back:hover{background:rgba(255,255,255,.08);color:#94A3B8}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:13px}
        .tog{padding:7px 18px;border-radius:7px;border:1px solid rgba(255,255,255,.09);background:transparent;color:#475569;font-size:12px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .2s}
        .tog.active{border-color:#02C39A;background:rgba(2,195,154,.12);color:#02C39A}
        .badge{display:inline-flex;align-items:center;gap:5px;background:rgba(2,128,144,.1);border:1px solid rgba(2,128,144,.2);border-radius:5px;padding:3px 8px;font-size:10px;color:#028090;font-weight:600;letter-spacing:.5px}
      `}</style>
      <div style={{minHeight:"100vh",background:"#060E1C"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(2,128,144,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(2,128,144,.025) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <nav style={{position:"relative",zIndex:10,padding:"0 40px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#028090,#02C39A)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15}}>D</div>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,letterSpacing:-.3}}>DIGDAYA</span>
          </div>
          {user&&<div style={{fontSize:12,color:"#475569"}}>Halo, <strong style={{color:"#94A3B8"}}>{user.name}</strong></div>}
        </nav>
        <div style={{background:"rgba(255,255,255,.02)",borderBottom:"1px solid rgba(255,255,255,.05)",padding:"14px 40px"}}>
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              {steps.map((s,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,flex:1}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:i<step?"#02C39A":i===step?"linear-gradient(135deg,#028090,#02C39A)":"rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:i<=step?"#fff":"#334155",border:i===step?"2px solid #02C39A":"2px solid transparent",transition:"all .3s"}}>{i<step?"✓":i+1}</div>
                  <div style={{fontSize:9,color:i===step?"#02C39A":i<step?"#475569":"#1E293B",textAlign:"center",fontWeight:i===step?600:400,letterSpacing:.5,textTransform:"uppercase"}}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{height:2,background:"rgba(255,255,255,.04)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#028090,#02C39A)",width:`${(step/(steps.length-1))*100}%`,transition:"width .4s ease",borderRadius:2}}/>
            </div>
          </div>
        </div>
        <div style={{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto",padding:"36px 24px"}}>
          <div className="fade-up" key={step}>
            {step===0&&(
              <div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>Profil Usaha</h2>
                <p style={{color:"#475569",marginBottom:26,fontSize:13,lineHeight:1.6}}>Informasi dasar usaha Anda untuk konteks penilaian kredit.</p>
                <div style={{display:"grid",gap:14}}>
                  <div><label className="lbl">Nama Usaha</label><input className="inp" placeholder="cth. Warung Sari Jaya" value={form.bizName} onChange={e=>u("bizName",e.target.value)}/></div>
                  <div className="g2">
                    <div><label className="lbl">Jenis Usaha</label>
                      <select className="inp" value={form.bizType} onChange={e=>u("bizType",e.target.value)}>
                        <option value="">Pilih jenis usaha</option>
                        {["Warung / Toko Sembako","Pertanian / Perkebunan","Peternakan / Perikanan","Kuliner / Makanan","Jasa Transportasi / Logistik","Kerajinan / Manufaktur","Jasa Lainnya"].map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><label className="lbl">Lama Usaha Berjalan</label>
                      <select className="inp" value={form.bizAge} onChange={e=>u("bizAge",e.target.value)}>
                        <option value="">Pilih durasi</option>
                        {["Kurang dari 1 tahun","1–2 tahun","2–5 tahun","5–10 tahun","Lebih dari 10 tahun"].map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="g2">
                    <div><label className="lbl">Provinsi</label>
                      <ProvinceSearch value={form.province} onChange={v=>u("province",v)}/>
                    </div>
                    <div><label className="lbl">Kota / Kabupaten</label><input className="inp" placeholder="cth. Kab. Banyumas" value={form.city} onChange={e=>u("city",e.target.value)}/></div>
                  </div>
                  <div><label className="lbl">Alamat Usaha</label><input className="inp" placeholder="Nama jalan, kelurahan / desa" value={form.address} onChange={e=>u("address",e.target.value)}/></div>
                </div>
              </div>
            )}
            {step===1&&(
              <div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>Data Keuangan</h2>
                <p style={{color:"#475569",marginBottom:26,fontSize:13,lineHeight:1.6}}>Estimasi rata-rata bulanan sudah cukup. Format otomatis menggunakan pemisah ribuan.</p>
                <div style={{display:"grid",gap:14}}>
                  <div className="g2">
                    <div><label className="lbl">Pendapatan Rata-rata / Bulan</label><input className="inp" placeholder="Rp 0" value={fmtRp(form.monthlyRevenue)} onChange={e=>u("monthlyRevenue",parseRp(e.target.value))}/></div>
                    <div><label className="lbl">Pengeluaran Rata-rata / Bulan</label><input className="inp" placeholder="Rp 0" value={fmtRp(form.monthlyExpense)} onChange={e=>u("monthlyExpense",parseRp(e.target.value))}/></div>
                  </div>
                  <div className="g2">
                    <div><label className="lbl">Total Cicilan / Hutang Aktif</label><input className="inp" placeholder="Rp 0" value={fmtRp(form.existingDebt)} onChange={e=>u("existingDebt",parseRp(e.target.value))}/><div style={{fontSize:11,color:"#334155",marginTop:4}}>Isi Rp 0 jika tidak ada</div></div>
                    <div><label className="lbl">Nominal Pinjaman Diinginkan</label><input className="inp" placeholder="Rp 0" value={fmtRp(form.loanAmount)} onChange={e=>u("loanAmount",parseRp(e.target.value))}/></div>
                  </div>
                  <div><label className="lbl">Tujuan Penggunaan Dana</label>
                    <select className="inp" value={form.loanPurpose} onChange={e=>u("loanPurpose",e.target.value)}>
                      <option value="">Pilih tujuan penggunaan</option>
                      {["Tambah stok barang / bahan baku","Renovasi atau perluasan tempat usaha","Pembelian peralatan atau mesin","Modal kerja operasional harian","Ekspansi ke lokasi atau produk baru","Refinancing hutang usaha"].map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  {form.monthlyRevenue&&form.monthlyExpense&&(
                    <div style={{background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.15)",borderRadius:10,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:11,color:"#02C39A",fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:3}}>Estimasi Arus Kas Bersih</div><div style={{fontSize:11,color:"#334155"}}>Pendapatan dikurangi pengeluaran bulanan</div></div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:cashflow>=0?"#02C39A":"#EF4444"}}>{cashflow>=0?"+ ":"- "}Rp {Math.abs(cashflow).toLocaleString("id-ID")}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {step===2&&(
              <div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>Rekam Jejak Usaha</h2>
                <p style={{color:"#475569",marginBottom:8,fontSize:13,lineHeight:1.6}}>Empat indikator ini adalah sinyal terkuat dalam model AI kami.</p>
                <div style={{background:"rgba(2,128,144,.07)",border:"1px solid rgba(2,128,144,.15)",borderRadius:10,padding:"12px 16px",marginBottom:22,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{color:"#028090",fontSize:16,marginTop:1}}>ⓘ</div>
                  <div style={{fontSize:12,color:"#475569",lineHeight:1.65}}><strong style={{color:"#94A3B8"}}>Mengapa data ini diminta?</strong> — Digdaya mengganti slip gaji dengan <strong style={{color:"#94A3B8"}}>behavioral signal</strong>: konsistensi pembayaran, kualitas layanan, dan jangkauan pasar Anda. Data diverifikasi silang dengan pola transaksi blockchain.</div>
                </div>
                <div style={{display:"grid",gap:14}}>
                  <div className="card" style={{padding:"16px 18px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div><label className="lbl">Tingkat Pembayaran Tepat Waktu ke Supplier</label><div style={{fontSize:12,color:"#475569",marginTop:2}}>Dari seluruh tagihan bulan lalu, berapa % yang dibayar sesuai jatuh tempo?</div></div>
                      <span className="badge">Behavioral</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <input className="inp" style={{width:100}} type="number" min="0" max="100" placeholder="0–100" value={form.onTimePayment} onChange={e=>u("onTimePayment",e.target.value)}/>
                      <span style={{color:"#64748B",fontSize:14}}>%</span>
                      {form.onTimePayment&&<div style={{fontSize:12,fontWeight:600,color:parseInt(form.onTimePayment)>=80?"#02C39A":parseInt(form.onTimePayment)>=60?"#F4A261":"#EF4444"}}>{parseInt(form.onTimePayment)>=80?"Sangat baik":parseInt(form.onTimePayment)>=60?"Cukup baik":"Perlu ditingkatkan"}</div>}
                    </div>
                  </div>
                  <div className="card" style={{padding:"16px 18px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div><label className="lbl">Tingkat Keberhasilan Pengiriman / Layanan</label><div style={{fontSize:12,color:"#475569",marginTop:2}}>Dari total pesanan bulan lalu, berapa % selesai tanpa komplain?</div></div>
                      <span className="badge">Operational</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <input className="inp" style={{width:100}} type="number" min="0" max="100" placeholder="0–100" value={form.deliveryRate} onChange={e=>u("deliveryRate",e.target.value)}/>
                      <span style={{color:"#64748B",fontSize:14}}>%</span>
                      {form.deliveryRate&&<div style={{fontSize:12,fontWeight:600,color:parseInt(form.deliveryRate)>=85?"#02C39A":parseInt(form.deliveryRate)>=65?"#F4A261":"#EF4444"}}>{parseInt(form.deliveryRate)>=85?"Excellent":parseInt(form.deliveryRate)>=65?"Good":"Perlu ditingkatkan"}</div>}
                    </div>
                  </div>
                  <div className="g2">
                    <div className="card" style={{padding:"16px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label className="lbl" style={{margin:0}}>Pelanggan Unik / Bulan</label><span className="badge">Market</span></div>
                      <div style={{fontSize:12,color:"#475569",marginBottom:10}}>Jumlah pembeli atau klien berbeda yang bertransaksi bulan ini</div>
                      <input className="inp" type="number" placeholder="cth. 150" value={form.uniqueBuyers} onChange={e=>u("uniqueBuyers",e.target.value)}/>
                    </div>
                    <div className="card" style={{padding:"16px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label className="lbl" style={{margin:0}}>Penjualan via Digital</label><span className="badge">Digital</span></div>
                      <div style={{fontSize:12,color:"#475569",marginBottom:10}}>Tokopedia, Shopee, GoFood, WA Business, dll</div>
                      <select className="inp" value={form.digitalRatio} onChange={e=>u("digitalRatio",e.target.value)}>
                        <option value="">Pilih proporsi</option>
                        <option value="5">0–10% — hampir semua offline</option>
                        <option value="25">10–40% — sebagian online</option>
                        <option value="55">40–70% — mayoritas online</option>
                        <option value="85">70–100% — hampir semua online</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step===3&&(
              <div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>Kelengkapan Dokumen</h2>
                <p style={{color:"#475569",marginBottom:24,fontSize:13,lineHeight:1.6}}>Tandai yang sudah Anda miliki. Tidak perlu diunggah sekarang.</p>
                {[
                  {key:"hasNIB",label:"NIB — Nomor Induk Berusaha",desc:"Legalitas usaha dasar. Gratis di oss.go.id dalam 10 menit.",req:true},
                  {key:"hasSKDU",label:"SKDU / Surat Keterangan Usaha",desc:"Diterbitkan kelurahan atau desa setempat.",req:false},
                  {key:"hasRekening",label:"Rekening Bank Aktif",desc:"Rekening yang rutin digunakan untuk transaksi usaha.",req:true},
                ].map(doc=>(
                  <div key={doc.key} style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:11,padding:"15px 18px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{doc.label}{doc.req&&<span style={{color:"#EF4444",fontSize:10,fontWeight:400}}> · wajib</span>}</div>
                      <div style={{fontSize:11,color:"#334155",lineHeight:1.5}}>{doc.desc}</div>
                    </div>
                    <div style={{display:"flex",gap:7,flexShrink:0}}>
                      {["yes","no"].map(v=>(
                        <button key={v} onClick={()=>u(doc.key,v)} className={`tog ${(form as any)[doc.key]===v?"active":""}`}>{v==="yes"?"Sudah Ada":"Belum"}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{background:"rgba(244,162,97,.06)",border:"1px solid rgba(244,162,97,.15)",borderRadius:10,padding:"13px 16px",marginTop:8}}>
                  <div style={{fontSize:12,color:"#F4A261",fontWeight:600,marginBottom:3}}>Belum punya NIB?</div>
                  <div style={{fontSize:12,color:"#475569",lineHeight:1.6}}>Proses di oss.go.id gratis dan selesai dalam 10 menit. Tim Digdaya siap membantu.</div>
                </div>
              </div>
            )}
            {step===4&&(
              <div>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>Konfirmasi Data</h2>
                <p style={{color:"#475569",marginBottom:24,fontSize:13,lineHeight:1.6}}>Periksa kembali sebelum dikirim ke mesin AI dan blockchain.</p>
                <div className="card" style={{padding:"6px 4px",marginBottom:16}}>
                  {[
                    ["Nama Usaha",form.bizName||"—"],["Jenis Usaha",form.bizType||"—"],["Lama Usaha",form.bizAge||"—"],
                    ["Lokasi",form.city&&form.province?`${form.city}, ${form.province}`:"—"],
                    ["Pendapatan / Bulan",form.monthlyRevenue?`Rp ${parseInt(form.monthlyRevenue).toLocaleString("id-ID")}`:"—"],
                    ["Pengeluaran / Bulan",form.monthlyExpense?`Rp ${parseInt(form.monthlyExpense).toLocaleString("id-ID")}`:"—"],
                    ["Cicilan Aktif",form.existingDebt?`Rp ${parseInt(form.existingDebt).toLocaleString("id-ID")}`:"Rp 0"],
                    ["Nominal Pinjaman",form.loanAmount?`Rp ${parseInt(form.loanAmount).toLocaleString("id-ID")}`:"—"],
                    ["Tujuan Dana",form.loanPurpose||"—"],
                    ["Bayar Tepat Waktu",form.onTimePayment?`${form.onTimePayment}%`:"—"],
                    ["Tingkat Delivery",form.deliveryRate?`${form.deliveryRate}%`:"—"],
                  ].map(([k,v],i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <span style={{fontSize:12,color:"#475569"}}>{k}</span>
                      <span style={{fontSize:12,fontWeight:500,color:"#E2E8F0"}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="card" style={{padding:"14px 18px",marginBottom:4}}>
                  <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}>
                    <input type="checkbox" checked={form.selfDeclaration} onChange={e=>u("selfDeclaration",e.target.checked)} style={{marginTop:3,accentColor:"#02C39A"}}/>
                    <span style={{fontSize:12,color:"#64748B",lineHeight:1.7}}>Saya menyatakan seluruh data yang diisi adalah <strong style={{color:"#94A3B8"}}>benar dan dapat dipertanggungjawabkan</strong>. Data diproses secara anonim sesuai <strong style={{color:"#02C39A"}}>UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi</strong>.</span>
                  </label>
                </div>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:32,gap:12}}>
              {step>0?<button className="btn-back" onClick={()=>setStep(s=>s-1)}>← Kembali</button>:<div/>}
              {step<4
                ?<button className="btn" onClick={()=>setStep(s=>s+1)}>Lanjut</button>
                :<button className="btn" onClick={handleSubmit} disabled={loading||!form.selfDeclaration}>{loading?"Mengirim ke AI & Blockchain...":"Analisis Kredit Sekarang"}</button>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
