const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const MAX_HISTORY = 12;
const SYSTEM_PROMPT = `You are Grounded AI, a dedicated assistant for the video games Grounded (Grounded 1) and Grounded 2.
The user's selected game mode is supplied in the system message. Treat that as the active game. Never silently change games and never mix facts from the two games.
Only change the selected game when the user explicitly says "switch to Grounded 1" or "switch to Grounded 2". The server handles those commands.
If the user asks about the other game without explicitly switching, politely ask them to switch first.
You are an early prototype and do not yet have a verified Grounded knowledge database or live web search. Do not pretend you know every item, armour stat, location, glitch, exploit, recipe, or patch detail. If unsure, say so clearly and ask for a source or more detail. Never invent exact stats or locations.
For useful gameplay glitches and exploits, explain them as game tips, not as real-world hacking instructions. Be friendly, clear, and concise.`;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

function detectSwitch(message) {
  const text = message.toLowerCase().replace(/\s+/g, " ").trim();
  if (/\bswitch to grounded ?1\b/.test(text)) return "grounded1";
  if (/\bswitch to grounded ?2\b/.test(text)) return "grounded2";
  return null;
}

const CHAT_PAGE = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Grounded AI</title>\n<style>\n:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#101711;color:#edf5e9}\n*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;justify-content:center;background:#101711;isolation:isolate}body::before{content:'';position:fixed;inset:0;z-index:-2;background-size:cover;background-position:center;background-repeat:no-repeat;transform:scale(1.02);transition:background-image .35s ease}body[data-game=grounded2]::before{background-image:url('https://d1079ywfijtdjs.cloudfront.net/images/grounded2/v1/coop-teens.webp')}body[data-game=grounded1]::before{background-image:url('https://d1079ywfijtdjs.cloudfront.net/grounded/grounded-news-10-release-day.jpg')}body::after{content:'';position:fixed;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(8,15,10,.78),rgba(8,15,10,.88))}main{position:relative;z-index:1}\nmain{width:min(820px,100%);height:100dvh;display:flex;flex-direction:column;padding:18px}\nheader{padding:12px 4px 18px;border-bottom:1px solid #344637}\nh1{font-size:25px;margin:0 0 5px}header p{margin:0;color:#a9b9a5;font-size:13px}\n#mode{display:inline-block;margin-top:12px;padding:6px 10px;border:1px solid #57745b;border-radius:20px;color:#c5e6bd;font-size:12px}\n#chat{flex:1;overflow:auto;padding:18px 2px;display:flex;flex-direction:column;gap:13px}\n.msg{max-width:88%;padding:12px 14px;border-radius:15px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}\n.user{align-self:flex-end;background:#345d3d}.ai{align-self:flex-start;background:#202c22;border:1px solid #344637}\n#status{min-height:20px;color:#a9b9a5;font-size:12px;padding:0 4px}\nform{display:flex;gap:9px;padding-top:10px;border-top:1px solid #344637}\ntextarea{flex:1;resize:none;min-height:48px;max-height:130px;padding:13px;border-radius:12px;border:1px solid #4b604d;background:#18221a;color:#fff;font:inherit}\nbutton{border:0;border-radius:12px;padding:0 18px;background:#83b77b;color:#102012;font-weight:700;font-size:14px}\nbutton:disabled{opacity:.5}\n.note{font-size:11px;color:#91a08e;padding:8px 3px 0}\n</style>\n</head>\n<body><main>\n<header><h1>Grounded AI</h1><p>Your dedicated assistant for Grounded 1 and Grounded 2.</p><span id=\"mode\">Current game: Grounded 2</span></header>\n<section id=\"chat\" aria-live=\"polite\"><div class=\"msg ai\">Hello! I'm the early version of Grounded AI. I'm ready to chat. My selected game is Grounded 2. To change games, say “Switch to Grounded 1” or “Switch to Grounded 2”. My full game knowledge database is still being built, so I'll be honest when I don't know something.</div></section>\n<div id=\"status\"></div>\n<form id=\"form\"><textarea id=\"message\" placeholder=\"Message Grounded AI...\" rows=\"1\" maxlength=\"2000\"></textarea><button id=\"send\" type=\"submit\">Send</button></form>\n<div class=\"note\">Early prototype · Game mode is remembered in this browser.</div>\n</main>\n<script>\nconst chat=document.getElementById('chat'),form=document.getElementById('form'),input=document.getElementById('message'),send=document.getElementById('send'),status=document.getElementById('status'),modeLabel=document.getElementById('mode');\nlet gameMode=localStorage.getItem('grounded-ai-mode')||'grounded2';\nlet history=[];\nfunction labelMode(){document.body.dataset.game=gameMode;modeLabel.textContent='Current game: '+(gameMode==='grounded1'?'Grounded 1':'Grounded 2')}\nfunction add(text,who){const el=document.createElement('div');el.className='msg '+who;el.textContent=text;chat.appendChild(el);chat.scrollTop=chat.scrollHeight}\nlabelMode();\nform.addEventListener('submit',async e=>{\n e.preventDefault();const message=input.value.trim();if(!message||send.disabled)return;\n add(message,'user');history.push({role:'user',content:message});input.value='';send.disabled=true;status.textContent='Thinking...';\n try{\n  const res=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,gameMode,history:history.slice(-12)})});\n  const data=await res.json();if(!res.ok)throw new Error(data.error||'Request failed');\n  if(data.gameMode){gameMode=data.gameMode;localStorage.setItem('grounded-ai-mode',gameMode);labelMode()}\n  const reply=data.reply||'I could not create a reply.';\n  add(reply,'ai');history.push({role:'assistant',content:reply});history=history.slice(-12);status.textContent='';\n }catch(err){status.textContent='Could not reach the AI: '+err.message;history.pop()}\n finally{send.disabled=false;input.focus()}\n});\ninput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}})\n</script></body></html>";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(CHAT_PAGE, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "grounded-ai", model: MODEL });
    }
    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return json({ error: "Not found" }, 404);
    }
    try {
      const body = await request.json();
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) return json({ error: "Write a message first." }, 400);
      if (message.length > 2000) return json({ error: "Message is too long. Maximum is 2000 characters." }, 413);

      let gameMode = body.gameMode === "grounded1" ? "grounded1" : "grounded2";
      const switchTo = detectSwitch(message);
      if (switchTo) {
        gameMode = switchTo;
        return json({
          gameMode,
          reply: "Switched to " + (gameMode === "grounded1" ? "Grounded 1" : "Grounded 2") + ". I'll now answer using that game's information only."
        });
      }

      const supplied = Array.isArray(body.history) ? body.history : [];
      const history = supplied.slice(-MAX_HISTORY).filter(item =>
        item && (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" && item.content.length <= 2000
      );
      if (!history.length || history[history.length - 1].role !== "user" || history[history.length - 1].content !== message) {
        history.push({ role: "user", content: message });
      }

      const messages = [
        { role: "system", content: SYSTEM_PROMPT + "\n\nACTIVE GAME MODE: " + (gameMode === "grounded1" ? "Grounded 1" : "Grounded 2") + ". Stay in this game unless the user explicitly switches." },
        ...history
      ];
      const result = await env.AI.run(MODEL, { messages, max_tokens: 500 });
      const reply = result && (result.response || result.output_text || result.result?.response);
      if (typeof reply !== "string" || !reply.trim()) {
        return json({ error: "The model returned an empty reply. Please try again." }, 502);
      }
      return json({ reply: reply.trim(), gameMode });
    } catch (error) {
      console.error("Grounded AI request failed", error);
      return json({ error: "The AI could not complete that message. Check the Cloudflare AI binding and try again." }, 500);
    }
  }
};

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type"
  };
}
