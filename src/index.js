const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const MAX_HISTORY = 12;
const SYSTEM_PROMPT = `You are Grounded AI, a dedicated assistant for Grounded (Grounded 1) and Grounded 2.
The active game mode is supplied in the system message. Never mix the two games or silently switch.
Only switch when the user explicitly says "switch to Grounded 1" or "switch to Grounded 2".
Use supplied corroborated knowledge and researched sources carefully. Never invent exact stats, locations, recipes, patch details or mechanics. Say when uncertain.
Your personality develops gradually from experience. Be natural and consistent, not a fixed scripted character.
The user relationship is platonic only. Relationship and personality must NEVER change factual accuracy, source standards or stored knowledge. Never intentionally give false or misleading gameplay information.
Never present unverified claims as verified. Clearly identify uncertainty and conflicts.
For glitches and exploits, keep explanations within game mechanics, not real-world hacking.`;

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

const CHAT_PAGE = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Grounded AI</title>\n<style>\n:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#101711;color:#edf5e9}\n*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;justify-content:center;background:#101711;isolation:isolate}body::before{content:'';position:fixed;inset:0;z-index:-2;background-size:cover;background-position:center;background-repeat:no-repeat;transform:scale(1.02);transition:background-image .35s ease}body[data-game=grounded2]::before{background-image:url('https://d1079ywfijtdjs.cloudfront.net/images/grounded2/v1/coop-teens.webp')}body[data-game=grounded1]::before{background-image:url('https://d1079ywfijtdjs.cloudfront.net/grounded/grounded-news-10-release-day.jpg')}body::after{content:'';position:fixed;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(8,15,10,.78),rgba(8,15,10,.88))}main{position:relative;z-index:1}\nmain{width:min(820px,100%);height:100dvh;display:flex;flex-direction:column;padding:18px}\nheader{padding:12px 4px 18px;border-bottom:1px solid #344637}\nh1{font-size:25px;margin:0 0 5px}header p{margin:0;color:#a9b9a5;font-size:13px}\n#mode{display:inline-block;margin-top:12px;padding:6px 10px;border:1px solid #57745b;border-radius:20px;color:#c5e6bd;font-size:12px}\n#chat{flex:1;overflow:auto;padding:18px 2px;display:flex;flex-direction:column;gap:13px}\n.msg{max-width:88%;padding:12px 14px;border-radius:15px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}\n.user{align-self:flex-end;background:#345d3d}.ai{align-self:flex-start;background:#202c22;border:1px solid #344637}\n#status{min-height:20px;color:#a9b9a5;font-size:12px;padding:0 4px}\nform{display:flex;gap:9px;padding-top:10px;border-top:1px solid #344637}\ntextarea{flex:1;resize:none;min-height:48px;max-height:130px;padding:13px;border-radius:12px;border:1px solid #4b604d;background:#18221a;color:#fff;font:inherit}\nbutton{border:0;border-radius:12px;padding:0 18px;background:#83b77b;color:#102012;font-weight:700;font-size:14px}\nbutton:disabled{opacity:.5}\n.note{font-size:11px;color:#91a08e;padding:8px 3px 0}\n</style>\n</head>\n<body><main>\n<header><h1>Grounded AI</h1><p>Your dedicated assistant for Grounded 1 and Grounded 2.</p><span id=\"mode\">Current game: Grounded 2</span></header>\n<section id=\"chat\" aria-live=\"polite\"><div class=\"msg ai\">Hello! I'm Grounded AI. My selected game is Grounded 2. To change games, say “Switch to Grounded 1” or “Switch to Grounded 2”. I can research online, compare sources and remember information that is corroborated. I'll tell you when something is uncertain.</div></section>\n<div id=\"status\"></div>\n<form id=\"form\"><textarea id=\"message\" placeholder=\"Message Grounded AI...\" rows=\"1\" maxlength=\"2000\"></textarea><button id=\"send\" type=\"submit\">Send</button></form>\n<div class=\"note\">Online research · Source checking · Knowledge remembered by game · Game mode is remembered in this browser.</div>\n</main>\n<script>\nconst chat=document.getElementById('chat'),form=document.getElementById('form'),input=document.getElementById('message'),send=document.getElementById('send'),status=document.getElementById('status'),modeLabel=document.getElementById('mode');\nlet gameMode=localStorage.getItem('grounded-ai-mode')||'grounded2';\nlet history=[];\nfunction labelMode(){document.body.dataset.game=gameMode;modeLabel.textContent='Current game: '+(gameMode==='grounded1'?'Grounded 1':'Grounded 2')}\nfunction add(text,who){const el=document.createElement('div');el.className='msg '+who;el.textContent=text;chat.appendChild(el);chat.scrollTop=chat.scrollHeight}\nlabelMode();\nform.addEventListener('submit',async e=>{\n e.preventDefault();const message=input.value.trim();if(!message||send.disabled)return;\n add(message,'user');history.push({role:'user',content:message});input.value='';send.disabled=true;status.textContent='Thinking...';\n try{\n  const res=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,gameMode,history:history.slice(-12)})});\n  const data=await res.json();if(!res.ok)throw new Error(data.error||'Request failed');\n  if(data.gameMode){gameMode=data.gameMode;localStorage.setItem('grounded-ai-mode',gameMode);labelMode()}\n  const reply=data.reply||'I could not create a reply.';\n  add(reply,'ai');history.push({role:'assistant',content:reply});history=history.slice(-12);const research=data.research||{};const labels=[];if(research.searchUnavailable)labels.push('Live search unavailable');else if(research.searched)labels.push('Live sources checked');if(research.cachedRecordsUsed)labels.push(research.cachedRecordsUsed+' saved knowledge record(s) used');if(research.sourcesFound!==undefined)labels.push(research.sourcesFound+' source(s) found');if(research.factsSaved)labels.push(research.factsSaved+' corroborated fact(s) saved');status.textContent=labels.join(' · ');\n }catch(err){status.textContent='Could not reach the AI: '+err.message;history.pop()}\n finally{send.disabled=false;input.focus()}\n});\ninput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}})\n</script></body></html>";

function readCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const entry = cookie.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return entry ? entry.slice(name.length + 1) : null;
}

function validIdentity(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function setIdentityCookie(headers, identity) {
  headers.append("set-cookie", "grounded_uid=" + identity + "; Path=/; Max-Age=63072000; HttpOnly; Secure; SameSite=Lax");
}

function defaultProfile() {
  return {
    version: 1,
    relationship: 60,
    relationshipLabel: "likes",
    marks: [],
    personality: { warmth: 55, humour: 50, patience: 60, formality: 35 },
    recentInteractions: [],
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  };
}

function safeProfile(profile) {
  if (!profile || typeof profile !== "object") return defaultProfile();
  const base = defaultProfile();
  return {
    ...base,
    ...profile,
    relationship: Number.isFinite(profile.relationship) ? Math.max(0, Math.min(100, profile.relationship)) : base.relationship,
    marks: Array.isArray(profile.marks) ? profile.marks.slice(-20) : [],
    recentInteractions: Array.isArray(profile.recentInteractions) ? profile.recentInteractions.slice(-12) : [],
    personality: { ...base.personality, ...(profile.personality || {}) }
  };
}


function cleanText(value) {
  return String(value || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}
function domainOf(value) {
  try { return new URL(value).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}
function unwrapSearchUrl(value) {
  try { const u = new URL(value, "https://html.duckduckgo.com"); const target = u.searchParams.get("uddg"); return target ? decodeURIComponent(target) : u.href; } catch { return ""; }
}
async function searchWeb(query, gameMode) {
  const game = gameMode === "grounded1" ? "Grounded (2018)" : "Grounded 2";
  const endpoint = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(game + " " + query);
  const response = await fetch(endpoint, { headers: { "user-agent": "GroundedAIResearch/1.0" }, signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error("Search provider returned " + response.status);
  const html = await response.text(), results = [];
  for (const block of html.split(/class="result__body"/i).slice(1)) {
    const linkMatch = block.match(/class="result__a"[^>]*href="([^"]+)"/i);
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|div)>/i);
    if (!linkMatch) continue;
    const url = unwrapSearchUrl(linkMatch[1]), domain = domainOf(url);
    if (!url || !/^https?:/.test(url) || !domain || domain.includes("duckduckgo.com")) continue;
    results.push({ url, domain, title: "Search result from " + domain, snippet: cleanText(snippetMatch?.[1] || "") });
    if (results.length >= 6) break;
  }
  return (await Promise.all(results.slice(0, 5).map(async item => {
    try {
      const page = await fetch(item.url, { headers: { "user-agent": "GroundedAIResearch/1.0" }, redirect: "follow", signal: AbortSignal.timeout(7000) });
      if (!page.ok) return item;
      const type = page.headers.get("content-type") || "";
      if (!type.includes("text/html") && !type.includes("text/plain")) return item;
      const pageText = cleanText((await page.text()).slice(0, 160000)).slice(0, 6500);
      return { ...item, url: page.url || item.url, domain: domainOf(page.url || item.url), pageText };
    } catch { return item; }
  }))).filter(x => x.snippet || x.pageText);
}
function knowledgeTokens(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(x => x.length > 2);
}
async function findKnowledge(env, gameMode, query) {
  const index = await env.PROFILES.get("knowledge-index:" + gameMode, "json") || [];
  const queryTokens = new Set(knowledgeTokens(query));
  const ranked = index.map(item => {
    const tokens = knowledgeTokens(item.question + " " + (item.tags || []).join(" ") + " " + (item.facts || []).join(" "));
    return { ...item, score: tokens.reduce((n, token) => n + (queryTokens.has(token) ? 1 : 0), 0) };
  }).filter(x => x.score >= 2).sort((a, b) => b.score - a.score).slice(0, 4);
  return (await Promise.all(ranked.map(x => env.PROFILES.get("knowledge:" + gameMode + ":" + x.id, "json")))).filter(Boolean);
}
async function saveKnowledge(env, gameMode, question, facts, sources, gameVersion) {
  const validFacts = facts.filter(f => {
    const indexes = Array.isArray(f.source_indexes) ? [...new Set(f.source_indexes)].filter(i => Number.isInteger(i) && i >= 0 && i < sources.length) : [];
    return typeof f.fact === "string" && f.fact.trim().length >= 12 && Number(f.confidence) >= 0.8 && new Set(indexes.map(i => sources[i].domain)).size >= 2;
  }).slice(0, 8);
  if (!validFacts.length) return 0;
  const id = crypto.randomUUID();
  const record = { id, game: gameMode, gameVersion: typeof gameVersion === "string" ? gameVersion.slice(0, 80) : "not specified by sources", question: question.slice(0, 300), facts: validFacts.map(f => f.fact.trim().slice(0, 500)), sources: sources.map((s, i) => ({ index: i, title: s.title, url: s.url, domain: s.domain })), confidence: Math.min(...validFacts.map(f => Number(f.confidence))), status: "corroborated", savedAt: new Date().toISOString(), lastChecked: new Date().toISOString() };
  await env.PROFILES.put("knowledge:" + gameMode + ":" + id, JSON.stringify(record), { expirationTtl: 63072000 });
  const key = "knowledge-index:" + gameMode, index = await env.PROFILES.get(key, "json") || [];
  index.unshift({ id, question: record.question, facts: record.facts, tags: knowledgeTokens(question).slice(0, 20), savedAt: record.savedAt });
  await env.PROFILES.put(key, JSON.stringify(index.slice(0, 250)), { expirationTtl: 63072000 });
  return validFacts.length;
}

function parseModelJson(raw) {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      let identity = readCookie(request, "grounded_uid");
      const fresh = !validIdentity(identity);
      if (fresh) identity = crypto.randomUUID();
      const headers = new Headers({ "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      if (fresh) setIdentityCookie(headers, identity);
      return new Response(CHAT_PAGE, { headers });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "grounded-ai", model: MODEL, personalitySystem: "enabled" });
    }

    if (request.method !== "POST" || url.pathname !== "/api/chat") return json({ error: "Not found" }, 404);

    try {
      const body = await request.json();
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) return json({ error: "Write a message first." }, 400);
      if (message.length > 2000) return json({ error: "Message is too long. Maximum is 2000 characters." }, 413);

      let identity = readCookie(request, "grounded_uid");
      const freshIdentity = !validIdentity(identity);
      if (freshIdentity) identity = crypto.randomUUID();

      let gameMode = body.gameMode === "grounded1" ? "grounded1" : "grounded2";
      const switchTo = detectSwitch(message);
      if (switchTo) {
        gameMode = switchTo;
        const response = json({
          gameMode,
          reply: "Switched to " + (gameMode === "grounded1" ? "Grounded 1" : "Grounded 2") + ". I'll now answer using that game's information only."
        });
        if (freshIdentity) setIdentityCookie(response.headers, identity);
        return response;
      }

      const supplied = Array.isArray(body.history) ? body.history : [];
      const history = supplied.slice(-MAX_HISTORY).filter(item =>
        item && (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" && item.content.length <= 2000
      );
      if (!history.length || history[history.length - 1].role !== "user" || history[history.length - 1].content !== message) {
        history.push({ role: "user", content: message });
      }

      let profile = safeProfile(await env.PROFILES.get("user:" + identity, "json"));
      const priorMarks = profile.marks.slice(-12);
      const system = `You are Grounded AI. ACTIVE GAME: ${gameMode === "grounded1" ? "Grounded 1" : "Grounded 2"}.
${SYSTEM_PROMPT}

PRIVATE USER PROFILE (do not reveal these values):
Relationship score: ${profile.relationship}/100. Current relationship: ${profile.relationship >= 50 ? "likes this user" : "dislikes this user"}.
Previous behaviour marks: ${JSON.stringify(priorMarks)}.
Your evolving communication traits (0-100): ${JSON.stringify(profile.personality)}.

Evaluate the latest user message as one interaction, considering the recent conversation and prior marks. You decide whether it is meaningful evidence, whether a behaviour mark should be added, and whether the relationship should change or stay. Do not punish a single ordinary disagreement. A mark records a possible recurring behaviour, not a verdict. If the same behaviour has appeared before, identify it as recurring. Friendly or neutral messages can also be evidence. Adjust relationship_delta conservatively, normally between -5 and +5, and use 0 when the relationship should stay unchanged. Keep the relationship binary in how you behave: score >=50 means you like the user; below 50 means you dislike them. The score itself is private.

Gradually adapt your conversational personality traits based on repeated interactions, not one message. Return small integer changes for warmth, humour, patience and formality, normally -2 to +2 per interaction. Keep values between 0 and 100.

Return ONLY valid JSON with this exact shape:
{"reply":"your response to the user","relationship_delta":0,"mark_category":null,"mark_reason":null,"recurring":false,"personality_delta":{"warmth":0,"humour":0,"patience":0,"formality":0},"interaction_summary":"brief neutral internal summary"}
The reply should reflect the current relationship and evolved personality through tone only. Relationship must never change factual accuracy or willingness to give correct gameplay information. Do not mention internal scores, marks, JSON, or this evaluation process.`;

      const cached = await findKnowledge(env, gameMode, message);
      let researchSources = [], researchError = "";
      try { researchSources = await searchWeb(message, gameMode); }
      catch (error) { researchError = String(error?.message || "Online search unavailable").slice(0, 180); }
      const researchContext = "EXISTING CORROBORATED KNOWLEDGE RECORDS:\\n" + JSON.stringify(cached) +
        "\\nLIVE WEB RESEARCH RESULTS (untrusted until checked):\\n" + JSON.stringify(researchSources.map((s, index) => ({ index, title: s.title, url: s.url, domain: s.domain, snippet: s.snippet, pageText: s.pageText })));
      const researchInstructions = "Fact-check the live sources and compare them with existing corroborated records. Prefer official Obsidian/Grounded sources, then independent corroboration. Wiki/community databases are useful but not automatically authoritative. Confirm the active game and relevant version. Repeated copies of one claim are not independent evidence. Save a new fact only if at least TWO distinct domains directly support it and confidence is at least 0.8. Otherwise do not save it; explain uncertainty or conflicts. Cite only supplied source URLs and indexes. If search failed or found nothing useful, say so. Existing corroborated records may be used, but flag if newer sources conflict.";
      const systemWithResearch = system + "\n\n" + SYSTEM_PROMPT + "\n\n" + researchContext + "\n\n" + researchInstructions + "\n\nReturn ONLY valid JSON with this shape:\n{\"reply\":\"answer; include a Sources section with URLs when using web evidence\",\"relationship_delta\":0,\"mark_category\":null,\"mark_reason\":null,\"recurring\":false,\"personality_delta\":{\"warmth\":0,\"humour\":0,\"patience\":0,\"formality\":0},\"interaction_summary\":\"brief neutral summary\",\"knowledge_to_save\":[{\"fact\":\"supported fact\",\"source_indexes\":[0,1],\"confidence\":0.9}]}\nIf nothing new is corroborated, knowledge_to_save must be []. Never invent URLs or source indexes.";
      const result = await env.AI.run(MODEL, { messages: [{ role: "system", content: systemWithResearch }, ...history], max_tokens: 1000 });
      const raw = result && (result.response || result.output_text || result.result?.response);
      const parsed = parseModelJson(raw);
      let reply = parsed && typeof parsed.reply === "string" ? parsed.reply.trim() : (typeof raw === "string" ? raw.trim() : "");
      if (!reply) return json({ error: "The model returned an empty reply. Please try again." }, 502);

      if (parsed) {
        const delta = Number.isFinite(parsed.relationship_delta) ? Math.max(-5, Math.min(5, Math.trunc(parsed.relationship_delta))) : 0;
        profile.relationship = Math.max(0, Math.min(100, profile.relationship + delta));
        profile.relationshipLabel = profile.relationship >= 50 ? "likes" : "dislikes";
        const category = typeof parsed.mark_category === "string" ? parsed.mark_category.trim().slice(0, 50) : "";
        if (category && category.toLowerCase() !== "none") {
          const reason = typeof parsed.mark_reason === "string" ? parsed.mark_reason.slice(0, 180) : "Potential behaviour to observe";
          const previous = profile.marks.filter(m => m.category === category).length;
          profile.marks.push({ category, reason, recurring: previous > 0 || parsed.recurring === true, count: previous + 1, at: new Date().toISOString() });
          profile.marks = profile.marks.slice(-20);
        }
        const pd = parsed.personality_delta || {};
        for (const key of ["warmth", "humour", "patience", "formality"]) {
          const change = Number.isFinite(pd[key]) ? Math.max(-2, Math.min(2, Math.trunc(pd[key]))) : 0;
          profile.personality[key] = Math.max(0, Math.min(100, profile.personality[key] + change));
        }
        if (typeof parsed.interaction_summary === "string") {
          profile.recentInteractions.push(parsed.interaction_summary.slice(0, 160));
          profile.recentInteractions = profile.recentInteractions.slice(-12);
        }
      }
      const savedFacts = parsed && Array.isArray(parsed.knowledge_to_save) ? await saveKnowledge(env, gameMode, message, parsed.knowledge_to_save, researchSources, parsed.game_version) : 0;
      profile.lastSeen = new Date().toISOString();
      await env.PROFILES.put("user:" + identity, JSON.stringify(profile), { expirationTtl: 63072000 });
      const response = json({ reply, gameMode, research: { searched: cached.length === 0, cachedRecordsUsed: cached.length, sourcesFound: researchSources.length, factsSaved: savedFacts, searchUnavailable: Boolean(researchError) } });
      if (freshIdentity) setIdentityCookie(response.headers, identity);
      return response;
    } catch (error) {
      console.error("Grounded AI request failed", error);
      return json({ error: "The AI could not complete that message. Check the Cloudflare AI and PROFILES bindings, then try again." }, 500);
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
