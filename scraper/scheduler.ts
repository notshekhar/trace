import { runScrape } from "./orchestrator";
import { publishEdition } from "./db";

export function startScheduler(): void {
  // Every 2 hours
  Bun.cron("0 */2 * * *", async () => {
    await runScrape();
  });

  // Midnight: publish today's edition (articles collected yesterday go live)
  Bun.cron("0 0 * * *", async () => {
    const today = new Date().toISOString().split("T")[0];
    publishEdition(today);
    console.log(`[scheduler] Published edition ${today}`);
  });

  console.log("[scheduler] Cron jobs registered. Scraper running...");
}
