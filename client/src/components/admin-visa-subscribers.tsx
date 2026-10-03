import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Download, Trash2, Send, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import allCountries from "@/lib/all-countries.json";

type Subscriber = {
  id: number;
  email: string;
  name: string | null;
  countries: string[];
  language: string;
  source: string | null;
  created_at: string;
  unsubscribed_at: string | null;
  last_emailed_at: string | null;
};

const NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  (allCountries as { countries: { code: string; name: string }[] }).countries.map((c) => [c.code, c.name])
);
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

// Admin view of visa-update subscribers: who signed up, what they follow,
// CSV export, removal, and a composer to email an update to them.
export function AdminVisaSubscribers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [sendCountry, setSendCountry] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: subs = [], isLoading } = useQuery<Subscriber[]>({
    queryKey: ["/api/admin/visa-subscribers"],
    queryFn: () =>
      fetch("/api/admin/visa-subscribers").then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      }),
  });

  const active = subs.filter((s) => !s.unsubscribed_at);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subs;
    return subs.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        (s.name ?? "").toLowerCase().includes(q) ||
        s.countries.some((c) => (NAME_BY_CODE[c] ?? c).toLowerCase().includes(q) || c.toLowerCase() === q)
    );
  }, [subs, query]);

  // Countries people follow, most-followed first — useful for picking video topics.
  const followed = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of active) for (const c of s.countries) counts.set(c, (counts.get(c) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [active]);
  const recipients = sendCountry
    ? active.filter((s) => s.countries.length === 0 || s.countries.includes(sendCountry)).length
    : active.length;

  const removeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/visa-subscribers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/visa-subscribers"] });
      toast({ title: "Subscriber removed" });
    },
    onError: () => toast({ title: "Error", description: "Could not remove subscriber", variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/visa-alerts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: sendCountry || null, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      return data as { sent: number };
    },
    onSuccess: ({ sent }) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/visa-subscribers"] });
      toast({ title: `Update sent to ${sent} subscriber${sent === 1 ? "" : "s"}` });
      setSubject("");
      setMessage("");
      setShowComposer(false);
    },
    onError: (err: Error) => toast({ title: "Not sent", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="mt-12" data-testid="admin-visa-subscribers">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <BellRing className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>Visa update subscribers</h2>
        <Badge variant="secondary" className="text-xs">{active.length} active</Badge>
        {subs.length > active.length && (
          <Badge variant="outline" className="text-xs">{subs.length - active.length} unsubscribed</Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowComposer((v) => !v)} data-testid="button-compose-update">
            <Send className="h-3.5 w-3.5 mr-1.5" /> Send update
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/api/admin/visa-subscribers.csv" data-testid="button-export-subscribers">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
            </a>
          </Button>
        </div>
      </div>

      {followed.length > 0 && (
        <p className="text-xs text-muted-foreground mb-4" data-testid="text-most-followed">
          Most followed: {followed.slice(0, 8).map(([c, n]) => `${NAME_BY_CODE[c] ?? c} (${n})`).join(" · ")}
        </p>
      )}

      {showComposer && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 mb-4 space-y-3" data-testid="update-composer">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={sendCountry}
              onChange={(e) => setSendCountry(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              data-testid="select-update-country"
            >
              <option value="">Everyone</option>
              {Object.entries(NAME_BY_CODE)
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([code, name]) => (
                  <option key={code} value={code}>Followers of {name}</option>
                ))}
            </select>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" maxLength={150} data-testid="input-update-subject" />
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (plain text). An unsubscribe link is added automatically."
            rows={5}
            maxLength={5000}
            data-testid="input-update-message"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Will email {recipients} active subscriber{recipients === 1 ? "" : "s"}.</span>
            <Button
              size="sm"
              disabled={sendMutation.isPending || recipients === 0}
              onClick={() => {
                if (window.confirm(`Send this email to ${recipients} subscriber${recipients === 1 ? "" : "s"}?`)) sendMutation.mutate();
              }}
              data-testid="button-send-update"
            >
              {sendMutation.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      )}

      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by email, name or country" className="pl-9" data-testid="input-subscriber-search" />
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Loading subscribers…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-border/60 bg-card/40">
          {subs.length === 0 ? "No subscribers yet." : "No matches."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
          <table className="w-full text-sm" data-testid="table-visa-subscribers">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Subscriber</th>
                <th className="px-4 py-3 font-medium">Following</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30" data-testid={`row-subscriber-${s.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{s.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {s.countries.length === 0 ? <span className="text-muted-foreground">All countries</span> : s.countries.map((c) => NAME_BY_CODE[c] ?? c).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(s.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.source ?? "—"}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {s.unsubscribed_at ? (
                      <span className="text-muted-foreground">Unsubscribed {fmtDate(s.unsubscribed_at)}</span>
                    ) : (
                      <span className="text-emerald-400">Active</span>
                    )}
                    {s.last_emailed_at && <div className="text-muted-foreground">Last emailed {fmtDate(s.last_emailed_at)}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title="Delete subscriber"
                      onClick={() => {
                        if (window.confirm(`Delete ${s.email}? This removes their data entirely.`)) removeMutation.mutate(s.id);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      data-testid={`button-delete-subscriber-${s.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
