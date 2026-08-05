const SENSITIVE_KEYS = new Set(["body", "title", "rawContent", "rawDiary", "diaryText", "content"]);

type LogValue = string | number | boolean | null | LogValue[] | { [key: string]: LogValue };

export function redactDiaryLogPayload<T extends LogValue>(payload: T): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => redactDiaryLogPayload(item)) as T;
  }

  if (payload && typeof payload === "object") {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        SENSITIVE_KEYS.has(key) ? "[redacted]" : redactDiaryLogPayload(value)
      ])
    ) as T;
  }

  return payload;
}
