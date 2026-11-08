const MODEL = "@cf/meta/llama-3.2-3b-instruct";
const MAX_BODY = 20_000;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4_000;

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "Content-Type",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": origin,
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

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: "Você é o assistente do AI Center. Responda em português por padrão, com clareza, educação e responsabilidade. Não invente fatos. Se não souber, diga. Não solicite dados pessoais sensíveis. Para assuntos de saúde, segurança ou decisões importantes, ofereça informações gerais e incentive a procura de um adulto de confiança ou profissional qualificado quando apropriado." },
          ...messages,
        ],
        max_tokens: 700,
        temperature: 0.6,
      });
      return json({ response: result.response || "Não foi possível gerar uma resposta." }, 200, origin);
    } catch (error) {
      console.error("Workers AI error:", error);
      return json({ error: "O serviço de IA está temporariamente indisponível." }, 503, origin);
    }
  },
};