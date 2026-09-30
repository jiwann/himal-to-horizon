import { z } from "zod";

export const passengerSchema = z.object({
  adults: z.number().min(1).max(9).default(1),
  children: z.number().min(0).max(8).default(0),
  infants: z.number().min(0).max(4).default(0),
});

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "AUD", "INR", "BRL"] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export const multiCitySegmentSchema = z.object({
  origin: z.string().min(2).max(4),
  destination: z.string().min(2).max(4),
  departureDate: z.string().min(1),
});

export type MultiCitySegment = z.infer<typeof multiCitySegmentSchema>;

export const flightSearchSchema = z.object({
  origin: z.string().min(0).max(4).default(""),
  destination: z.string().min(0).max(4).default(""),
  departureDate: z.string().default(""),
  returnDate: z.string().optional(),
  passengers: passengerSchema,
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  tripType: z.enum(["one_way", "round_trip", "multi_city"]).default("round_trip"),
  includeNearbyAirports: z.boolean().default(false),
  directOnly: z.boolean().default(false),
  currency: z.enum(SUPPORTED_CURRENCIES).default("USD"),
  segments: z.array(multiCitySegmentSchema).optional(),
});

export const calendarSearchSchema = z.object({
  origin: z.string().min(2).max(4),
  destination: z.string().min(2).max(4),
  month: z.string(),
  passengers: passengerSchema,
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
});

export type FlightSearchInput = z.infer<typeof flightSearchSchema>;
export type CalendarSearchInput = z.infer<typeof calendarSearchSchema>;
export type Passengers = z.infer<typeof passengerSchema>;

export type FlightSlice = {
  id: string;
  origin: { iata_code: string; name: string; city_name: string; iata_country_code?: string };
  destination: { iata_code: string; name: string; city_name: string; iata_country_code?: string };
  departure_at: string;
  arrival_at: string;
  duration: string;
  segments: FlightSegment[];
};

export type FlightSegment = {
  id: string;
  origin: { iata_code: string; name: string };
  destination: { iata_code: string; name: string };
  departure_at: string;
  arrival_at: string;
  duration: string;
  operating_carrier: { name: string; iata_code: string; logo_symbol_url?: string };
  flight_number: string;
  aircraft?: { name: string } | null;
  stops: number;
};

export type FlightOffer = {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount: string;
  slices: FlightSlice[];
  passengers_count: number;
  passengerIds: string[];
  owner: { name: string; iata_code: string; logo_symbol_url?: string };
  expires_at: string;
  checkedBags: number;
  carryOnBags: number;
  personalItemOnly: boolean;
  baggageEstimated: boolean;
  bookingUrl?: string;
  conditions?: {
    refund_before_departure?: { allowed: boolean };
    change_before_departure?: { allowed: boolean };
  };
};

export type HimalInsight = {
  originalDate: string;
  alternateDate: string;
  originalPrice: number;
  alternatePrice: number;
  savings: number;
  savingsPercent: number;
  currency: string;
  offerId: string;
  alternateCheckedBags?: number;
  alternateCarryOnBags?: number;
};

export type H2HTip = {
  direction: "origin" | "destination";
  searchedCode: string;
  searchedName: string;
  alternateCode: string;
  alternateName: string;
  searchedPrice: number;
  alternatePrice: number;
  savings: number;
  savingsPercent: number;
  currency: string;
};

export type FlightSearchResult = {
  offers: FlightOffer[];
  himalInsight?: HimalInsight;
  h2hTips: H2HTip[];
  searchedDates: { departure: string; return?: string };
};

export type CalendarDay = {
  date: string;
  price?: number;
  currency?: string;
  available: boolean;
};

export type AirportOption = {
  iata: string;
  name: string;
  city: string;
  country: string;
};

export type GoldenOpportunity = {
  currentDepartureDate: string;
  alternateDepartureDate: string;
  alternateReturnDate?: string;
  currentPrice: number;
  alternatePrice: number;
  savings: number;
  savingsPercent: number;
  currency: string;
  dayOffset: number;
  alternateCheckedBags?: number;
  alternateCarryOnBags?: number;
  airlineName?: string;
  offerId?: string;
};

export type StayExtraDayInsight = {
  returnDate: string;
  alternatePrice: number;
  savings: number;
  savingsPercent: number;
  currency: string;
};

export type StayOptimizerDeal = {
  segmentIdx: number;
  stopoverCity: string;
  gapNights: number;
  priceDrop: number;
  totalHotelCost: number;
  netSavings: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  bookingUrl: string;
  checkedBags?: number;
  carryOnBags?: number;
};

export type MultiCityInsightResult = {
  originalTotal: number;
  optimizedTotal: number;
  savings: number;
  savingsPercent: number;
  shiftDays: number;
  optimizedSegments: MultiCitySegment[];
  currency: string;
  stayOptimizerDeals: StayOptimizerDeal[];
};

export type HubStayDeal = {
  transitCity: string;
  transitCityName: string;
  originalFare: number;
  leg1Price: number;
  leg2Price: number;
  netSavings: number;
  currency: string;
  leg1Date: string;
  leg2Date: string;
  leg2OffsetDays: number;
  leg1DateOffset: number;
  checkedBags?: number;
  carryOnBags?: number;
  bookingUrl: string;
};

export type HorizonHopResult = {
  hubIata: string;
  hubCity: string;
  totalPrice: number;
  directPrice: number;
  savings: number;
  currency: string;
  leg1Date: string;
  leg2Date: string;
  offerId: string;
  checkedBags?: number;
  carryOnBags?: number;
  hopDirection: "outbound" | "return";
  nightsAtHub: number;
  hopPrice: number;
  companionOfferId?: string;
  companionPrice?: number;
  companionDepartureDate?: string;
};

export type WideInsightPricePoint = {
  date: string;
  price: number;
  currency: string;
};

export type WideInsightResult = {
  opportunity: GoldenOpportunity | null;
  stayExtraDay: StayExtraDayInsight | null;
  priceMap: WideInsightPricePoint[];
  currentPrice: number;
  currentCurrency: string;
};

export const passengerDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "undisclosed"], { required_error: "Gender is required" }),
  email: z.string().email("Enter a valid email address"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(5, "Enter a valid phone number"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(5, "Emergency contact phone is required"),
  passportNumber: z.string().optional(),
  passportIssuingCountry: z.string().optional(),
  passportExpiryDate: z.string().optional(),
});
export type PassengerDetails = z.infer<typeof passengerDetailsSchema>;

// ── Auth & User ──────────────────────────────────────────────────────────────

export type User = {
  id: number;
  email: string;
  name: string | null;
  homeAirport: string | null;
  homeAirportLabel: string | null;
  googleId: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export type InsertUser = {
  email: string;
  passwordHash?: string | null;
  name?: string | null;
  homeAirport?: string | null;
  homeAirportLabel?: string | null;
  googleId?: string | null;
  emailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
};

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  emailVerified: boolean;
  hasGoogle: boolean;
  createdAt: string;
  postCount: number;
  commentCount: number;
  reportCount: number;
};

export type FavoriteRoute = {
  id: number;
  userId: number;
  origin: string;
  destination: string;
  originLabel: string | null;
  destinationLabel: string | null;
  createdAt: string;
};

export type PriceAlert = {
  id: number;
  userId: number;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  cabinClass: string;
  passengersAdult: number;
  baselinePrice: number;
  currency: string;
  isActive: boolean;
  lastAlertedAt: string | null;
  createdAt: string;
};

export const createAlertSchema = z.object({
  origin: z.string().min(2).max(4),
  destination: z.string().min(2).max(4),
  departureDate: z.string(),
  returnDate: z.string().optional(),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  passengersAdult: z.number().min(1).default(1),
  baselinePrice: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES).default("USD"),
});
export type CreateAlertInput = z.infer<typeof createAlertSchema>;

export const waitlistEntrySchema = z.object({
  email: z.string().email(),
  service: z.enum(["stays", "cars", "insurance", "visa"]),
});
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const visaFeedbackSchema = z.object({
  countryPair: z.string().min(1).max(100),
  issue: z.string().min(5).max(1000),
  correctInfo: z.string().min(3).max(1000),
  email: z.string().email().optional().or(z.literal("")),
});
export type VisaFeedbackInput = z.infer<typeof visaFeedbackSchema>;

// ── Community Travel Platform ─────────────────────────────────────────────────

export const RECOMMENDATION_CATEGORIES = ["food", "stay", "activity", "guide", "tip"] as const;
export type RecommendationCategory = typeof RECOMMENDATION_CATEGORIES[number];

export const COMMUNITY_POST_TYPES = ["story", "recommendation", "visa_experience"] as const;
export type CommunityPostType = typeof COMMUNITY_POST_TYPES[number];

// First-hand visa outcomes travelers report (approved/denied/RFE/pending),
// tied to a "visa_experience" post. This is separate from the researched
// visa-profiles data (server/data/visa-profiles.json) -- it's self-reported
// anecdata, shown as such, never blended into the requirements-complexity
// ranking or presented as an official statistic.
export const VISA_OUTCOMES = ["approved", "denied", "rfe", "pending"] as const;
export type VisaOutcome = typeof VISA_OUTCOMES[number];

export const MAX_PHOTOS_PER_POST = 8;

export const insertCommunityPostSchema = z
  .object({
    type: z.enum(COMMUNITY_POST_TYPES),
    title: z.string().min(3, "Add a short title or place name").max(160),
    story: z.string().max(12000).default(""),
    countryCode: z.string().min(2).max(3),
    countryName: z.string().min(1).max(120),
    city: z.string().max(120).optional().or(z.literal("")),
    category: z.enum(RECOMMENDATION_CATEGORIES).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    visaOutcome: z.enum(VISA_OUTCOMES).optional(),
    processingTimeReported: z.string().max(120).optional().or(z.literal("")),
    photos: z.array(z.string().max(600)).max(MAX_PHOTOS_PER_POST).default([]),
  })
  .superRefine((d, ctx) => {
    if (d.type === "story") {
      if (d.story.trim().length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Write your story", path: ["story"] });
      }
    } else if (d.type === "visa_experience") {
      if (!d.visaOutcome) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select an outcome", path: ["visaOutcome"] });
      }
      if (d.story.trim().length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Share what happened", path: ["story"] });
      }
    } else {
      if (!d.category) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pick a category", path: ["category"] });
      }
      if (d.rating == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Add a star rating", path: ["rating"] });
      }
    }
  });
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

export const communityReportSchema = z.object({
  reason: z.string().max(400).default(""),
});
export type CommunityReportInput = z.infer<typeof communityReportSchema>;

export const insertCommunityCommentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment").max(2000),
});
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

export type CommunityComment = {
  id: number;
  postId: number;
  userId: number;
  authorName: string;
  body: string;
  createdAt: string;
};

export type CommunityPost = {
  id: number;
  userId: number;
  authorName: string;
  type: CommunityPostType;
  title: string;
  story: string;
  countryCode: string;
  countryName: string;
  city: string | null;
  category: RecommendationCategory | null;
  rating: number | null;
  visaOutcome: VisaOutcome | null;
  processingTimeReported: string | null;
  photos: string[];
  originalLang: string;
  status: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

export type CommunityPostTranslation = {
  title: string;
  story: string;
};

export type CommunityDestination = {
  countryCode: string;
  countryName: string;
  postCount: number;
};

export type CommunityCity = {
  city: string;
  postCount: number;
};

export type CommunityReport = {
  id: number;
  postId: number;
  userId: number;
  reason: string | null;
  createdAt: string;
  postTitle: string | null;
  postStatus: string | null;
  countryName: string | null;
};
