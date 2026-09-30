import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "himal-to-horizon", env: process.env.NODE_ENV ?? "development" },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) { return { level: label }; },
  },
});

export function logRequest(method: string, path: string, statusCode: number, durationMs: number, extra?: Record<string, unknown>) {
  logger.info({ type: "http_request", method, path, statusCode, durationMs, ...extra });
}

export function logError(message: string, err?: unknown, extra?: Record<string, unknown>) {
  logger.error({ type: "error", message, error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err), ...extra });
}
