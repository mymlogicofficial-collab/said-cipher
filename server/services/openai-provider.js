// OpenRouter provider for S.A.I.D. Cipher
// Uses OpenAI-compatible API via OpenRouter
const OpenAI = require("openai");

// Never cache client — always re-read key from env so .env loads correctly
function getClient() {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://mymlogic.com",
      "X-Title": "S.A.I.D. Cipher",
    },
  });
}

const DEFAULT_MODEL = "google/gemma-3-12b-it:free";

async function chat(messages, options = {}) {
  const c = getClient();
  if (!c) throw new Error("No API key found. Set OPENROUTER_API_KEY in your .env file.");
  const response = await c.chat.completions.create({
    model: options.model || DEFAULT_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
  });
  return response.choices[0].message.content;
}

async function streamChat(messages, onChunk, options = {}) {
  const c = getClient();
  if (!c) throw new Error("No API key found. Set OPENROUTER_API_KEY in your .env file.");
  const stream = await c.chat.completions.create({
    model: options.model || DEFAULT_MODEL,
    messages,
    stream: true,
    temperature: options.temperature ?? 0.7,
  });
  let full = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) { full += text; onChunk(text); }
  }
  return full;
}

module.exports = { provider: { chat, streamChat } };

