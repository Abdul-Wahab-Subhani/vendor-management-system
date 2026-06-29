import { execSync } from "child_process";
import { logger } from "./config/logger";
import { startServer } from "./server";

function runCommand(command: string) {
  execSync(command, { stdio: "inherit" });
}

async function bootstrap() {
  logger.info("Running production database migrations...");
  runCommand("npx prisma migrate deploy");

  logger.info("Seeding default production data...");
  runCommand("node prisma/seed.js");

  logger.info("Starting API server...");
  await startServer();
}

void bootstrap();