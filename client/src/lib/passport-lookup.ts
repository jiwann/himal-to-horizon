import visaData from "@/lib/visa-data.json";
import passportIndex from "@/lib/passport-index.json";
import destRequirements from "@/lib/destination-requirements.json";

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
  fee?: string;
  processingTime?: string;
};

// Builds the list of destinations at a given access level for a Nepali
// passport, from the open-source passport-index dataset already bundled
// with the app (see passport-index.json's own "source" field), enriched
// with the generic per-destination fee/maxStay/processingTime reference
// data in destination-requirements.json where available.
export function buildVisaList(category: PassportCategory): PassportEntry[] {
  const reqs = (passportIndex as any).requirements as Record<string, string>;
  const dests = (destRequirements as any).destinations as Record<
    string,
    { fee: string; maxStay: number; processingTime: string }
  >;
  const out: PassportEntry[] = [];
  for (const [pair, status] of Object.entries(reqs)) {
    if (!pair.startsWith("NP->") || status !== category) continue;
    const code = pair.split("->")[1];
    if (code === "NP") continue; // data artifact — not a real destination
    const info = NAME_BY_CODE[code];
    if (!info) continue;
    const dest = dests[code];
    out.push({
      code,
      name: info.name,
      flag: info.flag,
      maxStay: dest?.maxStay,
      fee: dest?.fee,
      processingTime: dest?.processingTime,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
