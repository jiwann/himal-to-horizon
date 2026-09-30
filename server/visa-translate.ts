import { LANG_NAMES, isSupportedLang } from "./translate";

// Generic string-array translator for visa profile content, independent of
// the community-post translator in translate.ts (different data shape, and
// keeping them separate means a change to one can't break the other).
//
// Same provider precedence as community posts: Google Cloud Translation (if
// GOOGLE_TRANSLATE_API_KEY is set) > Gemini (if the Replit AI integration
// vars are set) > MyMemory (free, keyless, always available).

const BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL;
const MYMEMORY_LANG: Record<string, string> = { zh: "zh-CN" };

export { isSupportedLang };

/**
 * Translate an ordered list of plain-text strings into targetLang, preserving
 * order and array length. Empty strings pass through unchanged. Throws if no
 * provider can complete the batch — callers should catch and fall back to the
 * original (English) text rather than show a broken page.
 */
export async function translateTexts(
  texts: string[],
  targetLang: string,
  sourceLang: string = "en"
): Promise<string[]> {
  if (texts.length === 0) return [];
  if (targetLang === sourceLang) return texts;

  if (GOOGLE_TRANSLATE_API_KEY) {
    return translateViaGoogle(texts, targetLang, sourceLang);
  }
  if (BASE_URL && API_KEY) {
    return translateViaGemini(texts, targetLang);
  }
  return translateViaMyMemory(texts, targetLang, sourceLang);
}

async function translateViaGoogle(texts: string[], targetLang: string, sourceLang: string): Promise<string[]> {
  // Google's batch endpoint accepts an array of q values in one request and
  // large payloads, so no manual chunking is needed here.
  const nonEmpty = texts.map((t, i) => ({ i, t })).filter((x) => x.t.trim().length > 0);
  if (nonEmpty.length === 0) return texts;

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: nonEmpty.map((x) => x.t), target: targetLang, source: sourceLang, format: "text" }),
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Translation request failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const translations: any[] = data?.data?.translations ?? [];
  const out = [...texts];
  nonEmpty.forEach((x, idx) => {
    const translated = translations[idx]?.translatedText;
    if (typeof translated === "string") out[x.i] = translated;
  });
  return out;
}

async function translateViaGemini(texts: string[], targetLang: string): Promise<string[]> {
  const langName = LANG_NAMES[targetLang] ?? targetLang;

  const system =
    "You are a professional travel and immigration content translator. Translate every string in " +
    `the given JSON array into ${langName}. Keep the array the same length and in the same order. ` +
    "Preserve URLs, numbers, and proper nouns (country/city/organization names) exactly, transliterated " +
    "naturally if needed. Do not add commentary, explanations, or extra fields. Respond with ONLY a JSON " +
    'object of the shape {"items": ["...", "...", ...]}.';

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      temperature: 0.2,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ items: texts }) },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Translation request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data: any = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty translation response");

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Translation response was not valid JSON");
  }

  const items = parsed?.items;
  if (!Array.isArray(items) || items.length !== texts.length) {
    throw new Error("Translation response shape mismatch");
  }
  return items.map((v: any, i: number) => (typeof v === "string" && v.trim() ? v : texts[i]));
}

// --- MyMemory (free, keyless) provider ---------------------------------------

const MYMEMORY_MAX_BYTES = 480;
const MYMEMORY_TIMEOUT_MS = 8000;
const QUOTA_RE = /MYMEMORY WARNING|QUOTA|QUERY LENGTH LIMIT|USED ALL|LIMIT EXCEEDED/i;

const byteLen = (s: string) => Buffer.byteLength(s, "utf8");

function chunkText(text: string, maxBytes = MYMEMORY_MAX_BYTES): string[] {
  if (byteLen(text) <= maxBytes) return [text];
  const chunks: string[] = [];
  let cur = "";
  const flush = () => { if (cur) { chunks.push(cur); cur = ""; } };
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if (byteLen(token) > maxBytes) {
      flush();
      let piece = "";
      for (const ch of token) {
        if (piece && byteLen(piece + ch) > maxBytes) { chunks.push(piece); piece = ""; }
        piece += ch;
      }
      cur = piece;
      continue;
    }
    if (cur && byteLen(cur + token) > maxBytes) flush();
    cur += token;
  }
  flush();
  return chunks;
}

async function translateChunkViaMyMemory(text: string, source: string, target: string): Promise<string> {
  const params = new URLSearchParams({ q: text, langpair: `${source}|${target}` });
  if (MYMEMORY_EMAIL) params.set("de", MYMEMORY_EMAIL);
  let res: Response;
  try {
    res = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
      signal: AbortSignal.timeout(MYMEMORY_TIMEOUT_MS),
    });
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      throw new Error("Translation service timed out. Please try again.");
    }
    throw new Error(`Translation service unreachable: ${err?.message ?? "unknown error"}`);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Translation request failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const status = data?.responseStatus;
  const translated = data?.responseData?.translatedText;
  const details = typeof data?.responseDetails === "string" ? data.responseDetails : "";

  if (
    data?.quotaFinished === true ||
    String(status) === "403" || String(status) === "429" ||
    QUOTA_RE.test(details) ||
    (typeof translated === "string" && QUOTA_RE.test(translated))
  ) {
    throw new Error("Translation temporarily unavailable (free daily limit reached). Please try again later.");
  }
  if (String(status) !== "200" || typeof translated !== "string" || !translated) {
    throw new Error(`Translation failed: ${details || status || "unexpected response"}`.slice(0, 200));
  }
  return translated;
}

async function translateFieldViaMyMemory(text: string, source: string, target: string): Promise<string> {
  if (!text.trim()) return text;
  const chunks = chunkText(text);
  const out: string[] = [];
  for (const chunk of chunks) {
    out.push(await translateChunkViaMyMemory(chunk, source, target));
  }
  return out.join("");
}

async function translateViaMyMemory(texts: string[], targetLang: string, sourceLang: string): Promise<string[]> {
  const source = MYMEMORY_LANG[sourceLang] ?? sourceLang;
  const target = MYMEMORY_LANG[targetLang] ?? targetLang;
  const out: string[] = [];
  // Sequential, not parallel: MyMemory's free tier rate-limits aggressively
  // and a burst of concurrent requests from one IP trips it faster than the
  // same requests spread out.
  for (const text of texts) {
    out.push(await translateFieldViaMyMemory(text, source, target));
  }
  return out;
}
