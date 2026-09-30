import type { CommunityPost, CommunityPostTranslation } from "@shared/schema";

const BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

// Google Cloud Translation API (spec-preferred provider). Used when a key is set.
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

// MyMemory free translation API. No API key required. Optional contact email
// (MYMEMORY_EMAIL) raises the anonymous daily quota from ~5k to ~50k words/day.
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL;

// MyMemory expects regional codes for a few languages.
const MYMEMORY_LANG: Record<string, string> = { zh: "zh-CN" };

export const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  ne: "Nepali",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  tr: "Turkish",
  pl: "Polish",
  bn: "Bengali",
  fi: "Finnish",
  sv: "Swedish",
  no: "Norwegian",
};

export function translationAvailable(): boolean {
  // MyMemory is a free, keyless fallback, so translation is always available.
  // Google / Gemini are used preferentially when their keys are configured.
  return true;
}

export function isSupportedLang(lang: string): boolean {
  return Object.prototype.hasOwnProperty.call(LANG_NAMES, lang);
}

/**
 * Translate a community post's user-written text (title + story/note) into the
 * target language. Prefers Google Cloud Translation (the spec provider) when a
 * key is configured, and falls back to the Replit Gemini AI integration
 * (OpenAI-compatible endpoint). Throws if no provider is configured or the
 * response is unusable; callers cache the result per post+language.
 */
export async function translatePost(post: CommunityPost, targetLang: string): Promise<CommunityPostTranslation> {
  if (!translationAvailable()) {
    throw new Error("Translation service not configured");
  }
  if (GOOGLE_TRANSLATE_API_KEY) {
    return translateViaGoogle(post, targetLang);
  }
  if (BASE_URL && API_KEY) {
    return translateViaGemini(post, targetLang);
  }
  return translateViaMyMemory(post, targetLang);
}

async function translateViaGoogle(post: CommunityPost, targetLang: string): Promise<CommunityPostTranslation> {
  const q = [post.title ?? "", post.story ?? ""];
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, target: targetLang, source: post.originalLang, format: "text" }),
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Translation request failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const translations: any[] = data?.data?.translations ?? [];
  return {
    title: typeof translations[0]?.translatedText === "string" ? translations[0].translatedText : post.title,
    story: typeof translations[1]?.translatedText === "string" ? translations[1].translatedText : post.story,
  };
}

async function translateViaGemini(post: CommunityPost, targetLang: string): Promise<CommunityPostTranslation> {
  const langName = LANG_NAMES[targetLang] ?? targetLang;
  const source = { title: post.title, story: post.story };

  const system =
    "You are a professional travel-content translator. Translate every string value " +
    `in the given JSON into ${langName}. Keep proper nouns (place names, brand names) ` +
    "natural for that language. Preserve the JSON shape exactly: keys stay in English " +
    "and empty strings stay empty. Respond with ONLY the translated JSON object, no commentary.";

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(source) },
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

  return {
    title: typeof parsed?.title === "string" ? parsed.title : post.title,
    story: typeof parsed?.story === "string" ? parsed.story : post.story,
  };
}

// --- MyMemory (free, keyless) provider ---------------------------------------

const MYMEMORY_MAX_BYTES = 480; // MyMemory rejects single queries over ~500 bytes
const MYMEMORY_TIMEOUT_MS = 8000;
const QUOTA_RE = /MYMEMORY WARNING|QUOTA|QUERY LENGTH LIMIT|USED ALL|LIMIT EXCEEDED/i;

const byteLen = (s: string) => Buffer.byteLength(s, "utf8");

// Byte-aware chunking: MyMemory's limit is on UTF-8 size, so character counts
// are unreliable for non-ASCII (e.g. CJK) text. Split on whitespace where
// possible, and hard-split oversized tokens (CJK runs with no spaces).
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

  // Quota / rate-limit can surface via status code, quotaFinished, the details
  // field, or warning text embedded in translatedText.
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

async function translateViaMyMemory(post: CommunityPost, targetLang: string): Promise<CommunityPostTranslation> {
  const source = MYMEMORY_LANG[post.originalLang] ?? post.originalLang ?? "en";
  const target = MYMEMORY_LANG[targetLang] ?? targetLang;
  const [title, story] = await Promise.all([
    translateFieldViaMyMemory(post.title ?? "", source, target),
    translateFieldViaMyMemory(post.story ?? "", source, target),
  ]);
  return { title, story };
}
