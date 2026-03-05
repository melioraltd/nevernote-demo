import pino from 'pino';

/**
 * Determines if we're in development mode.
 * Uses Vite's import.meta.env.MODE for environment detection.
 */
const isDev = import.meta.env.MODE === 'development';

/**
 * Log levels:
 * - Development: 'debug' (verbose, all logs)
 * - Production: 'warn' (minimal, only warnings and errors)
 */
const level = isDev ? 'debug' : 'warn';

/**
 * Pino logger instance configured for browser environment.
 *
 * Dev mode: verbose logging with debug level for easy tracing
 * Prod mode: minimal logging with warn level only
 */
export const logger = pino({
  level,
  browser: {
    asObject: true,
  },
});

/**
 * Create a child logger with a specific module name.
 * Useful for categorizing logs by component/service.
 *
 * @example
 * const log = createLogger('auth-service');
 * log.info('User logged in');
 */
export function createLogger(module: string) {
  return logger.child({ module });
}

// Log the current mode on startup (only in dev)
if (isDev) {
  logger.debug({ mode: import.meta.env.MODE }, 'Logger initialized in development mode');
}
