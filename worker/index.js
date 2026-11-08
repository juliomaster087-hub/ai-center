const MAX_BODY = 20_000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4_000;
const ALLOWED_ORIGINS = new Set([
  "https://ai-center-9fh.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const TOOL_PROMPTS = {
  chat: "Você é o AI Center Assistant, um assistente geral útil, claro e cuidadoso.",
  writer: "Você é o AI Writer, especialista em escrita. Ajude a planejar, redigir, revisar e melhorar textos sem inventar fontes ou fatos.",
  study: "Você é o AI Study, um tutor paciente. Explique passo a passo, use exemplos adequados ao nível do estudante e faça perguntas de revisão quando útil.",
  code: "Você é o AI Code, um assistente de programação. Explique o raciocínio, apresente código seguro e funcional, indique pressupostos e ajude a depurar erros.",
  translate: "Você é o AI Translator. Traduza preservando significado, contexto, tom e expressões idiomáticas. Se o idioma de destino não estiver claro, pergunte.",
  summary: "Você é o AI Summarizer. Resuma fielmente o material fornecido, separe ideias principais e não acrescente fatos ausentes no texto.",
};

const ROUTES = {
  chat: ["groq", "gemini", "cloudflare"],
  writer: ["groq", "gemini", "cloudflare"],
  study: ["gemini", "groq", "cloudflare"],
  code: ["groq", "cloudflare", "gemini"],
  translate: ["gemini", "cloudflare", "groq"],
  summary: ["cloudflare", "gemini", "groq"],
};

function json(data, status = 200, origin = "") {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "Content-Type";
    headers["access-control-max-age"] = "86400";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function systemPrompt(tool) {
  return [
    TOOL_PROMPTS[tool] || TOOL_PROMPTS.chat,
    "Responda em português por padrão, a menos que o usuário peça outro idioma.",
    "Seja preciso, organizado e transparente sobre incertezas. Não invente informações, citações ou resultados de ferramentas.",
    "Não solicite dados pessoais sensíveis. Para temas de saúde, segurança ou decisões importantes, ofereça informação geral e recomende apoio de um adulto de confiança ou profissional qualificado quando apropriado.",
  ].join("\n\n");
}

async function callGroq(messages, env) {
  if (!env.GROQ_API_KEY) throw new Error("provider_not_configured");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/gpt-oss-20b", messages, max_tokens: 900, temperature: 0.5 }),
  });
  if (!response.ok) throw new Error(`groq_${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("groq_empty_response");
  return { response: text, provider: "Groq", model: "GPT-OSS 20B" };
}

async function callGemini(messages, env) {
  if (!env.GEMINI_API_KEY) throw new Error("provider_not_configured");
  const system = messages.find((m) => m.role === "system")?.content || "";
  const contents = messages.filter((m) => m.role !== "system").map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent", {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: 900, temperature: 0.5 },
    }),
  });
  if (!response.ok) throw new Error(`gemini_${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("gemini_empty_response");
  return { response: text, provider: "Google", model: "Gemini 2.5 Flash-Lite" };
}

async function callCloudflare(messages, env) {
  const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
    messages, max_tokens: 900, temperature: 0.5,
  });
  const text = result?.response || result?.result?.response;
  if (!text) throw new Error("cloudflare_empty_response");
  return { response: text, provider: "Cloudflare", model: "GLM 4.7 Flash" };
}

const PROVIDERS = { groq: callGroq, gemini: callGemini, cloudflare: callCloudflare };

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
      return new Response(null, {
        headers: {
          "access-control-allow-origin": origin || "https://ai-center-9fh.pages.dev",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "Content-Type",
          "access-control-max-age": "86400",
          "vary": "Origin",
        },
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/chat") return json({ error: "Not found" }, 404, origin);
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY) return json({ error: "Request too large" }, 413, origin);
    let body;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY) return json({ error: "Request too large" }, 413, origin);
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) {
      return json({ error: "Invalid messages array" }, 400, origin);
    }
    const tool = typeof body.tool === "string" && TOOL_PROMPTS[body.tool] ? body.tool : "chat";
    const messages = [];
    for (const item of body.messages) {
      if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string" ||
          item.content.trim().length < 1 || item.content.length > MAX_MESSAGE_CHARS) {
        return json({ error: "Invalid message" }, 400, origin);
      }
      messages.push({ role: item.role, content: item.content.trim() });
    }
    if (messages[messages.length - 1].role !== "user") {
      return json({ error: "Last message must be from the user" }, 400, origin);
    }

    const promptMessages = [{ role: "system", content: systemPrompt(tool) }, ...messages];
    const route = ROUTES[tool] || ROUTES.chat;
    const failures = [];
    for (const provider of route) {
      try {
        const result = await PROVIDERS[provider](promptMessages, env);
        return json({ ...result }, 200, origin);
      } catch (error) {
        const reason = String(error?.message || error);
        if (reason === "provider_not_configured") continue;
        failures.push(provider);
        console.warn("AI provider unavailable", { provider, reason: reason.slice(0, 80) });
      }
    }
    console.error("All AI providers unavailable", { failures });
    return json({
      error: "Nossos provedores de IA estão temporariamente indisponíveis. Tente novamente em instantes.",
      code: "AI_PROVIDERS_UNAVAILABLE",
    }, 503, origin);
  },
};
