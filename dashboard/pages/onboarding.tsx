import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import NavBar from "../components/NavBar";
import { LangContext, ToastContext } from "./_app";

const fmtRp=(v:string)=>{const n=v.replace(/\D/g,"");return n?"Rp "+parseInt(n).toLocaleString("id-ID"):"";};
const parseRp=(v:string)=>v.replace(/\D/g,"");

// Komponen autocomplete generik
// Simple hash function (SHA-256 via Web Crypto API)
async function hashData(input: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback for non-secure contexts (e.g. local IP instead of localhost)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function validateNIK(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

function validateNIB(nib: string): boolean {
  return /^\d{13}$/.test(nib);
}

function validateRekening(rek: string): boolean {
  return /^\d{8,16}$/.test(rek.replace(/\s/g,""));
}

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
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#0F172A",border:"1px solid var(--border)",borderRadius:10,zIndex:200,overflow:"hidden",boxShadow:"0 16px 40px rgba(0,0,0,.6)",maxHeight:280,overflowY:"auto"}}>
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

function CustomSelect({label, value, onChange, options, placeholder}: {label?:string; value:string; onChange:(v:string)=>void; options:{val:string; label:string}[]; placeholder:string}) {
  const [open, setOpen] = useState(false);
  const selectedObj = options.find(o => o.val === value);

  return (
    <div style={{position:"relative", fontFamily:"var(--font)"}}>
      {label && <label>{label}</label>}
      <div 
        className="inp" 
        style={{
          display:"flex", justifyContent:"space-between", alignItems:"center", 
          cursor:"pointer", userSelect:"none",
          borderColor: open ? "#028090" : "var(--border)",
          boxShadow: open ? "0 0 0 3px rgba(2,128,144,.15), inset 0 2px 4px rgba(0,0,0,.02)" : "inset 0 2px 4px rgba(0,0,0,.02)",
          background: open ? "var(--card)" : "var(--bg2)",
          color: selectedObj ? "var(--text1)" : "var(--text5)",
          padding: "13px 16px"
        }}
        onClick={() => setOpen(!open)}
      >
        <span>{selectedObj ? selectedObj.label : placeholder}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s"}}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0, 
          background:"#0F172A", border:"1px solid var(--border)", borderRadius:12, 
          zIndex:200, overflow:"hidden", boxShadow:"0 16px 40px rgba(0,0,0,0.6)",
          padding: 6
        }}>
          {options.map((o, i) => (
            <div 
              key={i} 
              onMouseDown={(e)=>{ e.preventDefault(); onChange(o.val); setOpen(false); }}
              style={{
                padding:"10px 14px", fontSize:13, cursor:"pointer", 
                borderRadius:8, color: value === o.val ? "#02C39A" : "var(--text1)",
                background: value === o.val ? "rgba(2,195,154,0.08)" : "transparent",
                fontWeight: value === o.val ? 600 : 500,
                transition: "all 0.15s",
                marginBottom: i === options.length - 1 ? 0 : 2
              }}
              onMouseEnter={e => { if (value !== o.val) e.currentTarget.style.background = "rgba(2,128,144,0.1)"; }}
              onMouseLeave={e => { if (value !== o.val) e.currentTarget.style.background = "transparent"; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STEPS_ID = ["Profil Usaha","Data Keuangan","Rekam Jejak","Dokumen","Konfirmasi"];
const STEPS_EN = ["Business Profile","Financial Data","Track Record","Documents","Confirmation"];

const BIZ_TYPES = [
  {id:"Grocery", idL:"Warung / Toko Sembako", enL:"Grocery / Kiosk"},
  {id:"Agri", idL:"Pertanian / Perkebunan", enL:"Agriculture / Plantation"},
  {id:"Livestock", idL:"Peternakan / Perikanan", enL:"Livestock / Fishery"},
  {id:"FB", idL:"Kuliner / Makanan", enL:"Culinary / F&B"},
  {id:"Logistics", idL:"Jasa Transportasi / Logistik", enL:"Logistics / Transport"},
  {id:"Crafts", idL:"Kerajinan / Manufaktur", enL:"Crafts / Manufacturing"},
  {id:"Others", idL:"Jasa Lainnya", enL:"Other Services"}
];

const BIZ_AGES = [
  {id:"<1", idL:"Kurang dari 1 tahun", enL:"Less than 1 year"},
  {id:"1-2", idL:"1–2 tahun", enL:"1–2 years"},
  {id:"2-5", idL:"2–5 tahun", enL:"2–5 years"},
  {id:"5-10", idL:"5–10 tahun", enL:"5–10 years"},
  {id:">10", idL:"Lebih dari 10 tahun", enL:"More than 10 years"}
];

const LOAN_PURPOSES = [
  {id:"Stock", idL:"Tambah stok barang / bahan baku", enL:"Add stock / raw materials"},
  {id:"Renovation", idL:"Renovasi atau perluasan tempat usaha", enL:"Renovation or business expansion"},
  {id:"Equipment", idL:"Pembelian peralatan atau mesin", enL:"Purchase equipment or machinery"},
  {id:"WorkingCapital", idL:"Modal kerja operasional harian", enL:"Daily operational working capital"},
  {id:"Expansion", idL:"Ekspansi ke lokasi atau produk baru", enL:"Expansion to new location or product"},
  {id:"Refinancing", idL:"Refinancing hutang usaha", enL:"Refinancing business debt"}
];

const DIGITAL_RATIOS = [
  {id:"5",  idL: "0–10% — hampir semua offline", enL: "0–10% — almost all offline"},
  {id:"25", idL: "10–40% — sebagian online", enL: "10–40% — partly online"},
  {id:"55", idL: "40–70% — mayoritas online", enL: "40–70% — majority online"},
  {id:"85", idL: "70–100% — hampir semua online", enL: "70–100% — almost all online"}
];

const BANKS = ["BCA — Bank Central Asia","BRI — Bank Rakyat Indonesia","BNI — Bank Negara Indonesia","Mandiri — Bank Mandiri","BSI — Bank Syariah Indonesia","CIMB Niaga","Danamon","Permata Bank","BTN — Bank Tabungan Negara","BPD Jawa Tengah","BPD Jawa Barat (BJB)","BPD Jawa Timur","Bank Muamalat","Bank Mega","OCBC NISP","Maybank Indonesia","Bank Bukopin","Allo Bank","Sea Bank","Jago Bank"];
const BANK_OPTIONS = [...BANKS.map(b=>({id:b, idL:b, enL:b})), {id:"Other", idL:"Lainnya", enL:"Other"}];

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
    nikInput:"",nibInput:"",rekeningInput:"",
    nikHash:"",nibHash:"",rekeningLast4:"",
    bankName:"",
  });
  const [nikError, setNikError] = useState("");
  const [nibError, setNibError] = useState("");

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
      const API_URL = "https://kortney-hamulate-annamarie.ngrok-free.dev";
      const res = await fetch(`${API_URL}/api/v1/transactions`,{
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
        .inp{background:var(--bg2);border:1px solid var(--border);border-radius:12px;color:var(--text1);padding:13px 16px;font-size:14px;font-family:var(--font);width:100%;outline:none;transition:all .25s cubic-bezier(.16,1,.3,1);box-shadow:inset 0 2px 4px rgba(0,0,0,.02)}
        .inp:focus{border-color:#028090;box-shadow:0 0 0 3px rgba(2,128,144,.15),inset 0 2px 4px rgba(0,0,0,.02);background:var(--card)}
        .inp::placeholder{color:var(--text5)}
        select.inp{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;background-size:16px;padding-right:40px}
        select.inp option{background:var(--bg);color:var(--text1);padding:10px}
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
                    <CustomSelect 
                      label={lang==="id"?"Jenis Usaha":"Business Type"} 
                      placeholder={lang==="id"?"Pilih jenis usaha":"Choose business type"} 
                      value={form.bizType} 
                      onChange={v=>u("bizType",v)} 
                      options={BIZ_TYPES.map(x=>({val:x.id, label: lang==="id"?x.idL:x.enL}))} 
                    />
                    <CustomSelect 
                      label={lang==="id"?"Lama Usaha":"Business Age"} 
                      placeholder={lang==="id"?"Pilih durasi":"Choose duration"} 
                      value={form.bizAge} 
                      onChange={v=>u("bizAge",v)} 
                      options={BIZ_AGES.map(x=>({val:x.id, label: lang==="id"?x.idL:x.enL}))}
                    />
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
                  <CustomSelect 
                    label={lang==="id"?"Tujuan Penggunaan Dana":"Purpose of Funds"} 
                    placeholder={lang==="id"?"Pilih tujuan penggunaan":"Select purpose"} 
                    value={form.loanPurpose} 
                    onChange={v=>u("loanPurpose",v)} 
                    options={LOAN_PURPOSES.map(x=>({val:x.id, label: lang==="id"?x.idL:x.enL}))}
                  />
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
                        <input className="inp" style={{width:100}} placeholder="0–100" value={(form as any)[item.key]} onChange={e=>{
                          let val = e.target.value.replace(/\D/g,"");
                          if(val && parseInt(val) > 100) val = "100";
                          u(item.key, val);
                        }}/>
                        <span style={{color:"var(--text3)",fontSize:14}}>%</span>
                        {(form as any)[item.key]&&<div style={{fontSize:12,fontWeight:600,color:parseInt((form as any)[item.key])>=80?"#02C39A":parseInt((form as any)[item.key])>=60?"#F4A261":"#EF4444"}}>{parseInt((form as any)[item.key])>=80?(lang==="id"?"Sangat baik":"Excellent"):parseInt((form as any)[item.key])>=60?(lang==="id"?"Cukup baik":"Fair"):(lang==="id"?"Perlu ditingkatkan":"Needs improvement")}</div>}
                      </div>
                    </div>
                  ))}
                  <div className="g2">
                    <div className="card" style={{padding:"16px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={{textTransform:"none",letterSpacing:0,fontSize:12,fontWeight:600}}>{lang==="id"?"Pelanggan Unik / Bulan":"Unique Customers / Month"}</label><span className="badge">Market</span></div>
                      <input className="inp" placeholder={lang==="id"?"cth. 150":"e.g. 150"} value={form.uniqueBuyers} onChange={e=>u("uniqueBuyers",e.target.value.replace(/\D/g,""))}/>
                    </div>
                    <div className="card" style={{padding:"16px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={{textTransform:"none",letterSpacing:0,fontSize:12,fontWeight:600}}>{lang==="id"?"Penjualan via Digital":"Digital Sales"}</label><span className="badge">Digital</span></div>
                      <CustomSelect 
                        placeholder={lang==="id"?"Pilih proporsi":"Select proportion"} 
                        value={form.digitalRatio} 
                        onChange={v=>u("digitalRatio",v)} 
                        options={DIGITAL_RATIOS.map(x=>({val:x.id, label: lang==="id"?x.idL:x.enL}))} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 - Dokumen */}
            {step===3&&(
              <div>
                <h2 style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,marginBottom:5,letterSpacing:-.5}}>{steps[3]}</h2>
                <div style={{background:"rgba(2,195,154,.07)",border:"1px solid rgba(2,195,154,.15)",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{color:"#02C39A",fontSize:16,marginTop:1,flexShrink:0}}>🔒</div>
                  <div style={{fontSize:12,color:"var(--text3)",lineHeight:1.65}}>
                    <strong style={{color:"var(--text1)"}}>{lang==="id"?"Data Anda Aman 100%":"Your Data is 100% Safe"}</strong> — {lang==="id"?"NIK dan nomor rekening tidak pernah disimpan dalam bentuk asli. Sistem hanya menyimpan hash kriptografis (SHA-256) yang tidak bisa dikembalikan ke data asli.":"NIK and account numbers are never stored in original form. Only cryptographic SHA-256 hashes are stored, which cannot be reversed."}
                  </div>
                </div>

                {/* Input NIK */}
                <div className="card" style={{padding:"16px 18px",marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>
                        NIK — Nomor Induk Kependudukan
                        <span style={{background:"rgba(239,68,68,.1)",color:"#EF4444",fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:4,letterSpacing:.5,marginLeft:6}}>{lang==="id"?"WAJIB":"REQUIRED"}</span>
                      </div>
                      <div style={{fontSize:11,color:"var(--text3)"}}>{lang==="id"?"16 digit sesuai KTP. Langsung di-hash, tidak disimpan.":"16 digits from ID card. Immediately hashed, not stored."}</div>
                    </div>
                    {form.nikHash&&<div style={{fontSize:10,color:"#02C39A",fontWeight:600}}>✓ Verified</div>}
                  </div>
                  <div style={{position:"relative"}}>
                    <input className="inp"
                      placeholder="0000 0000 0000 0000"
                      value={form.nikInput.replace(/(\d{4})(?=\d)/g,"$1 ")}
                      maxLength={19}
                      onChange={async(e)=>{
                        const raw = e.target.value.replace(/\s/g,"");
                        u("nikInput",raw);
                        setNikError("");
                        if(raw.length===16){
                          if(!validateNIK(raw)){setNikError(lang==="id"?"NIK harus 16 digit angka":"NIK must be 16 digits");return;}
                          const h = await hashData(raw);
                          u("nikHash",h);
                        } else {
                          u("nikHash","");
                        }
                      }}
                      style={{borderColor:nikError?"#EF4444":form.nikHash?"#02C39A":"var(--border)",paddingRight:form.nikHash?40:14}}
                    />
                    {form.nikHash&&<div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#02C39A",fontSize:16}}>✓</div>}
                  </div>
                  {nikError&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠ {nikError}</div>}
                  {form.nikHash&&(
                    <div style={{marginTop:8,background:"rgba(2,195,154,.05)",border:"1px solid rgba(2,195,154,.1)",borderRadius:7,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:"var(--text4)",marginBottom:2,fontFamily:"var(--font-mono)",letterSpacing:1}}>SHA-256 HASH (yang tersimpan):</div>
                      <div style={{fontSize:9,color:"#02C39A",fontFamily:"var(--font-mono)",wordBreak:"break-all"}}>{form.nikHash}</div>
                    </div>
                  )}
                </div>

                {/* Input NIB */}
                <div className="card" style={{padding:"16px 18px",marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>
                        NIB — Nomor Induk Berusaha
                        <span style={{background:"rgba(239,68,68,.1)",color:"#EF4444",fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:4,letterSpacing:.5,marginLeft:6}}>{lang==="id"?"WAJIB":"REQUIRED"}</span>
                      </div>
                      <div style={{fontSize:11,color:"var(--text3)"}}>{lang==="id"?"13 digit dari OSS (oss.go.id). Gratis & 10 menit.":"13 digits from OSS (oss.go.id). Free & 10 minutes."}</div>
                    </div>
                    {form.nibHash&&<div style={{fontSize:10,color:"#02C39A",fontWeight:600}}>✓ Verified</div>}
                  </div>
                  <div style={{position:"relative"}}>
                    <input className="inp"
                      placeholder="0000000000000"
                      value={form.nibInput}
                      maxLength={13}
                      onChange={async(e)=>{
                        const raw = e.target.value.replace(/\D/g,"");
                        u("nibInput",raw);
                        setNibError("");
                        if(raw.length===13){
                          if(!validateNIB(raw)){setNibError(lang==="id"?"NIB harus 13 digit":"NIB must be 13 digits");return;}
                          const h = await hashData(raw);
                          u("nibHash",h);
                          u("hasNIB","yes");
                        } else {
                          u("nibHash",""); u("hasNIB","no");
                        }
                      }}
                      style={{borderColor:nibError?"#EF4444":form.nibHash?"#02C39A":"var(--border)"}}
                    />
                    {form.nibHash&&<div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#02C39A",fontSize:16}}>✓</div>}
                  </div>
                  {nibError&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠ {nibError}</div>}
                  {form.nibHash&&(
                    <div style={{marginTop:8,background:"rgba(2,195,154,.05)",border:"1px solid rgba(2,195,154,.1)",borderRadius:7,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:"var(--text4)",marginBottom:2,fontFamily:"var(--font-mono)",letterSpacing:1}}>SHA-256 HASH:</div>
                      <div style={{fontSize:9,color:"#02C39A",fontFamily:"var(--font-mono)",wordBreak:"break-all"}}>{form.nibHash}</div>
                    </div>
                  )}
                </div>

                {/* Input Rekening */}
                <div className="card" style={{padding:"16px 18px",marginBottom:12}}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>
                    {lang==="id"?"Nomor Rekening Bank":"Bank Account Number"}
                    <span style={{background:"rgba(239,68,68,.1)",color:"#EF4444",fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:4,letterSpacing:.5,marginLeft:6}}>{lang==="id"?"WAJIB":"REQUIRED"}</span>
                  </div>
                  <div style={{fontSize:11,color:"var(--text3)",marginBottom:10}}>{lang==="id"?"8–16 digit. Hanya 4 digit terakhir yang ditampilkan, sisanya di-mask.":"8–16 digits. Only last 4 digits shown, rest masked."}</div>
                  <div style={{marginBottom:10}}>
                    <CustomSelect 
                      label={lang==="id"?"Nama Bank":"Bank Name"} 
                      placeholder={lang==="id"?"Pilih bank":"Select bank"} 
                      value={form.bankName||""} 
                      onChange={v=>u("bankName",v)} 
                      options={BANK_OPTIONS.map(x=>({val:x.id, label: lang==="id"?x.idL:x.enL}))} 
                    />
                  </div>
                  <div style={{position:"relative"}}>
                    <input className="inp"
                      placeholder={lang==="id"?"Nomor rekening aktif":"Active account number"}
                      value={form.rekeningInput}
                      maxLength={16}
                      onChange={async(e)=>{
                        const raw = e.target.value.replace(/\D/g,"");
                        u("rekeningInput",raw);
                        if(validateRekening(raw)){
                          u("rekeningLast4",raw.slice(-4));
                          u("hasRekening","yes");
                          const h = await hashData(raw);
                          u("rekeningHash",h);
                        } else {
                          u("rekeningLast4",""); u("hasRekening","no");
                        }
                      }}
                      style={{borderColor:form.rekeningLast4?"#02C39A":"var(--border)"}}
                    />
                    {form.rekeningLast4&&<div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#02C39A",fontSize:16}}>✓</div>}
                  </div>
                  {form.rekeningLast4&&(
                    <div style={{marginTop:8,fontSize:12,color:"#02C39A",fontWeight:500}}>
                      ✓ {lang==="id"?"Rekening terverifikasi":"Account verified"} — ****{form.rekeningLast4}
                    </div>
                  )}
                </div>

                {/* SKDU opsional */}
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:11,padding:"15px 18px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>
                      SKDU / Surat Keterangan Usaha
                      <span style={{background:"rgba(2,128,144,.1)",color:"#028090",fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:4,letterSpacing:.5,marginLeft:6}}>{lang==="id"?"OPSIONAL":"OPTIONAL"}</span>
                    </div>
                    <div style={{fontSize:11,color:"var(--text3)",lineHeight:1.5}}>{lang==="id"?"Diterbitkan kelurahan atau desa setempat. Menambah skor +12 poin.":"Issued by local village office. Adds +12 score points."}</div>
                  </div>
                  <div style={{display:"flex",gap:7,flexShrink:0}}>
                    {["yes","no"].map(v=>(
                      <button key={v} onClick={()=>u("hasSKDU",v)} style={{padding:"7px 14px",borderRadius:7,border:`1.5px solid ${form.hasSKDU===v?(v==="yes"?"#02C39A":"#EF4444"):"var(--border)"}`,background:form.hasSKDU===v?(v==="yes"?"rgba(2,195,154,.12)":"rgba(239,68,68,.1)"):"transparent",color:form.hasSKDU===v?(v==="yes"?"#02C39A":"#EF4444"):"var(--text3)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font)",transition:"all .2s"}}>
                        {v==="yes"?(lang==="id"?"✓ Sudah Ada":"✓ Have It"):(lang==="id"?"✕ Belum":"✕ Not Yet")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step===3&&false&&(
              <div>
                {[
                  {key:"hasNIB",label:"NIB — Nomor Induk Berusaha",desc:"",req:true},
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
