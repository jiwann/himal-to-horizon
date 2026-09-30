export const AFFILIATE_CONFIG = {
  h2h_id: "h2h_himaltohorizon",
  source: "himaltohorizon.com",
} as const;

// Module-level marker — initialised from /api/config at app startup.
let _tpMarker = "504117";

export function setTravelpayoutsMarker(marker: string) {
  if (marker && marker.trim()) _tpMarker = marker.trim();
}

export function getTravelpayoutsMarker(): string {
  return _tpMarker;
}

/**
 * Build a Travelpayouts redirect URL.
 * partnerCode comes from your Travelpayouts dashboard → Tools tab for each program.
 */
function buildTpUrl(partnerCode: number, destinationUrl: string): string {
  const marker = getTravelpayoutsMarker();
  try {
    const url = new URL("https://tp.media/r");
    url.searchParams.set("marker", marker);
    url.searchParams.set("p", String(partnerCode));
    url.searchParams.set("u", destinationUrl);
    return url.toString();
  } catch {
    return `https://tp.media/r?marker=${encodeURIComponent(marker)}&p=${partnerCode}&u=${encodeURIComponent(destinationUrl)}`;
  }
}

// ── Travelpayouts partner codes ──────────────────────────────────────────────
// Get these from your Travelpayouts dashboard → each partner → Tools tab.
// Replace any 0 placeholders with your real code once you copy it from Tools.
const TP = {
  aviasales:       728,   // confirmed — 40% reward
  kiwi:           9114,   // confirmed — 3% reward
  airalo:         3729,   // eSIM — 12% reward (verify in Tools)
  yesim:          4184,   // eSIM — 18% reward (verify in Tools)
  drimsim:        3688,   // SIM card — €8 fixed (verify in Tools)
  welcomePickups: 3630,   // airport transfers — 8-9% (verify in Tools)
  klook:          5023,   // activities — 2-5% (verify in Tools)
  tiqets:         3547,   // tickets — 3.5-8% (verify in Tools)
  wegotrip:       4168,   // audio tours — up to 41.5% (verify in Tools)
  ekta:           4082,   // insurance — 20% reward (verify in Tools)
  airhelp:        3766,   // flight compensation — 15-16.6% (verify in Tools)
  compensair:     3760,   // flight compensation — €5-12 fixed (verify in Tools)
  localrent:      3738,   // car rental — 7.5-12% (verify in Tools)
  searadar:       4210,   // yacht rental — 5% (verify in Tools)
} as const;

// ── Flight booking links ─────────────────────────────────────────────────────

export function buildAviasalesUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  adults = 1,
): string {
  const marker = getTravelpayoutsMarker();
  const p = new URLSearchParams({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    depart_date: departureDate,          // YYYY-MM-DD
    adults: String(adults),
    children: "0",
    infants: "0",
    trip_class: "0",
    locale: "en",
    marker,
  });
  if (returnDate) {
    p.set("return_date", returnDate);    // YYYY-MM-DD
    p.set("one_way", "false");
  } else {
    p.set("one_way", "true");
  }
  return `https://www.aviasales.com/search?${p.toString()}`;
}

// Kiwi supports IATA codes directly in their search URL.
// NOTE: The TP tracking script overrides tp.media links, so we use direct
// Kiwi URLs. The TP script still fires a click-tracking event for commission.
export const KIWI_AFFILIATE_URL = "https://kiwi.tpk.mx/SOmJIBgC";

/**
 * Kiwi one-way / round-trip deep link.
 * Uses query-param format: ?from=IATA&to=IATA&departure=YYYY-MM-DD&return=YYYY-MM-DD
 * This is the current Kiwi.com format that reliably pre-fills both airports and dates.
 */
export function buildKiwiUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  adults = 1,
  children = 0,
  infants = 0,
  cabinClass = "economy",
): string {
  if (!origin || !destination || !departureDate) return KIWI_AFFILIATE_URL;
  const kiwiCabin: Record<string, string> = {
    economy: "economy",
    premium_economy: "premiumEconomy",
    business: "business",
    first: "firstClass",
  };
  const p = new URLSearchParams({
    from: origin.toUpperCase(),
    to: destination.toUpperCase(),
    departure: departureDate,
    adults: String(adults),
    children: String(children),
    infants: String(infants),
    locale: "en",
    cabinClass: kiwiCabin[cabinClass] ?? "economy",
  });
  if (returnDate) p.set("return", returnDate);
  return `https://www.kiwi.com/en/search/results?${p.toString()}`;
}

/**
 * Multi-city Kiwi deep link.
 * Uses numbered query params: from0, to0, date0, from1, to1, date1, ...
 */
export function buildKiwiMultiCityUrl(
  legs: Array<{ origin: string; destination: string; date: string }>,
  adults = 1,
): string {
  const valid = legs.filter(l => l.origin && l.destination && l.date);
  if (valid.length < 2) return KIWI_AFFILIATE_URL;
  const p = new URLSearchParams({ type: "multicity", adults: String(adults), cabinClass: "economy", locale: "en" });
  valid.forEach((l, i) => {
    p.set(`from${i}`, l.origin.toUpperCase());
    p.set(`to${i}`, l.destination.toUpperCase());
    p.set(`date${i}`, l.date);
  });
  return `https://www.kiwi.com/en/search/results?${p.toString()}`;
}

/**
 * Aviasales multi-city short-path URL.
 * Format: {FROM1}{DD1}{MM1}{FROM2}{DD2}{MM2}...{FINAL_DEST}{passengers}?marker=
 * e.g. TPA0805LAX0106KTM1 = TPA→LAX May 8 / LAX→KTM Jun 1, 1 pax
 */
export function buildAviasalesMultiCityUrl(
  legs: Array<{ origin: string; destination: string; date: string }>,
  adults = 1,
): string {
  const marker = getTravelpayoutsMarker();
  const valid = legs.filter(l => l.origin && l.destination && l.date);
  if (valid.length < 2) return `https://www.aviasales.com/search?marker=${marker}`;

  let path = "";
  for (const leg of valid) {
    const [, mm, dd] = leg.date.split("-");   // YYYY-MM-DD → mm, dd
    path += `${leg.origin.toUpperCase()}${dd}${mm}`;
  }
  // append final destination + passenger count
  path += `${valid[valid.length - 1].destination.toUpperCase()}${adults}`;

  return `https://www.aviasales.com/search/${path}?marker=${marker}`;
}

/**
 * Google Flights multi-city URL.
 * Uses the #flt= fragment format with t:m (multi-city type).
 * Each leg: FROM.TO.YYYY-MM-DD, legs separated by *.
 * e.g. #flt=TPA.LAX.2026-04-11*LAX.DXB.2026-04-20;c:USD;e:1;sd:1;t:m
 */
export function buildGoogleFlightsMultiCityUrl(
  legs: Array<{ origin: string; destination: string; date: string }>,
): string {
  const valid = legs.filter(l => l.origin && l.destination && l.date);
  if (valid.length < 2) return "https://www.google.com/travel/flights?tfs=CBwQAQ";
  const flt = valid
    .map(l => `${l.origin.toUpperCase()}.${l.destination.toUpperCase()}.${l.date}`)
    .join("*");
  return `https://www.google.com/travel/flights#flt=${flt};c:USD;e:1;sd:1;t:m`;
}

export function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
): string {
  const suffix = returnDate
    ? `through%20${returnDate}`
    : `oneway`;
  return `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${departureDate}%20${suffix}`;
}

// Legacy — kept so server-side hub-stay optimizer hotel links still work
export function generateBookingLink(city: string, checkIn: string, checkOut: string): string {
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}`;
  return buildTpUrl(2076, bookingUrl);
}

// Legacy alias used in a few places
export function generateFlightBookingLink(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  adults = 1,
): string {
  return buildAviasalesUrl(origin, destination, departureDate, returnDate, adults);
}

// ── Travel essentials affiliate links ────────────────────────────────────────

/** Airalo eSIM — deep-link to destination country eSIM page if country code provided */
export function buildAiraloUrl(destinationIso?: string): string {
  const base = destinationIso
    ? `https://www.airalo.com/esim/${destinationIso.toLowerCase()}`
    : "https://www.airalo.com";
  return buildTpUrl(TP.airalo, base);
}

/** Yesim eSIM */
export function buildYesimUrl(): string {
  return buildTpUrl(TP.yesim, "https://yesim.app/");
}

/** Welcome Pickups — airport transfer for a given city */
export function buildWelcomePickupsUrl(destinationCity?: string): string {
  const base = destinationCity
    ? `https://www.welcomepickups.com/airport-transfer/${destinationCity.toLowerCase().replace(/\s+/g, "-")}/`
    : "https://www.welcomepickups.com/";
  return buildTpUrl(TP.welcomePickups, base);
}

/** Klook — activities & experiences */
export function buildKlookUrl(destinationCity?: string): string {
  const base = destinationCity
    ? `https://www.klook.com/en-US/search/?query=${encodeURIComponent(destinationCity)}`
    : "https://www.klook.com/";
  return buildTpUrl(TP.klook, base);
}

/** Tiqets — museum & attraction tickets */
export function buildTiqetsUrl(destinationCity?: string): string {
  const base = destinationCity
    ? `https://www.tiqets.com/en/s/?q=${encodeURIComponent(destinationCity)}`
    : "https://www.tiqets.com/";
  return buildTpUrl(TP.tiqets, base);
}

/** EKTA travel insurance */
export function buildEktaUrl(): string {
  return buildTpUrl(TP.ekta, "https://ekta.com/");
}

/** AirHelp — flight delay compensation */
export function buildAirhelpUrl(): string {
  return buildTpUrl(TP.airhelp, "https://www.airhelp.com/");
}

/** Compensair — flight delay compensation */
export function buildCompensairUrl(): string {
  return buildTpUrl(TP.compensair, "https://compensair.com/");
}

/** Localrent — car rental */
export function buildLocalrentUrl(destinationCity?: string): string {
  const base = destinationCity
    ? `https://localrent.com/en/${destinationCity.toLowerCase().replace(/\s+/g, "-")}`
    : "https://localrent.com/en/";
  return buildTpUrl(TP.localrent, base);
}

// ── Skyscanner (no TP, own affiliate) ───────────────────────────────────────

export function buildSkyscannerUrl(origin: string, destination: string, departureDate: string, returnDate?: string): string {
  const base = `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${departureDate.replace(/-/g, "")}/${returnDate ? returnDate.replace(/-/g, "") + "/" : ""}`;
  try {
    const url = new URL(base);
    url.searchParams.set("adultsv2", "1");
    url.searchParams.set("preferDirectFlights", "false");
    return url.toString();
  } catch {
    return base;
  }
}

// ── Dynamic OTA routing ───────────────────────────────────────────────────────
// Picks the most relevant booking partner based on destination country code.

export type OtaOption = { name: string; url: string; label: string; testId: string };

const ASIA_CC = new Set([
  "JP","KR","CN","TH","SG","MY","ID","PH","VN","TW","HK","MO",
  "IN","PK","BD","NP","LK","MM","KH","LA","BT","MN","MV",
]);
const AMERICAS_CC = new Set([
  "US","CA","MX","BR","AR","CL","CO","PE","VE","EC","CU","DO",
  "PR","JM","GT","HN","SV","NI","CR","PA","BO","PY","UY","GY","SR",
]);

export function pickPrimaryOta(destCountryCode?: string): OtaOption {
  const cc = (destCountryCode ?? "").toUpperCase();
  if (ASIA_CC.has(cc))
    return { name: "Trip.com", url: "/go/trip", label: "Top-rated in Asia · flights & hotels", testId: "book-trip" };
  if (AMERICAS_CC.has(cc))
    return { name: "CheapOair", url: "/go/cheapoair", label: "Best discount fares in the Americas", testId: "book-cheapoair" };
  return { name: "Expedia", url: "/go/expedia", label: "Bundle discounts · loyalty rewards", testId: "book-expedia" };
}

export function getAllOtas(destCountryCode?: string): OtaOption[] {
  const primary = pickPrimaryOta(destCountryCode);
  const all: OtaOption[] = [
    { name: "Trip.com",    url: "/go/trip",      label: "Global fares · hotels & packages",        testId: "book-trip" },
    { name: "Expedia",     url: "/go/expedia",    label: "Bundle discounts · loyalty rewards",       testId: "book-expedia" },
    { name: "CheapOair",   url: "/go/cheapoair",  label: "Discount fares · flexible ticket options",  testId: "book-cheapoair" },
    { name: "Kiwi.com",    url: "/go/kiwi",       label: "Smart connections · mix-and-match routes",  testId: "book-kiwi" },
    { name: "Google Flights", url: "", label: "Free comparison — no booking fees", testId: "book-google" },
  ];
  return [primary, ...all.filter((o) => o.name !== primary.name)];
}

// ── Analytics ────────────────────────────────────────────────────────────────

export function trackAffiliateClick(eventType: string, meta: Record<string, unknown> = {}) {
  fetch("/api/events/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, ...meta }),
  }).catch(() => {});
}
