type LogContext = Record<string, unknown>;

function toErrorPayload(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

/**
 * Lightweight structured error log for server-side paths.
 */
export function logServerError(event: string, context: LogContext, error: unknown) {
  const payload = {
    level: "error",
    event,
    context,
    error: toErrorPayload(error),
  };
  console.error("[citygram]", JSON.stringify(payload));
}
