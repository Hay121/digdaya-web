import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import NavBar from "../components/NavBar";
import { LangContext, ToastContext } from "./_app";

const fmtRp=(v:string)=>{const n=v.replace(/\D/g,"");return n?"Rp "+parseInt(n).toLocaleString("id-ID"):"";};
const parseRp=(v:string)=>v.replace(/\D/g,"");

// Komponen autocomplete generik
function AutoComplete({label,value,onChange,options,placeholder,disabled}:{label:string;value:string;onChange:(v:string,id?:string)=>void;options:{id:string;name:string}[];placeholder:string;disabled?:boolean}) {
  const [query,  setQuery]  = useState(value);
  const [open,   setOpen]   = useState(false);
  const filtered = options.filter(o=>o.name.toLowerCase().includes(query.toLowerCase())).slice(0,8);
  useEffect(()=>{ setQuery(value); },[value]);
  return (
    <div>
      <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:5,fontWeight:500,letterSpacing:.4,textTransform:"uppercase"}}>{label}</label>
      <div style={{position:"relative"}}>
        <input
          className="inp"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={e=>{ setQuery(e.target.value); setOpen(true); onChange("",""); }}
          onFocus={()=>setOpen(true)}
          onBlur={()=>setTimeout(()=>setOpen(false),150)}
          autoComplete="off"
          style={{opacity:disabled?.5:1}}
        />
        {open&&query&&filtered.length>0&&!disabled&&(
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,zIndex:200,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.4)",maxHeight:280,overflowY:"auto"}}>
            {filtered.map(o=>{
              const qi = o.name.toLowerCase().indexOf(query.toLowerCase());
              return (
                <div key={o.id} onMouseDown={()=>{setQuery(o.name);onChange(o.name,o.id);setOpen(false);}}
                  style={{padding:"10px 14px",fontSize:13,cursor:"pointer",borderBottom:"1px solid var(--border2)",background:"transparent",transition:"background .15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(2,128,144,.1)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                >
                  {o.name.split("").map((ch,i)=>(
                    <span key={i} style={{color:i>=qi&&i<qi+query.length&&qi>-1?"#02C39A":"var(--text1)",fontWeight:i>=qi&&i<qi+query.length&&qi>-1?700:400}}>{ch}</span>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const STEPS_ID = ["Profil Usaha","Data Keuangan","Rekam Jejak","Dokumen","Konfirmasi"];
const STEPS_EN = ["Business Profile","Financial Data","Track Record","Documents","Confirmation"];

export default function Onboarding() {
  const router = useRouter();
  const { lang } = useContext(LangContext);
  const { addToast } = useContext(ToastContext);
  const [step,    setStep]    = useState(0);
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({
    bizName:"",bizType:"",bizAge:"",
    provinceId:"",provinceName:"",
    cityId:"",cityName:"",
    districtId:"",districtName:"",
    villageId:"",villageName:"",
    postalCode:"",address:"",
    monthlyRevenue:"",monthlyExpense:"",existingDebt:"",loanAmount:"",loanPurpose:"",
    onTimePayment:"",deliveryRate:"",uniqueBuyers:"",digitalRatio:"",
    hasNIB:"yes",hasSKDU:"no",hasRekening:"yes",selfDeclaration:false,
  });

  // Wilayah state
  const [provinces,  setProvinces]  = useState<{id:string;name:string}[]>([]);
  const [cities,     setCities]     = useState<{id:string;name:string}[]>([]);
  const [districts,  setDistricts]  = useState<{id:string;name:string}[]>([]);
  const [villages,   setVillages]   = useState<{id:string;name:string}[]>([]);
  const [loadingWil, setLoadingWil] = useState(false);

  const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

  useEffect(()=>{
    const u = localStorage.getItem("digdaya_user");
    if(!u){ router.push("/"); return; }
    setUser(JSON.parse(u));
    const draft     = localStorage.getItem("digdaya_umkm_draft");
    const stepDraft = localStorage.getItem("digdaya_onboarding_step");
    if(draft){ const d=JSON.parse(draft); setForm(d); }
    if(stepDraft) setStep(parseInt(stepDraft));
    // Load provinces
    fetch(`${BASE}/provinces.json`).then(r=>r.json()).then(data=>{
      setProvinces(data.map((p:any)=>({id:p.id,name:p.name})));
    }).catch(()=>{});
  },[]);

  // Load cities when province selected
  useEffect(()=>{
    if(!form.provinceId) return;
    setLoadingWil(true);
    setCities([]); setDistricts([]); setVillages([]);
    fetch(`${BASE}/regencies/${form.provinceId}.json`).then(r=>r.json()).then(data=>{
      setCities(data.map((c:any)=>({id:c.id,name:c.name})));
      setLoadingWil(false);
    }).catch(()=>setLoadingWil(false));
  },[form.provinceId]);

  // Load districts when city selected
  useEffect(()=>{
    if(!form.cityId) return;
    setLoadingWil(true);
    setDistricts([]); setVillages([]);
    fetch(`${BASE}/districts/${form.cityId}.json`).then(r=>r.json()).then(data=>{
      setDistricts(data.map((d:any)=>({id:d.id,name:d.name})));
      setLoadingWil(false);
    }).catch(()=>setLoadingWil(false));
  },[form.cityId]);

  // Load villages when district selected
  useEffect(()=>{
    if(!form.districtId) return;
    setLoadingWil(true);
    setVillages([]);
    fetch(`${BASE}/villages/${form.districtId}.json`).then(r=>r.json()).then(data=>{
      setVillages(data.map((v:any)=>({id:v.id,name:v.name})));
      setLoadingWil(false);
    }).catch(()=>setLoadingWil(false));
  },[form.districtId]);

  const u = (k:string,v:any) => setForm(f=>{
    const updated = {...f,[k]:v};
    localStorage.setItem("digdaya_umkm_draft", JSON.stringify(updated));
    return updated;
  });

  const goStep = (n:number) => {
    setStep(n);
    localStorage.setItem("digdaya_onboarding_step", n.toString());
  };

  const cashflow = parseInt(parseRp(form.monthlyRevenue)||"0")-parseInt(parseRp(form.monthlyExpense)||"0");

  const handleSubmit = async () => {
    setLoading(true);
    localStorage.setItem("digdaya_umkm_data", JSON.stringify(form));
    localStorage.setItem("digdaya_step","done");
    try {
      const usr = JSON.parse(localStorage.getItem("digdaya_user")||"{}");
      const res = await fetch("https://kortney-hamulate-annamarie.ngrok-free.dev/api/v1/transactions",{
        method:"POST",
        headers:{"Content-Type":"application/json","ngrok-skip-browser-warning":"true"},
        body:JSON.stringify({entityId:usr.id||usr.email||"anon",transactionType:"Cashflow",amountIdr:parseInt(parseRp(form.monthlyRevenue)||"0"),hashData:form.bizName+":"+form.bizType+":"+form.loanAmount}),
      });
      const d = await res.json();
      if(d.success){
        localStorage.setItem("digdaya_tx_sig",      d.solana_signature||"");
        localStorage.setItem("digdaya_tx_hash",     d.hash||"");
        localStorage.setItem("digdaya_tx_explorer", d.explorer||"");
        localStorage.setItem("digdaya_masked_entity",d.masked_entity||"");
      }
    } catch(e){ console.warn("Backend offline"); }
    localStorage.removeItem("digdaya_umkm_draft");
    localStorage.removeItem("digdaya_onboarding_step");
    setLoading(false);
    router.push("/scoring");
  };

  const steps = lang==="id"?STEPS_ID:STEPS_EN;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .4s ease forwards}
        .inp{background:var(--bg2);border:1px solid var(--border);border-radius:9px;color:var(--text1);padding:11px 14px;font-size:14px;font-family:var(--font);width:100%;outline:none;transition:border-color .2s}
        .inp:focus{border-color:#028090}
        .inp::placeholder{color:var(--text5)}
        select.inp{cursor:pointer}
        select.inp option{background:var(--bg2);color:var(--text1)}
        .btn{background:linear-gradient(135deg,#028090,#02C39A);border:none;border-radius:9px;color:#fff;padding:12px 26px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .2s}
        .btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(2,195,154,.25)}
        .btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
        .btn-back{background:var(--card);border:1px solid var(--border);border-radius:9px;color:var(--text3);padding:12px 26px;font-size:14px;font-weight:500;cursor:pointer;font-family:var(--font)}
        .btn-back:hover{background:var(--bg2)}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .card{background:var(--card);border:1px solid var(--border);border-radius:13px}
        .tog{padding:7px 18px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text3);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .2s}
        .tog.active{border-color:#02C39A;background:rgba(2,195,154,.12);color:#02C39A}
        .badge{display:inline-flex;align-items:center;gap:5px;background:rgba(2,128,144,.1);border:1px solid rgba(2,128,144,.2);border-radius:5px;padding:3px 8px;font-size:10px;color:#028090;font-weight:600;letter-spacing:.5px}
        label{font-size:11px;color:var(--text3);display:block;margin-bottom:5px;font-weight:500;letter-spacing:.4px;text-transform:uppercase}
      `}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)"}}>
        <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(var(--border2) 1px,transparent 1px),linear-gradient(90deg,var(--border2) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <NavBar rightItems={user&&<div style={{fontSize:12,color:"var(--text3)"}}>Halo, <strong style={{color:"var(--text2)"}}>{user.name}</strong></div>}/>

        {/* Step progress */}
        <div style={{background:"var(--card)",borderBottom:"1px solid var(--border2)",padding:"14px 40px"}}>
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              {steps.map((s,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,flex:1}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:i<step?"#02C39A":i===step?"linear-gradient(135deg,#028090,#02C39A)":"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:i<=step?"#fff":"var(--text4)",border:i===step?"2px solid #02C39A":"2px solid transparent",transition:"all .3s"}}>
                    {i<step?"✓":i+1}
                  </div>
                  <div style={{fontSize:9,color:i===step?"#02C39A":i<step?"var(--text3)":"var(--text5)",textAlign:"center",fontWeight:i===step?600:400,letterSpacing:.5,textTransform:"uppercase"}}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{height:2,background:"var(--border2)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#028090,#02C39A)",width:`${(step/(steps.length-1))*100}%`,transition:"width .4s ease",borderRadius:2}}/>
            </div>
          </div>
        </div>

        <div style={{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto",padding:"36px 24px"}}>
          <div className="fade-up" key={step}>

            {/* Step 0 - Profil Usaha */}
            {step===0&&(
              <div>
                <h2 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>{steps[0]}</h2>
                <p style={{color:"var(--text3)",marginBottom:24,fontSize:13,lineHeight:1.6}}>{lang==="id"?"Informasi dasar usaha Anda untuk konteks penilaian kredit.":"Basic information about your business for credit assessment context."}</p>
                <div style={{display:"grid",gap:14}}>
                  <div><label>{lang==="id"?"Nama Usaha":"Business Name"}</label><input className="inp" placeholder={lang==="id"?"cth. Warung Sari Jaya":"e.g. Sari Jaya Store"} value={form.bizName} onChange={e=>u("bizName",e.target.value)}/></div>
                  <div className="g2">
                    <div><label>{lang==="id"?"Jenis Usaha":"Business Type"}</label>
                      <select className="inp" value={form.bizType} onChange={e=>u("bizType",e.target.value)}>
                        <option value="">{lang==="id"?"Pilih jenis usaha":"Choose business type"}</option>
                        {["Warung / Toko Sembako","Pertanian / Perkebunan","Peternakan / Perikanan","Kuliner / Makanan","Jasa Transportasi / Logistik","Kerajinan / Manufaktur","Jasa Lainnya"].map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><label>{lang==="id"?"Lama Usaha":"Business Age"}</label>
                      <select className="inp" value={form.bizAge} onChange={e=>u("bizAge",e.target.value)}>
                        <option value="">{lang==="id"?"Pilih durasi":"Choose duration"}</option>
                        {["Kurang dari 1 tahun","1–2 tahun","2–5 tahun","5–10 tahun","Lebih dari 10 tahun"].map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Wilayah dinamis */}
                  <div className="g2">
                    <AutoComplete label={lang==="id"?"Provinsi":"Province"} value={form.provinceName} placeholder={lang==="id"?"Ketik nama provinsi...":"Type province name..."} options={provinces} onChange={(name,id)=>{ u("provinceName",name); u("provinceId",id||""); u("cityName",""); u("cityId",""); u("districtName",""); u("districtId",""); u("villageName",""); u("villageId",""); }}/>
                    <AutoComplete label={lang==="id"?"Kota / Kabupaten":"City / Regency"} value={form.cityName} placeholder={form.provinceId?(lang==="id"?"Ketik kota...":"Type city..."):(lang==="id"?"Pilih provinsi dulu":"Select province first")} options={cities} disabled={!form.provinceId} onChange={(name,id)=>{ u("cityName",name); u("cityId",id||""); u("districtName",""); u("districtId",""); u("villageName",""); u("villageId",""); }}/>
                  </div>
                  <div className="g2">
                    <AutoComplete label={lang==="id"?"Kecamatan":"District"} value={form.districtName} placeholder={form.cityId?(lang==="id"?"Ketik kecamatan...":"Type district..."):(lang==="id"?"Pilih kota dulu":"Select city first")} options={districts} disabled={!form.cityId} onChange={(name,id)=>{ u("districtName",name); u("districtId",id||""); u("villageName",""); u("villageId",""); }}/>
                    <AutoComplete label={lang==="id"?"Kelurahan / Desa":"Village"} value={form.villageName} placeholder={form.districtId?(lang==="id"?"Ketik kelurahan...":"Type village..."):(lang==="id"?"Pilih kecamatan dulu":"Select district first")} options={villages} disabled={!form.districtId} onChange={(name,id)=>{ u("villageName",name); u("villageId",id||""); }}/>
                  </div>
                  {loadingWil&&<div style={{fontSize:11,color:"#028090",display:"flex",alignItems:"center",gap:6}}><span style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(2,128,144,.2)",borderTopColor:"#028090",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>{lang==="id"?"Memuat data wilayah...":"Loading area data..."}</div>}
                  <div><label>{lang==="id"?"Alamat Lengkap":"Full Address"}</label><input className="inp" placeholder={lang==="id"?"Nama jalan, nomor, RT/RW":"Street name, number, RT/RW"} value={form.address} onChange={e=>u("address",e.target.value)}/></div>
                </div>
              </div>
            )}

            {/* Step 1 - Data Keuangan */}
            {step===1&&(
              <div>
                <h2 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>{steps[1]}</h2>
                <p style={{color:"var(--text3)",marginBottom:24,fontSize:13,lineHeight:1.6}}>{lang==="id"?"Estimasi rata-rata bulanan sudah cukup. Format otomatis menggunakan pemisah ribuan.":"Monthly averages are sufficient. Format automatically uses thousand separators."}</p>
                <div style={{display:"grid",gap:14}}>
                  <div className="g2">
                    <div><label>{lang==="id"?"Pendapatan / Bulan":"Revenue / Month"}</label><input className="inp" placeholder="Rp 0" value={fmtRp(form.monthlyRevenue)} onChange={e=>u("monthlyRevenue",parseRp(e.target.value))}/></div>
                    <div><label>{lang==="id"?"Pengeluaran / Bulan":"Expenses / Month"}</label><input className="inp" placeholder="Rp 0" value={fmtRp(form.monthlyExpense)} onChange={e=>u("monthlyExpense",parseRp(e.target.value))}/></div>
                  </div>
                  <div className="g2">
                    <div><label>{lang==="id"?"Cicilan / Hutang Aktif":"Active Debt/Installment"}</label><input className="inp" placeholder="Rp 0" value={fmtRp(form.existingDebt)} onChange={e=>u("existingDebt",parseRp(e.target.value))}/><div style={{fontSize:11,color:"var(--text5)",marginTop:4}}>{lang==="id"?"Isi Rp 0 jika tidak ada":"Enter Rp 0 if none"}</div></div>
                    
                  </div>
                  <div><label>{lang==="id"?"Tujuan Penggunaan Dana":"Purpose of Funds"}</label>
                    <select className="inp" value={form.loanPurpose} onChange={e=>u("loanPurpose",e.target.value)}>
                      <option value="">{lang==="id"?"Pilih tujuan penggunaan":"Select purpose"}</option>
                      {["Tambah stok barang / bahan baku","Renovasi atau perluasan tempat usaha","Pembelian peralatan atau mesin","Modal kerja operasional harian","Ekspansi ke lokasi atau produk baru","Refinancing hutang usaha"].map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  {form.monthlyRevenue&&form.monthlyExpense&&(
                    <div style={{background:cashflow>=0?"rgba(2,195,154,.07)":"rgba(239,68,68,.07)",border:`1px solid ${cashflow>=0?"rgba(2,195,154,.15)":"rgba(239,68,68,.15)"}`,borderRadius:10,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:11,color:cashflow>=0?"#02C39A":"#EF4444",fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:2}}>{lang==="id"?"Estimasi Arus Kas Bersih":"Estimated Net Cash Flow"}</div><div style={{fontSize:11,color:"var(--text4)"}}>{lang==="id"?"Pendapatan dikurangi pengeluaran bulanan":"Revenue minus monthly expenses"}</div></div>
                      <div style={{fontFamily:"var(--font-head)",fontSize:20,fontWeight:800,color:cashflow>=0?"#02C39A":"#EF4444"}}>{cashflow>=0?"+ ":"- "}Rp {Math.abs(cashflow).toLocaleString("id-ID")}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2 - Rekam Jejak */}
            {step===2&&(
              <div>
                <h2 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>{steps[2]}</h2>
                <div style={{background:"rgba(2,128,144,.07)",border:"1px solid rgba(2,128,144,.15)",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{color:"#028090",fontSize:16,marginTop:1,flexShrink:0}}>ⓘ</div>
                  <div style={{fontSize:12,color:"var(--text3)",lineHeight:1.65}}><strong style={{color:"var(--text1)"}}>{lang==="id"?"Mengapa data ini diminta?":"Why is this data needed?"}</strong> — {lang==="id"?"Digdaya mengganti slip gaji dengan behavioral signal: konsistensi pembayaran, kualitas layanan, dan jangkauan pasar Anda.":"Digdaya replaces payslips with behavioral signals: payment consistency, service quality, and market reach."}</div>
                </div>
                <div style={{display:"grid",gap:14}}>
                  {[
                    {key:"onTimePayment",label:lang==="id"?"Pembayaran Tepat Waktu ke Supplier":"On-Time Payment to Supplier",desc:lang==="id"?"Dari seluruh tagihan bulan lalu, berapa % yang dibayar sesuai jatuh tempo?":"From all last month's invoices, what % was paid on time?",badge:"Behavioral"},
                    {key:"deliveryRate",label:lang==="id"?"Tingkat Keberhasilan Delivery / Layanan":"Delivery / Service Success Rate",desc:lang==="id"?"Dari total pesanan bulan lalu, berapa % selesai tanpa komplain?":"From total orders last month, what % completed without complaints?",badge:"Operational"},
                  ].map(item=>(
                    <div key={item.key} className="card" style={{padding:"16px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div><label style={{textTransform:"none",letterSpacing:0,fontSize:13,fontWeight:600,color:"var(--text1)",marginBottom:3}}>{item.label}</label><div style={{fontSize:12,color:"var(--text3)"}}>{item.desc}</div></div>
                        <span className="badge">{item.badge}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <input className="inp" style={{width:100}} type="number" min="0" max="100" placeholder="0–100" value={(form as any)[item.key]} onChange={e=>u(item.key,e.target.value)}/>
                        <span style={{color:"var(--text3)",fontSize:14}}>%</span>
                        {(form as any)[item.key]&&<div style={{fontSize:12,fontWeight:600,color:parseInt((form as any)[item.key])>=80?"#02C39A":parseInt((form as any)[item.key])>=60?"#F4A261":"#EF4444"}}>{parseInt((form as any)[item.key])>=80?"Sangat baik":parseInt((form as any)[item.key])>=60?"Cukup baik":"Perlu ditingkatkan"}</div>}
                      </div>
                    </div>
                  ))}
                  <div className="g2">
                    <div className="card" style={{padding:"16px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={{textTransform:"none",letterSpacing:0,fontSize:12,fontWeight:600}}>{lang==="id"?"Pelanggan Unik / Bulan":"Unique Customers / Month"}</label><span className="badge">Market</span></div>
                      <input className="inp" type="number" placeholder={lang==="id"?"cth. 150":"e.g. 150"} value={form.uniqueBuyers} onChange={e=>u("uniqueBuyers",e.target.value)}/>
                    </div>
                    <div className="card" style={{padding:"16px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={{textTransform:"none",letterSpacing:0,fontSize:12,fontWeight:600}}>{lang==="id"?"Penjualan via Digital":"Digital Sales"}</label><span className="badge">Digital</span></div>
                      <select className="inp" value={form.digitalRatio} onChange={e=>u("digitalRatio",e.target.value)}>
                        <option value="">{lang==="id"?"Pilih proporsi":"Select proportion"}</option>
                        <option value="5">0–10% — {lang==="id"?"hampir semua offline":"mostly offline"}</option>
                        <option value="25">10–40% — {lang==="id"?"sebagian online":"partly online"}</option>
                        <option value="55">40–70% — {lang==="id"?"mayoritas online":"mostly online"}</option>
                        <option value="85">70–100% — {lang==="id"?"hampir semua online":"almost all online"}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 - Dokumen */}
            {step===3&&(
              <div>
                <h2 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>{steps[3]}</h2>
                <p style={{color:"var(--text3)",marginBottom:24,fontSize:13,lineHeight:1.6}}>{lang==="id"?"Tandai yang sudah Anda miliki. Tidak perlu diunggah sekarang.":"Mark what you already have. No need to upload now."}</p>
                {[
                  {key:"hasNIB",label:"NIB — Nomor Induk Berusaha",desc:lang==="id"?"Legalitas usaha dasar. Gratis di oss.go.id dalam 10 menit.":"Basic business legality. Free at oss.go.id in 10 minutes.",req:true},
                  {key:"hasSKDU",label:"SKDU / Surat Keterangan Usaha",desc:lang==="id"?"Diterbitkan kelurahan atau desa setempat.":"Issued by local village office.",req:false},
                  {key:"hasRekening",label:lang==="id"?"Rekening Bank Aktif":"Active Bank Account",desc:lang==="id"?"Rekening yang rutin digunakan untuk transaksi usaha.":"Account regularly used for business transactions.",req:true},
                ].map(doc=>(
                  <div key={doc.key} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:11,padding:"15px 18px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{doc.label}{doc.req&&<span style={{color:"#EF4444",fontSize:10,fontWeight:400}}> · {lang==="id"?"wajib":"required"}</span>}</div>
                      <div style={{fontSize:11,color:"var(--text3)",lineHeight:1.5}}>{doc.desc}</div>
                    </div>
                    <div style={{display:"flex",gap:7,flexShrink:0}}>
                      {["yes","no"].map(v=>(
                        <button key={v} onClick={()=>u(doc.key,v)} className={`tog ${(form as any)[doc.key]===v?"active":""}`}>{v==="yes"?(lang==="id"?"Sudah Ada":"Have It"):(lang==="id"?"Belum":"Not Yet")}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4 - Konfirmasi */}
            {step===4&&(
              <div>
                <h2 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>{steps[4]}</h2>
                <p style={{color:"var(--text3)",marginBottom:22,fontSize:13,lineHeight:1.6}}>{lang==="id"?"Periksa kembali sebelum dikirim ke mesin AI dan blockchain.":"Review before sending to AI engine and blockchain."}</p>
                <div className="card" style={{padding:"6px 4px",marginBottom:16}}>
                  {[
                    [lang==="id"?"Nama Usaha":"Business Name",form.bizName||"—"],
                    [lang==="id"?"Jenis Usaha":"Business Type",form.bizType||"—"],
                    [lang==="id"?"Lama Usaha":"Business Age",form.bizAge||"—"],
                    [lang==="id"?"Lokasi":"Location",[form.villageName,form.districtName,form.cityName,form.provinceName].filter(Boolean).join(", ")||"—"],
                    [lang==="id"?"Pendapatan / Bulan":"Revenue / Month",form.monthlyRevenue?`Rp ${parseInt(form.monthlyRevenue).toLocaleString("id-ID")}`:"—"],
                    [lang==="id"?"Pengeluaran / Bulan":"Expenses / Month",form.monthlyExpense?`Rp ${parseInt(form.monthlyExpense).toLocaleString("id-ID")}`:"—"],
                    [lang==="id"?"Nominal Pinjaman":"Loan Amount",form.loanAmount?`Rp ${parseInt(form.loanAmount).toLocaleString("id-ID")}`:"—"],
                    [lang==="id"?"Tujuan Dana":"Purpose",form.loanPurpose||"—"],
                    [lang==="id"?"Bayar Tepat Waktu":"On-Time Payment",form.onTimePayment?`${form.onTimePayment}%`:"—"],
                  ].map(([k,v],i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderBottom:"1px solid var(--border2)"}}>
                      <span style={{fontSize:12,color:"var(--text3)"}}>{k}</span>
                      <span style={{fontSize:12,fontWeight:500,color:"var(--text1)"}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="card" style={{padding:"14px 18px",marginBottom:4}}>
                  <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",textTransform:"none",letterSpacing:0,fontSize:12,color:"var(--text3)",lineHeight:1.7,fontWeight:400}}>
                    <input type="checkbox" checked={form.selfDeclaration} onChange={e=>u("selfDeclaration",e.target.checked)} style={{marginTop:3,accentColor:"#02C39A",flexShrink:0}}/>
                    <span>{lang==="id"?"Saya menyatakan seluruh data yang diisi adalah benar dan dapat dipertanggungjawabkan. Data diproses secara anonim sesuai":"I declare all data entered is true and accountable. Data is processed anonymously per"} <strong style={{color:"#02C39A"}}>UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi</strong>.</span>
                  </label>
                </div>
              </div>
            )}

            <div style={{display:"flex",justifyContent:"space-between",marginTop:32,gap:12}}>
              {step>0?<button className="btn-back" onClick={()=>goStep(step-1)}>{lang==="id"?"← Kembali":"← Back"}</button>:<div/>}
              {step<4
                ?<button className="btn" onClick={()=>goStep(step+1)}>{lang==="id"?"Lanjut →":"Next →"}</button>
                :<button className="btn" onClick={handleSubmit} disabled={loading||!form.selfDeclaration}>{loading?(lang==="id"?"Mengirim ke AI & Blockchain...":"Sending to AI & Blockchain..."):(lang==="id"?"Analisis Kredit Sekarang":"Analyze Credit Now")}</button>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
