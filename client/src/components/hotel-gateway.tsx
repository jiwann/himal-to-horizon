import { ExternalLink, Hotel } from "lucide-react";

const AMBER  = "hsl(22 79% 75%)";
const VIOLET = "hsl(270 60% 70%)";

interface HotelGatewayProps {
  cityName: string;
}

export function HotelGateway({ cityName }: HotelGatewayProps) {
  return (
    <div
      className="rounded-2xl p-5 my-8"
      data-testid={`hotel-gateway-${cityName.toLowerCase().replace(/\s+/g, "-")}`}
      style={{
        background: "rgba(247,176,136,0.04)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(247,176,136,0.18)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(247,176,136,0.12)" }}
        >
          <Hotel className="h-4 w-4" style={{ color: AMBER }} />
        </div>
        <div>
          <span
            className="text-[10px] font-black uppercase tracking-[0.15em] block"
            style={{ color: AMBER }}
          >
            Horizon Stays
          </span>
          <h3 className="text-sm font-bold text-foreground">
            Looking for a place to stay in {cityName}?
          </h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        We compare two of the best hotel networks so you get the lowest rate. Agoda typically leads on Asian and South American properties; Hotels.com is great for flexible cancellation and North American travel.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href="/go/agoda-search"
          target="_blank"
          rel="noopener noreferrer sponsored"
          data-testid={`hotel-agoda-${cityName.toLowerCase().replace(/\s+/g, "-")}`}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 flex-1"
          style={{ background: AMBER, color: "hsl(220 20% 10%)" }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Check Agoda Prices
        </a>
        <a
          href="/go/hotels"
          target="_blank"
          rel="noopener noreferrer sponsored"
          data-testid={`hotel-hotelscom-${cityName.toLowerCase().replace(/\s+/g, "-")}`}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 flex-1"
          style={{
            background: "rgba(160,100,240,0.10)",
            border: "1px solid rgba(160,100,240,0.25)",
            color: VIOLET,
            textDecoration: "none",
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Check Hotels.com Prices
        </a>
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-3 leading-relaxed">
        Affiliate links — Himal to Horizon earns a small commission if you book. Price you pay is unaffected.
      </p>
    </div>
  );
}
