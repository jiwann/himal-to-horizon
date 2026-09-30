/**
 * sync_visa_data.mjs
 * Node.js script to download the Passport Index dataset and generate
 * client/src/lib/passport-index.json for use by the Visa Engine.
 *
 * Run with:  node scripts/sync_visa_data.mjs
 */

import { createReadStream, writeFileSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import path from "path";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "../client/src/lib/passport-index.json");
const CSV_URL =
  "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy.csv";

// ---------------------------------------------------------------------------
// Country name  →  ISO 3166-1 alpha-2 code
// Base: visa-data.json countries + all additional names used in the CSV
// ---------------------------------------------------------------------------
const NAME_TO_ISO = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", Andorra: "AD",
  Angola: "AO", "Antigua & Barbuda": "AG", "Antigua and Barbuda": "AG",
  Argentina: "AR", Armenia: "AM", Australia: "AU", Austria: "AT",
  Azerbaijan: "AZ", Bahamas: "BS", Bahrain: "BH", Bangladesh: "BD",
  Barbados: "BB", Belarus: "BY", Belgium: "BE", Belize: "BZ",
  Benin: "BJ", Bhutan: "BT", Bolivia: "BO",
  "Bosnia & Herzegovina": "BA", "Bosnia and Herzegovina": "BA",
  Botswana: "BW", Brazil: "BR", Brunei: "BN", Bulgaria: "BG",
  "Burkina Faso": "BF", Burundi: "BI", Cambodia: "KH", Cameroon: "CM",
  Canada: "CA", "Cape Verde": "CV", "Cabo Verde": "CV",
  "Central African Republic": "CF", Chad: "TD", Chile: "CL",
  China: "CN", Colombia: "CO", Comoros: "KM", Congo: "CG",
  "Costa Rica": "CR", Croatia: "HR", Cuba: "CU", Cyprus: "CY",
  "Czech Republic": "CZ", Czechia: "CZ", Denmark: "DK",
  Djibouti: "DJ", Dominica: "DM", "Dominican Republic": "DO",
  "DR Congo": "CD", Ecuador: "EC", Egypt: "EG", "El Salvador": "SV",
  "Equatorial Guinea": "GQ", Eritrea: "ER", Estonia: "EE",
  Ethiopia: "ET", Fiji: "FJ", Finland: "FI", France: "FR",
  Gabon: "GA", Gambia: "GM", Georgia: "GE", Germany: "DE",
  Ghana: "GH", Greece: "GR", Grenada: "GD", Guatemala: "GT",
  Guinea: "GN", "Guinea-Bissau": "GW", Guyana: "GY", Haiti: "HT",
  Honduras: "HN", "Hong Kong SAR": "HK", "Hong Kong": "HK",
  Hungary: "HU", Iceland: "IS", India: "IN", Indonesia: "ID",
  Iran: "IR", Iraq: "IQ", Ireland: "IE", Israel: "IL", Italy: "IT",
  "Ivory Coast": "CI", "Côte d'Ivoire": "CI", Jamaica: "JM",
  Japan: "JP", Jordan: "JO", Kazakhstan: "KZ", Kenya: "KE",
  Kiribati: "KI", Kosovo: "XK", Kuwait: "KW", Kyrgyzstan: "KG",
  Laos: "LA", Latvia: "LV", Lebanon: "LB", Lesotho: "LS",
  Liberia: "LR", Libya: "LY", Liechtenstein: "LI", Lithuania: "LT",
  Luxembourg: "LU", "Macao": "MO", "Macau": "MO",
  Madagascar: "MG", Malawi: "MW", Malaysia: "MY", Maldives: "MV",
  Mali: "ML", Malta: "MT", "Marshall Islands": "MH", Mauritania: "MR",
  Mauritius: "MU", Mexico: "MX", Micronesia: "FM", Moldova: "MD",
  Monaco: "MC", Mongolia: "MN", Montenegro: "ME", Morocco: "MA",
  Mozambique: "MZ", Myanmar: "MM", Burma: "MM", Namibia: "NA",
  Nauru: "NR", Nepal: "NP", Netherlands: "NL", "New Zealand": "NZ",
  Nicaragua: "NI", Niger: "NE", Nigeria: "NG",
  "North Korea": "KP", "North Macedonia": "MK",
  "Republic of North Macedonia": "MK", Norway: "NO", Oman: "OM",
  Pakistan: "PK", Palau: "PW", Palestine: "PS",
  "Palestinian Territories": "PS", Panama: "PA",
  "Papua New Guinea": "PG", Paraguay: "PY", Peru: "PE",
  Philippines: "PH", Poland: "PL", Portugal: "PT", Qatar: "QA",
  Romania: "RO", Russia: "RU", Rwanda: "RW",
  "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC", Samoa: "WS",
  "San Marino": "SM", "Sao Tome and Principe": "ST",
  "São Tomé and Príncipe": "ST", "Saudi Arabia": "SA",
  Senegal: "SN", Serbia: "RS", Seychelles: "SC",
  "Sierra Leone": "SL", Singapore: "SG", Slovakia: "SK",
  "Slovak Republic": "SK", Slovenia: "SI", "Solomon Islands": "SB",
  Somalia: "SO", "South Africa": "ZA", "South Korea": "KR",
  "South Sudan": "SS", Spain: "ES", "Sri Lanka": "LK", Sudan: "SD",
  Suriname: "SR", Swaziland: "SZ", Eswatini: "SZ", Sweden: "SE",
  Switzerland: "CH", Syria: "SY", Taiwan: "TW", Tajikistan: "TJ",
  Tanzania: "TZ", Thailand: "TH", "Timor-Leste": "TL", Togo: "TG",
  Tonga: "TO", "Trinidad and Tobago": "TT", Tunisia: "TN",
  Turkey: "TR", Turkmenistan: "TM", Tuvalu: "TV", Uganda: "UG",
  Ukraine: "UA", "United Arab Emirates": "AE",
  "United Kingdom": "GB", "United States": "US", Uruguay: "UY",
  Uzbekistan: "UZ", Vanuatu: "VU", Vatican: "VA",
  "Vatican City": "VA", Venezuela: "VE", Vietnam: "VN",
  Yemen: "YE", Zambia: "ZM", Zimbabwe: "ZW",
};

const STATUS_MAP = {
  "visa free": "visa_free",
  "visa on arrival": "visa_on_arrival",
  "e-visa": "evisa",
  "eta": "evisa",
  "visa required": "sticker_visa",
  "-1": "not_admitted",
  "no admission": "not_admitted",
};

function mapRequirement(raw) {
  const lower = raw.trim().toLowerCase();
  if (STATUS_MAP[lower]) return STATUS_MAP[lower];
  // Numeric values represent visa-free days (e.g. "90" = 90 days visa-free)
  if (/^\d+$/.test(lower)) return "visa_free";
  return "sticker_visa";
}

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  console.log("Downloading Passport Index CSV from GitHub…");
  const csv = await fetchCSV(CSV_URL);

  const lines = csv.trim().split("\n");
  const header = lines.shift();
  console.log(`Parsing ${lines.length} rows…`);

  const requirements = {};
  // Visa-free stay length in days, when the source gives one (numeric
  // requirement values). Passport-specific, unlike the generic maxStay in
  // destination-requirements.json; read by getStayDays() in passport-lookup.ts.
  const stayDays = {};
  const unmapped = new Set();

  for (const line of lines) {
    const [passport, destination, requirement] = line.split(",");
    if (!passport || !destination || !requirement) continue;

    const passportISO = NAME_TO_ISO[passport.trim()];
    const destISO = NAME_TO_ISO[destination.trim()];

    if (!passportISO) unmapped.add(passport.trim());
    if (!destISO) unmapped.add(destination.trim());
    if (!passportISO || !destISO) continue;

    const status = mapRequirement(requirement);
    requirements[`${passportISO}->${destISO}`] = status;
    if (/^\d+$/.test(requirement.trim())) {
      stayDays[`${passportISO}->${destISO}`] = Number(requirement.trim());
    }
  }

  const output = {
    generated: new Date().toISOString(),
    source: "https://github.com/ilyankou/passport-index-dataset",
    count: Object.keys(requirements).length,
    requirements,
    stayDays,
  };

  writeFileSync(OUT_PATH, JSON.stringify(output));
  console.log(`✓ ${output.count} pairs written to ${OUT_PATH}`);
  if (unmapped.size > 0) {
    console.warn(`! ${unmapped.size} unmapped country names:`, [...unmapped].join(", "));
  }
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
