import { runScrape } from "./orchestrator";
import { startScheduler } from "./scheduler";

await runScrape();
startScheduler();
