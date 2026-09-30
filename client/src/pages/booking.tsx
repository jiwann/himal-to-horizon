import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plane } from "lucide-react";
import logoImg from "@assets/logo_1772143671966.png";
import { Button } from "@/components/ui/button";
import { loadOfferForBooking } from "@/lib/offer-cache";
import { formatCurrency } from "@/lib/utils";
import { buildGoogleFlightsUrl, trackAffiliateClick } from "@/lib/affiliate";
import { safePartnerOpen } from "@/lib/verify-status";
import type { FlightOffer } from "@shared/schema";

export { saveOfferForBooking } from "@/lib/offer-cache";

export default function BookingPage() {
  const [, setLocation] = useLocation();
  const offer: FlightOffer | null = loadOfferForBooking();

  useEffect(() => {
    if (!offer) setLocation("/");
  }, [offer, setLocation]);

  if (!offer) return null;

  const origin = offer.slices[0].origin.iata_code;
  const destination = offer.slices[offer.slices.length - 1].destination.iata_code;
  const depDate = offer.slices[0].departure_at?.slice(0, 10) ?? "";
  const retDate = offer.slices.length > 1 ? offer.slices[1].departure_at?.slice(0, 10) : undefined;
  const adults = offer.passengers_count ?? 1;
  const price = formatCurrency(offer.total_amount, offer.total_currency);
  const airline = offer.owner?.name ?? "";

  const otas = [
    {
      name: "Trip.com",
      label: "Global fares · hotels & packages bundle",
      url: "/go/trip",
      testId: "book-trip",
      primary: true,
    },
    {
      name: "Expedia",
      label: "Bundle discounts · loyalty rewards",
      url: "/go/expedia",
      testId: "book-expedia",
      primary: false,
    },
    {
      name: "CheapOair",
      label: "Discount fares · flexible ticket options",
      url: "/go/cheapoair",
      testId: "book-cheapoair",
      primary: false,
    },
    {
      name: "Google Flights",
      label: "Free price comparison — no booking fees",
      url: buildGoogleFlightsUrl(origin, destination, depDate, retDate),
      testId: "book-google",
      primary: false,
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(211 60% 8%)", color: "hsl(var(--foreground))" }}
    >
      <header
        className="sticky top-0 z-20 border-b px-4 py-3 flex items-center gap-3"
        style={{ background: "hsl(211 60% 8% / 0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <button
          type="button"
          onClick={() => window.history.back()}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          data-testid="back-to-results"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <img src={logoImg} alt="Himal to Horizon" className="h-7 w-auto" />
        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)", color: "hsl(22 79% 75%)" }}>
          Horizon's Booking Recommendations
        </span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div
            className="rounded-xl p-5 mb-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Plane className="h-4 w-4" style={{ color: "hsl(22 79% 75%)" }} />
              <span className="font-bold text-base" style={{ fontFamily: "var(--font-serif)" }}>
                {origin} → {destination}
              </span>
              {retDate && <span className="text-xs text-muted-foreground ml-1">(return)</span>}
            </div>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              <span>{airline}</span>
              <span>·</span>
              <span>{depDate}</span>
              <span>·</span>
              <span>{adults} passenger{adults > 1 ? "s" : ""}</span>
            </div>
            <div className="mt-3 text-2xl font-bold" style={{ color: "hsl(142 60% 55%)" }}>{price}</div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 text-center">
            We found this fare via live API search. Select an OTA below to complete your booking.
          </p>

          <div className="flex flex-col gap-3">
            {otas.map((ota) => (
              <a
                key={ota.name}
                href={ota.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-testid={ota.testId}
                onClick={(e) => {
                  e.preventDefault();
                  trackAffiliateClick(`metasearch_book_${ota.name.toLowerCase().replace(/[^a-z]/g, "")}`, { origin, destination, depDate });
                  safePartnerOpen(ota.url);
                }}
                className="flex items-center justify-between px-5 py-4 rounded-xl transition-all hover:opacity-90"
                style={ota.primary
                  ? { background: "hsl(22 79% 75%)", color: "hsl(211 60% 8%)" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "hsl(var(--foreground))" }
                }
              >
                <div>
                  <div className="font-bold">{ota.name}</div>
                  <div className={`text-xs mt-0.5 ${ota.primary ? "opacity-70" : "text-muted-foreground"}`}>{ota.label}</div>
                </div>
                <span className="text-sm font-semibold">Book →</span>
              </a>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground/60 text-center mt-6">
            Prices are from live API search. Final price may differ on the OTA. We may earn a commission on completed bookings.
          </p>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground"
              data-testid="back-to-search"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to results
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
