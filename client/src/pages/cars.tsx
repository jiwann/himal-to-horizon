import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Car, ExternalLink, Shield, ShieldCheck, Plane, BedDouble, ShieldPlus, Compass, User } from "lucide-react";
import { NavTabs } from "@/components/nav-tabs";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@assets/logo_1772143671966.png";
import { VisaWidget } from "@/components/visa-widget";
import { AuthModal } from "@/components/auth-modal";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/contexts/auth-context";
import { setSEO, resetSEO } from "@/lib/seo";

const ACCENT   = "hsl(205 80% 70%)";
const AMBER    = "hsl(22 79% 75%)";


export default function CarsPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setSEO({
      title: "Car Rentals — Compare Local & International Providers",
      description: "Compare car rental deals from local and international providers. No mark-ups, no hidden fees — powered by Localrent through Himal to Horizon.",
      path: "/cars",
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
            <button type="button" data-testid="nav-visa-guides" onClick={() => setLocation("/visa-guides")} className="text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = AMBER)} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}>{t("nav.visa_intelligence")}</button>
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
              style={{ background: "rgba(99,179,237,0.12)", border: "1px solid rgba(99,179,237,0.25)" }}
            >
              <Car className="h-5 w-5" style={{ color: ACCENT }} />
            </div>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-serif)" }}>
              {t("cars.title")}
            </h1>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {t("cars.desc")}
          </p>
        </div>

        {/* ── Two-column layout: partners + sidebar ── */}
        <div className="flex gap-8 items-start">

          {/* ── Partner cards ── */}
          <div className="flex-1 space-y-4">

            {/* Section label */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: AMBER }}
              >
                {t("common.verified_partners")}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(247,176,136,0.2)" }} />
            </div>

            {/* 2×2 Partner Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* ── Localrent ── */}
              <a
                href="/go/localrent"
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-testid="cars-localrent"
                className="group flex flex-col gap-4 p-6 rounded-2xl transition-all duration-150 hover:border-blue-400/40"
                style={{
                  background: "rgba(99,179,237,0.05)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(99,179,237,0.2)",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(99,179,237,0.12)" }}
                  >
                    🚗
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(99,179,237,0.15)", color: ACCENT }}
                  >
                    {t("common.live_badge")}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {t("cars.localrent_title")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("cars.localrent_desc")}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90 mt-auto"
                  style={{ background: ACCENT, color: "hsl(220 20% 10%)" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("cars.localrent_cta")}
                </div>
              </a>

              {/* ── Klook Car Rentals ── */}
              <a
                href="/go/klook"
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-testid="cars-klook"
                className="group flex flex-col gap-4 p-6 rounded-2xl transition-all duration-150 hover:border-orange-400/30"
                style={{
                  background: "rgba(247,176,100,0.04)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(247,176,100,0.16)",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(247,176,100,0.10)" }}
                  >
                    🌍
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(247,176,100,0.12)", color: "hsl(32 95% 62%)" }}
                  >
                    {t("common.live_badge")}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {t("cars.klook_title")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("cars.klook_desc")}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90 mt-auto"
                  style={{ background: "rgba(247,176,100,0.18)", color: "hsl(32 95% 62%)", border: "1px solid rgba(247,176,100,0.3)" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("cars.klook_cta")}
                </div>
              </a>

              {/* ── EconomyBookings ── */}
              <a
                href="https://economybookings.tpk.mx/vfho21Ha"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="cars-economybookings"
                className="group flex flex-col gap-4 p-6 rounded-2xl transition-all duration-150 hover:border-green-400/40"
                style={{
                  background: "rgba(72,187,120,0.04)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(72,187,120,0.18)",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(72,187,120,0.12)" }}
                  >
                    🏢
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(72,187,120,0.15)", color: "hsl(145 65% 58%)" }}
                  >
                    {t("common.live_badge")}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {t("cars.economy_title")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("cars.economy_desc")}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90 mt-auto"
                  style={{ background: "rgba(72,187,120,0.18)", color: "hsl(145 65% 58%)", border: "1px solid rgba(72,187,120,0.3)" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("cars.economy_cta")}
                </div>
              </a>

              {/* ── GetRentacar ── */}
              <a
                href="https://getrentacar.tpk.mx/5eJ3QYKe"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="cars-getrentacar"
                className="group flex flex-col gap-4 p-6 rounded-2xl transition-all duration-150 hover:border-violet-400/40"
                style={{
                  background: "rgba(159,122,234,0.04)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(159,122,234,0.18)",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(159,122,234,0.12)" }}
                  >
                    🤝
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(159,122,234,0.15)", color: "hsl(270 60% 70%)" }}
                  >
                    {t("common.live_badge")}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {t("cars.getrentacar_title")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("cars.getrentacar_desc")}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90 mt-auto"
                  style={{ background: "rgba(159,122,234,0.18)", color: "hsl(270 60% 70%)", border: "1px solid rgba(159,122,234,0.3)" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("cars.getrentacar_cta")}
                </div>
              </a>

            </div>

            {/* ── Visa Intelligence Widget ── */}
            <div className="rounded-2xl p-5 mt-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: AMBER }}>{t("common.visa_check_title")}</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t("common.visa_check_desc")}</p>
              <VisaWidget />
            </div>

            {/* How it works */}
            <div
              className="rounded-2xl p-5 mt-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h3 className="font-semibold text-sm mb-3" style={{ color: AMBER }}>
                {t("cars.how_title")}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  t("cars.step_1"),
                  t("cars.step_2"),
                  t("cars.step_3"),
                  t("cars.step_4"),
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{ background: "rgba(247,176,136,0.15)", color: AMBER }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Horizon Shield sidebar ── */}
          <aside
            className="hidden lg:flex flex-col gap-3 w-64 shrink-0 sticky"
            style={{ top: "80px" }}
            data-testid="cars-horizon-shield"
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: AMBER }} />
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: AMBER }}
              >
                {t("common.horizon_shield")}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(247,176,136,0.2)" }} />
            </div>

            {/* EKTA — highlighted */}
            <a
              href="/go/ekta"
              target="_blank"
              rel="noopener noreferrer sponsored"
              data-testid="cars-ekta"
              className="flex flex-col gap-2.5 p-4 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "rgba(247,176,136,0.06)",
                border: "1px solid rgba(247,176,136,0.25)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <span className="text-sm font-semibold text-foreground">{t("common.travel_insurance")}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold" style={{ color: AMBER }}>{t("common.horizon_tip")}:</span> {t("common.ekta_cars_tip")}
              </p>
              <div
                className="text-xs font-bold text-center py-1.5 px-3 rounded-lg"
                style={{ background: "rgba(247,176,136,0.15)", color: AMBER }}
              >
                {t("common.get_covered")}
              </div>
            </a>

            {/* General travel tip */}
            <div
              className="flex flex-col gap-2 p-3.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <span className="text-sm font-semibold text-foreground">{t("cars.checklist_title")}</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                {[
                  t("cars.check_1"),
                  t("cars.check_2"),
                  t("cars.check_3"),
                  t("cars.check_4"),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="opacity-40 mt-0.5">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Affiliate note */}
            <p className="text-[10px] text-muted-foreground/40 leading-relaxed px-1">
              {t("common.affiliate_note")}
            </p>
          </aside>
        </div>
      </main>

      <footer
        className="text-center text-[11px] py-6 px-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
      >
        {t("footer.affiliate_notice")}
      </footer>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
