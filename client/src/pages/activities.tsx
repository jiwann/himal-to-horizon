import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Compass, ExternalLink, User } from "lucide-react";
import { NavTabs } from "@/components/nav-tabs";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@/assets/logo.png";
import { VisaWidget } from "@/components/visa-widget";
import { AuthModal } from "@/components/auth-modal";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/contexts/auth-context";
import { setSEO, resetSEO } from "@/lib/seo";

const ORANGE  = "hsl(32 95% 62%)";
const AMBER   = "hsl(22 79% 75%)";
const PURPLE  = "hsl(270 60% 70%)";

export default function ActivitiesPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setSEO({
      title: "Activities & Tours — Discover Things to Do",
      description: "Find tours, attractions, and activities worldwide. Book through Klook, Tiqets, and WeGoTrip — curated by Himal to Horizon.",
      path: "/activities",
    });
    return () => { resetSEO(); };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "linear-gradient(180deg, rgba(11,20,33,0.97) 0%, rgba(16,28,45,0.97) 100%)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(247,176,136,0.18)" }}
      >
        <div className="max-w-6xl mx-auto px-4 pt-3 pb-0 flex items-center gap-3">
          <button type="button" onClick={() => setLocation("/")} className="flex items-center gap-2">
            <img src={logoImg} alt="Himal to Horizon" className="w-6 h-6 rounded-full object-cover" />
            <span className="text-sm font-semibold" style={{ color: AMBER }}>Himal to Horizon</span>
          </button>
          <div className="hidden sm:flex items-center gap-4 ml-auto">
            <button type="button" data-testid="nav-visa-guides" onClick={() => setLocation("/visa-guides")} className="text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = AMBER)} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}>{t("nav.visa_guides")}</button>
            <button type="button" data-testid="nav-travel-blog" onClick={() => setLocation("/blog")} className="text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = AMBER)} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}>{t("nav.travel_blog")}</button>
            {user ? <UserMenu user={user} /> : (
              <button type="button" data-testid="button-sign-in" onClick={() => setAuthOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(247,176,136,0.15)", color: AMBER, border: "1px solid rgba(247,176,136,0.3)" }}>
                <User className="w-3 h-3" />{t("common.sign_in")}
              </button>
            )}
          </div>
        </div>
        <NavTabs />
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">

        {/* ── Page title ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(247,176,100,0.12)", border: "1px solid rgba(247,176,100,0.25)" }}
            >
              <Compass className="h-5 w-5" style={{ color: ORANGE }} />
            </div>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-serif)" }}>
              {t("activities.title")}
            </h1>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {t("activities.desc")}
          </p>
        </div>

        {/* ── Two-column layout: partners + sidebar ── */}
        <div className="flex gap-8 items-start">

          {/* ── Partner cards ── */}
          <div className="flex-1 space-y-4">

            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: AMBER }}
              >
                {t("common.verified_partners")}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(247,176,136,0.2)" }} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">

              {/* ── Klook (Top Pick) ── */}
              <a
                href="/go/klook"
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-testid="activities-klook"
                className="group flex flex-col gap-4 p-6 rounded-2xl transition-all duration-150 hover:border-orange-400/40"
                style={{
                  background: "rgba(247,176,100,0.06)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(247,176,100,0.22)",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(247,176,100,0.14)" }}
                  >
                    🎟️
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(247,176,100,0.18)", color: ORANGE }}
                  >
                    {t("common.top_pick")}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {t("activities.klook_title")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("activities.klook_desc")}
                  </p>
                </div>

                <div
                  className="flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90"
                  style={{ background: ORANGE, color: "hsl(220 20% 10%)" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("activities.klook_cta")}
                </div>
              </a>

              {/* ── Tiqets ── */}
              <a
                href="/go/tiqets"
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-testid="activities-tiqets"
                className="group flex flex-col gap-4 p-6 rounded-2xl transition-all duration-150 hover:border-purple-400/30"
                style={{
                  background: "rgba(160,100,240,0.04)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(160,100,240,0.16)",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(160,100,240,0.10)" }}
                  >
                    🏛️
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(160,100,240,0.12)", color: PURPLE }}
                  >
                    {t("common.live_badge")}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    Tiqets
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("activities.tiqets_desc")}
                  </p>
                </div>

                <div
                  className="flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90"
                  style={{ background: "rgba(160,100,240,0.18)", color: PURPLE, border: "1px solid rgba(160,100,240,0.3)" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("activities.tiqets_cta")}
                </div>
              </a>
            </div>

            {/* ── Visa Widget ── */}
            <div className="rounded-2xl p-5 mt-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: ORANGE }}>{t("activities.visa_warn")}</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t("activities.visa_warn_desc")}</p>
              <VisaWidget />
            </div>

            {/* ── What to book on Klook ── */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(247,176,100,0.04)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(247,176,100,0.15)",
              }}
            >
              <h2
                className="text-xl font-extrabold mb-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                🎯 {t("activities.what_to_book")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {t("activities.what_to_book_desc")}
              </p>

              <div className="space-y-4">
                {[
                  { icon: "🎢", titleKey: "activities.book_parks_title" as const, bodyKey: "activities.book_parks_body" as const },
                  { icon: "🚌", titleKey: "activities.book_tours_title" as const, bodyKey: "activities.book_tours_body" as const },
                  { icon: "🚄", titleKey: "activities.book_rail_title" as const, bodyKey: "activities.book_rail_body" as const },
                  { icon: "📱", titleKey: "activities.book_sim_title" as const, bodyKey: "activities.book_sim_body" as const },
                ].map((r) => (
                  <div
                    key={r.titleKey}
                    className="flex gap-4 p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{r.icon}</span>
                    <div>
                      <h3 className="font-bold text-foreground text-sm mb-1">{t(r.titleKey as any)}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(r.bodyKey as any)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Sidebar ── */}
          <aside
            className="hidden lg:flex flex-col gap-3 w-64 shrink-0 sticky"
            style={{ top: "80px" }}
            data-testid="activities-sidebar"
          >
            <div className="flex items-center gap-2 mb-1">
              <Compass className="h-3.5 w-3.5" style={{ color: ORANGE }} />
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: ORANGE }}
              >
                {t("activities.horizon_tips")}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(247,176,100,0.2)" }} />
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(247,176,100,0.05)", border: "1px solid rgba(247,176,100,0.18)" }}
            >
              <p className="text-xs font-bold mb-2" style={{ color: ORANGE }}>{t("activities.checklist_title")}</p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                {([
                  "activities.checklist_1",
                  "activities.checklist_2",
                  "activities.checklist_3",
                  "activities.checklist_4",
                  "activities.checklist_5",
                ] as const).map((key, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                      style={{ background: "rgba(247,176,100,0.15)", color: ORANGE }}
                    >
                      {i + 1}
                    </span>
                    {t(key as any)}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="/go/klook"
              target="_blank"
              rel="noopener noreferrer sponsored"
              data-testid="activities-sidebar-klook"
              className="flex flex-col gap-2.5 p-4 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "rgba(247,176,100,0.06)",
                border: "1px solid rgba(247,176,100,0.22)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🎟️</span>
                <span className="text-sm font-semibold text-foreground">{t("activities.browse_klook")}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("activities.browse_klook_desc")}
              </p>
              <div
                className="text-xs font-bold text-center py-1.5 px-3 rounded-lg"
                style={{ background: "rgba(247,176,100,0.18)", color: ORANGE }}
              >
                {t("activities.explore_deals")}
              </div>
            </a>

            <p className="text-[11px] text-center text-muted-foreground/50 leading-relaxed px-1 pt-2">
              {t("common.affiliate_note")}
            </p>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/30 mt-10 py-6 px-4">
        <p className="text-center text-xs text-muted-foreground/50">{t("footer.affiliate_notice")}</p>
      </footer>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
