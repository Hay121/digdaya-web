import { useState, useEffect, useRef, useContext } from "react";
import { LangContext } from "../pages/_app";

const NGROK_URL = "https://kortney-hamulate-annamarie.ngrok-free.dev";

type Msg = { role:"user"|"ai"; text:string; sentiment?:string; intent?:string; source?:string; time:string };

const SUGGESTIONS_ID = ["Cara meningkatkan skor?","Berapa limit pinjaman saya?","Apa itu behavioral scoring?","Apakah data saya aman?","Analisis arus kas saya"];
const SUGGESTIONS_EN = ["How to improve my score?","What is my loan limit?","What is behavioral scoring?","Is my data safe?","Analyze my cashflow"];

export default function AIChatWidget() {
  const { lang } = useContext(LangContext);
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [unread,   setUnread]   = useState(1);
  const [profile,  setProfile]  = useState<any>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    setMounted(true);
    const user  = localStorage.getItem("digdaya_user");
    const umkm  = localStorage.getItem("digdaya_umkm_data");
    const score = localStorage.getItem("digdaya_score");
    const p: any = {};
    if(user)  p.name  = JSON.parse(user).name;
    if(umkm)  Object.assign(p, JSON.parse(umkm));
    if(score) p.score = parseInt(score);
    setProfile(p);

    const greeting: Msg = {
      role: "ai",
      text: lang==="id"
        ? `Halo${p.name?" "+p.name:""}! 👋 Saya **AI Advisor** ModalAI powered by **Azure AI Language**. Tanya apapun tentang kredit usaha Anda!`
        : `Hi${p.name?" "+p.name:""}! 👋 I'm **AI Advisor** powered by **Azure AI Language**. Ask me anything about your business credit!`,
      time: new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),
      source: "system",
    };
    setMessages([greeting]);
  },[]);

  useEffect(()=>{
    if(open){ setUnread(0); setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100); }
  },[open, messages]);

  if(!mounted) return null;

  const send = async (msg: string) => {
    if(!msg.trim()||loading) return;
    const userMsg: Msg = { role:"user", text:msg, time:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}) };
    setMessages(m=>[...m,userMsg]);
    setInput("");
    setLoading(true);
    if(!open) setUnread(u=>u+1);

    try {
      const res = await fetch(`${NGROK_URL}/api/v1/ai-advisor`,{
        method:"POST",
        headers:{"Content-Type":"application/json","ngrok-skip-browser-warning":"true"},
        body:JSON.stringify({
          message: msg, lang,
          creditScore:    profile.score,
          bizType:        profile.bizType,
          onTimePayment:  profile.onTimePayment,
          deliveryRate:   profile.deliveryRate,
          digitalRatio:   profile.digitalRatio,
          monthlyRevenue: profile.monthlyRevenue,
          monthlyExpense: profile.monthlyExpense,
        }),
      });
      const d = await res.json();
      setMessages(m=>[...m,{
        role:"ai", text:d.reply, sentiment:d.sentiment,
        intent:d.intent, source:d.source,
        time:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})
      }]);
    } catch {
      setMessages(m=>[...m,{
        role:"ai",
        text:lang==="id"?"Koneksi bermasalah. Pastikan backend berjalan.":"Connection error. Make sure backend is running.",
        time:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})
      }]);
    }
    setLoading(false);
  };

  const sentimentColor = (s?:string) => s==="positive"?"#05A66B":s==="negative"?"#EF4444":"#F59E0B";
  const sentimentLabel = (s?:string) => s==="positive"?"😊":s==="negative"?"😟":"😐";
  const suggestions = lang==="id"?SUGGESTIONS_ID:SUGGESTIONS_EN;

  // Render markdown bold sederhana
  const renderText = (text:string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p,i)=>
      p.startsWith('**')
        ? <strong key={i} style={{color:"var(--text1)",fontWeight:700}}>{p.slice(2,-2)}</strong>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
        .ai-widget{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:12px}
        .ai-panel{animation:slideUp .3s cubic-bezier(.34,1.56,.64,1) forwards;width:380px;height:560px;display:flex;flex-direction:column;background:var(--bg2);border:1px solid var(--border);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.5);overflow:hidden}
        .ai-fab{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#1A56DB,#05A66B);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(26,86,219,.4);transition:all .2s;position:relative;animation:bounce 3s ease infinite}
        .ai-fab:hover{transform:scale(1.1);box-shadow:0 12px 32px rgba(26,86,219,.5)}
        .msg-bubble-ai{background:var(--card);border:1px solid var(--border);border-radius:16px 16px 16px 4px;padding:12px 14px;max-width:85%;font-size:13px;line-height:1.65;color:var(--text1)}
        .msg-bubble-user{background:linear-gradient(135deg,#1A56DB,#05A66B);border-radius:16px 16px 4px 16px;padding:12px 14px;max-width:85%;font-size:13px;line-height:1.65;color:#fff}
        .suggest-chip{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:6px 12px;font-size:11px;color:var(--text2);cursor:pointer;white-space:nowrap;transition:all .2s;font-family:var(--font)}
        .suggest-chip:hover{border-color:#1A56DB;color:#1A56DB;background:rgba(26,86,219,.05)}
        .chat-inp{background:var(--bg3);border:1px solid var(--border);border-radius:12px;color:var(--text1);padding:10px 14px;font-size:13px;font-family:var(--font);flex:1;outline:none;transition:border-color .2s;resize:none;line-height:1.5}
        .chat-inp:focus{border-color:#1A56DB;box-shadow:0 0 0 3px rgba(26,86,219,.1)}
        .send-btn{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#1A56DB,#05A66B);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
        .send-btn:hover{transform:scale(1.05)}
        .send-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
        .typing-d{width:5px;height:5px;border-radius:50%;background:var(--text3);animation:dot 1.2s infinite;display:inline-block;margin:0 2px}
        .typing-d:nth-child(2){animation-delay:.2s}
        .typing-d:nth-child(3){animation-delay:.4s}
      `}</style>

      <div className="ai-widget">
        {open&&(
          <div className="ai-panel">
            {/* Header */}
            <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",background:"linear-gradient(135deg,rgba(26,86,219,.1),rgba(5,166,107,.1))",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1A56DB,#05A66B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:13,letterSpacing:-.2}}>AI Credit Advisor</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#05A66B",fontWeight:600}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#05A66B",boxShadow:"0 0 6px rgba(5,166,107,.6)"}}/>
                    Azure AI Language
                  </div>
                </div>
              </div>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:18,padding:4,borderRadius:8,transition:"all .2s"}}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--bg3)")}
                onMouseLeave={e=>(e.currentTarget.style.background="none")}>✕</button>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
              {messages.map((msg,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",gap:3}}>
                  {msg.role==="ai"&&msg.source&&msg.source!=="system"&&(
                    <div style={{fontSize:10,color:"var(--text4)",marginLeft:2,display:"flex",alignItems:"center",gap:4}}>
                      <span>AI Advisor</span>
                      {msg.source==="azure-language"&&<span style={{background:"rgba(26,86,219,.1)",color:"#1A56DB",borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:700}}>Azure</span>}
                      {msg.sentiment&&<span style={{color:sentimentColor(msg.sentiment),fontSize:11}}>{sentimentLabel(msg.sentiment)}</span>}
                    </div>
                  )}
                  <div className={msg.role==="user"?"msg-bubble-user":"msg-bubble-ai"} style={{whiteSpace:"pre-line"}}>
                    {renderText(msg.text)}
                  </div>
                  <div style={{fontSize:10,color:"var(--text5)"}}>{msg.time}</div>
                </div>
              ))}
              {loading&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:3}}>
                  <div style={{fontSize:10,color:"var(--text4)"}}>AI Advisor</div>
                  <div className="msg-bubble-ai" style={{padding:"14px 16px"}}>
                    <span className="typing-d"/><span className="typing-d"/><span className="typing-d"/>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Suggestions */}
            <div style={{padding:"8px 12px",display:"flex",gap:6,overflowX:"auto",borderTop:"1px solid var(--border2)"}}>
              {suggestions.slice(0,3).map((s,i)=>(
                <button key={i} className="suggest-chip" onClick={()=>send(s)}>{s}</button>
              ))}
            </div>

            {/* Input */}
            <div style={{padding:"12px 14px",borderTop:"1px solid var(--border)",display:"flex",gap:8,alignItems:"flex-end",background:"var(--bg3)"}}>
              <textarea className="chat-inp" rows={1}
                placeholder={lang==="id"?"Tanya tentang kredit usaha...":"Ask about your business credit..."}
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);}}}
                style={{maxHeight:80}}
              />
              <button className="send-btn" disabled={!input.trim()||loading} onClick={()=>send(input)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button className="ai-fab" onClick={()=>setOpen(o=>!o)}>
          {open
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.21 3.41-.6L22 22l-1.6-6.59C21.79 14.34 22 13.19 22 12 22 6.48 17.52 2 12 2zm1 14H7v-2h6v2zm2-4H7v-2h8v2zm0-4H7V6h8v2z"/></svg>
          }
          {!open&&unread>0&&(
            <div style={{position:"absolute",top:-4,right:-4,width:18,height:18,borderRadius:"50%",background:"#EF4444",color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid var(--bg)"}}>
              {unread}
            </div>
          )}
        </button>
      </div>
    </>
  );
}
