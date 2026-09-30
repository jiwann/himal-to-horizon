#!/usr/bin/env python3
"""
sync_visa_data.py
Himal to Horizon — Passport Index Sync Script
Operated by Synergy Soul LLC

Downloads the latest Passport Index CSV from GitHub and converts it to
a JSON dictionary used by the Visa Intelligence Engine.

Usage:
    python3 sync_visa_data.py

Requirements:
    Python 3.7+  (no external packages — uses stdlib only)

Output:
    client/src/lib/passport-index.json
"""

import urllib.request
import csv
import json
import io
import datetime
import os

CSV_URL = (
    "https://raw.githubusercontent.com/ilyankou/"
    "passport-index-dataset/master/passport-index-tidy.csv"
)

OUT_PATH = os.path.join(
    os.path.dirname(__file__),
    "client", "src", "lib", "passport-index.json",
)

# ---------------------------------------------------------------------------
# Country name → ISO 3166-1 alpha-2 code
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
    # Numeric values = visa-free days (e.g. "90" = 90 days visa-free)
    if lower.isdigit():
        return "visa_free"
    return "sticker_visa"


def main():
    print("Downloading Passport Index CSV from GitHub…")
    try:
        req = urllib.request.Request(CSV_URL, headers={"User-Agent": "HimalToHorizon/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read().decode("utf-8")
    except Exception as e:
        print(f"Error downloading CSV: {e}")
        return

    reader = csv.reader(io.StringIO(content))
    header = next(reader)
    print(f"Header: {header}")

    requirements = {}
    unmapped = set()

    for row in reader:
        if len(row) < 3:
            continue
        passport_name = row[0].strip()
        dest_name = row[1].strip()
        requirement = row[2].strip().lower()

        passport_iso = NAME_TO_ISO.get(passport_name)
        dest_iso = NAME_TO_ISO.get(dest_name)

        if not passport_iso:
            unmapped.add(passport_name)
        if not dest_iso:
            unmapped.add(dest_name)
        if not passport_iso or not dest_iso:
            continue

        status = map_requirement(requirement)
        requirements[f"{passport_iso}->{dest_iso}"] = status

    output = {
        "generated": datetime.datetime.utcnow().isoformat() + "Z",
        "source": "https://github.com/ilyankou/passport-index-dataset",
        "count": len(requirements),
        "requirements": requirements,
    }

    with open(OUT_PATH, "w") as f:
        json.dump(output, f, separators=(",", ":"))

    print(f"✓ {len(requirements)} requirement pairs written to {OUT_PATH}")
    if unmapped:
        print(f"! {len(unmapped)} unmapped country names: {', '.join(sorted(unmapped))}")


if __name__ == "__main__":
    main()
