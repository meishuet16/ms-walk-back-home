export const currencyCodes = ["MYR", "SGD", "USD", "JPY", "CNY", "EUR", "GBP"] as const;
export type CurrencyCode = typeof currencyCodes[number];
export type CurrencyRatePayload = { base: CurrencyCode; rates: Partial<Record<CurrencyCode, number>>; date: string; fetchedAt: string };

export function parseCurrencyRateResponse(value: unknown, base: CurrencyCode, fetchedAt: string): CurrencyRatePayload | null {
  if (!value || typeof value !== "object") return null;
  const source = value as { base?: unknown; date?: unknown; rates?: unknown };
  if (source.base !== base || typeof source.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(source.date) || !source.rates || typeof source.rates !== "object") return null;
  const rates: Partial<Record<CurrencyCode, number>> = {};
  for (const code of currencyCodes) {
    const rate = (source.rates as Record<string, unknown>)[code];
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) rates[code] = rate;
  }
  return { base, rates, date: source.date, fetchedAt };
}

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode, payload: CurrencyRatePayload): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;
  if (payload.base === from) {
    const rate = payload.rates[to];
    return rate === undefined ? null : amount * rate;
  }
  if (payload.base === to) {
    const rate = payload.rates[from];
    return rate === undefined || rate === 0 ? null : amount / rate;
  }
  const fromRate = payload.rates[from];
  const toRate = payload.rates[to];
  return fromRate === undefined || toRate === undefined || fromRate === 0 ? null : amount / fromRate * toRate;
}

export function currencyCacheStatus(payload: CurrencyRatePayload, now: string, maxAgeMs = 30 * 60 * 1000): "fresh" | "stale" {
  const age = Date.parse(now) - Date.parse(payload.fetchedAt);
  return Number.isFinite(age) && age >= 0 && age <= maxAgeMs ? "fresh" : "stale";
}

export async function fetchCurrencyRates(base: CurrencyCode, fetcher: typeof fetch = fetch, now: () => string = () => new Date().toISOString()): Promise<CurrencyRatePayload> {
  const quotes = currencyCodes.filter((code) => code !== base).join(",");
  const response = await fetcher(`https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${quotes}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Currency request failed: ${response.status}`);
  const payload = parseCurrencyRateResponse(await response.json(), base, now());
  if (!payload) throw new Error("Currency response was unavailable");
  return payload;
}
