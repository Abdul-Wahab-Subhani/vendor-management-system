import http from "http";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";
import { initSocketServer } from "./sockets";
import { startEmailSchedulerJob } from "./jobs/emailScheduler.job";

const server = http.createServer(app);

initSocketServer(server);
startEmailSchedulerJob();

server.listen(env.port, () => {
  logger.info(`🚀 VMS API server running on port ${env.port} [${env.nodeEnv}]`);
  logger.info(`🔌 Socket.io ready for real-time connections`);
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Server closed. Goodbye!");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});
