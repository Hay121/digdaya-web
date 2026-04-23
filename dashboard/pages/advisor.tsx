import { useState, useEffect, useRef, useContext } from "react";
import { useRouter } from "next/router";
import NavBar from "../components/NavBar";
import { LangContext, ToastContext } from "./_app";

const NGROK_URL = "https://kortney-hamulate-annamarie.ngrok-free.dev";

const QUICK_QUESTIONS_ID = [
  "Kenapa skor kredit saya segini?",
  "Bagaimana cara meningkatkan skor saya?",
  "Berapa maksimal pinjaman yang bisa saya ajukan?",
  "Apa itu behavioral credit scoring?",
  "Apakah data saya aman di ModalAI?",
];

const QUICK_QUESTIONS_EN = [
  "Why is my credit score this low?",
  "How can I improve my credit score?",
  "What is the maximum loan I can apply for?",
  "What is behavioral credit scoring?",
  "Is my data safe with ModalAI?",
];

type Message = { role: "user"|"assistant"; content: string; time: string; source?: string };

export default function Advisor() {
  const router  = useRouter();
  const { lang } = useContext(LangContext);
  const { addToast } = useContext(ToastContext);
  const [user,     setUser]     = useState<any>(null);
  const [umkm,     setUmkm]     = useState<any>(null);
  const [score,    setScore]    = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    setMounted(true);
    const u = localStorage.getItem("digdaya_user");
    const d = localStorage.getItem("digdaya_umkm_data");
    const s = localStorage.getItem("digdaya_score");
    if(!u){ router.push("/"); return; }
    const parsedUser = JSON.parse(u);
    setUser(parsedUser);
    if(d) setUmkm(JSON.parse(d));
    if(s) setScore(parseInt(s));

    // Greeting awal
    const greeting: Message = {
      role: "assistant",
      content: lang === "en"
        ? `Hi ${parsedUser.name}! 👋 I'm your ModalAI Credit Advisor powered by Azure AI. I can help you understand your credit score, improve your chances of approval, and answer any questions about your loan application. How can I help you today?`
        : `Halo ${parsedUser.name}! 👋 Saya adalah Konsultan Kredit ModalAI yang didukung Azure AI. Saya siap membantu Anda memahami skor kredit, meningkatkan peluang persetujuan, dan menjawab pertanyaan seputar pengajuan pinjaman. Ada yang bisa saya bantu?`,
      time: new Date().toLocaleTimeString("id-ID", {hour:"2-digit",minute:"2-digit"}),
      source: "system",
    };
    setMessages([greeting]);
  },[]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  },[messages]);

  if(!mounted) return null;

  const sc = score>=740?"#05A66B":score>=670?"#1A56DB":score>=580?"#F59E0B":"#EF4444";

  const sendMessage = async (msg: string) => {
    if(!msg.trim()||loading) return;
    const userMsg: Message = { role:"user", content:msg, time:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}) };
    setMessages(m=>[...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${NGROK_URL}/api/v1/ai-advisor`, {
        method: "POST",
        headers: { "Content-Type":"application/json", "ngrok-skip-browser-warning":"true" },
        body: JSON.stringify({
          message: msg,
          creditScore: score,
          bizType: umkm?.bizType,
          onTimePayment: umkm?.onTimePayment,
          deliveryRate: umkm?.deliveryRate,
          digitalRatio: umkm?.digitalRatio,
          monthlyRevenue: umkm?.monthlyRevenue,
          monthlyExpense: umkm?.monthlyExpense,
          lang,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        role: "assistant",
        content: data.reply || (lang==="en"?"Sorry, I couldn't process that.":"Maaf, saya tidak bisa memproses permintaan itu."),
        time: new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),
        source: data.source,
      };
      setMessages(m=>[...m, aiMsg]);
    } catch(e) {
      const errMsg: Message = {
        role: "assistant",
        content: lang==="en"
          ? "I'm having trouble connecting right now. Please make sure the backend is running and try again."
          : "Saya sedang kesulitan terhubung. Pastikan backend berjalan dan coba lagi.",
        time: new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),
        source: "error",
      };
      setMessages(m=>[...m, errMsg]);
    }
    setLoading(false);
  };

  const quickQuestions = lang==="en" ? QUICK_QUESTIONS_EN : QUICK_QUESTIONS_ID;

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text1);font-family:var(--font);-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes typing{0%,100%{opacity:.3}50%{opacity:1}}
        .msg-in{animation:fadeUp .25s ease forwards}
        .bubble-user{background:linear-gradient(135deg,#1A56DB,#05A66B);color:#fff;border-radius:18px 18px 4px 18px;padding:12px 16px;max-width:75%;font-size:14px;line-height:1.6;box-shadow:0 4px 12px rgba(26,86,219,.3)}
        .bubble-ai{background:var(--card);border:1px solid var(--border);color:var(--text1);border-radius:18px 18px 18px 4px;padding:12px 16px;max-width:75%;font-size:14px;line-height:1.6}
        .quick-btn{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:8px 14px;font-size:12px;color:var(--text2);cursor:pointer;font-family:var(--font);transition:all .2s;white-space:nowrap}
        .quick-btn:hover{border-color:#1A56DB;color:#1A56DB;background:rgba(26,86,219,.05)}
        .send-btn{background:linear-gradient(135deg,#1A56DB,#05A66B);border:none;border-radius:12px;color:#fff;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0}
        .send-btn:hover{transform:scale(1.05);box-shadow:0 4px 12px rgba(26,86,219,.3)}
        .send-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
        .chat-input{background:var(--bg2);border:1px solid var(--border);border-radius:12px;color:var(--text1);padding:12px 16px;font-size:14px;font-family:var(--font);flex:1;outline:none;transition:border-color .2s;resize:none}
        .chat-input:focus{border-color:#1A56DB;box-shadow:0 0 0 3px rgba(26,86,219,.1)}
        .nbtn{background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text3);padding:6px 14px;font-size:12px;cursor:pointer;font-family:var(--font);transition:all .2s}
        .nbtn:hover{color:var(--text2)}
        .typing-dot{width:6px;height:6px;border-radius:50%;background:var(--text3);animation:typing 1.2s infinite}
        .typing-dot:nth-child(2){animation-delay:.2s}
        .typing-dot:nth-child(3){animation-delay:.4s}
      `}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column"}}>
        <NavBar rightItems={
          <div style={{display:"flex",gap:8}}>
            <button className="nbtn" onClick={()=>router.push("/dashboard")}>{lang==="id"?"Dashboard":"Dashboard"}</button>
            <button className="nbtn" onClick={()=>router.push("/report")}>{lang==="id"?"Laporan":"Report"}</button>
          </div>
        }/>

        <div style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr",maxWidth:1100,margin:"0 auto",width:"100%",padding:"24px",gap:20,minHeight:"calc(100vh - 58px)"}}>

          {/* Left sidebar — info */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* AI Badge */}
            <div style={{background:"linear-gradient(135deg,rgba(26,86,219,.1),rgba(5,166,107,.1))",border:"1px solid rgba(26,86,219,.2)",borderRadius:16,padding:"20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#1A56DB,#05A66B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🤖</div>
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:14,letterSpacing:-.2}}>AI Credit Advisor</div>
                  <div style={{fontSize:11,color:"#05A66B",fontWeight:600}}>Powered by Azure OpenAI</div>
                </div>
              </div>
              <div style={{fontSize:12,color:"var(--text3)",lineHeight:1.6}}>
                {lang==="id"
                  ?"Konsultan kredit AI yang memahami profil usaha Anda secara personal."
                  :"AI credit consultant that understands your business profile personally."}
              </div>
            </div>

            {/* Score card */}
            {score>0&&(
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"20px"}}>
                <div style={{fontSize:11,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12,fontFamily:"var(--font-mono)"}}>Credit Score</div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{width:56,height:56,borderRadius:"50%",background:`conic-gradient(${sc} ${((score-300)/550)*360}deg,var(--border) 0deg)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{fontSize:16,fontWeight:800,color:sc,fontFamily:"var(--font-head)"}}>{score}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:sc}}>{score>=740?"Excellent":score>=670?"Good":score>=580?"Fair":"Poor"}</div>
                    <div style={{fontSize:11,color:"var(--text4)"}}>{lang==="id"?"Skor kredit Anda":"Your credit score"}</div>
                  </div>
                </div>
                <div style={{height:4,background:"var(--border2)",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${((score-300)/550)*100}%`,background:`linear-gradient(90deg,#EF4444,#F59E0B,#05A66B)`,borderRadius:2}}/>
                </div>
              </div>
            )}

            {/* Quick topics */}
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"20px"}}>
              <div style={{fontSize:11,color:"var(--text4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14,fontFamily:"var(--font-mono)"}}>{lang==="id"?"Topik Populer":"Popular Topics"}</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {quickQuestions.map((q,i)=>(
                  <button key={i} onClick={()=>sendMessage(q)} style={{textAlign:"left",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"var(--text2)",cursor:"pointer",fontFamily:"var(--font)",transition:"all .2s",lineHeight:1.5}} onMouseEnter={e=>(e.currentTarget.style.borderColor="#1A56DB")} onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — chat area */}
          <div style={{display:"flex",flexDirection:"column",background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,overflow:"hidden"}}>

            {/* Chat header */}
            <div style={{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#05A66B",boxShadow:"0 0 8px rgba(5,166,107,.5)"}}/>
                <span style={{fontSize:14,fontWeight:600}}>
                  {lang==="id"?"Konsultan Kredit AI — ModalAI":"AI Credit Advisor — ModalAI"}
                </span>
              </div>
              <div style={{fontSize:11,color:"var(--text4)",background:"rgba(5,166,107,.1)",border:"1px solid rgba(5,166,107,.2)",borderRadius:20,padding:"3px 10px",color:"#05A66B",fontWeight:600}}>
                Azure OpenAI
              </div>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:16,minHeight:400,maxHeight:"calc(100vh - 280px)"}}>
              {messages.map((msg,i)=>(
                <div key={i} className="msg-in" style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",gap:4}}>
                  {msg.role==="assistant"&&(
                    <div style={{fontSize:11,color:"var(--text4)",marginLeft:4,display:"flex",alignItems:"center",gap:4}}>
                      <span>🤖 AI Advisor</span>
                      {msg.source==="azure"&&<span style={{background:"rgba(26,86,219,.1)",color:"#1A56DB",borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:700}}>Azure</span>}
                      {msg.source==="fallback"&&<span style={{background:"rgba(245,158,11,.1)",color:"#F59E0B",borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:700}}>Local</span>}
                    </div>
                  )}
                  <div className={msg.role==="user"?"bubble-user":"bubble-ai"}>
                    {msg.content}
                  </div>
                  <div style={{fontSize:10,color:"var(--text5)",marginLeft:msg.role==="assistant"?4:0,marginRight:msg.role==="user"?4:0}}>
                    {msg.time}
                  </div>
                </div>
              ))}
              {loading&&(
                <div className="msg-in" style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4}}>
                  <div style={{fontSize:11,color:"var(--text4)",marginLeft:4}}>🤖 AI Advisor</div>
                  <div className="bubble-ai" style={{display:"flex",alignItems:"center",gap:6,padding:"14px 18px"}}>
                    <div className="typing-dot"/>
                    <div className="typing-dot"/>
                    <div className="typing-dot"/>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input area */}
            <div style={{padding:"16px 20px",borderTop:"1px solid var(--border)",background:"var(--bg2)"}}>
              {/* Quick questions scroll */}
              <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12,marginBottom:12}}>
                {quickQuestions.slice(0,3).map((q,i)=>(
                  <button key={i} className="quick-btn" onClick={()=>sendMessage(q)}>{q}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
                <textarea
                  className="chat-input"
                  rows={1}
                  placeholder={lang==="id"?"Tanya apapun tentang kredit usaha Anda...":"Ask anything about your business credit..."}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(input); } }}
                  style={{minHeight:44,maxHeight:120}}
                />
                <button className="send-btn" disabled={!input.trim()||loading} onClick={()=>sendMessage(input)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
              <div style={{fontSize:11,color:"var(--text5)",marginTop:8,textAlign:"center"}}>
                {lang==="id"?"Tekan Enter untuk kirim · Shift+Enter untuk baris baru":"Press Enter to send · Shift+Enter for new line"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
