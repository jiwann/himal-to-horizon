import type { FlightOffer, FlightSlice, FlightSegment } from "@shared/schema";

export const CARRIER_BAGGAGE_DEFAULTS: Record<string, { carryOn: number; checked: number; personalOnly: boolean }> = {
  NK: { carryOn: 0, checked: 0, personalOnly: true  },
  F9: { carryOn: 0, checked: 0, personalOnly: true  },
  G4: { carryOn: 0, checked: 0, personalOnly: true  },
  SY: { carryOn: 0, checked: 0, personalOnly: true  },
  AA: { carryOn: 1, checked: 0, personalOnly: false },
  UA: { carryOn: 1, checked: 0, personalOnly: false },
  DL: { carryOn: 1, checked: 0, personalOnly: false },
  AS: { carryOn: 1, checked: 0, personalOnly: false },
  B6: { carryOn: 1, checked: 0, personalOnly: false },
  HA: { carryOn: 1, checked: 0, personalOnly: false },
  WN: { carryOn: 1, checked: 2, personalOnly: false },
  FR: { carryOn: 0, checked: 0, personalOnly: true  },
  U2: { carryOn: 0, checked: 0, personalOnly: true  },
  W6: { carryOn: 0, checked: 0, personalOnly: true  },
  VY: { carryOn: 0, checked: 0, personalOnly: true  },
  BA: { carryOn: 1, checked: 1, personalOnly: false },
  LH: { carryOn: 1, checked: 1, personalOnly: false },
  AF: { carryOn: 1, checked: 1, personalOnly: false },
  KL: { carryOn: 1, checked: 1, personalOnly: false },
  IB: { carryOn: 1, checked: 0, personalOnly: false },
  AY: { carryOn: 1, checked: 1, personalOnly: false },
  SK: { carryOn: 1, checked: 1, personalOnly: false },
  OS: { carryOn: 1, checked: 1, personalOnly: false },
  LX: { carryOn: 1, checked: 1, personalOnly: false },
  EK: { carryOn: 1, checked: 1, personalOnly: false },
  QR: { carryOn: 1, checked: 1, personalOnly: false },
  EY: { carryOn: 1, checked: 1, personalOnly: false },
  SQ: { carryOn: 1, checked: 1, personalOnly: false },
  CX: { carryOn: 1, checked: 1, personalOnly: false },
  TK: { carryOn: 1, checked: 1, personalOnly: false },
  AI: { carryOn: 1, checked: 1, personalOnly: false },
  ET: { carryOn: 1, checked: 1, personalOnly: false },
  SA: { carryOn: 1, checked: 1, personalOnly: false },
  CA: { carryOn: 1, checked: 1, personalOnly: false },
  MU: { carryOn: 1, checked: 1, personalOnly: false },
  CZ: { carryOn: 1, checked: 1, personalOnly: false },
  NH: { carryOn: 1, checked: 1, personalOnly: false },
  JL: { carryOn: 1, checked: 1, personalOnly: false },
  KE: { carryOn: 1, checked: 1, personalOnly: false },
  OZ: { carryOn: 1, checked: 1, personalOnly: false },
  TG: { carryOn: 1, checked: 1, personalOnly: false },
  MH: { carryOn: 1, checked: 1, personalOnly: false },
  SV: { carryOn: 1, checked: 1, personalOnly: false },
  MS: { carryOn: 1, checked: 1, personalOnly: false },
  QF: { carryOn: 1, checked: 1, personalOnly: false },
  NZ: { carryOn: 1, checked: 1, personalOnly: false },
  VN: { carryOn: 1, checked: 1, personalOnly: false },
  FD: { carryOn: 1, checked: 0, personalOnly: false },
  AK: { carryOn: 1, checked: 0, personalOnly: false },
  PG: { carryOn: 1, checked: 0, personalOnly: false },
  DD: { carryOn: 1, checked: 0, personalOnly: false },
};
export const DEFAULT_CARRIER_BAGGAGE = { carryOn: 1, checked: 0, personalOnly: false };

export const NEARBY_AIRPORT_MAP: Record<string, string[]> = {
  "JFK": ["EWR", "LGA"], "EWR": ["JFK", "LGA"], "LGA": ["JFK", "EWR"], "NYC": ["JFK", "EWR", "LGA"],
  "LHR": ["LGW", "LCY", "STN", "LTN"], "LGW": ["LHR", "LCY", "STN"], "LCY": ["LHR", "LGW"],
  "STN": ["LHR", "LGW"], "LTN": ["LHR", "LGW"], "LON": ["LHR", "LGW", "LCY", "STN", "LTN"],
  "DCA": ["IAD", "BWI"], "IAD": ["DCA", "BWI"], "BWI": ["DCA", "IAD"],
  "ORD": ["MDW"], "MDW": ["ORD"], "CHI": ["ORD", "MDW"],
  "LAX": ["BUR", "LGB", "ONT", "SNA"], "BUR": ["LAX", "LGB"], "SNA": ["LAX", "LGB"],
  "SFO": ["OAK", "SJC"], "OAK": ["SFO", "SJC"], "SJC": ["SFO", "OAK"],
  "DFW": ["DAL"], "DAL": ["DFW"],
  "MIA": ["FLL", "PBI"], "FLL": ["MIA"],
  "IAH": ["HOU"], "HOU": ["IAH"],
  "BOS": ["PVD", "MHT"],
  "YYZ": ["YTZ"],
  "DXB": ["AUH", "SHJ"], "AUH": ["DXB"],
  "MAN": ["BHX", "LPL"], "BHX": ["MAN"],
  "SYD": ["MEL"], "DEL": [], "BOM": [],
};

export const AIRPORT_DISPLAY_NAMES: Record<string, string> = {
  "JFK": "Kennedy (JFK)", "EWR": "Newark (EWR)", "LGA": "LaGuardia (LGA)",
  "LHR": "Heathrow (LHR)", "LGW": "Gatwick (LGW)", "LCY": "London City (LCY)",
  "STN": "Stansted (STN)", "LTN": "Luton (LTN)", "DCA": "Reagan (DCA)",
  "IAD": "Dulles (IAD)", "BWI": "Baltimore (BWI)", "ORD": "O'Hare (ORD)",
  "MDW": "Midway (MDW)", "LAX": "LAX", "BUR": "Burbank (BUR)",
  "SNA": "Orange County (SNA)", "SFO": "SFO", "OAK": "Oakland (OAK)",
  "SJC": "San Jose (SJC)", "DFW": "DFW", "DAL": "Love Field (DAL)",
  "MIA": "Miami (MIA)", "FLL": "Fort Lauderdale (FLL)", "IAH": "Houston (IAH)",
  "HOU": "Hobby (HOU)", "BOS": "Boston (BOS)", "DXB": "Dubai (DXB)",
  "AUH": "Abu Dhabi (AUH)", "SHJ": "Sharjah (SHJ)", "MAN": "Manchester (MAN)",
  "BHX": "Birmingham (BHX)", "YYZ": "Toronto Pearson (YYZ)",
};

export const AIRPORT_CITY_NAMES: Record<string, string> = {
  "JFK": "New York", "EWR": "New York", "LGA": "New York",
  "LHR": "London", "LGW": "London", "LCY": "London", "STN": "London", "LTN": "London",
  "CDG": "Paris", "ORY": "Paris",
  "BKK": "Bangkok", "DMK": "Bangkok",
  "NRT": "Tokyo", "HND": "Tokyo",
  "ICN": "Seoul", "GMP": "Seoul",
  "SIN": "Singapore",
  "KUL": "Kuala Lumpur", "SZB": "Kuala Lumpur",
  "DXB": "Dubai", "AUH": "Abu Dhabi",
  "LAX": "Los Angeles", "SFO": "San Francisco",
  "ORD": "Chicago", "MIA": "Miami", "DFW": "Dallas",
  "DEL": "Delhi", "BOM": "Mumbai",
  "HKG": "Hong Kong",
  "SYD": "Sydney", "MEL": "Melbourne",
  "CAN": "Guangzhou", "PEK": "Beijing", "PVG": "Shanghai",
  "IST": "Istanbul",
  "DOH": "Doha",
  "AMS": "Amsterdam",
  "FRA": "Frankfurt",
  "MUC": "Munich",
  "MAD": "Madrid", "BCN": "Barcelona",
  "FCO": "Rome", "MXP": "Milan",
  "ZRH": "Zurich",
  "CPH": "Copenhagen",
  "ARN": "Stockholm",
  "VIE": "Vienna",
  "BRU": "Brussels",
  "HEL": "Helsinki",
  "DUB": "Dublin",
  "ATH": "Athens",
  "WAW": "Warsaw",
  "GRU": "São Paulo", "EZE": "Buenos Aires", "BOG": "Bogotá", "LIM": "Lima",
  "MEX": "Mexico City", "YYZ": "Toronto", "YVR": "Vancouver", "YUL": "Montreal",
  "JNB": "Johannesburg", "NBO": "Nairobi", "LOS": "Lagos", "CMN": "Casablanca",
  "CAI": "Cairo",
  "CGK": "Jakarta", "DPS": "Bali",
  "MNL": "Manila",
  "HAN": "Hanoi", "SGN": "Ho Chi Minh City",
  "CMB": "Colombo",
  "KTM": "Kathmandu",
};

export const AIRLINE_NAMES: Record<string, string> = {
  "AA": "American Airlines", "UA": "United Airlines", "DL": "Delta Air Lines",
  "AS": "Alaska Airlines", "B6": "JetBlue Airways", "WN": "Southwest Airlines",
  "NK": "Spirit Airlines", "F9": "Frontier Airlines",
  "BA": "British Airways", "LH": "Lufthansa", "AF": "Air France", "KL": "KLM",
  "IB": "Iberia", "AY": "Finnair", "SK": "SAS", "OS": "Austrian Airlines",
  "LX": "Swiss Air Lines",
  "EK": "Emirates", "QR": "Qatar Airways", "EY": "Etihad Airways",
  "SQ": "Singapore Airlines", "CX": "Cathay Pacific",
  "TK": "Turkish Airlines",
  "AI": "Air India", "ET": "Ethiopian Airlines", "SA": "South African Airways",
  "CA": "Air China", "MU": "China Eastern", "CZ": "China Southern",
  "NH": "All Nippon Airways", "JL": "Japan Airlines",
  "KE": "Korean Air", "OZ": "Asiana Airlines",
  "TG": "Thai Airways", "MH": "Malaysia Airlines",
  "VN": "Vietnam Airlines", "FD": "Thai AirAsia", "AK": "AirAsia",
  "PG": "Bangkok Airways", "DD": "Nok Air",
  "SV": "Saudia", "MS": "EgyptAir",
  "QF": "Qantas", "NZ": "Air New Zealand",
  "FR": "Ryanair", "U2": "easyJet", "W6": "Wizz Air", "VY": "Vueling",
  "HA": "Hawaiian Airlines", "G4": "Allegiant Air",
  "KU": "Kuwait Airways", "GF": "Gulf Air",
  "RJ": "Royal Jordanian", "ME": "Middle East Airlines",
  "AC": "Air Canada", "WS": "WestJet",
  "LA": "LATAM Airlines", "AV": "Avianca",
  "CM": "Copa Airlines",
};

export const AIRPORT_COUNTRY_CODES: Record<string, string> = {
  "JFK": "US", "EWR": "US", "LGA": "US", "LAX": "US", "ORD": "US",
  "DFW": "US", "MIA": "US", "SFO": "US", "BOS": "US", "SEA": "US",
  "DEN": "US", "ATL": "US", "PHX": "US", "LAS": "US", "MCO": "US",
  "MDW": "US", "DAL": "US", "FLL": "US", "IAH": "US", "HOU": "US",
  "DCA": "US", "IAD": "US", "BWI": "US", "HNL": "US", "OAK": "US", "SJC": "US",
  "LHR": "GB", "LGW": "GB", "LCY": "GB", "STN": "GB", "LTN": "GB", "MAN": "GB", "BHX": "GB",
  "CDG": "FR", "ORY": "FR",
  "FRA": "DE", "MUC": "DE", "TXL": "DE", "BER": "DE",
  "AMS": "NL", "BRU": "BE", "ZRH": "CH", "VIE": "AT",
  "MAD": "ES", "BCN": "ES",
  "FCO": "IT", "MXP": "IT",
  "CPH": "DK", "ARN": "SE", "HEL": "FI", "OSL": "NO",
  "DUB": "IE", "ATH": "GR", "WAW": "PL", "PRG": "CZ",
  "BKK": "TH", "DMK": "TH", "HKT": "TH", "CNX": "TH",
  "SIN": "SG",
  "KUL": "MY", "SZB": "MY", "PEN": "MY",
  "NRT": "JP", "HND": "JP", "KIX": "JP", "ITM": "JP", "NGO": "JP",
  "ICN": "KR", "GMP": "KR", "PUS": "KR",
  "DXB": "AE", "AUH": "AE", "SHJ": "AE",
  "DOH": "QA", "KWI": "KW", "BAH": "BH",
  "DEL": "IN", "BOM": "IN", "MAA": "IN", "BLR": "IN", "CCU": "IN", "HYD": "IN",
  "CGK": "ID", "DPS": "ID",
  "MNL": "PH", "CEB": "PH",
  "HAN": "VN", "SGN": "VN",
  "KTM": "NP",
  "CMB": "LK",
  "RGN": "MM",
  "PNH": "KH", "REP": "KH",
  "VTE": "LA",
  "HKG": "HK",
  "TPE": "TW",
  "PEK": "CN", "PVG": "CN", "CAN": "CN",
  "IST": "TR", "SAW": "TR",
  "CAI": "EG",
  "JNB": "ZA", "CPT": "ZA",
  "NBO": "KE",
  "LOS": "NG",
  "CMN": "MA",
  "GRU": "BR", "GIG": "BR",
  "EZE": "AR", "AEP": "AR",
  "BOG": "CO",
  "LIM": "PE",
  "MEX": "MX",
  "YYZ": "CA", "YVR": "CA", "YUL": "CA", "YYC": "CA",
  "SYD": "AU", "MEL": "AU", "BNE": "AU", "PER": "AU",
  "AKL": "NZ",
};

export function getNearbyAirports(code: string): string[] {
  return NEARBY_AIRPORT_MAP[code.toUpperCase()] ?? [];
}

export function getAirportDisplayName(code: string): string {
  return AIRPORT_DISPLAY_NAMES[code.toUpperCase()] ?? code;
}

function getCityName(code: string): string {
  return AIRPORT_CITY_NAMES[code.toUpperCase()] ?? code;
}

function getAirlineName(iata: string): string {
  return AIRLINE_NAMES[iata.toUpperCase()] ?? iata;
}

function getCountryCode(airportCode: string): string | undefined {
  return AIRPORT_COUNTRY_CODES[airportCode.toUpperCase()];
}

function minutesToIsoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h}H${m > 0 ? `${m}M` : ""}`;
}

function buildBaggage(airlineCode: string) {
  const defaults = CARRIER_BAGGAGE_DEFAULTS[airlineCode.toUpperCase()] ?? DEFAULT_CARRIER_BAGGAGE;
  return {
    checkedBags: defaults.checked,
    carryOnBags: defaults.carryOn,
    personalItemOnly: defaults.personalOnly,
    baggageEstimated: true,
  };
}

let _offerCounter = 0;

function tpPriceToFlightOffer(
  origin: string,
  destination: string,
  item: any,
  returnDate?: string,
  currency = "USD",
  passengers = 1,
): FlightOffer {
  const airline = (item.airline ?? "OA").toUpperCase();
  const departureAt = item.departure_at ?? `${item.depart_date ?? ""}T00:00:00`;
  const returnAt = item.return_at ?? (returnDate ? `${returnDate}T00:00:00` : "");
  const totalMinutes = item.duration ?? item.duration_to ?? 0;
  const returnMinutes = item.duration_back ?? item.duration ?? 0;
  const flightNum = String(item.flight_number ?? 0).padStart(3, "0");
  const transfers = item.transfers ?? 0;
  const price = ((item.price ?? 0) * passengers).toFixed(2);
  const id = `tp_${Date.now()}_${++_offerCounter}`;

  const outboundSlice: FlightSlice = {
    id: `${id}_out`,
    origin: {
      iata_code: origin,
      name: getAirportDisplayName(origin),
      city_name: getCityName(origin),
      iata_country_code: getCountryCode(origin),
    },
    destination: {
      iata_code: destination,
      name: getAirportDisplayName(destination),
      city_name: getCityName(destination),
      iata_country_code: getCountryCode(destination),
    },
    departure_at: departureAt,
    arrival_at: departureAt,
    duration: minutesToIsoDuration(totalMinutes),
    segments: buildSegments(id, origin, destination, airline, flightNum, departureAt, totalMinutes, transfers, "out"),
  };

  const slices: FlightSlice[] = [outboundSlice];

  if (returnDate && returnAt) {
    const inboundSlice: FlightSlice = {
      id: `${id}_in`,
      origin: {
        iata_code: destination,
        name: getAirportDisplayName(destination),
        city_name: getCityName(destination),
        iata_country_code: getCountryCode(destination),
      },
      destination: {
        iata_code: origin,
        name: getAirportDisplayName(origin),
        city_name: getCityName(origin),
        iata_country_code: getCountryCode(origin),
      },
      departure_at: returnAt,
      arrival_at: returnAt,
      duration: minutesToIsoDuration(returnMinutes || totalMinutes),
      segments: buildSegments(id, destination, origin, airline, flightNum, returnAt, returnMinutes || totalMinutes, transfers, "in"),
    };
    slices.push(inboundSlice);
  }

  const baggage = buildBaggage(airline);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  return {
    id,
    total_amount: price,
    total_currency: currency,
    base_amount: (parseFloat(price) * 0.82).toFixed(2),
    tax_amount: (parseFloat(price) * 0.18).toFixed(2),
    slices,
    passengers_count: passengers,
    passengerIds: [],
    owner: {
      name: getAirlineName(airline),
      iata_code: airline,
    },
    expires_at: expiresAt,
    ...baggage,
  };
}

function buildSegments(
  baseId: string,
  from: string,
  to: string,
  airline: string,
  flightNum: string,
  departureAt: string,
  durationMinutes: number,
  transfers: number,
  dir: string,
): FlightSegment[] {
  const segments: FlightSegment[] = [];
  if (transfers === 0) {
    segments.push({
      id: `${baseId}_${dir}_seg0`,
      origin: { iata_code: from, name: getAirportDisplayName(from) },
      destination: { iata_code: to, name: getAirportDisplayName(to) },
      departure_at: departureAt,
      arrival_at: departureAt,
      duration: minutesToIsoDuration(durationMinutes),
      operating_carrier: { name: getAirlineName(airline), iata_code: airline },
      flight_number: `${airline}${flightNum}`,
      aircraft: null,
      stops: 0,
    });
  } else {
    const halfMin = Math.round(durationMinutes / 2);
    segments.push({
      id: `${baseId}_${dir}_seg0`,
      origin: { iata_code: from, name: getAirportDisplayName(from) },
      destination: { iata_code: to, name: getAirportDisplayName(to) },
      departure_at: departureAt,
      arrival_at: departureAt,
      duration: minutesToIsoDuration(halfMin),
      operating_carrier: { name: getAirlineName(airline), iata_code: airline },
      flight_number: `${airline}${flightNum}`,
      aircraft: null,
      stops: transfers,
    });
  }
  return segments;
}

export type SearchParams = {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
  maxOffers?: number;
  currency?: string;
  segments?: Array<{ origin: string; destination: string; departureDate: string }>;
  maxConnections?: number;
};

const SEARCH_CACHE_TTL = 20 * 60 * 1000;
const _searchCache = new Map<string, { data: FlightOffer[]; expires: number }>();

function _cacheKey(p: SearchParams): string {
  const segsKey = p.segments ? p.segments.map(s => `${s.origin}-${s.destination}-${s.departureDate}`).join(",") : "";
  return [p.origin ?? segsKey, p.destination ?? "", p.departureDate ?? "", p.returnDate ?? "", p.adults, p.cabinClass].join("|");
}

setInterval(() => {
  const now = Date.now();
  _searchCache.forEach((v, k) => {
    if (v.expires <= now) _searchCache.delete(k);
  });
}, 5 * 60 * 1000);

async function tpFetch(path: string, qs: Record<string, string>): Promise<any> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) throw new Error("TRAVELPAYOUTS_TOKEN not configured");
  const url = new URL(`https://api.travelpayouts.com${path}`);
  for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);
  url.searchParams.set("token", token);
  const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Travelpayouts API ${resp.status}: ${txt.slice(0, 200)}`);
  }
  return resp.json();
}

export const IS_LIVE_MODE = true;

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  const key = _cacheKey(params);
  const cached = _searchCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  const passengers = params.adults + params.children + params.infants;
  const currency = (params.currency ?? "USD").toUpperCase();
  const depart = params.departureDate;

  try {
    let offers: FlightOffer[] = [];

    if (params.segments && params.segments.length >= 2) {
      const seg0 = params.segments[0];
      const segN = params.segments[params.segments.length - 1];
      const data = await tpFetch("/v1/prices/cheap", {
        origin: seg0.origin,
        destination: segN.destination,
        currency,
        depart_date: seg0.departureDate.slice(0, 7),
      });
      const entries = Object.values((data?.data ?? {}) as Record<string, Record<string, any>>)
        .flatMap(v => Object.values(v));
      offers = entries.slice(0, params.maxOffers ?? 10).map((item: any) =>
        tpPriceToFlightOffer(seg0.origin, segN.destination, item, undefined, currency, passengers)
      );
    } else {
      const ori = params.origin ?? "";
      const dst = params.destination ?? "";
      const dep = params.departureDate ?? "";
      const [calData, cheapData] = await Promise.allSettled([
        tpFetch("/v1/prices/calendar", {
          origin: ori,
          destination: dst,
          currency,
          depart_date: dep,
          ...(params.returnDate ? { return_date: params.returnDate } : {}),
        }),
        tpFetch("/v1/prices/cheap", {
          origin: ori,
          destination: dst,
          currency,
          depart_date: dep.slice(0, 7),
          ...(params.returnDate ? { return_date: params.returnDate.slice(0, 7) } : {}),
        }),
      ]);

      const exactEntry = calData.status === "fulfilled"
        ? Object.values((calData.value?.data ?? {}) as Record<string, any>).filter((e: any) => {
            const d = (e.departure_at ?? e.depart_date ?? "").slice(0, 10);
            return d === dep;
          })
        : [];

      const destKey = dst.toUpperCase();
      const cheapEntries = cheapData.status === "fulfilled"
        ? Object.values((cheapData.value?.data?.[destKey] ?? cheapData.value?.data ?? {}) as Record<string, any>)
        : [];

      const combined = [...exactEntry, ...cheapEntries];
      combined.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));

      const unique = new Map<number, any>();
      for (const item of combined) {
        if (!unique.has(item.price)) unique.set(item.price, item);
      }

      offers = Array.from(unique.values())
        .slice(0, params.maxOffers ?? 10)
        .map((item: any) =>
          tpPriceToFlightOffer(ori, dst, item, params.returnDate, currency, passengers)
        );

      if (offers.length === 0 && cheapEntries.length > 0) {
        offers = cheapEntries.slice(0, params.maxOffers ?? 10).map((item: any) =>
          tpPriceToFlightOffer(ori, dst, item, params.returnDate, currency, passengers)
        );
      }
    }

    _searchCache.set(key, { data: offers, expires: Date.now() + SEARCH_CACHE_TTL });
    return offers;
  } catch (err: any) {
    console.error("[aviasales] searchFlights error:", err?.message);
    return [];
  }
}

export async function searchFlightForDate(
  origin: string,
  destination: string,
  date: string,
  adults: number,
  children: number,
  infants: number,
  cabinClass: string,
  returnDate?: string,
): Promise<FlightOffer | null> {
  try {
    const offers = await searchFlights({
      origin, destination, departureDate: date, returnDate,
      adults, children, infants, cabinClass, maxOffers: 1,
    });
    return offers[0] ?? null;
  } catch {
    return null;
  }
}

export async function searchCheapestFromAirport(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  adults: number,
  children: number,
  infants: number,
  cabinClass: string,
): Promise<{ offer: FlightOffer; origin: string } | null> {
  try {
    const offers = await searchFlights({
      origin, destination, departureDate, returnDate, adults, children, infants, cabinClass, maxOffers: 3,
    });
    if (offers.length === 0) return null;
    return { offer: offers[0], origin };
  } catch {
    return null;
  }
}

export async function getCalendarPrices(
  origin: string,
  destination: string,
  month: string,
  currency = "USD",
): Promise<Record<string, { price: number; airline: string }>> {
  try {
    const data = await tpFetch("/v1/prices/calendar", {
      origin,
      destination,
      currency: currency.toUpperCase(),
      depart_date: month,
    });
    const result: Record<string, { price: number; airline: string }> = {};
    for (const [, item] of Object.entries((data?.data ?? {}) as Record<string, any>)) {
      const dateKey = (item.departure_at ?? item.depart_date ?? "").slice(0, 10);
      if (dateKey) {
        result[dateKey] = { price: item.price ?? 0, airline: item.airline ?? "" };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function checkTPApiHealth(): Promise<boolean> {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) return false;
    const resp = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?origin=JFK&destination=LHR&token=${token}`, {
      signal: AbortSignal.timeout(5000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
