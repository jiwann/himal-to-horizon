import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, ExternalLink, Plane, BedDouble, Car, ShieldPlus, CheckCircle2, Compass, User } from "lucide-react";
import { NavTabs } from "@/components/nav-tabs";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@/assets/logo.png";
import { VisaWidget } from "@/components/visa-widget";
import { AuthModal } from "@/components/auth-modal";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/contexts/auth-context";
import { setSEO, resetSEO } from "@/lib/seo";

const GREEN  = "hsl(145 65% 58%)";
const AMBER  = "hsl(22 79% 75%)";

export default function InsurancePage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setSEO({
      title: "Travel Insurance — Compare Coverage Plans",
      description: "Browse travel insurance on Klook. Medical, trip cancellation, and baggage coverage for international travellers.",
      path: "/insurance",
    });
    return () => { resetSEO(); };
  }, []);

  const REASONS = [
    { title: t("insurance.reason1_title"), body: t("insurance.reason1_body") },
    { title: t("insurance.reason2_title"), body: t("insurance.reason2_body") },
    { title: t("insurance.reason3_title"), body: t("insurance.reason3_body") },
  ];

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
              style={{ background: "rgba(56,200,120,0.12)", border: "1px solid rgba(56,200,120,0.25)" }}
            >
              <Shield className="h-5 w-5" style={{ color: GREEN }} />
            </div>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-serif)" }}>
              {t("insurance.title")}
            </h1>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {t("insurance.desc")}
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-8 items-start">

          {/* ── Main content ── */}
          <div className="flex-1 space-y-6">

            {/* Partner section label */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: GREEN }}>
                {t("common.verified_partners")}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(56,200,120,0.2)" }} />
            </div>

            {/* ── Partner grid ── */}
            <div className="grid sm:grid-cols-2 gap-4">

              {/* Klook — travel insurance */}
              <a
                href="/go/klook"
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-testid="insurance-klook"
                className="group flex flex-col gap-4 p-5 rounded-2xl transition-all duration-150 hover:border-green-400/40"
                style={{
                  background: "rgba(56,200,120,0.06)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(56,200,120,0.22)",
                  textDecoration: "none",
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(56,200,120,0.12)" }}
                  >
                    🛡️
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(56,200,120,0.18)", color: GREEN }}
                  >
                    {t("common.top_pick")}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground mb-1">{t("insurance.klook_title")}</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("insurance.klook_desc")}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 justify-center py-2 px-3 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90 mt-auto"
                  style={{ background: GREEN, color: "hsl(220 20% 10%)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("insurance.klook_cta")}
                </div>
              </a>
            </div>

            {/* ── Visa Intelligence Widget ── */}
            <div className="rounded-2xl p-5 mt-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: GREEN }}>{t("common.visa_check_title")}</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t("common.visa_check_desc")}</p>
              <VisaWidget />
            </div>

            {/* ── Why Travel Insurance is Non-Negotiable ── */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(56,200,120,0.04)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(56,200,120,0.15)",
              }}
            >
              <h2
                className="text-xl font-extrabold mb-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                🛡️ {t("insurance.why_title")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {t("insurance.why_intro")}
              </p>

              <div className="space-y-4">
                {REASONS.map((r) => (
                  <div
                    key={r.title}
                    className="flex gap-4 p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 mt-0.5"
                      style={{ color: GREEN }}
                    />
                    <div>
                      <h3 className="font-bold text-foreground text-sm mb-1">{r.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-5 p-4 rounded-xl text-sm leading-relaxed"
                style={{
                  background: "rgba(56,200,120,0.06)",
                  border: "1px solid rgba(56,200,120,0.2)",
                  color: GREEN,
                }}
              >
                <span className="font-bold block mb-1 text-xs uppercase tracking-wide opacity-70">{t("insurance.tip_label")}</span>
                {t("insurance.tip_body")}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside
            className="hidden lg:flex flex-col gap-3 w-64 shrink-0 sticky"
            style={{ top: "80px" }}
            data-testid="insurance-sidebar"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-3.5 w-3.5" style={{ color: GREEN }} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: GREEN }}>
                {t("insurance.sidebar_label")}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(56,200,120,0.2)" }} />
            </div>

            {/* Checklist */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: "rgba(56,200,120,0.05)",
                border: "1px solid rgba(56,200,120,0.18)",
              }}
            >
              <p className="text-xs font-bold text-foreground mb-3">{t("insurance.checklist_intro")}</p>
              <ul className="space-y-2">
                {[
                  t("insurance.check_1"),
                  t("insurance.check_2"),
                  t("insurance.check_3"),
                  t("insurance.check_4"),
                  t("insurance.check_5"),
                  t("insurance.check_6"),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: GREEN }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Affiliate note */}
            <p className="text-[10px] text-muted-foreground/40 leading-relaxed px-1 mt-1">
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
