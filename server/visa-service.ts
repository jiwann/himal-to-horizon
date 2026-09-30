import fs from "fs";
import path from "path";
import { visaProfileSchema, visaProfileKey, type VisaProfile, type VisaCategory } from "@shared/visa-schema";
import { WORLD_COUNTRIES, DEFAULT_FROM_COUNTRY } from "@shared/countries";
import { translateTexts, isSupportedLang } from "./visa-translate";
import { logger } from "./logger";

const DATA_PATH = path.join(process.cwd(), "server", "data", "visa-profiles.json");

let cache: Map<string, VisaProfile> | null = null;

function load(): Map<string, VisaProfile> {
  if (cache) return cache;

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const map = new Map<string, VisaProfile>();

  for (const entry of raw) {
    const parsed = visaProfileSchema.safeParse(entry);
    if (!parsed.success) {
      // Fail loudly in dev so a malformed entry gets caught before it ships,
      // but don't crash the whole server over one bad record in production.
      const msg = `[visa-service] Invalid visa profile for ${entry?.fromCountryCode ?? "?"}->${entry?.countryCode}:${entry?.category} — ${parsed.error.message}`;
      if (process.env.NODE_ENV === "production") {
        console.error(msg);
        continue;
      }
      throw new Error(msg);
    }
    map.set(visaProfileKey(parsed.data.fromCountryCode, parsed.data.countryCode, parsed.data.category), parsed.data);
  }

  cache = map;
  return map;
}

// Call after editing the JSON file at runtime (e.g. from a future admin tool)
// so subsequent requests pick up the change without a server restart.
export function invalidateVisaCache() {
  cache = null;
  translationCache.clear();
}

// ── Origin ("from") countries ────────────────────────────────────────────
// The full world list is static reference data (so a country can be shown as
// "coming soon" before any data exists for it); which ones are actually
// usable right now is derived from what's in visa-profiles.json.

export function listFromCountries(): { code: string; name: string; active: boolean }[] {
  const activeCodes = new Set(Array.from(load().values()).map((p) => p.fromCountryCode));
  return WORLD_COUNTRIES.map((c) => ({ ...c, active: activeCodes.has(c.code) })).sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1; // active countries first
    return a.name.localeCompare(b.name);
  });
}

export function listVisaCountries(
  fromCountryCode: string = DEFAULT_FROM_COUNTRY
): { countryCode: string; countryName: string; categories: VisaCategory[] }[] {
  const from = fromCountryCode.toUpperCase();
  const byCountry = new Map<string, { countryName: string; categories: VisaCategory[] }>();
  for (const profile of Array.from(load().values())) {
    if (profile.fromCountryCode !== from) continue;
    const existing = byCountry.get(profile.countryCode);
    if (existing) {
      existing.categories.push(profile.category);
    } else {
      byCountry.set(profile.countryCode, { countryName: profile.countryName, categories: [profile.category] });
    }
  }
  return Array.from(byCountry.entries())
    .map(([countryCode, v]) => ({ countryCode, ...v }))
    .sort((a, b) => a.countryName.localeCompare(b.countryName));
}

export function getVisaProfilesForCountry(
  countryCode: string,
  fromCountryCode: string = DEFAULT_FROM_COUNTRY
): VisaProfile[] {
  const code = countryCode.toUpperCase();
  const from = fromCountryCode.toUpperCase();
  return Array.from(load().values()).filter((p) => p.countryCode === code && p.fromCountryCode === from);
}

export function getVisaProfile(
  fromCountryCode: string,
  countryCode: string,
  category: VisaCategory
): VisaProfile | undefined {
  return load().get(visaProfileKey(fromCountryCode, countryCode, category));
}

// ── Translation ──────────────────────────────────────────────────────────
// Visa profiles are static editorial content (not user data), so a simple
// in-memory cache per profile+language is enough — no DB table needed. It's
// rebuilt on server restart and holds at most (profiles × languages actually
// requested), which stays small.

const translationCache = new Map<string, VisaProfile>();

/**
 * Returns the profile translated into `lang`. Falls back to the original
 * English profile (with a translationFailed flag) if the language is
 * unsupported or every translation provider fails, so the page always has
 * something correct to show rather than breaking.
 */
export async function getVisaProfileLocalized(
  fromCountryCode: string,
  countryCode: string,
  category: VisaCategory,
  lang: string
): Promise<{ profile: VisaProfile; translated: boolean; translationFailed: boolean } | undefined> {
  const profile = getVisaProfile(fromCountryCode, countryCode, category);
  if (!profile) return undefined;

  if (lang === "en" || !isSupportedLang(lang)) {
    return { profile, translated: false, translationFailed: false };
  }

  const cacheKey = `${visaProfileKey(fromCountryCode, countryCode, category)}:${lang}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return { profile: cached, translated: true, translationFailed: false };

  try {
    const translated = await translateProfile(profile, lang);
    translationCache.set(cacheKey, translated);
    return { profile: translated, translated: true, translationFailed: false };
  } catch (err: any) {
    logger.warn({ err: err?.message, fromCountryCode, countryCode, category, lang }, "[visa-service] translation failed, serving English");
    return { profile, translated: false, translationFailed: true };
  }
}

async function translateProfile(profile: VisaProfile, lang: string): Promise<VisaProfile> {
  // Flatten every translatable string into one ordered list so we make a
  // single batch translation call (cheap, and avoids the free MyMemory tier's
  // rate limit, which a flurry of per-field calls trips quickly), then write
  // the results back into a deep copy at the same positions.
  const out: VisaProfile = JSON.parse(JSON.stringify(profile));
  const pieces: string[] = [];
  const setters: ((v: string) => void)[] = [];

  const add = (value: string, setter: (v: string) => void) => {
    pieces.push(value);
    setters.push(setter);
  };

  add(out.countryName, (v) => (out.countryName = v));
  add(out.summary, (v) => (out.summary = v));
  add(out.overview, (v) => (out.overview = v));
  add(out.processingTime, (v) => (out.processingTime = v));
  add(out.fee, (v) => (out.fee = v));
  if (out.maxStay) add(out.maxStay, (v) => (out.maxStay = v));
  if (out.notes) add(out.notes, (v) => (out.notes = v));

  out.steps.forEach((step, i) => {
    add(step.title, (v) => (out.steps[i].title = v));
    add(step.description, (v) => (out.steps[i].description = v));
  });

  out.requiredDocuments.forEach((doc, i) => {
    add(doc, (v) => (out.requiredDocuments[i] = v));
  });

  out.officialLinks.forEach((link, i) => {
    add(link.label, (v) => (out.officialLinks[i].label = v));
  });

  if (out.nearestEmbassy) {
    add(out.nearestEmbassy.city, (v) => (out.nearestEmbassy!.city = v));
    add(out.nearestEmbassy.country, (v) => (out.nearestEmbassy!.country = v));
    if (out.nearestEmbassy.note) add(out.nearestEmbassy.note, (v) => (out.nearestEmbassy!.note = v));
  }

  out.faqs.forEach((faq, i) => {
    add(faq.q, (v) => (out.faqs[i].q = v));
    add(faq.a, (v) => (out.faqs[i].a = v));
  });

  const translated = await translateTexts(pieces, lang, "en");
  translated.forEach((value, i) => setters[i](value));

  return out;
}

// ── Visa difficulty ranking ──────────────────────────────────────────────
// An "easy to hard" ranking for the Visa Intelligence hub. This is a
// requirements-complexity index computed from the data we already publish
// (application channel, document count, whether a police clearance
// certificate or interview is actually listed as required, translation
// burden, and processing time) — NOT a visa-approval/success-rate statistic.
// Immigration authorities don't publish acceptance rates by nationality for
// tourist visas, so anything claiming to be that would be fabricated. This
// score is an honest, transparent stand-in: "how much process do you have
// to go through", derived only from the same verified fields already shown
// on each country's own guide page.

export type DifficultyTier = "easy" | "moderate" | "hard" | "very_hard";

export interface VisaDifficultyEntry {
  countryCode: string;
  countryName: string;
  status: VisaProfile["status"];
  score: number;
  tier: DifficultyTier;
  documentCount: number;
  requiresPoliceClearance: boolean;
  requiresInterview: boolean;
  requiresTranslation: boolean;
  processingTime: string;
  fee: string;
  verified: boolean;
}

const DIFFICULTY_STATUS_BASE: Record<string, number> = {
  visa_free: 0,
  visa_on_arrival: 1,
  evisa: 2,
  sponsor_program: 3,
  employer_petition: 3,
  embassy_visa: 4,
};

// Estimate a 0-3 processing-time penalty from a free-text processingTime
// field. When the text has a parseable number, we convert it to a
// weeks-equivalent estimate and score it normally. When it doesn't — e.g.
// "Not published specifically for Nepal — confirm directly with the
// Embassy" — we used to fall back to a default of 0, which rewarded
// genuinely unresearched/unpublished timelines with the BEST possible
// score. That's backwards: not knowing how long something takes is a
// real burden, not a point in the country's favor. So instead we check
// for fast-qualitative language first (same-day, a few days, etc.),
// then fall through to month/week keywords, and otherwise apply a
// moderate penalty for the uncertainty itself rather than a free pass.
function estimateProcessingScore(processingTimeRaw: string): number {
  const pt = (processingTimeRaw || "").toLowerCase();
  const nums = (pt.match(/\d+/g) || []).map(Number);

  if (nums.length) {
    const max = Math.max(...nums);
    let weeksEst: number;
    if (/month/.test(pt)) weeksEst = max * 4;
    else if (/week/.test(pt)) weeksEst = max;
    else weeksEst = max / 7;
    if (weeksEst <= 1) return 0;
    if (weeksEst <= 3) return 1;
    if (weeksEst <= 6) return 2;
    return 3;
  }

  if (/instant|immediate|same[- ]day|no visa to process|within minutes|a few (business )?days|few hours/.test(pt)) {
    return 0;
  }
  if (/month/.test(pt)) return 3;
  if (/week/.test(pt)) return 2;
  // Genuinely unresearched or openly unpredictable -- can't plan around
  // it, which is itself a real burden. Don't default to the best case.
  return 2;
}

function scoreDifficulty(p: VisaProfile): {
  score: number;
  requiresPoliceClearance: boolean;
  requiresInterview: boolean;
  requiresTranslation: boolean;
} {
  const base = DIFFICULTY_STATUS_BASE[p.status] ?? 3;
  const docs = p.requiredDocuments ?? [];
  const docsText = docs.join(" ").toLowerCase();
  const stepsText = (p.steps ?? []).map((s) => s.description).join(" ").toLowerCase();
  const notesText = (p.notes ?? "").toLowerCase();

  // Only count something as an actual requirement if it shows up in what
  // you must submit/do (requiredDocuments, steps) — NOT in notes, which
  // mostly exist to reassure people something is *not* required.
  const requiresPoliceClearance = /police clearance|criminal (record|background)|\bpcc\b/.test(docsText);
  const requiresInterview = /interview/.test(stepsText) || /interview/.test(docsText);
  const requiresTranslation = /translat/.test(docsText);
  const uncertain = /not published|confirm directly|not confirmed|wasn.t confirmed/.test(notesText);

  const procScore = estimateProcessingScore(p.processingTime);

  const score =
    base +
    docs.length * 0.3 +
    (requiresPoliceClearance ? 2 : 0) +
    (requiresInterview ? 2 : 0) +
    (requiresTranslation ? 1 : 0) +
    (uncertain ? 1 : 0) +
    procScore;

  return {
    score: Math.round(score * 100) / 100,
    requiresPoliceClearance,
    requiresInterview,
    requiresTranslation,
  };
}

function tierForScore(score: number): DifficultyTier {
  if (score < 4.5) return "easy";
  if (score < 7.5) return "moderate";
  if (score < 10.5) return "hard";
  return "very_hard";
}

export function getVisaDifficultyRanking(
  fromCountryCode: string = DEFAULT_FROM_COUNTRY,
  category: VisaCategory = "tourist"
): VisaDifficultyEntry[] {
  const from = fromCountryCode.toUpperCase();
  const rows: VisaDifficultyEntry[] = [];
  for (const p of Array.from(load().values())) {
    if (p.fromCountryCode !== from || p.category !== category) continue;
    const { score, requiresPoliceClearance, requiresInterview, requiresTranslation } = scoreDifficulty(p);
    rows.push({
      countryCode: p.countryCode,
      countryName: p.countryName,
      status: p.status,
      score,
      tier: tierForScore(score),
      documentCount: (p.requiredDocuments ?? []).length,
      requiresPoliceClearance,
      requiresInterview,
      requiresTranslation,
      processingTime: p.processingTime,
      fee: p.fee,
      verified: p.verified,
    });
  }
  rows.sort((a, b) => a.score - b.score);
  return rows;
}
