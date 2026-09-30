import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";

type Props = {
  service: "stays" | "cars" | "insurance" | "visa";
  accentColor?: string;
};

export function WaitlistSignup({ service, accentColor = "#F7B088" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), service }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl"
        style={{
          background: "rgba(56,200,120,0.08)",
          border: "1px solid rgba(56,200,120,0.2)",
        }}
      >
        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "hsl(145 65% 55%)" }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: "hsl(145 65% 60%)" }}>
            You're on the list!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            We'll notify you at <span className="text-foreground/80">{email}</span> when this launches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4" style={{ color: accentColor }} />
        <span className="text-sm font-bold" style={{ color: accentColor }}>
          Notify Me at Launch
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Be the first to access this feature. We'll send you one email when it goes live — no spam, ever.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap sm:flex-nowrap">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          data-testid="input-waitlist-email"
          className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all min-w-0"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
          }}
          onFocus={(e) => (e.currentTarget.style.border = `1px solid ${accentColor}`)}
          onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)")}
        />
        <button
          type="submit"
          data-testid="button-waitlist-submit"
          disabled={status === "loading"}
          className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0"
          style={{ background: accentColor, color: "hsl(211 60% 8%)", opacity: status === "loading" ? 0.7 : 1 }}
        >
          {status === "loading" ? "Saving…" : "Notify Me"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs" style={{ color: "hsl(0 65% 65%)" }}>{errorMsg}</p>
      )}
    </div>
  );
}
