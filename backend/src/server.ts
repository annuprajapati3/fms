import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { disconnectPrisma, prisma } from '@/config/prisma';

async function main(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connection established');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`FMS backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await disconnectPrisma();
      logger.info('Shutdown complete');
      process.exit(0);
    });

    // Force exit if shutdown hangs
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
