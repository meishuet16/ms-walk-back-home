export const currencyCodes = ["MYR", "SGD", "USD", "JPY", "CNY", "EUR", "GBP"] as const;
export type CurrencyCode = typeof currencyCodes[number];
export type CurrencyRatePayload = {
  base: CurrencyCode;
  rates: Partial<Record<CurrencyCode, number>>;
  date: string;
  fetchedAt: string;
  quote?: CurrencyCode;
  rate?: number;
};

type RateRow = { base?: unknown; quote?: unknown; rate?: unknown; date?: unknown };

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (currencyCodes as readonly string[]).includes(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseCurrencyRateResponse(value: unknown, base: CurrencyCode, fetchedAt: string, quote?: CurrencyCode): CurrencyRatePayload | null {
  const rows: RateRow[] = Array.isArray(value) ? value.filter((row): row is RateRow => !!row && typeof row === "object") : value && typeof value === "object" ? [value as RateRow] : [];
  const rates: Partial<Record<CurrencyCode, number>> = {};
  let date = "";
  for (const row of rows) {
    if (row.base !== base || !isCurrencyCode(row.quote) || !isDate(row.date) || typeof row.rate !== "number" || !Number.isFinite(row.rate) || row.rate <= 0) continue;
    if (quote && row.quote !== quote) continue;
    rates[row.quote] = row.rate;
    date = row.date;
  }
  if (!date || !Object.keys(rates).length) return null;
  const selectedQuote = quote && rates[quote] !== undefined ? quote : undefined;
  return { base, rates, date, fetchedAt, ...(selectedQuote ? { quote: selectedQuote, rate: rates[selectedQuote] } : {}) };
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

export function currencyPairKey(base: CurrencyCode, quote: CurrencyCode): string {
  return `${base}/${quote}`;
}

export function currencyPayloadMatchesPair(payload: CurrencyRatePayload | null | undefined, base: CurrencyCode, quote: CurrencyCode): boolean {
  return payload?.base === base && payload.quote === quote;
}

export function currencyRequestIsCurrent(requestedPair: string, currentPair: string, requestId: number, currentRequestId: number): boolean {
  return requestedPair === currentPair && requestId === currentRequestId;
}

export async function fetchCurrencyRate(base: CurrencyCode, quote: CurrencyCode, fetcher: typeof fetch = fetch, now: () => string = () => new Date().toISOString()): Promise<CurrencyRatePayload> {
  if (base === quote) return { base, quote, rate: 1, rates: { [quote]: 1 }, date: now().slice(0, 10), fetchedAt: now() };
  const response = await fetcher(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Currency request failed: ${response.status}`);
  const payload = parseCurrencyRateResponse(await response.json(), base, now(), quote);
  if (!payload || payload.rate === undefined) throw new Error("Currency response was unavailable");
  return payload;
}

export async function fetchCurrencyRates(base: CurrencyCode, fetcher: typeof fetch = fetch, now: () => string = () => new Date().toISOString()): Promise<CurrencyRatePayload> {
  const quotes = currencyCodes.filter((code) => code !== base).join(",");
  const response = await fetcher(`https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${quotes}`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Currency request failed: ${response.status}`);
  const payload = parseCurrencyRateResponse(await response.json(), base, now());
  if (!payload) throw new Error("Currency response was unavailable");
  return payload;
}
