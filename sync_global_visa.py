#!/usr/bin/env python3
"""
sync_global_visa.py — Himal to Horizon Global Intelligence Feed
Operated by Synergy Soul LLC

Downloads the latest Passport Index dataset (MIT Licensed) from GitHub and
converts it into a high-speed JSON lookup file covering every passport ×
destination combination on Earth.

Usage:
    python3 sync_global_visa.py

Output:
    client/src/lib/passport-index.json

Every combination (e.g. AFG-BRA, KEN-IND) will have one of:
    visa_free | evisa | visa_on_arrival | sticker_visa | not_admitted

Source: https://github.com/ilyankou/passport-index-dataset (MIT License)
"""

import urllib.request
import csv
import json
import io
import datetime
import os

# ---------------------------------------------------------------------------
# Source
# ---------------------------------------------------------------------------
CSV_URL = (
    "https://raw.githubusercontent.com/ilyankou/"
    "passport-index-dataset/master/passport-index-tidy.csv"
)

OUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "client", "src", "lib", "passport-index.json",
)

# ---------------------------------------------------------------------------
# Country name  →  ISO 3166-1 alpha-2 code
# ---------------------------------------------------------------------------
NAME_TO_ISO = {
    "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD",
    "Angola": "AO", "Antigua & Barbuda": "AG", "Antigua and Barbuda": "AG",
    "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT",
    "Azerbaijan": "AZ", "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD",
    "Barbados": "BB", "Belarus": "BY", "Belgium": "BE", "Belize": "BZ",
    "Benin": "BJ", "Bhutan": "BT", "Bolivia": "BO",
    "Bosnia & Herzegovina": "BA", "Bosnia and Herzegovina": "BA",
    "Botswana": "BW", "Brazil": "BR", "Brunei": "BN", "Bulgaria": "BG",
    "Burkina Faso": "BF", "Burundi": "BI", "Cambodia": "KH",
    "Cameroon": "CM", "Canada": "CA", "Cape Verde": "CV", "Cabo Verde": "CV",
    "Central African Republic": "CF", "Chad": "TD", "Chile": "CL",
    "China": "CN", "Colombia": "CO", "Comoros": "KM", "Congo": "CG",
    "Costa Rica": "CR", "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY",
    "Czech Republic": "CZ", "Czechia": "CZ", "Denmark": "DK",
    "Djibouti": "DJ", "Dominica": "DM", "Dominican Republic": "DO",
    "DR Congo": "CD", "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV",
    "Equatorial Guinea": "GQ", "Eritrea": "ER", "Estonia": "EE",
    "Ethiopia": "ET", "Fiji": "FJ", "Finland": "FI", "France": "FR",
    "Gabon": "GA", "Gambia": "GM", "Georgia": "GE", "Germany": "DE",
    "Ghana": "GH", "Greece": "GR", "Grenada": "GD", "Guatemala": "GT",
    "Guinea": "GN", "Guinea-Bissau": "GW", "Guyana": "GY", "Haiti": "HT",
    "Honduras": "HN", "Hong Kong SAR": "HK", "Hong Kong": "HK",
    "Hungary": "HU", "Iceland": "IS", "India": "IN", "Indonesia": "ID",
    "Iran": "IR", "Iraq": "IQ", "Ireland": "IE", "Israel": "IL",
    "Italy": "IT", "Ivory Coast": "CI", "Côte d'Ivoire": "CI",
    "Jamaica": "JM", "Japan": "JP", "Jordan": "JO", "Kazakhstan": "KZ",
    "Kenya": "KE", "Kiribati": "KI", "Kosovo": "XK", "Kuwait": "KW",
    "Kyrgyzstan": "KG", "Laos": "LA", "Latvia": "LV", "Lebanon": "LB",
    "Lesotho": "LS", "Liberia": "LR", "Libya": "LY", "Liechtenstein": "LI",
    "Lithuania": "LT", "Luxembourg": "LU", "Macao": "MO", "Macau": "MO",
    "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY", "Maldives": "MV",
    "Mali": "ML", "Malta": "MT", "Marshall Islands": "MH",
    "Mauritania": "MR", "Mauritius": "MU", "Mexico": "MX",
    "Micronesia": "FM", "Moldova": "MD", "Monaco": "MC",
    "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA",
    "Mozambique": "MZ", "Myanmar": "MM", "Burma": "MM",
    "Namibia": "NA", "Nauru": "NR", "Nepal": "NP", "Netherlands": "NL",
    "New Zealand": "NZ", "Nicaragua": "NI", "Niger": "NE", "Nigeria": "NG",
    "North Korea": "KP", "North Macedonia": "MK",
    "Republic of North Macedonia": "MK", "Norway": "NO", "Oman": "OM",
    "Pakistan": "PK", "Palau": "PW", "Palestine": "PS",
    "Palestinian Territories": "PS", "Panama": "PA",
    "Papua New Guinea": "PG", "Paraguay": "PY", "Peru": "PE",
    "Philippines": "PH", "Poland": "PL", "Portugal": "PT", "Qatar": "QA",
    "Romania": "RO", "Russia": "RU", "Rwanda": "RW",
    "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC",
    "Saint Vincent and the Grenadines": "VC", "Samoa": "WS",
    "San Marino": "SM", "Sao Tome and Principe": "ST",
    "São Tomé and Príncipe": "ST", "Saudi Arabia": "SA",
    "Senegal": "SN", "Serbia": "RS", "Seychelles": "SC",
    "Sierra Leone": "SL", "Singapore": "SG", "Slovakia": "SK",
    "Slovak Republic": "SK", "Slovenia": "SI", "Solomon Islands": "SB",
    "Somalia": "SO", "South Africa": "ZA", "South Korea": "KR",
    "South Sudan": "SS", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD",
    "Suriname": "SR", "Swaziland": "SZ", "Eswatini": "SZ",
    "Sweden": "SE", "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW",
    "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH",
    "Timor-Leste": "TL", "Togo": "TG", "Tonga": "TO",
    "Trinidad and Tobago": "TT", "Tunisia": "TN", "Turkey": "TR",
    "Turkmenistan": "TM", "Tuvalu": "TV", "Uganda": "UG",
    "Ukraine": "UA", "United Arab Emirates": "AE",
    "United Kingdom": "GB", "United States": "US", "Uruguay": "UY",
    "Uzbekistan": "UZ", "Vanuatu": "VU", "Vatican": "VA",
    "Vatican City": "VA", "Venezuela": "VE", "Vietnam": "VN",
    "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW",
}

# ---------------------------------------------------------------------------
# Requirement mapping
# Numeric values (7, 30, 90, 180…) = visa-free days → visa_free
# ---------------------------------------------------------------------------
STATUS_MAP = {
    "visa free": "visa_free",
    "visa on arrival": "visa_on_arrival",
    "e-visa": "evisa",
    "eta": "evisa",
    "visa required": "sticker_visa",
    "-1": "not_admitted",
    "no admission": "not_admitted",
}


def map_requirement(raw: str) -> str:
    lower = raw.strip().lower()
    if lower in STATUS_MAP:
        return STATUS_MAP[lower]
    if lower.isdigit():
        return "visa_free"
    return "sticker_visa"


def main():
    print("Himal to Horizon — Global Intelligence Feed Sync")
    print(f"Source: {CSV_URL}")
    print("Downloading CSV…")

    try:
        req = urllib.request.Request(
            CSV_URL, headers={"User-Agent": "HimalToHorizon-GlobalSync/4.0"}
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read().decode("utf-8")
    except Exception as exc:
        print(f"Error downloading CSV: {exc}")
        return

    reader = csv.reader(io.StringIO(content))
    header = next(reader)
    print(f"Parsing data (columns: {header})…")

    requirements: dict[str, str] = {}
    unmapped: set[str] = set()

    for row in reader:
        if len(row) < 3:
            continue
        passport_name, dest_name, requirement = (
            row[0].strip(), row[1].strip(), row[2].strip()
        )
        passport_iso = NAME_TO_ISO.get(passport_name)
        dest_iso = NAME_TO_ISO.get(dest_name)

        if not passport_iso:
            unmapped.add(passport_name)
        if not dest_iso:
            unmapped.add(dest_name)
        if not passport_iso or not dest_iso:
            continue

        status = map_requirement(requirement)
        # AFG-BRA style key (3-letter fallback via iso2→iso3 is not needed;
        # UI layer uses alpha-2. The format "AF->BR" is used internally.)
        requirements[f"{passport_iso}->{dest_iso}"] = status

    output = {
        "generated": datetime.datetime.utcnow().isoformat() + "Z",
        "source": "https://github.com/ilyankou/passport-index-dataset",
        "license": "MIT",
        "count": len(requirements),
        "requirements": requirements,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"))

    print(f"✓ {len(requirements)} pairs written → {OUT_PATH}")
    if unmapped:
        print(f"! {len(unmapped)} unmapped names: {', '.join(sorted(unmapped))}")


if __name__ == "__main__":
    main()
