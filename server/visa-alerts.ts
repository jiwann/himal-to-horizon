import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pool } from "./db";
import { logger } from "./logger";
import { getVisaProfile } from "./visa-service";
import { sendVisaAlertEmail } from "./email";

// ── Visa rule-change alerts ──────────────────────────────────────────────
// People subscribe (optionally to specific countries) and get an email when
// the entry status for a Nepali passport changes for a country they follow.
// Changes are detected after each deploy by comparing the site's current
// Nepal statuses with the last snapshot stored in the database; the weekly
// data sync deploys new data, so alerts go out within a day of a change
// landing. Admins can also send a manual update from /admin.

export type VisaSubscriber = {
  id: number;
  email: string;
  name: string | null;
  countries: string[]; // ISO codes; empty = every country
  language: string;
  source: string | null;
  created_at: string;
  unsubscribed_at: string | null;
  last_emailed_at: string | null;
};

export async function initVisaAlertTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visa_alert_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      countries TEXT[] NOT NULL DEFAULT '{}',
      language TEXT NOT NULL DEFAULT 'en',
      source TEXT,
      unsubscribe_token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      unsubscribed_at TIMESTAMPTZ,
      last_emailed_at TIMESTAMPTZ
    )
  `);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_visa_alert_subscribers_email ON visa_alert_subscribers (LOWER(email))`
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visa_status_snapshots (
      country_code TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ── Subscribe / unsubscribe ──────────────────────────────────────────────

export async function subscribe(input: {
  email: string;
  name?: string | null;
  countries?: string[];
  language?: string;
  source?: string | null;
}): Promise<{ subscriber: VisaSubscriber; isNew: boolean; token: string }> {
  const email = input.email.trim().toLowerCase();
  const countries = Array.from(new Set((input.countries ?? []).map((c) => c.toUpperCase()))).sort();
  const existing = await pool.query(`SELECT * FROM visa_alert_subscribers WHERE LOWER(email) = $1`, [email]);

  if (existing.rows[0]) {
    const row = existing.rows[0];
    // Re-subscribing: reactivate and widen the country list. An empty list
    // (everything) wins over a specific one.
    const merged = row.countries.length === 0 || countries.length === 0
      ? []
      : Array.from(new Set([...row.countries, ...countries])).sort();
    const { rows } = await pool.query(
      `UPDATE visa_alert_subscribers
          SET countries = $2, name = COALESCE($3, name), language = $4, unsubscribed_at = NULL
        WHERE id = $1 RETURNING *`,
      [row.id, merged, input.name?.trim() || null, input.language ?? row.language]
    );
    return { subscriber: rows[0], isNew: !!row.unsubscribed_at, token: row.unsubscribe_token };
  }

  const token = crypto.randomBytes(24).toString("base64url");
  const { rows } = await pool.query(
    `INSERT INTO visa_alert_subscribers (email, name, countries, language, source, unsubscribe_token)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [email, input.name?.trim() || null, countries, input.language ?? "en", input.source ?? null, token]
  );
  return { subscriber: rows[0], isNew: true, token };
}

export async function unsubscribe(token: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE visa_alert_subscribers SET unsubscribed_at = COALESCE(unsubscribed_at, NOW()) WHERE unsubscribe_token = $1`,
    [token]
  );
  return (rowCount ?? 0) > 0;
}

// ── Admin ────────────────────────────────────────────────────────────────

export async function listSubscribers(): Promise<VisaSubscriber[]> {
  const { rows } = await pool.query(
    `SELECT id, email, name, countries, language, source, created_at, unsubscribed_at, last_emailed_at
       FROM visa_alert_subscribers ORDER BY created_at DESC`
  );
  return rows;
}

export async function deleteSubscriber(id: number): Promise<void> {
  await pool.query(`DELETE FROM visa_alert_subscribers WHERE id = $1`, [id]);
}

export function subscribersToCsv(rows: VisaSubscriber[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
    // Quote everything; neutralise spreadsheet formulas (=, +, -, @).
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const header = ["email", "name", "countries", "language", "source", "subscribed_at", "unsubscribed_at", "last_emailed_at"];
  const lines = rows.map((r) =>
    [r.email, r.name, r.countries.length ? r.countries.join(" ") : "ALL", r.language, r.source, r.created_at, r.unsubscribed_at, r.last_emailed_at]
      .map(esc)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n") + "\n";
}

async function activeSubscribersFor(countryCodes: string[] | null): Promise<(VisaSubscriber & { unsubscribe_token: string })[]> {
  // null = everyone active; otherwise people following all countries or any of these.
  const { rows } = countryCodes
    ? await pool.query(
        `SELECT * FROM visa_alert_subscribers
          WHERE unsubscribed_at IS NULL AND (cardinality(countries) = 0 OR countries && $1::text[])`,
        [countryCodes]
      )
    : await pool.query(`SELECT * FROM visa_alert_subscribers WHERE unsubscribed_at IS NULL`);
  return rows;
}

/** Manual update from /admin. Returns how many emails were sent. */
export async function sendManualUpdate(input: { countryCode?: string | null; subject: string; message: string }): Promise<number> {
  const recipients = await activeSubscribersFor(input.countryCode ? [input.countryCode.toUpperCase()] : null);
  let sent = 0;
  for (const r of recipients) {
    const ok = await sendVisaAlertEmail({
      toEmail: r.email,
      toName: r.name,
      subject: input.subject,
      intro: input.message,
      changes: [],
      unsubscribeToken: r.unsubscribe_token,
    });
    if (ok) {
      sent++;
      await pool.query(`UPDATE visa_alert_subscribers SET last_emailed_at = NOW() WHERE id = $1`, [r.id]);
    }
  }
  return sent;
}


// ── Automatic change detection ───────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  visa_free: "Visa-free",
  visa_on_arrival: "Visa on arrival",
  evisa: "e-Visa / online authorization",
  sticker_visa: "Visa required before travel",
  not_admitted: "Entry not permitted",
};

const GUIDE_TO_INDEX: Record<string, string> = {
  visa_free: "visa_free",
  visa_on_arrival: "visa_on_arrival",
  evisa: "evisa",
  embassy_visa: "sticker_visa",
  sponsor_program: "sticker_visa",
  employer_petition: "sticker_visa",
};

function readClientJson(file: string): any {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "client", "src", "lib", file), "utf-8"));
}

/** Nepal-passport status per destination, using the same precedence as the
 *  site: full guide > checked Nepal facts > passport-index dataset. */
function currentNepalStatuses(): { statuses: Map<string, string>; names: Map<string, string> } {
  const index = readClientJson("passport-index.json").requirements as Record<string, string>;
  const facts = readClientJson("nepal-visa-facts.json").destinations as Record<string, { status: string }>;
  const countries = readClientJson("all-countries.json").countries as { code: string; name: string }[];
  const names = new Map(countries.map((c) => [c.code, c.name]));
  const statuses = new Map<string, string>();
  for (const [pair, raw] of Object.entries(index)) {
    if (!pair.startsWith("NP->")) continue;
    const code = pair.slice(4);
    if (code === "NP") continue;
    const guide = getVisaProfile("NP", code, "tourist");
    statuses.set(code, (guide && GUIDE_TO_INDEX[guide.status]) ?? facts[code]?.status ?? raw);
  }
  return { statuses, names };
}

export type StatusChange = { code: string; name: string; from: string; to: string };

/**
 * Compares current Nepal statuses with the stored snapshot and emails the
 * subscribers who follow each changed country. First run only seeds the
 * snapshot. If email isn't configured the snapshot is left as is, so the
 * alerts go out on a later run once it is.
 */
export async function runVisaChangeAlerts(): Promise<StatusChange[]> {
  // One instance at a time (advisory lock), in case of overlapping deploys.
  const client = await pool.connect();
  try {
    const { rows: lock } = await client.query(`SELECT pg_try_advisory_lock(827364) AS ok`);
    if (!lock[0].ok) return [];
    try {
      const { statuses, names } = currentNepalStatuses();
      const { rows: snap } = await client.query(`SELECT country_code, status FROM visa_status_snapshots`);
      const previous = new Map<string, string>(snap.map((r) => [r.country_code, r.status]));

      const writeSnapshot = async () => {
        for (const [code, status] of Array.from(statuses)) {
          await client.query(
            `INSERT INTO visa_status_snapshots (country_code, status, updated_at) VALUES ($1, $2, NOW())
             ON CONFLICT (country_code) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
             WHERE visa_status_snapshots.status <> EXCLUDED.status`,
            [code, status]
          );
        }
      };

      if (previous.size === 0) {
        await writeSnapshot();
        logger.info(`[visa-alerts] Seeded status snapshot for ${statuses.size} destinations`);
        return [];
      }

      const changes: StatusChange[] = [];
      for (const [code, to] of Array.from(statuses)) {
        const from = previous.get(code);
        if (from && from !== to) changes.push({ code, name: names.get(code) ?? code, from, to });
      }
      if (changes.length === 0) return [];

      if (!process.env.RESEND_API_KEY) {
        logger.warn(`[visa-alerts] ${changes.length} Nepal status change(s) found but RESEND_API_KEY is not set — not emailing yet`);
        return changes;
      }

      const recipients = await activeSubscribersFor(changes.map((c) => c.code));
      let attempted = 0;
      let sent = 0;
      for (const r of recipients) {
        const relevant = r.countries.length === 0 ? changes : changes.filter((c) => r.countries.includes(c.code));
        if (relevant.length === 0) continue;
        attempted++;
        const ok = await sendVisaAlertEmail({
          toEmail: r.email,
          toName: r.name,
          subject:
            relevant.length === 1
              ? `Visa update: ${relevant[0].name} for Nepali passport holders`
              : `Visa updates for Nepali passport holders (${relevant.length} countries)`,
          intro: "Entry rules for Nepali passport holders have changed for:",
          changes: relevant.map((c) => ({
            name: c.name,
            from: STATUS_LABEL[c.from] ?? c.from,
            to: STATUS_LABEL[c.to] ?? c.to,
            url: `https://himaltohorizon.com/visa/nepal/${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
          })),
          unsubscribeToken: r.unsubscribe_token,
        });
        if (ok) {
          sent++;
          await client.query(`UPDATE visa_alert_subscribers SET last_emailed_at = NOW() WHERE id = $1`, [r.id]);
        }
      }
      // If every send failed (e.g. a bad API key), keep the old snapshot so
      // the next deploy retries instead of silently dropping the alert.
      if (attempted > 0 && sent === 0) {
        logger.warn(`[visa-alerts] All ${attempted} alert email(s) failed — will retry on next start`);
        return changes;
      }
      await writeSnapshot();
      logger.info(`[visa-alerts] Emailed ${sent}/${attempted} subscriber(s) about ${changes.length} change(s)`);
      return changes;
    } finally {
      await client.query(`SELECT pg_advisory_unlock(827364)`);
    }
  } finally {
    client.release();
  }
}
