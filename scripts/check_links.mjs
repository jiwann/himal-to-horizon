/**
 * Checks every external link the site shows (official portals, guide links,
 * visa-data apply/official URLs, Nepal-facts sources) and writes
 * client/src/lib/link-status.json, which the site uses to hide links that
 * are gone. Run weekly by .github/workflows/sync-visa-data.yml.
 *
 * Only clear failures count as broken: the domain doesn't exist, the
 * connection is refused, or the server says 404/410. Government sites often
 * block bots (401/403/429), time out, or have unusual TLS setups that still
 * open fine in a browser — those are reported as warnings but the link stays
 * visible, so a flaky check never hides a working link.
 *
 * Usage: node scripts/check_links.mjs [--report report.md]
 * Exit code is always 0; read the report / link-status.json for results.
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = [
  "client/src/lib/official-portals.json",
  "client/src/lib/visa-data.json",
  "client/src/lib/nepal-visa-facts.json",
  "server/data/visa-profiles.json",
];
const STATUS_PATH = path.join(root, "client/src/lib/link-status.json");
const TIMEOUT_MS = 20000;
const CONCURRENCY = 12;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Map links (Google Maps searches) are generated, not external content.
const SKIP = [/^https?:\/\/(www\.)?google\.[a-z.]+\/maps/i, /^https?:\/\/maps\.google\./i];

function collectUrls() {
  const found = new Map(); // url -> Set(files)
  for (const rel of SOURCES) {
    const text = readFileSync(path.join(root, rel), "utf-8");
    for (const m of text.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)) {
      const url = m[0].replace(/[.,]+$/, "");
      if (SKIP.some((re) => re.test(url))) continue;
      if (!found.has(url)) found.set(url, new Set());
      found.get(url).add(rel);
    }
  }
  return found;
}

const BROKEN_CODES = new Set(["ENOTFOUND", "ECONNREFUSED"]);

async function checkOnce(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    });
    res.body?.cancel().catch(() => {});
    if (res.status === 404 || res.status === 410) return { state: "broken", reason: `HTTP ${res.status}` };
    if (res.status >= 400) return { state: "warning", reason: `HTTP ${res.status}` };
    return { state: "ok", reason: `HTTP ${res.status}` };
  } catch (err) {
    const code = err?.cause?.code ?? err?.code ?? err?.name;
    if (BROKEN_CODES.has(code)) return { state: "broken", reason: code === "ENOTFOUND" ? "domain does not exist" : code };
    return { state: "warning", reason: code === "AbortError" ? "timed out" : String(code ?? err?.message) };
  } finally {
    clearTimeout(timer);
  }
}

// Retry anything that isn't OK once, so a single blip doesn't count.
async function check(url) {
  const first = await checkOnce(url);
  if (first.state === "ok") return first;
  await new Promise((r) => setTimeout(r, 2000));
  const second = await checkOnce(url);
  if (second.state === "ok") return second;
  // Broken only if both attempts say so; anything mixed is a warning.
  if (first.state === "broken" && second.state === "broken") return second;
  return { state: "warning", reason: second.reason };
}

async function main() {
  const reportArg = process.argv.indexOf("--report");
  const reportPath = reportArg > -1 ? process.argv[reportArg + 1] : null;

  const urls = collectUrls();
  const list = [...urls.keys()];
  console.log(`Checking ${list.length} external links…`);

  const results = new Map();
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < list.length) {
        const url = list[next++];
        results.set(url, await check(url));
      }
    }),
  );

  const broken = {};
  const warnings = {};
  for (const url of list.sort()) {
    const r = results.get(url);
    if (r.state === "broken") broken[url] = r.reason;
    else if (r.state === "warning") warnings[url] = r.reason;
  }

  writeFileSync(
    STATUS_PATH,
    JSON.stringify(
      {
        _comment: "Written by scripts/check_links.mjs. Links listed under broken are hidden on the site until fixed in the data files.",
        checked: new Date().toISOString(),
        total: list.length,
        broken,
      },
      null,
      2,
    ) + "\n",
  );

  const where = (url) => [...urls.get(url)].map((f) => `\`${path.basename(f)}\``).join(", ");
  const lines = [
    `## External link check — ${new Date().toISOString().slice(0, 10)}`,
    "",
    `Checked **${list.length}** links: **${Object.keys(broken).length} broken** (hidden on the site), ${Object.keys(warnings).length} warnings (still shown).`,
    "",
  ];
  if (Object.keys(broken).length) {
    lines.push("### Broken — replace these in the data files", "", "| Link | Problem | File |", "|---|---|---|");
    for (const [url, why] of Object.entries(broken)) lines.push(`| ${url} | ${why} | ${where(url)} |`);
    lines.push("");
  }
  if (Object.keys(warnings).length) {
    lines.push(
      "<details><summary>Warnings — often bot-blocking or slow government sites; open them in a browser to confirm</summary>",
      "",
      "| Link | Problem | File |",
      "|---|---|---|",
    );
    for (const [url, why] of Object.entries(warnings)) lines.push(`| ${url} | ${why} | ${where(url)} |`);
    lines.push("", "</details>");
  }
  const report = lines.join("\n") + "\n";
  console.log(report);
  if (reportPath) writeFileSync(reportPath, report);
}

main().catch((e) => {
  console.error("Link check failed:", e);
  process.exit(1);
});
