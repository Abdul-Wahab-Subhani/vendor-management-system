import { logger } from "../config/logger";
import { EmailService } from "../services/email.service";

const POLL_INTERVAL_MS = 60_000; // every minute

export function startEmailSchedulerJob() {
  setInterval(async () => {
    try {
      const sent = await EmailService.processScheduledEmails();
      if (sent > 0) logger.info(`Email scheduler: dispatched ${sent} scheduled email(s)`);
    } catch (err) {
      logger.error(`Email scheduler job failed: ${(err as Error).message}`);
    }
  }, POLL_INTERVAL_MS);

  logger.info("Email scheduler job started (interval: 60s)");
}
