import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Plane, Globe, ShieldCheck, ChevronDown, Menu, X, User,
  BedDouble, Car, BookOpen, FileText, Users,
  ArrowRight, CheckCircle2,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import heroBg from "@/assets/hero_mountain_sunrise.png";
import { AuthModal } from "@/components/auth-modal";
import { VisaWidget } from "@/components/visa-widget";
import { UserMenu } from "@/components/user-menu";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { LANGUAGE_LABELS, LANGUAGE_FLAGS } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { setSEO, resetSEO } from "@/lib/seo";

const TRUST_CHIP: React.CSSProperties = {
  background: "rgba(6,13,23,0.5)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();
  const langRef = useRef<HTMLDivElement>(null);
  const offersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSEO({
      title: "Himal to Horizon — Visa Intelligence for Nepali Travelers",
      description: "Step-by-step visa requirements, fees and official links for Nepali passport holders — verified and updated weekly. Plus flights, travel guides, insurance and a traveler community.",
      path: "/",
    });
    return () => { resetSEO(); };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    if (langOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [langOpen]);

  function scrollToOffers() {
    offersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: "640px" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center 28%",
            filter: "saturate(1.08) contrast(1.06)",
          }}
        />
        {/* Darken the bright sunrise sky behind the header and headline, then fade into the page background */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,13,23,0.78) 0%, rgba(6,13,23,0.38) 26%, rgba(6,13,23,0.30) 52%, rgba(6,13,23,0.72) 80%, hsl(var(--background)) 100%)" }} />
        {/* Vignette focused behind the headline so light text stays legible over bright snow, without darkening the whole photo */}
        <div
          className="absolute pointer-events-none"
          style={{ top: "52%", left: "50%", transform: "translate(-50%, -50%)", width: "min(980px, 96vw)", height: "460px", background: "radial-gradient(ellipse at center, rgba(4,10,18,0.50) 0%, rgba(4,10,18,0.22) 50%, transparent 76%)" }}
        />

        {/* ── Header: brand row + service tabs in one frosted bar ───────────── */}
        <header
          className="relative z-20"
          style={{
            background: "rgba(6,13,23,0.72)",
            backdropFilter: "blur(14px) saturate(1.2)",
            WebkitBackdropFilter: "blur(14px) saturate(1.2)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
        <nav className="flex items-center px-5 pt-3.5 pb-2.5 gap-2 max-w-7xl mx-auto">
          <button
            type="button"
            data-testid="logo"
            onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center gap-2 group bg-transparent border-0 p-0 cursor-pointer shrink-0"
          >
            <img src={logoImg} alt="Himal to Horizon" className="w-9 h-9 rounded-full object-cover" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.18)" }} />
            <div
              data-testid="logo-text"
              className="leading-tight tracking-tight transition-colors duration-200"
              style={{ fontFamily: "var(--font-serif)", color: "white", fontSize: "22px", fontWeight: 800 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(22 79% 80%)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
            >
              Himal to Horizon
            </div>
          </button>

          <div className="hidden sm:flex items-center gap-2 ml-auto">
            <div ref={langRef} className="relative">
              <button type="button" data-testid="language-toggle"
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-semibold transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFFFFF" }}
              >
                <span>{LANGUAGE_FLAGS[language]}</span>
                <span className="text-xs">{language.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1.5 py-1 rounded-md shadow-xl z-50 min-w-[160px] max-h-72 overflow-y-auto" style={{ background: "#0f1a28", border: "1px solid rgba(255,255,255,0.1)", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) transparent" }}>
                  {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                    <button key={lang} type="button" data-testid={`language-option-${lang}`}
                      onClick={() => { setLanguage(lang); setLangOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                      style={{ color: language === lang ? "hsl(22 79% 75%)" : "rgba(255,255,255,0.8)", background: language === lang ? "hsl(22 79% 75% / 0.08)" : "transparent", fontWeight: language === lang ? 600 : 400 }}
                    >
                      <span>{LANGUAGE_FLAGS[lang]}</span><span>{LANGUAGE_LABELS[lang]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center ml-1">
            {user ? <UserMenu user={user} /> : (
              <button type="button" data-testid="button-sign-in" onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
              >
                <User className="w-3.5 h-3.5" />{t("auth.sign_in")}
              </button>
            )}
          </div>

          <button type="button" data-testid="mobile-menu-toggle"
            onClick={() => { setMobileMenuOpen((o) => !o); setLangOpen(false); }}
            className="sm:hidden ml-auto flex items-center justify-center w-9 h-9 rounded text-white/90"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Service Tabs */}
        <div className="px-4 pb-3 max-w-7xl mx-auto">
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }} data-testid="service-tabs">
            {[
              { id: "tab-visa",      icon: <FileText className="h-4 w-4" />,   label: t("nav.visa_intelligence"),  path: "/visa-guides", primary: true },
              { id: "tab-flights",   icon: <Plane className="h-4 w-4" />,      label: t("nav.flights"),            path: "/flights" },
              { id: "tab-hotels",    icon: <BedDouble className="h-4 w-4" />,  label: t("nav.hotels"),             path: "/hotels" },
              { id: "tab-cars",      icon: <Car className="h-4 w-4" />,        label: t("nav.cars"),               path: "/cars" },
              { id: "tab-insurance", icon: <ShieldCheck className="h-4 w-4" />,label: t("nav.insurance"),          path: "/insurance" },
              { id: "tab-blog",      icon: <BookOpen className="h-4 w-4" />,   label: t("nav.travel_blog"),        path: "/blog" },
            ].map((tab) => (
              <button key={tab.id} type="button" data-testid={tab.id} onClick={() => setLocation(tab.path)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0"
                style={{
                  color: tab.primary ? "hsl(211 60% 8%)" : "rgba(255,255,255,0.86)",
                  background: tab.primary ? "#F7B088" : "rgba(255,255,255,0.06)",
                  border: tab.primary ? "1px solid #F7B088" : "1px solid rgba(255,255,255,0.10)",
                }}
                onMouseEnter={(e) => { if (!tab.primary) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.12)"; } }}
                onMouseLeave={(e) => { if (!tab.primary) { e.currentTarget.style.color = "rgba(255,255,255,0.86)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; } }}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>
        </header>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="relative z-40 sm:hidden px-5 py-4 space-y-4" style={{ background: "rgba(6,13,23,0.97)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <button type="button" data-testid="mobile-nav-visa" onClick={() => { setMobileMenuOpen(false); setLocation("/visa-guides"); }}
              className="block w-full text-left text-white/80 text-sm font-medium py-2 hover:text-white transition-colors bg-transparent border-0"
            >{t("home.mobile_visa")}</button>
            <button type="button" data-testid="mobile-nav-blog" onClick={() => { setMobileMenuOpen(false); setLocation("/blog"); }}
              className="block w-full text-left text-white/80 text-sm font-medium py-2 hover:text-white transition-colors bg-transparent border-0"
            >{t("nav.travel_blog")}</button>
            <button type="button" data-testid="mobile-nav-about" onClick={() => { setMobileMenuOpen(false); setLocation("/about"); }}
              className="block w-full text-left text-white/80 text-sm font-medium py-2 hover:text-white transition-colors bg-transparent border-0"
            >{t("nav.about")}</button>
            {user ? (
              <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <span className="text-sm text-white/80">{user.name ?? user.email}</span>
              </div>
            ) : (
              <button type="button" data-testid="mobile-sign-in" onClick={() => { setMobileMenuOpen(false); setAuthOpen(true); }}
                className="w-full py-2.5 rounded-xl text-sm font-bold" style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
              >{t("auth.sign_in")}</button>
            )}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">{t("nav.language")}</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                  <button key={lang} type="button" data-testid={`mobile-lang-${lang}`}
                    onClick={() => { setLanguage(lang); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                    style={{ color: language === lang ? "hsl(22 79% 75%)" : "rgba(255,255,255,0.75)", background: language === lang ? "hsl(22 79% 75% / 0.12)" : "rgba(255,255,255,0.05)", fontWeight: language === lang ? 600 : 400, border: language === lang ? "1px solid hsl(22 79% 75% / 0.3)" : "1px solid transparent" }}
                  ><span>{LANGUAGE_FLAGS[lang]}</span><span>{LANGUAGE_LABELS[lang]}</span></button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Hero headline ────────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center text-center px-5 pt-20 pb-24">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-7" style={{ background: "rgba(6,13,23,0.62)", border: "1px solid rgba(247,176,136,0.45)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <FileText className="h-3.5 w-3.5" style={{ color: "#F7B088" }} />
            <span className="text-[11px] font-bold uppercase" style={{ color: "#FFFFFF", letterSpacing: "0.16em" }}>{t("home.visa_hero_badge")}</span>
          </div>
          <h1
            className="text-[2.6rem] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white max-w-4xl"
            style={{ fontFamily: "var(--font-serif)", lineHeight: 1.05, letterSpacing: "-0.025em", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
          >
            {t("home.visa_hero_title_1")}
            <br />
            <span style={{ background: "linear-gradient(100deg, #FFD9BF 0%, #F7B088 45%, #F2C46D 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", textShadow: "none", filter: "drop-shadow(0 2px 18px rgba(0,0,0,0.35))" }}>
              {t("home.visa_hero_title_2")}
            </span>
          </h1>
          <p className="mt-6 text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 12px rgba(0,0,0,0.55)" }}>
            {t("home.visa_hero_subtitle")}
          </p>

          {/* Same any-passport checker as the Flights/Hotels/Cars pages, pre-set
              to a Nepali passport since that's who this site is for — change it
              to check any of the 199 passports. */}
          <div
            className="w-full max-w-2xl mt-8 rounded-2xl p-4 sm:p-5 text-left"
            style={{
              background: "rgba(6,13,23,0.72)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: "0 20px 50px -20px rgba(0,0,0,0.6)",
            }}
            data-testid="hero-visa-check"
          >
            <h2 className="text-sm font-bold mb-0.5" style={{ color: "#F7B088" }}>{t("common.visa_check_title")}</h2>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>{t("common.visa_check_desc")}</p>
            <VisaWidget defaultOrigin="NP" />
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <button
              type="button"
              data-testid="hero-cta-visa"
              onClick={() => setLocation("/visa-guides")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(180deg, #FAC4A3 0%, #F7B088 100%)", color: "hsl(211 60% 8%)", boxShadow: "0 10px 30px -8px rgba(247,176,136,0.65), inset 0 1px 0 rgba(255,255,255,0.5)" }}
            >
              <FileText className="h-4 w-4" /> {t("home.visa_hero_cta_primary")} <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid="hero-cta-services"
              onClick={scrollToOffers}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(6,13,23,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
            >
              <Globe className="h-4 w-4" /> {t("home.visa_hero_cta_secondary")}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-10 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={TRUST_CHIP}><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#F7B088" }} /> {t("home.trust_countries")}</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={TRUST_CHIP}><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#F7B088" }} /> {t("home.trust_sources")}</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={TRUST_CHIP}><CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#F7B088" }} /> {t("home.trust_refresh")}</span>
          </div>
        </div>
      </div>

      {/* ── What We Offer ────────────────────────────────────────────────────── */}
      <section ref={offersRef} className="px-4 pt-12 pb-16 max-w-5xl mx-auto w-full scroll-mt-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold" style={{ fontFamily: "var(--font-serif)" }}>{t("home.offer_title")}</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2">{t("home.offer_subtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Visa Intelligence — featured, primary */}
          <button
            type="button"
            data-testid="offer-visa"
            onClick={() => setLocation("/visa-guides")}
            className="md:col-span-2 text-left rounded-2xl p-6 transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, rgba(247,176,136,0.14) 0%, rgba(247,176,136,0.04) 100%)", border: "1.5px solid rgba(247,176,136,0.55)" }}
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0" style={{ background: "#F7B088" }}>
                <FileText className="h-6 w-6" style={{ color: "hsl(211 60% 8%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold">{t("home.offer_visa_title")}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{t("home.offer_visa_desc")}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold mt-3" style={{ color: "#F7B088" }}>
                  {t("home.offer_visa_cta")} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </button>

          {/* Secondary services */}
          {[
            { id: "offer-flights",   icon: Plane,      title: t("home.offer_flights_title"),   desc: t("home.offer_flights_desc"),   cta: t("home.offer_flights_cta"),   path: "/flights" },
            { id: "offer-guides",    icon: BookOpen,   title: t("home.offer_guides_title"),    desc: t("home.offer_guides_desc"),    cta: t("home.offer_guides_cta"),    path: "/blog" },
            { id: "offer-insurance", icon: ShieldCheck,title: t("home.offer_insurance_title"), desc: t("home.offer_insurance_desc"), cta: t("home.offer_insurance_cta"), path: "/insurance" },
            { id: "offer-community", icon: Users,      title: t("home.offer_community_title"),  desc: t("home.offer_community_desc"),  cta: t("home.offer_community_cta"),  path: "/community" },
          ].map((offer) => (
            <button
              key={offer.id}
              type="button"
              data-testid={offer.id}
              onClick={() => setLocation(offer.path)}
              className="text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 border border-border/40 bg-card/50 hover:border-border/70"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                <offer.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold">{offer.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{offer.desc}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold mt-3 text-muted-foreground">
                {offer.cta} <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="pt-10 pb-6 px-4 mt-6" style={{ borderTop: "1px solid rgba(247,176,136,0.4)" }}>
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">

          {/* Brand block */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
          >
            <img src={logoImg} alt="Himal to Horizon" className="w-6 h-6 rounded-full object-cover" />
            <span className="font-bold text-base transition-colors duration-200" style={{ fontFamily: "var(--font-serif)", color: "#FFFFFF" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F7B088")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#FFFFFF")}
            >Himal to Horizon</span>
          </button>
          <p className="text-sm mt-2 max-w-md" style={{ color: "rgba(255,255,255,0.75)" }}>
            Visa intelligence and travel guidance for Nepali travelers.
          </p>

          {/* Nav links — the part people actually use */}
          <nav className="flex justify-center items-center gap-x-5 gap-y-2 flex-wrap text-sm font-semibold mt-6 pt-6 w-full max-w-xl" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { label: t("footer.visa_guides"),   path: "/visa-guides" },
              { label: t("footer.flights_link"),  path: "/flights" },
              { label: t("footer.blog_link"),     path: "/blog" },
              { label: t("nav.about"),            path: "/about" },
            ].map((link) => (
              <button key={link.path} type="button" onClick={() => setLocation(link.path)}
                className="transition-colors bg-transparent border-0 p-0 cursor-pointer"
                style={{ color: "rgba(255,255,255,0.85)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F7B088")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                data-testid={`footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >{link.label}</button>
            ))}
          </nav>

          {/* Legal / fine print — demoted, grouped, out of the way */}
          <div className="mt-6 pt-5 w-full max-w-xl flex flex-col items-center gap-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {t("footer.contact")}{" "}
              <a href="mailto:hello@himaltohorizon.com" style={{ color: "rgba(255,255,255,0.6)" }}>hello@himaltohorizon.com</a>
            </p>
            <p className="text-[11px] leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.35)" }}>
              {t("footer.disclaimer")} · {t("footer.affiliate_notice")}
            </p>
            <div className="flex justify-center items-center gap-4 flex-wrap text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              {[
                { label: t("footer.privacy"),   path: "/privacy" },
                { label: t("footer.terms"),     path: "/terms" },
                { label: t("footer.affiliate"), path: "/affiliate-disclosure" },
              ].map((link) => (
                <button key={link.path} type="button" onClick={() => setLocation(link.path)}
                  className="hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer text-[11px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  data-testid={`footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >{link.label}</button>
              ))}
            </div>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              © {new Date().getFullYear()} Himal to Horizon, a product of Synergy Soul LLC · himaltohorizon.com
            </p>
          </div>
        </div>
      </footer>

      {authOpen && <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
