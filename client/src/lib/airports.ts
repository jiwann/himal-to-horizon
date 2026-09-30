export type Airport = {
  iata: string;
  name: string;
  city: string;
  country: string;
};

export const POPULAR_AIRPORTS: Airport[] = [
  { iata: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States" },
  { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "United States" },
  { iata: "LHR", name: "Heathrow", city: "London", country: "United Kingdom" },
  { iata: "DXB", name: "Dubai International", city: "Dubai", country: "UAE" },
  { iata: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore" },
  { iata: "TPA", name: "Tampa International Airport", city: "Tampa", country: "United States" },
  { iata: "MIA", name: "Miami International Airport", city: "Miami", country: "United States" },
  { iata: "KTM", name: "Tribhuvan International", city: "Kathmandu", country: "Nepal" },
  { iata: "ORD", name: "O'Hare International", city: "Chicago", country: "United States" },
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta Intl", city: "Atlanta", country: "United States" },
  { iata: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "United States" },
  { iata: "MCO", name: "Orlando International Airport", city: "Orlando", country: "United States" },
  { iata: "BOS", name: "Logan International Airport", city: "Boston", country: "United States" },
  { iata: "SEA", name: "Seattle-Tacoma International", city: "Seattle", country: "United States" },
  { iata: "SFO", name: "San Francisco International", city: "San Francisco", country: "United States" },
  { iata: "DEN", name: "Denver International Airport", city: "Denver", country: "United States" },
  { iata: "IAD", name: "Dulles International", city: "Washington DC", country: "United States" },
  { iata: "EWR", name: "Newark Liberty International", city: "Newark", country: "United States" },
  { iata: "LGW", name: "Gatwick", city: "London", country: "United Kingdom" },
  { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom" },
  { iata: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom" },
  { iata: "AUH", name: "Abu Dhabi International", city: "Abu Dhabi", country: "UAE" },
  { iata: "DOH", name: "Hamad International", city: "Doha", country: "Qatar" },
  { iata: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "Canada" },
  { iata: "YVR", name: "Vancouver International", city: "Vancouver", country: "Canada" },
  { iata: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia" },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia" },
  { iata: "KUL", name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "Malaysia" },
  { iata: "DEL", name: "Indira Gandhi International", city: "New Delhi", country: "India" },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", country: "India" },
  { iata: "BLR", name: "Kempegowda International", city: "Bengaluru", country: "India" },
  { iata: "MAA", name: "Chennai International", city: "Chennai", country: "India" },
  { iata: "CCU", name: "Netaji Subhas Chandra Bose Intl", city: "Kolkata", country: "India" },
  { iata: "HYD", name: "Rajiv Gandhi International", city: "Hyderabad", country: "India" },
  { iata: "AMD", name: "Sardar Vallabhbhai Patel Intl", city: "Ahmedabad", country: "India" },
  { iata: "KHI", name: "Jinnah International", city: "Karachi", country: "Pakistan" },
  { iata: "LHE", name: "Allama Iqbal International", city: "Lahore", country: "Pakistan" },
  { iata: "ISB", name: "Islamabad International", city: "Islamabad", country: "Pakistan" },
  { iata: "DAC", name: "Hazrat Shahjalal International", city: "Dhaka", country: "Bangladesh" },
  { iata: "CMB", name: "Bandaranaike International", city: "Colombo", country: "Sri Lanka" },
];

export function searchAirports(query: string): Airport[] {
  if (!query || query.length < 1) return POPULAR_AIRPORTS.slice(0, 8);
  const q = query.toLowerCase();
  return POPULAR_AIRPORTS.filter(
    (a) =>
      a.iata.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  ).slice(0, 8);
}
