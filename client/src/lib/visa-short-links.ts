import allCountries from "@/lib/all-countries.json";
import nepalGuideStatuses from "@/lib/nepal-guide-statuses.json";

type Country = { code: string; name: string };

function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const BY_SLUG = new Map<string, Country>();
for (const c of (allCountries as { countries: Country[] }).countries) {
  BY_SLUG.set(slugify(c.name), c);
  BY_SLUG.set(c.code.toLowerCase(), c);
}
// Common short names people will type from a video description.
const ALIASES: Record<string, string> = {
  usa: "US", us: "US", america: "US", uk: "GB", "united-kingdom": "GB", britain: "GB",
  uae: "AE", dubai: "AE", korea: "KR", "south-korea": "KR", czechia: "CZ",
};

const GUIDES = new Set(Object.keys((nepalGuideStatuses as { statuses: Record<string, string> }).statuses));

/** Short link (/visa/brazil) → the full Nepali tourist guide if one exists,
 *  else the generic Nepal → country page. null if the slug isn't a country. */
export function resolveShortLink(slug: string): string | null {
  const key = slugify(decodeURIComponent(slug));
  const code = ALIASES[key] ?? BY_SLUG.get(key)?.code;
  if (!code) return null;
  if (GUIDES.has(code)) return `/visa-guides/${code}/tourist`;
  const name = (allCountries as { countries: Country[] }).countries.find((c) => c.code === code)?.name ?? code;
  return `/visa/nepal/${slugify(name)}`;
}

/** The short link for a country, for showing/copying (e.g. "/visa/brazil"). */
export function shortLinkFor(countryName: string): string {
  return `/visa/${slugify(countryName)}`;
}
