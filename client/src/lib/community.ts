import { Utensils, BedDouble, Compass, UserCheck, Lightbulb, CheckCircle2, XCircle, HelpCircle, Clock3 } from "lucide-react";
import type { RecommendationCategory, VisaOutcome } from "@shared/schema";

export const CATEGORY_META: Record<
  RecommendationCategory,
  { label: string; icon: typeof Utensils; color: string }
> = {
  food: { label: "Food & Drink", icon: Utensils, color: "hsl(22 79% 70%)" },
  stay: { label: "Stay", icon: BedDouble, color: "hsl(200 80% 65%)" },
  activity: { label: "Activity", icon: Compass, color: "hsl(145 60% 58%)" },
  guide: { label: "Guide", icon: UserCheck, color: "hsl(42 90% 65%)" },
  tip: { label: "Tip", icon: Lightbulb, color: "hsl(280 60% 70%)" },
};

export const CATEGORY_ORDER: RecommendationCategory[] = ["food", "stay", "activity", "guide", "tip"];

// Colors/icons for self-reported visa outcomes (approved/denied/RFE/pending)
// on "visa_experience" posts. Labels come from communityUI() (i18n), this
// only carries the icon + color per outcome.
export const VISA_OUTCOME_META: Record<VisaOutcome, { icon: typeof CheckCircle2; color: string }> = {
  approved: { icon: CheckCircle2, color: "hsl(145 65% 55%)" },
  denied: { icon: XCircle, color: "hsl(0 75% 65%)" },
  rfe: { icon: HelpCircle, color: "hsl(42 90% 65%)" },
  pending: { icon: Clock3, color: "hsl(205 80% 65%)" },
};

export const VISA_OUTCOME_ORDER: VisaOutcome[] = ["approved", "denied", "rfe", "pending"];

// Languages the on-demand translator can target (mirrors server/translate.ts LANG_NAMES).
export const TRANSLATE_LANGS = new Set([
  "en", "es", "fr", "de", "it", "pt", "nl", "ru", "ja", "zh",
  "ko", "ar", "hi", "ne", "th", "vi", "id", "tr", "pl",
]);

export function isTranslatableLang(code: string): boolean {
  return TRANSLATE_LANGS.has(code);
}

export function countryFlag(countryCode: string): string {
  const cc = (countryCode || "").trim().toUpperCase();
  if (cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65), A + (cc.charCodeAt(1) - 65));
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [60, "s"], [60, "m"], [24, "h"], [7, "d"], [4.345, "w"], [12, "mo"], [Number.POSITIVE_INFINITY, "y"],
  ];
  let val = secs;
  let unit = "s";
  for (let i = 0; i < units.length; i++) {
    const [div, label] = units[i];
    if (val < div) { unit = label; break; }
    val = Math.floor(val / div);
    unit = label;
  }
  return `${val}${unit} ago`;
}
