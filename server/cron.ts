import { storage } from "./storage";
import { searchFlightForDate } from "./aviasales";
import { sendPriceAlertEmail } from "./email";

const ALERT_THRESHOLD_PCT = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const BETWEEN_REQUESTS_MS = 3000;

async function checkAllAlerts() {
  console.log("[cron] Starting daily price alert check...");
  let alerts: Awaited<ReturnType<typeof storage.getAllActiveAlerts>>;
  try {
    alerts = await storage.getAllActiveAlerts();
  } catch (err) {
    console.error("[cron] Failed to fetch alerts:", err);
    return;
  }

  console.log(`[cron] Checking ${alerts.length} active alert(s)...`);

  for (const alert of alerts) {
    try {
      // Skip unverified email addresses — alerts only go to confirmed inboxes
      if (!alert.userEmailVerified) {
        console.log(`[cron] Skipping alert ${alert.id} — user email not verified`);
        continue;
      }

      if (alert.lastAlertedAt) {
        const lastSent = new Date(alert.lastAlertedAt).getTime();
        if (Date.now() - lastSent < COOLDOWN_MS) {
          console.log(`[cron] Skipping alert ${alert.id} (sent within last 24h)`);
          continue;
        }
      }

      const offer = await searchFlightForDate(
        alert.origin,
        alert.destination,
        alert.departureDate,
        alert.passengersAdult,
        0,
        0,
        alert.cabinClass,
        alert.returnDate ?? undefined
      );

      if (!offer) {
        console.log(`[cron] No offer found for alert ${alert.id} (${alert.origin}→${alert.destination} ${alert.departureDate})`);
        await sleep(BETWEEN_REQUESTS_MS);
        continue;
      }

      const newPrice = parseFloat(offer.total_amount);
      const savings = alert.baselinePrice - newPrice;
      const savingsPercent = (savings / alert.baselinePrice) * 100;

      console.log(`[cron] Alert ${alert.id}: baseline=${alert.baselinePrice} new=${newPrice} drop=${savingsPercent.toFixed(1)}%`);

      if (savingsPercent >= ALERT_THRESHOLD_PCT) {
        const ok = await sendPriceAlertEmail({
          toEmail: alert.userEmail,
          toName: alert.userName ?? "",
          origin: alert.origin,
          destination: alert.destination,
          departureDate: alert.departureDate,
          returnDate: alert.returnDate ?? undefined,
          baselinePrice: alert.baselinePrice,
          newPrice,
          savings,
          savingsPercent,
          currency: alert.currency ?? offer.total_currency,
        });
        if (ok) {
          await storage.markAlertSent(alert.id);
          console.log(`[cron] Alert email sent for alert ${alert.id} (saved ${savingsPercent.toFixed(1)}%)`);
        }
      }

      await sleep(BETWEEN_REQUESTS_MS);
    } catch (err) {
      console.error(`[cron] Error processing alert ${alert.id}:`, err);
      await sleep(BETWEEN_REQUESTS_MS);
    }
  }

  console.log("[cron] Daily price alert check complete.");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startPriceCron() {
  console.log("[cron] Price alert cron job registered (runs every 24h)");
  setTimeout(async () => {
    await checkAllAlerts();
    setInterval(checkAllAlerts, CHECK_INTERVAL_MS);
  }, 60 * 1000);
}
