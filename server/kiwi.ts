/**
 * Flight search via Travelpayouts / Aviasales API.
 * All booking links are affiliate links routed through /go/<partner>.
 */

export {
  CARRIER_BAGGAGE_DEFAULTS,
  DEFAULT_CARRIER_BAGGAGE,
  NEARBY_AIRPORT_MAP,
  AIRPORT_DISPLAY_NAMES,
  AIRPORT_CITY_NAMES,
  AIRLINE_NAMES,
  AIRPORT_COUNTRY_CODES,
  IS_LIVE_MODE,
  getNearbyAirports,
  getAirportDisplayName,
  searchCheapestFromAirport,
  getCalendarPrices,
  checkTPApiHealth,
  searchFlights,
  searchFlightForDate,
} from "./aviasales";

export type { SearchParams } from "./aviasales";
