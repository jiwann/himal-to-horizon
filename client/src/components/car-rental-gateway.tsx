import { ExternalLink, Car } from "lucide-react";

const AMBER = "hsl(22 79% 75%)";

function buildLocalrentUrl(airportCode: string): string {
  const params = new URLSearchParams({
    from: airportCode.toUpperCase(),
    marker: "707746",
  });
  return `https://localrent.com/search?${params.toString()}`;
}

interface CarRentalGatewayProps {
  airportCode: string;
  cityName?: string;
}

export function CarRentalGateway({ airportCode, cityName }: CarRentalGatewayProps) {
  const deepLink = buildLocalrentUrl(airportCode);
  const displayCity = cityName ?? airportCode;

  return (
    <div
      className="rounded-2xl p-5 my-8"
      data-testid={`car-rental-gateway-${airportCode}`}
      style={{
        background: "rgba(99,179,237,0.04)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(99,179,237,0.18)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(99,179,237,0.12)" }}
        >
          <Car className="h-4 w-4" style={{ color: "hsl(205 80% 70%)" }} />
        </div>
        <div>
          <span
            className="text-[10px] font-black uppercase tracking-[0.15em] block"
            style={{ color: AMBER }}
          >
            Horizon Car Rentals
          </span>
          <h3 className="text-sm font-bold text-foreground">
            Renting a car in {displayCity}?
          </h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Skip the airport counter queues. Localrent connects you directly with local suppliers —
        usually 20–40% cheaper than the big chains, with lower deposits and transparent pricing.
        Your pickup airport ({airportCode.toUpperCase()}) is pre-selected.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer sponsored"
          data-testid={`car-rental-cta-${airportCode}`}
          className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "hsl(205 80% 70%)", color: "hsl(220 20% 10%)" }}
        >
          <ExternalLink className="h-4 w-4" />
          Search cars at {airportCode.toUpperCase()}
        </a>
        <a
          href="/cars"
          data-testid="car-rental-all-partners"
          className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
          style={{
            background: "rgba(99,179,237,0.08)",
            border: "1px solid rgba(99,179,237,0.2)",
            color: "hsl(205 80% 70%)",
            textDecoration: "none",
          }}
        >
          All car rental partners →
        </a>
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-3 leading-relaxed">
        Affiliate link — Himal to Horizon earns a small commission if you book. Price you pay is unaffected.
      </p>
    </div>
  );
}
