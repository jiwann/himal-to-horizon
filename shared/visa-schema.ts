import { z } from "zod";

// ── Visa Intelligence ────────────────────────────────────────────────────
// Every profile is keyed by (origin passport country → destination country →
// visa category). Today the site only has data for Nepali passport holders
// (fromCountryCode "NP"), but the shape supports adding other origin
// countries (India, Pakistan, Bangladesh, Afghanistan, ...) later without
// another schema/data migration — just add more profiles with a different
// fromCountryCode.

export const VISA_CATEGORIES = [
  "tourist", // short-stay visit / tourism
  "student_f1", // USA F-1 academic student
  "exchange_j1", // USA J-1 exchange visitor (Work & Travel, Au Pair, Intern/Trainee)
  "work_h2b", // USA H-2B temporary non-agricultural worker
  "student_general", // generic student visa for non-US destinations (AU/NZ/UK/EU/etc.)
  "work_general", // generic skilled/general work visa for non-Gulf destinations
] as const;
export type VisaCategory = (typeof VISA_CATEGORIES)[number];

export const VISA_CATEGORY_LABELS: Record<VisaCategory, string> = {
  tourist: "Tourist / Visit",
  student_f1: "Student (F-1)",
  exchange_j1: "Exchange Visitor (J-1)",
  work_h2b: "Temporary Worker (H-2B)",
  student_general: "Student Visa",
  work_general: "Work Visa",
};

// Status of the underlying application channel — distinct from old
// visa-free/eVisa language, since every category here requires *some* active
// application for the applicant's passport (unless status is visa_free).
export const APPLICATION_STATUS = [
  "evisa", // apply online, no embassy visit
  "visa_on_arrival",
  "embassy_visa", // sticker visa via embassy/VFS, appointment required
  "sponsor_program", // J-1 style — requires a designated sponsor organization first
  "employer_petition", // H-2B style — employer/agent files on applicant's behalf first
  "visa_free", // no visa/application needed for the stay length shown; entry requirements (passport validity, proof of onward travel, etc.) still apply
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

export const visaStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});
export type VisaStep = z.infer<typeof visaStepSchema>;

export const visaLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});
export type VisaLink = z.infer<typeof visaLinkSchema>;

export const visaProfileSchema = z.object({
  // Defaulted (not required) so every existing profile in visa-profiles.json
  // that predates this field still parses as Nepal — see the migration note
  // in server/data/visa-profiles.json history. New entries should always set
  // this explicitly rather than relying on the default.
  fromCountryCode: z.string().length(2).default("NP"), // ISO 3166-1 alpha-2, passport/origin country
  countryCode: z.string().length(2), // ISO 3166-1 alpha-2, destination country
  countryName: z.string().min(1),
  category: z.enum(VISA_CATEGORIES),
  status: z.enum(APPLICATION_STATUS),
  summary: z.string().min(1).max(300), // one-line takeaway for list views
  overview: z.string().min(1), // longer plain-language explanation
  steps: z.array(visaStepSchema).min(1),
  requiredDocuments: z.array(z.string().min(1)).min(1),
  processingTime: z.string().min(1),
  fee: z.string().min(1),
  maxStay: z.string().optional(),
  officialLinks: z.array(visaLinkSchema).min(1),
  nearestEmbassy: z
    .object({
      city: z.string(),
      country: z.string(),
      address: z.string().optional(),
      mapsUrl: z.string().url().optional(),
      note: z.string().optional(), // e.g. "Applications via VFS Global, New Delhi"
    })
    .optional(),
  faqs: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),
  notes: z.string().optional(), // caveats, edge cases
  // Editorial trust fields — surfaced in the UI so users know how fresh/verified
  // the information is. This matters a lot for a site people rely on for real
  // decisions.
  verified: z.boolean().default(false),
  lastReviewed: z.string().nullable().default(null), // ISO date, null = not yet reviewed
  sourceNotes: z.string().optional(), // where this was compiled from
});
export type VisaProfile = z.infer<typeof visaProfileSchema>;

export function visaProfileKey(fromCountryCode: string, countryCode: string, category: VisaCategory): string {
  return `${fromCountryCode.toUpperCase()}:${countryCode.toUpperCase()}:${category}`;
}
