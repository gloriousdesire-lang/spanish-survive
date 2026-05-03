import { useState, useEffect, useCallback } from "react";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#F7F5F2", surface: "#FFFFFF", border: "#E8E4DE", borderLight: "#F0EDE8",
  accent: "#FF5C35", accentDark: "#D94420",
  blue: "#2D6BE4", blueLight: "#EEF3FD",
  green: "#22C55E", greenLight: "#F0FDF4",
  yellow: "#F59E0B", yellowLight: "#FFFBEB",
  text: "#1A1612", textMid: "#6B6560", textLight: "#A09890",
  shadow: "0 2px 12px rgba(0,0,0,0.07)", shadowMd: "0 4px 24px rgba(0,0,0,0.10)",
};

// ── Speech (browser TTS) ──────────────────────────────────────────────────────
function speak(text, lang) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || "es-ES";
    u.rate = 0.92;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang && v.lang.toLowerCase().startsWith((lang||"es").slice(0,2).toLowerCase()));
    if (match) u.voice = match;
    window.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

function SpeakBtn({ text, lang = "es-ES", size = 32, style: s = {} }) {
  return (
    <button
      onClick={(e)=>{ e.stopPropagation(); speak(text, lang); }}
      aria-label="Play pronunciation"
      style={{
        width:size, height:size, borderRadius:size/2, background:C.blueLight,
        color:C.blue, fontSize:size*0.5, display:"flex", alignItems:"center",
        justifyContent:"center", border:`1px solid ${C.blue}33`, flexShrink:0, ...s
      }}>
      🔊
    </button>
  );
}

// ── Mission Bank (20 missions, 3 levels) ──────────────────────────────────────
const ALL_MISSIONS = [
  { id:1, level:1, title:"Order Coffee", emoji:"☕", scene:"You walk into a café in Valencia.", pressure:"The barista is looking at you.", phrases:[{es:"Un café, por favor",en:"One coffee, please"},{es:"Con leche",en:"With milk"},{es:"¿Cuánto cuesta?",en:"How much is it?"},{es:"Para llevar",en:"Takeaway"},{es:"La cuenta, por favor",en:"The bill, please"}], fallback:{es:"Un café",en:"One coffee"} },
  { id:2, level:1, title:"Get a Taxi", emoji:"🚕", scene:"You just landed at Valencia Airport.", pressure:"The driver asks where to.", phrases:[{es:"Al centro, por favor",en:"To the centre, please"},{es:"¿Cuánto cuesta?",en:"How much?"},{es:"¿Acepta tarjeta?",en:"Card ok?"},{es:"Aquí está bien",en:"Here is fine"},{es:"Gracias, quédese con el cambio",en:"Thanks, keep the change"}], fallback:{es:"Centro, gracias",en:"Centre, thanks"} },
  { id:3, level:1, title:"Ask for Help", emoji:"🆘", scene:"You're lost in El Carmen.", pressure:"A local stops to help.", phrases:[{es:"Necesito ayuda",en:"I need help"},{es:"Estoy perdido",en:"I'm lost"},{es:"¿Dónde está...?",en:"Where is...?"},{es:"No entiendo",en:"I don't understand"},{es:"¿Habla inglés?",en:"Do you speak English?"}], fallback:{es:"Ayuda, por favor",en:"Help, please"} },
  { id:4, level:1, title:"Supermarket", emoji:"🛒", scene:"You're at Mercadona checkout.", pressure:"Your items are being scanned.", phrases:[{es:"¿Tiene bolsa?",en:"Do you have a bag?"},{es:"Pago con tarjeta",en:"Paying by card"},{es:"¿Dónde está el cajero?",en:"Where is the ATM?"},{es:"¿Tiene oferta?",en:"Is it on offer?"},{es:"Gracias, hasta luego",en:"Thanks, goodbye"}], fallback:{es:"Tarjeta, por favor",en:"Card, please"} },
  { id:5, level:1, title:"Greet Neighbours", emoji:"👋", scene:"You pass your neighbour in the stairwell.", pressure:"They smile and say something.", phrases:[{es:"Buenos días",en:"Good morning"},{es:"Buenas tardes",en:"Good afternoon"},{es:"¿Cómo está usted?",en:"How are you?"},{es:"Soy su nuevo vecino",en:"I'm your new neighbour"},{es:"Encantado de conocerle",en:"Pleased to meet you"}], fallback:{es:"Buenos días",en:"Good morning"} },
  { id:6, level:1, title:"At the Pharmacy", emoji:"💊", scene:"You have a headache.", pressure:"The pharmacist asks what you need.", phrases:[{es:"Me duele la cabeza",en:"My head hurts"},{es:"¿Tiene algo para el dolor?",en:"Do you have something for pain?"},{es:"¿Sin receta?",en:"Without a prescription?"},{es:"¿Cuántas veces al día?",en:"How many times a day?"},{es:"¿Cuánto cuesta?",en:"How much is it?"}], fallback:{es:"Para el dolor, por favor",en:"For pain, please"} },
  { id:7, level:1, title:"Order Food", emoji:"🍽️", scene:"Sunday lunch at a local restaurant.", pressure:"The waiter arrives at your table.", phrases:[{es:"¿Tienen menú del día?",en:"Do you have a set menu?"},{es:"¿Qué recomienda?",en:"What do you recommend?"},{es:"Sin gluten, por favor",en:"Gluten-free, please"},{es:"Otro vino, por favor",en:"Another wine, please"},{es:"Está delicioso",en:"It's delicious"}], fallback:{es:"El menú, por favor",en:"The menu, please"} },
  { id:8, level:2, title:"Call About a Flat", emoji:"🏠", scene:"You found a listing on Idealista.", pressure:"The landlord picks up.", phrases:[{es:"¿Está disponible el piso?",en:"Is the flat available?"},{es:"¿Cuál es el precio mensual?",en:"What is the monthly rent?"},{es:"¿Están incluidos los gastos?",en:"Are bills included?"},{es:"¿Cuándo puedo verlo?",en:"When can I view it?"},{es:"¿Se admiten mascotas?",en:"Are pets allowed?"}], fallback:{es:"¿Está disponible?",en:"Is it available?"} },
  { id:9, level:2, title:"At the Bank", emoji:"🏦", scene:"You need to open a Spanish bank account.", pressure:"The advisor calls your number.", phrases:[{es:"Quiero abrir una cuenta",en:"I want to open an account"},{es:"¿Qué documentos necesito?",en:"What documents do I need?"},{es:"Tengo el NIE",en:"I have my NIE"},{es:"¿Cuánto tarda?",en:"How long does it take?"},{es:"¿Tiene tarjeta de débito?",en:"Do you have a debit card?"}], fallback:{es:"Quiero una cuenta",en:"I want an account"} },
  { id:10, level:2, title:"Doctor's Visit", emoji:"🏥", scene:"You're at the Centro de Salud.", pressure:"The receptionist asks what's wrong.", phrases:[{es:"Tengo una cita",en:"I have an appointment"},{es:"Me duele la cabeza",en:"My head hurts"},{es:"Tengo fiebre",en:"I have a fever"},{es:"¿Puedo tener la receta?",en:"Can I have the prescription?"},{es:"¿Dónde está la farmacia?",en:"Where is the pharmacy?"}], fallback:{es:"Necesito un médico",en:"I need a doctor"} },
  { id:11, level:2, title:"Buy a Used Car", emoji:"🚗", scene:"You found a car on Wallapop.", pressure:"The seller calls to arrange a meeting.", phrases:[{es:"¿Está en buen estado?",en:"Is it in good condition?"},{es:"¿Cuántos kilómetros tiene?",en:"How many km on the clock?"},{es:"¿Tiene la ITV pasada?",en:"Has it passed its ITV?"},{es:"¿Acepta menos?",en:"Will you take less?"},{es:"Lo pago en efectivo",en:"I'll pay cash"}], fallback:{es:"¿Está bien?",en:"Is it ok?"} },
  { id:12, level:2, title:"Post Office", emoji:"📦", scene:"You need to send a package.", pressure:"You're at the counter.", phrases:[{es:"Quiero enviar este paquete",en:"I want to send this package"},{es:"¿Cuánto tarda en llegar?",en:"How long will it take?"},{es:"¿Tiene seguro?",en:"Is it insured?"},{es:"Correo urgente",en:"Express mail"},{es:"¿Me da el comprobante?",en:"Can I have the receipt?"}], fallback:{es:"Enviar esto",en:"Send this"} },
  { id:13, level:2, title:"Hairdresser", emoji:"✂️", scene:"First haircut in Spain.", pressure:"The stylist asks what you want.", phrases:[{es:"Solo un poco, por favor",en:"Just a little, please"},{es:"Los lados cortos",en:"Short on the sides"},{es:"Igual que antes",en:"Same as before"},{es:"¿Cuánto cuesta?",en:"How much is it?"},{es:"Está perfecto",en:"It's perfect"}], fallback:{es:"Poco, gracias",en:"A little, thanks"} },
  { id:14, level:2, title:"Complain Politely", emoji:"😤", scene:"Your apartment has no hot water.", pressure:"You call the landlord.", phrases:[{es:"Hay un problema en el piso",en:"There's a problem in the flat"},{es:"No hay agua caliente",en:"There's no hot water"},{es:"Lleva dos días así",en:"It's been like this two days"},{es:"¿Cuándo puede venir?",en:"When can you come?"},{es:"Necesito una solución hoy",en:"I need a solution today"}], fallback:{es:"Hay un problema",en:"There's a problem"} },
  { id:15, level:3, title:"Job Interview", emoji:"💼", scene:"Interview at a luxury boutique in Valencia.", pressure:"The manager asks about your experience.", phrases:[{es:"Tengo diez años de experiencia",en:"I have ten years of experience"},{es:"Trabajo bien bajo presión",en:"I work well under pressure"},{es:"Me adapto rápidamente",en:"I adapt quickly"},{es:"¿Cuáles son los siguientes pasos?",en:"What are the next steps?"},{es:"Estoy muy motivado",en:"I'm very motivated"}], fallback:{es:"Tengo experiencia",en:"I have experience"} },
  { id:16, level:3, title:"Sign a Lease", emoji:"📋", scene:"You're signing your Valencia apartment contract.", pressure:"The landlord explains the terms.", phrases:[{es:"¿Puedo leerlo antes de firmar?",en:"Can I read it before signing?"},{es:"¿Cuánto es la fianza?",en:"How much is the deposit?"},{es:"¿Cuándo puedo entrar?",en:"When can I move in?"},{es:"¿Quién paga las reparaciones?",en:"Who pays for repairs?"},{es:"Necesito pensarlo",en:"I need to think about it"}], fallback:{es:"¿Puedo leerlo?",en:"Can I read it?"} },
  { id:17, level:3, title:"Negotiate a Deal", emoji:"🤝", scene:"Sourcing a wholesale supplier in Spain.", pressure:"They quote you a price.", phrases:[{es:"¿Puede hacer un mejor precio?",en:"Can you do a better price?"},{es:"Compramos en grandes cantidades",en:"We buy in large quantities"},{es:"¿Cuáles son las condiciones?",en:"What are the terms?"},{es:"Necesitamos exclusividad",en:"We need exclusivity"},{es:"Lo consultaré con mi equipo",en:"I'll check with my team"}], fallback:{es:"¿Mejor precio?",en:"Better price?"} },
  { id:18, level:3, title:"Town Hall", emoji:"🏛️", scene:"You need to register residency (empadronamiento).", pressure:"The official asks for your documents.", phrases:[{es:"Quiero empadronarme",en:"I want to register my residency"},{es:"Aquí está mi pasaporte",en:"Here is my passport"},{es:"¿Cuánto tiempo tarda?",en:"How long does it take?"},{es:"¿Necesito cita previa?",en:"Do I need an appointment?"},{es:"¿Me puede dar el certificado?",en:"Can you give me the certificate?"}], fallback:{es:"Quiero registrarme",en:"I want to register"} },
  { id:19, level:3, title:"Networking Event", emoji:"🎪", scene:"Business event in Valencia city centre.", pressure:"Someone approaches and introduces themselves.", phrases:[{es:"Me llamo Hamza, mucho gusto",en:"My name is Hamza, nice to meet you"},{es:"Trabajo en el sector del lujo",en:"I work in the luxury sector"},{es:"Acabo de mudarme a Valencia",en:"I just moved to Valencia"},{es:"¿Me puede dar su tarjeta?",en:"Can I have your card?"},{es:"Quedamos para tomar un café",en:"Let's meet for a coffee"}], fallback:{es:"Me llamo Hamza",en:"My name is Hamza"} },
  { id:20, level:3, title:"Fallas Festival", emoji:"🎆", scene:"You're at Las Fallas in Valencia.", pressure:"A local asks if you're enjoying it.", phrases:[{es:"Es increíble, nunca había visto algo así",en:"It's incredible, I've never seen anything like it"},{es:"¿Cuándo empieza la mascletà?",en:"When does the mascletà start?"},{es:"¿Qué significa esto?",en:"What does this mean?"},{es:"Llevo poco tiempo aquí",en:"I haven't been here long"},{es:"Me encanta Valencia",en:"I love Valencia"}], fallback:{es:"Me encanta",en:"I love it"} },
];

function getLevelForXp(xp) { return xp < 50 ? 1 : xp < 150 ? 2 : 3; }
function getLevelLabel(l) { return ["","Beginner","Intermediate","Advanced"][l]; }
function getLevelColor(l) { return [,C.green,C.blue,C.accent][l]; }

function getMissions(xp, saved) {
  const lv = getLevelForXp(xp);
  const base = ALL_MISSIONS.filter(m => m.level <= lv);
  const custom = saved.length > 0 ? [{
    id:"custom", level:1, title:"My Phrases", emoji:"📖",
    scene:"Phrases you saved from the translator.",
    pressure:"Practice what you actually need.",
    phrases: saved, fallback: saved[0] || {es:"Por favor",en:"Please"}
  }] : [];
  return [...base, ...custom];
}

// ── Translation (free, browser-friendly) ──────────────────────────────────────
async function translateText(text, dir) {
  const langpair = dir === "en→es" ? "en|es" : "es|en";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  const d = await res.json();
  if (d.responseStatus && d.responseStatus !== 200 && d.responseStatus !== "200") {
    throw new Error(d.responseDetails || "Translation error");
  }
  return (d.responseData && d.responseData.translatedText) || "";
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
body{background:#F7F5F2;font-family:'DM Sans',sans-serif;}
button,textarea,input{font-family:'DM Sans',sans-serif;}
textarea::placeholder{color:#C0B8B0;}
button{cursor:pointer;border:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
.fu{animation:fadeUp 0.28s ease forwards;}
.si{animation:slideIn 0.22s ease forwards;}
`;

function Pill({label, color}) {
  return <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:color+"1A",color}}>{label}</span>;
}

function PBtn({children,onClick,disabled,color=C.accent,style:s={}}) {
  return <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"15px",borderRadius:14,background:disabled?"#E8E4DE":color,color:disabled?C.textLight:"white",fontSize:15,fontWeight:600,boxShadow:disabled?"none":`0 4px 18px ${color}44`,transition:"all 0.15s",...s}}>{children}</button>;
}

function GBtn({children,onClick,style:s={}}) {
  return <button onClick={onClick} style={{width:"100%",padding:"13px",borderRadius:14,background:"transparent",color:C.textMid,fontSize:14,fontWeight:500,border:`1.5px solid ${C.border}`,transition:"all 0.15s",...s}}>{children}</button>;
}

// ── Survive ───────────────────────────────────────────────────────────────────
function SurviveTab({missions, xp, setXp, streak, setStreak}) {
  const [idx,setIdx] = useState(0);
  const [time,setTime] = useState(30);
  const [phase,setPhase] = useState("study");
  const level = getLevelForXp(xp);
  const nextXp = level===1?50:level===2?150:null;

  useEffect(()=>{if(phase!=="study"||time<=0)return;const t=setTimeout(()=>setTime(p=>p-1),1000);return()=>clearTimeout(t);},[time,phase]);

  const next = useCallback(()=>{setIdx(i=>(i+1)%missions.length);setTime(30);setPhase("study");},[missions.length]);
  const answer = yes => { if(yes){setXp(x=>x+10);setStreak(s=>s+1);next();}else{setStreak(0);setPhase("fallback");} };

  if(!missions.length) return <div style={{padding:"60px 20px",textAlign:"center",color:C.textMid}}><p style={{fontSize:48}}>✨</p><p style={{marginTop:12,fontSize:16}}>Loading missions…</p></div>;
  const m = missions[idx % missions.length];
  const danger = time <= 8;

  return (
    <div style={{padding:"20px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:C.text}}>Survive 🇪🇸</h1>
          {nextXp && <p style={{fontSize:12,color:C.textLight,marginTop:3}}>{nextXp-xp} XP to unlock {getLevelLabel(level+1)}</p>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <Pill label={`⚡ ${xp} XP`} color={C.blue}/>
          <Pill label={`🔥 ${streak}`} color={C.accent}/>
        </div>
      </div>

      {/* Mission header */}
      <div className="fu" style={{background:"white",borderRadius:20,padding:18,boxShadow:C.shadowMd,marginBottom:14,border:`1px solid ${C.borderLight}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:50,height:50,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,background:getLevelColor(m.level)+"15"}}>{m.emoji}</div>
            <div>
              <Pill label={getLevelLabel(m.level)} color={getLevelColor(m.level)}/>
              <p style={{fontSize:18,fontWeight:700,color:C.text,marginTop:5}}>{m.title}</p>
            </div>
          </div>
          <div style={{minWidth:48,height:48,borderRadius:12,background:danger?C.accent+"15":C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:danger?"pulse 0.6s ease-in-out infinite":"none"}}>
            <span style={{fontSize:20,fontWeight:700,color:danger?C.accent:C.text,lineHeight:1}}>{time}</span>
            <span style={{fontSize:9,color:C.textLight,letterSpacing:"0.5px"}}>SEC</span>
          </div>
        </div>
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.borderLight}`}}>
          <p style={{fontSize:12,color:C.textLight,fontWeight:500,marginBottom:3}}>{m.scene}</p>
          <p style={{fontSize:14,color:C.textMid,fontStyle:"italic"}}>{m.pressure}</p>
        </div>
      </div>

      {/* Phrases */}
      {m.phrases.map((p,i)=>(
        <div key={i} style={{background:"white",borderRadius:14,padding:"14px 16px",marginBottom:9,border:`1px solid ${C.borderLight}`,animation:`fadeUp 0.22s ease ${i*0.06}s both`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:18,fontWeight:600,color:C.text,marginBottom:4}}>{p.es}</p>
            <p style={{fontSize:13,color:C.textLight}}>{p.en}</p>
          </div>
          <SpeakBtn text={p.es} size={36}/>
        </div>
      ))}

      {/* CTA */}
      <div style={{marginTop:6}}>
        {phase==="study" && <PBtn onClick={()=>setPhase("check")}>✅ I used this in real life</PBtn>}
        {phase==="check" && (
          <div className="si" style={{background:"white",borderRadius:16,padding:16,border:`1px solid ${C.borderLight}`,boxShadow:C.shadow}}>
            <p style={{fontWeight:600,fontSize:15,textAlign:"center",marginBottom:14}}>Did it work? 🤔</p>
            <PBtn onClick={()=>answer(true)} style={{marginBottom:9}}>YES — nailed it! +10 XP 🎉</PBtn>
            <GBtn onClick={()=>answer(false)}>Not quite, show me easier</GBtn>
          </div>
        )}
        {phase==="fallback" && (
          <div className="si">
            <div style={{background:C.yellowLight,borderRadius:14,padding:16,border:`1px solid ${C.yellow}44`,marginBottom:10}}>
              <p style={{fontSize:11,fontWeight:600,color:C.yellow,letterSpacing:"0.5px",marginBottom:8}}>SIMPLER VERSION</p>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <p style={{fontSize:24,fontWeight:700,color:C.text}}>{m.fallback.es}</p>
                  <p style={{fontSize:14,color:C.textMid,marginTop:5}}>{m.fallback.en}</p>
                </div>
                <SpeakBtn text={m.fallback.es} size={40}/>
              </div>
            </div>
            <PBtn onClick={next}>Next Mission →</PBtn>
          </div>
        )}
      </div>
      <p style={{textAlign:"center",fontSize:12,color:C.textLight,margin:"16px 0 0"}}>
        Mission {(idx%missions.length)+1} of {missions.length} · Loops forever
      </p>
    </div>
  );
}

// ── Translate ─────────────────────────────────────────────────────────────────
function TranslateTab({onSave}) {
  const [dir,setDir] = useState("en→es");
  const [input,setInput] = useState("");
  const [result,setResult] = useState("");
  const [loading,setLoading] = useState(false);
  const [saved,setSaved] = useState(false);
  const [error,setError] = useState("");

  const go = async () => {
    if(!input.trim())return;
    setLoading(true);setResult("");setError("");setSaved(false);
    try{const r=await translateText(input.trim(),dir);setResult(r);}
    catch(e){setError("Translation failed — please check your connection and try again.");}
    setLoading(false);
  };
  const swap = ()=>{setDir(d=>d==="en→es"?"es→en":"en→es");setInput(result);setResult("");setSaved(false);setError("");};
  const save = ()=>{const[es,en]=dir==="en→es"?[result,input]:[input,result];onSave({es,en});setSaved(true);};

  const resultLang = dir === "en→es" ? "es-ES" : "en-GB";

  return (
    <div style={{padding:"20px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:C.text,marginBottom:20}}>Translate 🌐</h1>

      {/* Toggle */}
      <div style={{display:"flex",background:"white",borderRadius:12,padding:4,marginBottom:18,border:`1px solid ${C.border}`,boxShadow:C.shadow}}>
        {["en→es","es→en"].map(d=>(
          <button key={d} onClick={()=>{setDir(d);setResult("");setError("");}}
            style={{flex:1,padding:"11px 6px",borderRadius:9,background:dir===d?"white":"transparent",color:dir===d?C.text:C.textLight,fontSize:13,fontWeight:dir===d?600:400,boxShadow:dir===d?C.shadow:"none",transition:"all 0.2s",border:dir===d?`1px solid ${C.border}`:"none"}}>
            {d==="en→es"?"🇬🇧 EN → ES 🇪🇸":"🇪🇸 ES → EN 🇬🇧"}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{background:"white",borderRadius:16,border:`1.5px solid ${input?C.blue:C.border}`,transition:"border-color 0.2s",marginBottom:12,overflow:"hidden"}}>
        <p style={{padding:"11px 14px 0",fontSize:11,fontWeight:600,color:C.textLight,letterSpacing:"0.5px"}}>
          {dir==="en→es"?"TYPE IN ENGLISH":"ESCRIBE EN ESPAÑOL"}
        </p>
        <textarea value={input} onChange={e=>{setInput(e.target.value);setResult("");setSaved(false);setError("");}}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();go();}}}
          placeholder={dir==="en→es"?"e.g. I need a furnished flat near the centre…":"e.g. ¿Está incluido el agua en el precio?"}
          style={{width:"100%",minHeight:110,padding:"10px 14px 16px",background:"transparent",border:"none",outline:"none",fontSize:16,color:C.text,resize:"none",lineHeight:1.5}}/>
      </div>

      <PBtn onClick={go} disabled={loading||!input.trim()}>{loading?"Translating…":"Translate →"}</PBtn>

      {error && (
        <div style={{background:"#FFF0EC",border:`1px solid ${C.accent}44`,borderRadius:12,padding:"12px 14px",marginTop:12}}>
          <p style={{fontSize:13,color:C.accent}}>{error}</p>
        </div>
      )}

      {result && (
        <div className="si" style={{background:C.greenLight,border:`1px solid ${C.green}44`,borderRadius:16,padding:18,marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <p style={{fontSize:11,fontWeight:600,color:C.green,letterSpacing:"0.5px"}}>
              {dir==="en→es"?"SPANISH":"ENGLISH"}
            </p>
            <SpeakBtn text={result} lang={resultLang} size={34}/>
          </div>
          <p style={{fontSize:20,fontWeight:600,color:C.text,lineHeight:1.45,marginBottom:16}}>{result}</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[
              {label:"⇄ Swap & edit",fn:swap},
              {label:"📋 Copy",fn:()=>navigator.clipboard?.writeText(result)},
            ].map(({label,fn})=>(
              <button key={label} onClick={fn}
                style={{padding:"9px 14px",borderRadius:10,background:"white",border:`1px solid ${C.border}`,fontSize:13,fontWeight:500,color:C.textMid}}>{label}</button>
            ))}
            <button onClick={save}
              style={{padding:"9px 14px",borderRadius:10,fontSize:13,fontWeight:600,background:saved?C.green:"white",color:saved?"white":C.blue,border:`1px solid ${saved?C.green:C.blue}55`,transition:"all 0.2s"}}>
              {saved?"✓ Saved!":"+ Add to missions"}
            </button>
          </div>
        </div>
      )}

      <p style={{fontSize:12,color:C.textLight,textAlign:"center",marginTop:18}}>Press Enter to translate · Tap 🔊 to hear it · Saved phrases become missions</p>
    </div>
  );
}

// ── Phrases ───────────────────────────────────────────────────────────────────
function PhrasesTab({phrases,onDelete}) {
  if(!phrases.length) return (
    <div style={{padding:"20px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:C.text,marginBottom:20}}>My Phrases 📖</h1>
      <div style={{textAlign:"center",padding:"52px 20px"}}>
        <div style={{fontSize:54}}>📖</div>
        <p style={{marginTop:14,fontSize:16,fontWeight:600,color:C.text}}>No saved phrases yet</p>
        <p style={{marginTop:6,fontSize:14,color:C.textLight}}>Translate something and tap<br/>"Add to missions" to save it here.</p>
      </div>
    </div>
  );
  return (
    <div style={{padding:"20px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:C.text}}>My Phrases 📖</h1>
        <Pill label={`${phrases.length} saved`} color={C.blue}/>
      </div>
      <p style={{fontSize:13,color:C.textLight,marginBottom:16}}>These appear as a custom mission in Survive mode. Tap 🔊 to hear pronunciation.</p>
      {phrases.map((p,i)=>(
        <div key={i} style={{background:"white",borderRadius:14,padding:"13px 14px",marginBottom:9,border:`1px solid ${C.borderLight}`,display:"flex",alignItems:"center",gap:10,animation:`fadeUp 0.22s ease ${i*0.05}s both`}}>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:16,fontWeight:600,color:C.text}}>{p.es}</p>
            <p style={{fontSize:13,color:C.textLight,marginTop:3}}>{p.en}</p>
          </div>
          <SpeakBtn text={p.es} size={34}/>
          <button onClick={()=>onDelete(i)} style={{width:32,height:32,borderRadius:8,background:"#FFF0EC",color:C.accent,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
      ))}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────
function ProgressTab({xp,streak,savedCount}) {
  const level = getLevelForXp(xp);
  const thresholds = [0,50,150,999];
  const lxp = xp - thresholds[level-1];
  const lmax = thresholds[level] - thresholds[level-1];
  const pct = Math.min((lxp/lmax)*100,100);
  const milestones = [
    {label:"First phrase",req:10,emoji:"🌱"},
    {label:"Unlock Intermediate",req:50,emoji:"📈"},
    {label:"10 missions done",req:100,emoji:"🏅"},
    {label:"Unlock Advanced",req:150,emoji:"🚀"},
    {label:"Valencia ready",req:300,emoji:"🇪🇸"},
    {label:"Fluency mode",req:500,emoji:"🏆"},
  ];
  return (
    <div style={{padding:"20px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:C.text,marginBottom:20}}>Progress ⚡</h1>
      <div style={{background:`linear-gradient(135deg,${C.accent},${C.accentDark})`,borderRadius:22,padding:24,marginBottom:14,color:"white",boxShadow:`0 8px 32px ${C.accent}55`}}>
        <p style={{fontSize:12,opacity:0.8,letterSpacing:"0.5px",fontWeight:500,marginBottom:4}}>TOTAL XP</p>
        <p style={{fontSize:56,fontWeight:700,lineHeight:1,fontFamily:"'DM Serif Display',serif"}}>{xp}</p>
        <div style={{marginTop:18}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
            <span style={{fontSize:13,opacity:0.9,fontWeight:600}}>{getLevelLabel(level)}</span>
            {level<3&&<span style={{fontSize:13,opacity:0.75}}>{getLevelLabel(level+1)} →</span>}
          </div>
          <div style={{background:"rgba(255,255,255,0.25)",borderRadius:6,height:8}}>
            <div style={{background:"white",borderRadius:6,height:8,width:`${level>=3?100:pct}%`,transition:"width 0.7s ease",boxShadow:"0 0 10px rgba(255,255,255,0.5)"}}/>
          </div>
          <p style={{fontSize:11,opacity:0.7,marginTop:6}}>
            {level<3?`${Math.round(pct)}% to next level`:"Max level reached 🏆"}
          </p>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
        {[{label:"Streak",val:streak,emoji:"🔥"},{label:"Level",val:level,emoji:"⭐"},{label:"Phrases",val:savedCount,emoji:"📖"}].map(({label,val,emoji})=>(
          <div key={label} style={{background:"white",borderRadius:14,padding:"16px 10px",textAlign:"center",border:`1px solid ${C.borderLight}`}}>
            <div style={{fontSize:26,marginBottom:4}}>{emoji}</div>
            <div style={{fontSize:26,fontWeight:700,color:C.text,lineHeight:1}}>{val}</div>
            <div style={{fontSize:11,color:C.textLight,marginTop:3}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{background:"white",borderRadius:16,padding:16,border:`1px solid ${C.borderLight}`}}>
        <p style={{fontSize:11,fontWeight:600,color:C.textLight,letterSpacing:"0.5px",marginBottom:14}}>MILESTONES</p>
        {milestones.map((m,i)=>{
          const done=xp>=m.req;
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<milestones.length-1?`1px solid ${C.borderLight}`:"none",opacity:done?1:0.5}}>
              <span style={{fontSize:22}}>{m.emoji}</span>
              <div style={{flex:1}}>
                <p style={{fontSize:14,fontWeight:600,color:C.text}}>{m.label}</p>
                <p style={{fontSize:11,color:C.textLight}}>{m.req} XP</p>
              </div>
              {done?<span style={{fontSize:18}}>✅</span>:<span style={{fontSize:12,color:C.textLight}}>{m.req-xp} XP</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab] = useState("survive");
  const [xp,setXp] = useState(0);
  const [streak,setStreak] = useState(0);
  const [saved,setSaved] = useState([]);
  const missions = getMissions(xp,saved);

  // Pre-load voices so the first speak() call has Spanish ready
  useEffect(()=>{
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  },[]);

  const NAV = [
    {id:"survive",emoji:"⚔️",label:"Survive"},
    {id:"translate",emoji:"🌐",label:"Translate"},
    {id:"phrases",emoji:"📖",label:"Phrases"},
    {id:"progress",emoji:"⚡",label:"Progress"}
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:76}}>
      <style>{CSS}</style>
      {tab==="survive"&&<SurviveTab missions={missions} xp={xp} setXp={setXp} streak={streak} setStreak={setStreak}/>}
      {tab==="translate"&&<TranslateTab onSave={p=>setSaved(prev=>[...prev,p])}/>}
      {tab==="phrases"&&<PhrasesTab phrases={saved} onDelete={i=>setSaved(prev=>prev.filter((_,j)=>j!==i))}/>}
      {tab==="progress"&&<ProgressTab xp={xp} streak={streak} savedCount={saved.length}/>}

      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.96)",backdropFilter:"blur(14px)",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100}}>
        {NAV.map(({id,emoji,label})=>{
          const a=tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)}
              style={{flex:1,padding:"10px 4px 9px",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:a?C.accent:C.textLight,borderTop:a?`2.5px solid ${C.accent}`:"2.5px solid transparent",transition:"all 0.15s"}}>
              <span style={{fontSize:21}}>{emoji}</span>
              <span style={{fontSize:10,fontWeight:a?700:400,letterSpacing:"0.3px"}}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
