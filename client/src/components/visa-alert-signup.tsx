import { useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

type Props = {
  /** ISO code of the country this page is about; offers "only this country". */
  defaultCountry?: string;
  countryName?: string;
  /** Where the signup came from (shown in /admin), e.g. "guide", "checklist", "home". */
  source: string;
};

// "Email me when visa rules change" — the subscriber list behind /admin's
// Subscribers tab. Name is optional; nothing is sent except rule changes
// (and occasional updates from the site owner), each with an unsubscribe link.
export function VisaAlertSignup({ defaultCountry, countryName, source }: Props) {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"country" | "all">(defaultCountry ? "country" : "all");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/visa-alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          countries: scope === "country" && defaultCountry ? [defaultCountry] : [],
          language,
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  const box: React.CSSProperties = {
    background: "rgba(247,176,136,0.06)",
    border: "1px solid rgba(247,176,136,0.25)",
  };

  if (status === "done") {
    return (
      <div className="flex items-start gap-3 rounded-2xl p-5" style={box} data-testid="visa-alert-done">
        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#38C878" }} />
        <div className="text-sm">
          <p className="font-bold text-white">You're subscribed.</p>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>
            We'll email {email.trim()} when visa rules change
            {scope === "country" && countryName ? ` for ${countryName}` : ""}. Every email has an unsubscribe link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl p-5" style={box} data-testid="visa-alert-signup">
      <div className="flex items-center gap-2 mb-1">
        <BellRing className="h-4 w-4" style={{ color: "#F7B088" }} />
        <h3 className="text-sm font-bold text-white">
          {countryName ? `Get notified if ${countryName}'s visa rules change` : "Get notified when visa rules change"}
        </h3>
      </div>
      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
        Free email alerts for Nepali passport holders — only when something changes.
      </p>

      {defaultCountry && countryName && (
        <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="What to follow">
          {(["country", "all"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={scope === opt}
              onClick={() => setScope(opt)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: scope === opt ? "rgba(247,176,136,0.18)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${scope === opt ? "rgba(247,176,136,0.5)" : "rgba(255,255,255,0.12)"}`,
                color: scope === opt ? "#F7B088" : "rgba(255,255,255,0.75)",
              }}
              data-testid={`visa-alert-scope-${opt}`}
            >
              {opt === "country" ? `Only ${countryName}` : "All countries"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          maxLength={100}
          autoComplete="name"
          className="sm:w-40 px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/40 outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
          data-testid="visa-alert-name"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={254}
          autoComplete="email"
          className="flex-1 px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/40 outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
          data-testid="visa-alert-email"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
          style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
          data-testid="visa-alert-submit"
        >
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          Notify me
        </button>
      </div>
      {status === "error" && <p className="text-xs mt-2" style={{ color: "hsl(0 75% 70%)" }}>{error}</p>}
      <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        No spam. Unsubscribe with one click. See our <a href="/privacy" className="underline">privacy policy</a>.
      </p>
    </form>
  );
}
