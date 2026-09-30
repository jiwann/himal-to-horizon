export const ORIGIN_LS_KEY = "h2h_saved_origin";

export type HubAirport = {
  iata: string;
  name: string;
  lat: number;
  lon: number;
  radiusMiles: number;
};

function toRad(deg: number) { return (deg * Math.PI) / 180; }

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2) * 0.621371;
}

export const CATEGORY_A_HUBS: HubAirport[] = [
  // ── North America ─────────────────────────────────────────────────────────
  { iata: "JFK", name: "New York JFK",        lat: 40.6413,  lon: -73.7781,  radiusMiles: 100 },
  { iata: "EWR", name: "Newark",              lat: 40.6895,  lon: -74.1745,  radiusMiles: 100 },
  { iata: "LGA", name: "New York LaGuardia",  lat: 40.7769,  lon: -73.8740,  radiusMiles: 100 },
  { iata: "ORD", name: "Chicago O'Hare",      lat: 41.9742,  lon: -87.9073,  radiusMiles: 100 },
  { iata: "ATL", name: "Atlanta",             lat: 33.6407,  lon: -84.4277,  radiusMiles: 100 },
  { iata: "LAX", name: "Los Angeles",         lat: 33.9425,  lon: -118.4081, radiusMiles: 100 },
  { iata: "DFW", name: "Dallas/Fort Worth",   lat: 32.8998,  lon: -97.0403,  radiusMiles: 100 },
  { iata: "MIA", name: "Miami",               lat: 25.7959,  lon: -80.2870,  radiusMiles: 100 },
  { iata: "SFO", name: "San Francisco",       lat: 37.6213,  lon: -122.3790, radiusMiles: 100 },
  { iata: "DEN", name: "Denver",              lat: 39.8561,  lon: -104.6737, radiusMiles: 100 },
  { iata: "SEA", name: "Seattle",             lat: 47.4502,  lon: -122.3088, radiusMiles: 100 },
  { iata: "BOS", name: "Boston",              lat: 42.3656,  lon: -71.0096,  radiusMiles: 100 },
  { iata: "IAH", name: "Houston Intercontinental", lat: 29.9902, lon: -95.3368, radiusMiles: 100 },
  { iata: "PHX", name: "Phoenix",             lat: 33.4373,  lon: -112.0078, radiusMiles: 100 },
  { iata: "CLT", name: "Charlotte",           lat: 35.2140,  lon: -80.9431,  radiusMiles: 100 },
  { iata: "MCO", name: "Orlando",             lat: 28.4312,  lon: -81.3081,  radiusMiles: 100 },
  { iata: "TPA", name: "Tampa",               lat: 27.9755,  lon: -82.5332,  radiusMiles: 130 },
  { iata: "MSP", name: "Minneapolis",         lat: 44.8848,  lon: -93.2223,  radiusMiles: 100 },
  { iata: "DTW", name: "Detroit",             lat: 42.2162,  lon: -83.3554,  radiusMiles: 100 },
  { iata: "LAS", name: "Las Vegas",           lat: 36.0840,  lon: -115.1537, radiusMiles: 100 },
  { iata: "PHL", name: "Philadelphia",        lat: 39.8744,  lon: -75.2424,  radiusMiles: 100 },
  { iata: "IAD", name: "Washington Dulles",   lat: 38.9531,  lon: -77.4565,  radiusMiles: 100 },
  { iata: "DCA", name: "Washington Reagan",   lat: 38.8512,  lon: -77.0402,  radiusMiles: 100 },
  { iata: "HNL", name: "Honolulu",            lat: 21.3245,  lon: -157.9251, radiusMiles: 100 },
  { iata: "YYZ", name: "Toronto",             lat: 43.6777,  lon: -79.6248,  radiusMiles: 100 },
  { iata: "YVR", name: "Vancouver",           lat: 49.1967,  lon: -123.1815, radiusMiles: 100 },
  { iata: "YUL", name: "Montreal",            lat: 45.4706,  lon: -73.7408,  radiusMiles: 100 },
  { iata: "MEX", name: "Mexico City",         lat: 19.4363,  lon: -99.0721,  radiusMiles: 100 },
  { iata: "GRU", name: "São Paulo",           lat: -23.4356, lon: -46.4731,  radiusMiles: 100 },
  { iata: "BOG", name: "Bogotá",              lat: 4.7016,   lon: -74.1469,  radiusMiles: 100 },
  { iata: "LIM", name: "Lima",                lat: -12.0219, lon: -77.1143,  radiusMiles: 100 },
  { iata: "EZE", name: "Buenos Aires",        lat: -34.8222, lon: -58.5358,  radiusMiles: 100 },
  { iata: "SCL", name: "Santiago",            lat: -33.3930, lon: -70.7858,  radiusMiles: 100 },

  // ── Europe ────────────────────────────────────────────────────────────────
  { iata: "LHR", name: "London Heathrow",     lat: 51.4700,  lon: -0.4543,   radiusMiles: 100 },
  { iata: "LGW", name: "London Gatwick",      lat: 51.1537,  lon: -0.1821,   radiusMiles: 100 },
  { iata: "CDG", name: "Paris Charles de Gaulle", lat: 49.0097, lon: 2.5479, radiusMiles: 100 },
  { iata: "FRA", name: "Frankfurt",           lat: 50.0379,  lon: 8.5622,    radiusMiles: 100 },
  { iata: "AMS", name: "Amsterdam",           lat: 52.3086,  lon: 4.7639,    radiusMiles: 100 },
  { iata: "MAD", name: "Madrid",              lat: 40.4936,  lon: -3.5668,   radiusMiles: 100 },
  { iata: "BCN", name: "Barcelona",           lat: 41.2974,  lon: 2.0833,    radiusMiles: 100 },
  { iata: "FCO", name: "Rome Fiumicino",      lat: 41.8003,  lon: 12.2389,   radiusMiles: 100 },
  { iata: "MXP", name: "Milan Malpensa",      lat: 45.6306,  lon: 8.7231,    radiusMiles: 100 },
  { iata: "MUC", name: "Munich",              lat: 48.3537,  lon: 11.7750,   radiusMiles: 100 },
  { iata: "ZRH", name: "Zurich",              lat: 47.4647,  lon: 8.5492,    radiusMiles: 100 },
  { iata: "VIE", name: "Vienna",              lat: 48.1103,  lon: 16.5697,   radiusMiles: 100 },
  { iata: "CPH", name: "Copenhagen",          lat: 55.6180,  lon: 12.6508,   radiusMiles: 100 },
  { iata: "ARN", name: "Stockholm Arlanda",   lat: 59.6519,  lon: 17.9186,   radiusMiles: 100 },
  { iata: "HEL", name: "Helsinki",            lat: 60.3183,  lon: 24.9630,   radiusMiles: 100 },
  { iata: "WAW", name: "Warsaw",              lat: 52.1657,  lon: 20.9671,   radiusMiles: 100 },
  { iata: "ATH", name: "Athens",              lat: 37.9364,  lon: 23.9445,   radiusMiles: 100 },
  { iata: "IST", name: "Istanbul",            lat: 41.2608,  lon: 28.7418,   radiusMiles: 100 },
  { iata: "LIS", name: "Lisbon",              lat: 38.7742,  lon: -9.1342,   radiusMiles: 100 },

  // ── Middle East ───────────────────────────────────────────────────────────
  { iata: "DXB", name: "Dubai",               lat: 25.2532,  lon: 55.3657,   radiusMiles: 100 },
  { iata: "AUH", name: "Abu Dhabi",           lat: 24.4330,  lon: 54.6511,   radiusMiles: 100 },
  { iata: "DOH", name: "Doha",                lat: 25.2731,  lon: 51.6086,   radiusMiles: 100 },
  { iata: "RUH", name: "Riyadh",              lat: 24.9576,  lon: 46.6988,   radiusMiles: 100 },
  { iata: "TLV", name: "Tel Aviv",            lat: 32.0055,  lon: 34.8854,   radiusMiles: 100 },
  { iata: "AMM", name: "Amman",               lat: 31.7226,  lon: 35.9932,   radiusMiles: 100 },

  // ── Asia Pacific ──────────────────────────────────────────────────────────
  { iata: "SIN", name: "Singapore Changi",    lat: 1.3644,   lon: 103.9915,  radiusMiles: 100 },
  { iata: "HKG", name: "Hong Kong",           lat: 22.3080,  lon: 113.9185,  radiusMiles: 100 },
  { iata: "NRT", name: "Tokyo Narita",        lat: 35.7720,  lon: 140.3929,  radiusMiles: 100 },
  { iata: "HND", name: "Tokyo Haneda",        lat: 35.5494,  lon: 139.7798,  radiusMiles: 100 },
  { iata: "ICN", name: "Seoul Incheon",       lat: 37.4691,  lon: 126.4510,  radiusMiles: 100 },
  { iata: "PVG", name: "Shanghai Pudong",     lat: 31.1443,  lon: 121.8083,  radiusMiles: 100 },
  { iata: "PEK", name: "Beijing Capital",     lat: 40.0799,  lon: 116.6031,  radiusMiles: 100 },
  { iata: "BKK", name: "Bangkok Suvarnabhumi",lat: 13.6900,  lon: 100.7501,  radiusMiles: 100 },
  { iata: "KUL", name: "Kuala Lumpur",        lat: 2.7456,   lon: 101.7099,  radiusMiles: 100 },
  { iata: "DEL", name: "New Delhi",           lat: 28.5562,  lon: 77.1000,   radiusMiles: 100 },
  { iata: "BOM", name: "Mumbai",              lat: 19.0896,  lon: 72.8656,   radiusMiles: 100 },
  { iata: "BLR", name: "Bangalore",           lat: 13.1979,  lon: 77.7063,   radiusMiles: 100 },
  { iata: "MAA", name: "Chennai",             lat: 12.9941,  lon: 80.1709,   radiusMiles: 100 },
  { iata: "HYD", name: "Hyderabad",           lat: 17.2403,  lon: 78.4294,   radiusMiles: 100 },
  { iata: "CCU", name: "Kolkata",             lat: 22.6546,  lon: 88.4467,   radiusMiles: 100 },
  { iata: "DAC", name: "Dhaka",               lat: 23.8433,  lon: 90.3978,   radiusMiles: 100 },
  { iata: "KHI", name: "Karachi",             lat: 24.9065,  lon: 67.1608,   radiusMiles: 100 },
  { iata: "LHE", name: "Lahore",              lat: 31.5216,  lon: 74.4036,   radiusMiles: 100 },
  { iata: "ISB", name: "Islamabad",           lat: 33.6169,  lon: 73.0990,   radiusMiles: 100 },
  { iata: "KTM", name: "Kathmandu",           lat: 27.6966,  lon: 85.3591,   radiusMiles: 100 },
  { iata: "SYD", name: "Sydney",              lat: -33.9399, lon: 151.1753,  radiusMiles: 100 },
  { iata: "MEL", name: "Melbourne",           lat: -37.6690, lon: 144.8410,  radiusMiles: 100 },
  { iata: "BNE", name: "Brisbane",            lat: -27.3842, lon: 153.1175,  radiusMiles: 100 },
  { iata: "CGK", name: "Jakarta",             lat: -6.1275,  lon: 106.6537,  radiusMiles: 100 },
  { iata: "MNL", name: "Manila",              lat: 14.5086,  lon: 121.0194,  radiusMiles: 100 },

  // ── Africa ────────────────────────────────────────────────────────────────
  { iata: "JNB", name: "Johannesburg",        lat: -26.1392, lon: 28.2460,   radiusMiles: 100 },
  { iata: "CPT", name: "Cape Town",           lat: -33.9715, lon: 18.6021,   radiusMiles: 100 },
  { iata: "NBO", name: "Nairobi",             lat: -1.3192,  lon: 36.9275,   radiusMiles: 100 },
  { iata: "ADD", name: "Addis Ababa",         lat: 8.9779,   lon: 38.7993,   radiusMiles: 100 },
  { iata: "CAI", name: "Cairo",               lat: 30.1127,  lon: 31.4000,   radiusMiles: 100 },
  { iata: "CMN", name: "Casablanca",          lat: 33.3675,  lon: -7.5898,   radiusMiles: 100 },
  { iata: "LOS", name: "Lagos",               lat: 6.5774,   lon: 3.3212,    radiusMiles: 100 },
  { iata: "ACC", name: "Accra",               lat: 5.6052,   lon: -0.1668,   radiusMiles: 100 },
];

export function getHubForCoords(lat: number, lon: number): HubAirport | null {
  let best: HubAirport | null = null;
  let bestDist = Infinity;

  for (const hub of CATEGORY_A_HUBS) {
    const dist = haversineMiles(lat, lon, hub.lat, hub.lon);
    if (dist <= hub.radiusMiles && dist < bestDist) {
      best = hub;
      bestDist = dist;
    }
  }

  return best;
}

export type SavedOrigin = { iata: string; city: string };

export function loadSavedOrigin(): SavedOrigin | null {
  try {
    const raw = localStorage.getItem(ORIGIN_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedOrigin;
    if (parsed?.iata && parsed?.city) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveOrigin(iata: string, city: string) {
  try {
    localStorage.setItem(ORIGIN_LS_KEY, JSON.stringify({ iata, city }));
  } catch { /* quota exceeded – ignore */ }
}

export function clearSavedOrigin() {
  try {
    localStorage.removeItem(ORIGIN_LS_KEY);
  } catch { /* ignore */ }
}
