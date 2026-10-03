import visaData from "@/lib/visa-data.json";
import passportIndex from "@/lib/passport-index.json";
import destRequirements from "@/lib/destination-requirements.json";
import nepalVisaFacts from "@/lib/nepal-visa-facts.json";
import nepalGuideStatuses from "@/lib/nepal-guide-statuses.json";

// Country codes that show up in the worldwide passport-index dataset but
// aren't in our main visa-data.json country list (mostly small island states
// and territories). Mirrors the supplemental list already used on the
// generic /visa/:passport/:destination checker page.
const EXTRA_NAMES: Record<string, { name: string; flag: string }> = {
  AG: { name: "Antigua and Barbuda", flag: "🇦🇬" },
  BB: { name: "Barbados", flag: "🇧🇧" },
  BZ: { name: "Belize", flag: "🇧🇿" },
  BJ: { name: "Benin", flag: "🇧🇯" },
  BF: { name: "Burkina Faso", flag: "🇧🇫" },
  BI: { name: "Burundi", flag: "🇧🇮" },
  CV: { name: "Cape Verde", flag: "🇨🇻" },
  CF: { name: "Central African Republic", flag: "🇨🇫" },
  TD: { name: "Chad", flag: "🇹🇩" },
  KM: { name: "Comoros", flag: "🇰🇲" },
  CG: { name: "Congo", flag: "🇨🇬" },
  DM: { name: "Dominica", flag: "🇩🇲" },
  CD: { name: "DR Congo", flag: "🇨🇩" },
  SV: { name: "El Salvador", flag: "🇸🇻" },
  GQ: { name: "Equatorial Guinea", flag: "🇬🇶" },
  ER: { name: "Eritrea", flag: "🇪🇷" },
  EE: { name: "Estonia", flag: "🇪🇪" },
  GA: { name: "Gabon", flag: "🇬🇦" },
  GM: { name: "Gambia", flag: "🇬🇲" },
  GD: { name: "Grenada", flag: "🇬🇩" },
  GN: { name: "Guinea", flag: "🇬🇳" },
  GW: { name: "Guinea-Bissau", flag: "🇬🇼" },
  GY: { name: "Guyana", flag: "🇬🇾" },
  HT: { name: "Haiti", flag: "🇭🇹" },
  HN: { name: "Honduras", flag: "🇭🇳" },
  HK: { name: "Hong Kong", flag: "🇭🇰" },
  IS: { name: "Iceland", flag: "🇮🇸" },
  CI: { name: "Ivory Coast", flag: "🇨🇮" },
  KI: { name: "Kiribati", flag: "🇰🇮" },
  XK: { name: "Kosovo", flag: "🇽🇰" },
  LV: { name: "Latvia", flag: "🇱🇻" },
  LS: { name: "Lesotho", flag: "🇱🇸" },
  LR: { name: "Liberia", flag: "🇱🇷" },
  LI: { name: "Liechtenstein", flag: "🇱🇮" },
  LT: { name: "Lithuania", flag: "🇱🇹" },
  LU: { name: "Luxembourg", flag: "🇱🇺" },
  MO: { name: "Macao", flag: "🇲🇴" },
  MG: { name: "Madagascar", flag: "🇲🇬" },
  MW: { name: "Malawi", flag: "🇲🇼" },
  ML: { name: "Mali", flag: "🇲🇱" },
  MH: { name: "Marshall Islands", flag: "🇲🇭" },
  MR: { name: "Mauritania", flag: "🇲🇷" },
  MU: { name: "Mauritius", flag: "🇲🇺" },
  FM: { name: "Micronesia", flag: "🇫🇲" },
  MC: { name: "Monaco", flag: "🇲🇨" },
  ME: { name: "Montenegro", flag: "🇲🇪" },
  NR: { name: "Nauru", flag: "🇳🇷" },
  NI: { name: "Nicaragua", flag: "🇳🇮" },
  NE: { name: "Niger", flag: "🇳🇪" },
  KP: { name: "North Korea", flag: "🇰🇵" },
  MK: { name: "North Macedonia", flag: "🇲🇰" },
  PW: { name: "Palau", flag: "🇵🇼" },
  PS: { name: "Palestine", flag: "🇵🇸" },
  RW: { name: "Rwanda", flag: "🇷🇼" },
  KN: { name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  LC: { name: "Saint Lucia", flag: "🇱🇨" },
  VC: { name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  WS: { name: "Samoa", flag: "🇼🇸" },
  SM: { name: "San Marino", flag: "🇸🇲" },
  ST: { name: "Sao Tome and Principe", flag: "🇸🇹" },
  SC: { name: "Seychelles", flag: "🇸🇨" },
  SL: { name: "Sierra Leone", flag: "🇸🇱" },
  SK: { name: "Slovakia", flag: "🇸🇰" },
  SI: { name: "Slovenia", flag: "🇸🇮" },
  SB: { name: "Solomon Islands", flag: "🇸🇧" },
  SO: { name: "Somalia", flag: "🇸🇴" },
  SS: { name: "South Sudan", flag: "🇸🇸" },
  SD: { name: "Sudan", flag: "🇸🇩" },
  SR: { name: "Suriname", flag: "🇸🇷" },
  SZ: { name: "Swaziland", flag: "🇸🇿" },
  SY: { name: "Syria", flag: "🇸🇾" },
  TJ: { name: "Tajikistan", flag: "🇹🇯" },
  TL: { name: "Timor-Leste", flag: "🇹🇱" },
  TG: { name: "Togo", flag: "🇹🇬" },
  TO: { name: "Tonga", flag: "🇹🇴" },
  TT: { name: "Trinidad and Tobago", flag: "🇹🇹" },
  TN: { name: "Tunisia", flag: "🇹🇳" },
  TM: { name: "Turkmenistan", flag: "🇹🇲" },
  TV: { name: "Tuvalu", flag: "🇹🇻" },
  VU: { name: "Vanuatu", flag: "🇻🇺" },
  VA: { name: "Vatican City", flag: "🇻🇦" },
  VE: { name: "Venezuela", flag: "🇻🇪" },
};

export const NAME_BY_CODE: Record<string, { name: string; flag: string }> = { ...EXTRA_NAMES };
for (const c of (visaData as any).countries as { code: string; name: string; flag: string }[]) {
  NAME_BY_CODE[c.code] = { name: c.name, flag: c.flag };
}

export type PassportCategory = "visa_free" | "visa_on_arrival" | "evisa";

export type PassportEntry = {
  code: string;
  name: string;
  flag: string;
  maxStay?: number;
  // Replaces "Up to N days" when the stay isn't a day count (e.g. India).
  stayText?: string;
  fee?: string;
  processingTime?: string;
  // Entry depends on something beyond the passport (e.g. a third-country visa).
  conditional?: boolean;
  // No Nepal-specific source confirmed this entry; tell travelers to check.
  unconfirmed?: boolean;
};

// Hand-checked facts for Nepali passport holders (see the file's _comment).
export type NepalVisaFact = {
  status: string;
  fee: string;
  stay?: number;
  stayText?: string;
  confidence: "confirmed" | "unconfirmed";
  conditional?: boolean;
  conditions: string[];
  sources: string[];
};

const NEPAL_FACTS = (nepalVisaFacts as any).destinations as Record<string, NepalVisaFact>;
export const NEPAL_FACTS_CHECKED: string = (nepalVisaFacts as any).checked;

export function getNepalFact(destination: string): NepalVisaFact | undefined {
  return NEPAL_FACTS[destination];
}

const GUIDE_STATUSES = (nepalGuideStatuses as any).statuses as Record<string, string>;

// Status from a full hand-checked guide, if one exists for this pair. These
// beat every other source, including the older visa-data.json entries.
export function getGuideStatus(passport: string, destination: string): string | undefined {
  return passport === "NP" ? GUIDE_STATUSES[destination] : undefined;
}

// Entry status for a passport -> destination pair. For Nepali passports the
// most specific source wins: a full hand-checked guide (e.g. Thailand's
// e-visa), then the checked visa-free/on-arrival facts (e.g. Palau, Bolivia
// need a visa first), then the passport-index community dataset.
export function getEffectiveStatus(passport: string, destination: string, rawStatus: string): string {
  if (passport === "NP") return GUIDE_STATUSES[destination] ?? NEPAL_FACTS[destination]?.status ?? rawStatus;
  return rawStatus;
}

// Visa-free stay length in days for a specific passport -> destination pair,
// straight from the passport-index dataset. Prefer this over the generic
// maxStay in destination-requirements.json, which isn't passport-specific.
export function getStayDays(passport: string, destination: string): number | undefined {
  return ((passportIndex as any).stayDays as Record<string, number> | undefined)?.[`${passport}->${destination}`];
}

// Plain-language fee text for a destination at a given access level.
// destination-requirements.json holds one generic fee per destination, so
// values like "Free / $50 USD" mean "free for exempt nationalities, $50 for
// everyone else" — confusing on a page that's already about one passport.
// Visa-free entries have no visa fee at all; for everything else a
// "Free / X" value collapses to X, the part that applies to a traveller who
// isn't visa-exempt.
export function describeFee(status: string, fee: string | undefined): string | undefined {
  if (status === "visa_free") return "No visa fee";
  if (!fee) return undefined;
  const split = fee.match(/^free\s*\/\s*(.+)$/i);
  if (split) return split[1];
  return fee;
}

// Short fee phrase for list cards, where the fee sits next to the stay
// length with no column heading to explain it: bare amounts get a
// "Visa fee" prefix, sentences ("No visa fee", "Israeli visa fee applies")
// are shown as written.
export function feeCardLabel(fee: string | undefined): string | undefined {
  if (!fee) return undefined;
  if (/^free$/i.test(fee)) return "Free visa";
  if (/^([$€£]|around |from |varies |set by )/i.test(fee)) {
    return `Visa fee ${fee.charAt(0).toLowerCase()}${fee.slice(1)}`;
  }
  return fee;
}

const listCache = new Map<PassportCategory, PassportEntry[]>();

// Builds the list of destinations at a given access level for a Nepali
// passport: the open-source passport-index dataset bundled with the app
// (see passport-index.json's own "source" field), corrected and enriched by
// the hand-checked nepal-visa-facts.json, falling back to the generic
// per-destination reference data in destination-requirements.json for
// anything the facts file doesn't cover. Cached per category: the scan
// covers ~40k pairs and the data never changes at runtime.
export function buildVisaList(category: PassportCategory): PassportEntry[] {
  const cached = listCache.get(category);
  if (cached) return cached;
  const reqs = (passportIndex as any).requirements as Record<string, string>;
  const dests = (destRequirements as any).destinations as Record<
    string,
    { fee: string; maxStay: number; processingTime: string }
  >;
  const out: PassportEntry[] = [];
  for (const [pair, rawStatus] of Object.entries(reqs)) {
    if (!pair.startsWith("NP->")) continue;
    const code = pair.split("->")[1];
    if (code === "NP") continue; // data artifact — not a real destination
    if (getEffectiveStatus("NP", code, rawStatus) !== category) continue;
    const info = NAME_BY_CODE[code];
    if (!info) continue;
    const fact = NEPAL_FACTS[code];
    const dest = dests[code];
    out.push(fact
      ? {
          code,
          name: info.name,
          flag: info.flag,
          maxStay: fact.stay,
          stayText: fact.stayText,
          fee: fact.fee,
          // destReq's processing time is another nationality's; leave it out.
          conditional: fact.conditional,
          unconfirmed: fact.confidence === "unconfirmed",
        }
      : {
          code,
          name: info.name,
          flag: info.flag,
          // Visa-free stays come from the passport-specific dataset only;
          // the generic figure is often another nationality's allowance.
          maxStay: category === "visa_free" ? getStayDays("NP", code) : dest?.maxStay,
          fee: describeFee(category, dest?.fee),
          processingTime: dest?.processingTime,
        });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  listCache.set(category, out);
  return out;
}
