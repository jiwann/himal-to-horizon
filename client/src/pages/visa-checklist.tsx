import { useEffect, useState } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, CheckSquare, Square, ExternalLink } from "lucide-react";
import type { VisaProfile, VisaCategory } from "@shared/visa-schema";
import { VISA_CATEGORIES } from "@shared/visa-schema";
import { isLinkBroken } from "@/lib/link-status";
import { shortLinkFor } from "@/lib/visa-short-links";
import { setSEO, resetSEO } from "@/lib/seo";
import { VisaAlertSignup } from "@/components/visa-alert-signup";
import NotFound from "@/pages/not-found";

type LocalizedResponse = { profile: VisaProfile; translated: boolean; translationFailed: boolean };

const SITE = "himaltohorizon.com";

// Ticks are kept per guide in this browser only (no account needed), so a
// person can work through their documents over several days.
function useTicks(key: string, count: number) {
  const [ticks, setTicks] = useState<boolean[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const toggle = (i: number) =>
    setTicks((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  const done = Array.from({ length: count }, (_, i) => !!ticks[i]).filter(Boolean).length;
  return { ticks, toggle, done };
}

// Printable checklist for one visa guide: what to prepare and in what order.
// "Print / Save as PDF" uses the browser's own print dialog, so it works on
// phones and desktops without a PDF library.
export default function VisaChecklistPage() {
  const { countryCode = "", category = "" } = useParams<{ countryCode: string; category: string }>();
  const search = useSearch();
  const lang = new URLSearchParams(search).get("lang") || "en";
  const [, setLocation] = useLocation();
  const cc = countryCode.toUpperCase();
  const validCategory = (VISA_CATEGORIES as readonly string[]).includes(category);

  const { data, isLoading, error } = useQuery<LocalizedResponse>({
    queryKey: ["/api/visa", "NP", cc, category, lang],
    enabled: validCategory,
    queryFn: async () => {
      const r = await fetch(`/api/visa/NP/${cc}/${category}?lang=${encodeURIComponent(lang)}`);
      if (!r.ok) throw new Error(`Failed to load (${r.status})`);
      return r.json();
    },
  });
  const profile = data?.profile;
  const { ticks, toggle, done } = useTicks(`h2h_checklist_${cc}_${category}`, profile?.requiredDocuments.length ?? 0);

  useEffect(() => {
    if (profile) {
      setSEO({
        title: `${profile.countryName} Visa Document Checklist for Nepali Applicants`,
        description: `Printable checklist of documents and steps for a ${profile.countryName} visa from Nepal.`,
        path: `/visa-guides/${cc}/${category}/checklist`,
      });
    }
    return () => resetSEO();
  }, [profile, cc, category]);

  if (!validCategory || error) return <NotFound />;
  if (isLoading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading checklist…</div>;
  }

  const links = profile.officialLinks.filter((l) => !isLinkBroken(l.url));
  const shortLink = `${SITE}${shortLinkFor(profile.countryName)}`;

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:text-black">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3" style={{ background: "hsl(211 60% 8%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          type="button"
          onClick={() => setLocation(`/visa-guides/${cc}/${category}`)}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.7)" }}
          data-testid="checklist-back"
        >
          <ArrowLeft className="h-4 w-4" /> Back to guide
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
          data-testid="checklist-print"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 print:px-0 print:py-0" data-testid="checklist">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#F7B088" }}>
            Himal to Horizon · Visa checklist for Nepali passport holders
          </p>
          <h1 className="text-2xl font-extrabold">{profile.countryName} — {profile.category === "tourist" ? "Tourist / visit visa" : profile.category.replace(/_/g, " ")}</h1>
          <p className="text-sm mt-2 opacity-80">{profile.summary}</p>
          <p className="text-xs mt-2 opacity-60">
            {profile.lastReviewed ? `Guide last reviewed ${profile.lastReviewed}. ` : ""}
            Rules change — check {shortLink} or the official links below before you apply.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm print:grid-cols-3">
          <div><div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Fee</div>{profile.fee}</div>
          <div><div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Processing</div>{profile.processingTime}</div>
          {profile.maxStay && <div><div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Stay</div>{profile.maxStay}</div>}
        </section>

        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-bold">Documents to prepare</h2>
            <span className="text-xs opacity-60 print:hidden" data-testid="checklist-progress">
              {done} of {profile.requiredDocuments.length} ready
            </span>
          </div>
          <ul className="space-y-1.5">
            {profile.requiredDocuments.map((doc, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-start gap-2.5 text-left text-sm py-1"
                  data-testid={`checklist-item-${i}`}
                >
                  {ticks[i] ? (
                    <CheckSquare className="h-4 w-4 shrink-0 mt-0.5 print:hidden" style={{ color: "#38C878" }} />
                  ) : (
                    <Square className="h-4 w-4 shrink-0 mt-0.5 print:hidden opacity-60" />
                  )}
                  {/* Always an empty box on paper, so a printed copy can be ticked by hand */}
                  <span className="hidden print:inline-block w-3.5 h-3.5 border border-black shrink-0 mt-0.5" />
                  <span className={ticks[i] ? "line-through opacity-60 print:no-underline print:opacity-100" : ""}>{doc}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-base font-bold mb-2">Steps</h2>
          <ol className="space-y-2 text-sm">
            {profile.steps.map((s) => (
              <li key={s.order} className="flex gap-2.5">
                <span className="font-bold shrink-0">{s.order}.</span>
                <span>
                  <span className="font-semibold">{s.title}.</span> <span className="opacity-80">{s.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {profile.notes && (
          <section className="mb-6 text-sm">
            <h2 className="text-base font-bold mb-1">Good to know</h2>
            <p className="opacity-80">{profile.notes}</p>
          </section>
        )}

        {links.length > 0 && (
          <section className="mb-6 text-sm">
            <h2 className="text-base font-bold mb-1">Official links</h2>
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                    {l.label} <ExternalLink className="h-3 w-3 print:hidden" />
                  </a>
                  <span className="hidden print:inline opacity-70"> — {l.url}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="text-xs opacity-60 border-t pt-3" style={{ borderColor: "rgba(127,127,127,0.3)" }}>
          Latest version: {shortLink} · Free guide by Himal to Horizon. Not legal advice — always confirm with the embassy.
        </footer>

        <div className="mt-8 print:hidden">
          <VisaAlertSignup defaultCountry={cc} countryName={profile.countryName} source="checklist" />
        </div>
      </div>
    </div>
  );
}
