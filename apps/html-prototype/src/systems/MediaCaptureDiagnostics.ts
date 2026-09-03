export type MediaCaptureErrorDetails = {
  name: string;
  message: string;
  constraint?: string;
};

export function mediaCaptureErrorDetails(error: unknown): MediaCaptureErrorDetails {
  const candidate = error as { name?: unknown; message?: unknown; constraint?: unknown } | null;
  const name = typeof candidate?.name === "string" && candidate.name ? candidate.name : "UnknownError";
  const message = typeof candidate?.message === "string" ? candidate.message : "";
  const constraint = typeof candidate?.constraint === "string" && candidate.constraint ? candidate.constraint : undefined;
  return { name, message, ...(constraint ? { constraint } : {}) };
}

export function describeMediaCaptureError(error: unknown): string {
  const details = mediaCaptureErrorDetails(error);
  return details.message ? `${details.name}: ${details.message}` : details.name;
}

export function mediaCaptureFailureMessage(error: unknown): string {
  const details = mediaCaptureErrorDetails(error);
  if (details.name === "NotAllowedError" || details.name === "SecurityError") {
    return `Microphone access was denied or unavailable (${describeMediaCaptureError(error)}).`;
  }
  if (details.name === "NotFoundError") return `No microphone was found (${describeMediaCaptureError(error)}).`;
  if (details.name === "NotReadableError") return `The microphone is busy or unavailable (${describeMediaCaptureError(error)}).`;
  return `Microphone recording failed (${describeMediaCaptureError(error)}).`;
}

export function reportMediaCaptureError(context: string, error: unknown): MediaCaptureErrorDetails {
  const details = mediaCaptureErrorDetails(error);
  console.error(`[Walk Back Home] ${context}: ${describeMediaCaptureError(error)}`, details);
  return details;
}
