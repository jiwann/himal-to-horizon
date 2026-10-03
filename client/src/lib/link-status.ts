import linkStatus from "@/lib/link-status.json";

// Links the weekly check (scripts/check_links.mjs) found dead: the domain
// doesn't exist, the connection is refused, or the page is 404/410. They're
// hidden rather than sending people to an error page; the weekly GitHub
// issue lists them so the data can be fixed.
const BROKEN = new Set(Object.keys((linkStatus as { broken: Record<string, string> }).broken));

export function isLinkBroken(url: string | undefined | null): boolean {
  return !!url && BROKEN.has(url);
}
