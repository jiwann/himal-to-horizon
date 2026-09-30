import { useEffect } from "react";
import { useLocation } from "wouter";
import { Mountain, Camera, Youtube, Heart, Compass, ArrowLeft, Globe, Star } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useLanguage } from "@/contexts/language-context";
import { setSEO, resetSEO } from "@/lib/seo";

export default function AboutPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    setSEO({
      title: "About — Our Story",
      description: "Himal to Horizon is a free travel advisory by Synergy Soul LLC. No booking fees, no mark-ups — just honest flight search, visa intel, and destination guides.",
      path: "/about",
    });
    return () => { resetSEO(); };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className="sticky top-0 z-40 border-b border-border/40"
        style={{ background: "hsl(var(--background) / 0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="about-back"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("about.back")}
          </button>
          <span className="text-border/60">·</span>
          <span className="text-sm font-semibold" style={{ color: "hsl(22 79% 75%)" }}>{t("nav.about")}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-14">
          <div className="flex justify-center mb-5">
            <img
              src={logoImg}
              alt="Himal to Horizon"
              className="w-20 h-20 rounded-full object-cover ring-2"
              style={{ outline: "2px solid hsl(22 79% 75% / 0.4)" }}
            />
          </div>
          <h1
            className="text-4xl font-extrabold mb-3"
            style={{ fontFamily: "var(--font-serif)", color: "hsl(22 79% 75%)" }}
          >
            Himal to Horizon
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t("about.hero_subtitle")}
          </p>
        </div>

        <section
          className="rounded-2xl p-8 mb-10"
          style={{
            background: "rgba(247,176,136,0.05)",
            border: "1px solid rgba(247,176,136,0.18)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "hsl(22 79% 75% / 0.15)", border: "1px solid hsl(22 79% 75% / 0.3)" }}
            >
              <Mountain className="h-5 w-5" style={{ color: "hsl(22 79% 75%)" }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              {t("about.creator_title")}
            </h2>
          </div>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>{t("about.creator_p1")}</p>
            <p>{t("about.creator_p2")}</p>
            <p>{t("about.creator_p3")}</p>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <section
            className="rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,0,0,0.12)", border: "1px solid rgba(255,0,0,0.2)" }}
              >
                <Youtube className="h-4 w-4" style={{ color: "#FF4444" }} />
              </div>
              <h3 className="font-bold text-foreground">{t("about.youtube_title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("about.youtube_desc")}
            </p>
            <a
              href="https://youtube.com/@himaltohorizon"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="about-youtube-link"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold transition-colors"
              style={{ color: "#FF4444" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Youtube className="h-3.5 w-3.5" />
              {t("about.youtube_link")}
            </a>
          </section>

          <section
            className="rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "hsl(22 79% 75% / 0.12)", border: "1px solid hsl(22 79% 75% / 0.25)" }}
              >
                <Camera className="h-4 w-4" style={{ color: "hsl(22 79% 75%)" }} />
              </div>
              <h3 className="font-bold text-foreground">{t("about.photo_title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("about.photo_desc")}
            </p>
          </section>
        </div>

        <section
          className="rounded-2xl p-8 mb-10"
          style={{
            background: "rgba(56,200,120,0.04)",
            border: "1px solid rgba(56,200,120,0.18)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <Heart className="h-5 w-5 shrink-0" style={{ color: "hsl(145 65% 55%)" }} />
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              {t("about.mission_title")}
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {t("about.mission_p1")}
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {([
              { icon: Compass, label: t("about.pillar_1_label"), desc: t("about.pillar_1_desc") },
              { icon: Globe, label: t("about.pillar_2_label"), desc: t("about.pillar_2_desc") },
              { icon: Star, label: t("about.pillar_3_label"), desc: t("about.pillar_3_desc") },
            ] as const).map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{ background: "rgba(56,200,120,0.06)", border: "1px solid rgba(56,200,120,0.14)" }}
              >
                <Icon className="h-4 w-4 mb-2" style={{ color: "hsl(145 65% 55%)" }} />
                <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How Our Technology Works */}
        <section
          className="rounded-2xl p-8 mb-10"
          style={{
            background: "rgba(99,179,237,0.04)",
            border: "1px solid rgba(99,179,237,0.16)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(99,179,237,0.14)", border: "1px solid rgba(99,179,237,0.28)" }}
            >
              <Compass className="h-5 w-5" style={{ color: "hsl(205 80% 65%)" }} />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              How Our Technology Works
            </h2>
          </div>

          <div className="space-y-6 text-muted-foreground leading-relaxed text-sm">
            <div>
              <h3 className="font-bold text-foreground mb-2" style={{ color: "hsl(205 80% 70%)" }}>
                Horizon Hop™ — The Stopover That Pays You Back
              </h3>
              <p>
                Horizon Hop™ is our proprietary fare-engineering feature that turns a traditional layover into a free or discounted city break. When you search for a flight — say, Dallas to Kathmandu — our system simultaneously checks alternative routings that pass through major hub cities such as Kuala Lumpur, Doha, Dubai, or Istanbul. Instead of booking a simple through-ticket, Horizon Hop™ splits the journey into two separate bookings: the first leg takes you from your origin to the hub city, and a second booking departs the hub city onward to your final destination days later.
              </p>
              <p className="mt-2">
                The mathematics works because hub city fares are often priced at a significant discount relative to the full through-fare. By staying two to seven nights in the hub — effectively a free stopover holiday — and booking both segments independently, the combined cost can be hundreds of dollars cheaper than a direct itinerary. Our algorithm evaluates dozens of hub combinations in real time, calculates the net saving after accounting for accommodation estimates, and only surfaces a Horizon Hop recommendation when the saving is meaningful. The result is a trip that costs less, offers more, and lets you explore an extra city along the way.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-foreground mb-2" style={{ color: "hsl(22 79% 75%)" }}>
                Horizon's Insight™ — Value Intelligence for Every Search
              </h3>
              <p>
                Horizon's Insight™ is our real-time price intelligence engine. Every time you search, the system quietly runs a parallel ±7 day date scan across your chosen route — checking fourteen departure date variations simultaneously — to identify whether a nearby date offers a materially lower fare. If it finds a saving of 5% or more, the Horizon's Insight banner appears, showing you the alternate departure and return dates alongside the exact dollar saving.
              </p>
              <p className="mt-2">
                Beyond date flexibility, Horizon's Insight™ powers our Stay Optimizer™ slider, which lets you drag a timeline to explore how different trip durations affect your total fare. Longer stays often unlock lower fares because many airlines price round trips based on the day-of-week you depart or return. The system tracks historical price data for each route, builds a Price Confidence score, and tells you whether current fares are likely to rise or fall — so you know whether to book now or wait. Together, these tools replace guesswork with genuine value intelligence, helping the South Asian diaspora and global long-stay travellers make smarter booking decisions every time.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center">
          <button
            type="button"
            data-testid="about-start-searching"
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: "hsl(22 79% 75%)", color: "hsl(211 60% 8%)", fontFamily: "var(--font-sans)" }}
          >
            <Compass className="h-4 w-4" />
            {t("about.cta")}
          </button>
          <p className="text-xs text-muted-foreground mt-3">
            {t("about.cta_footer")}
          </p>
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            Himal to Horizon is operated by Synergy Soul LLC, an American-based technology company dedicated to travel optimization.
          </p>
        </div>
      </main>
    </div>
  );
}
