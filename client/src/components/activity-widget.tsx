import { Ticket } from "lucide-react";

const KLOOK_URL = "/go/klook";
const ORANGE = "hsl(32 95% 62%)";

export function ActivityWidget() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(247,176,100,0.05)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(247,176,100,0.2)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(247,176,100,0.14)", border: "1px solid rgba(247,176,100,0.25)" }}
        >
          <Ticket className="h-5 w-5" style={{ color: ORANGE }} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-0.5"
            style={{ color: ORANGE, opacity: 0.75 }}
          >
            Horizon Experiences
          </p>
          <p className="text-sm font-semibold text-foreground mb-1">
            Want to experience this yourself?
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Check Klook for discounted tickets and guided tours — day trips, attraction passes, local transport and more.
          </p>

          <a
            href={KLOOK_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            data-testid="activity-widget-klook"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: ORANGE, color: "hsl(220 20% 8%)" }}
          >
            Search local tours on Klook
          </a>
        </div>
      </div>
    </div>
  );
}
