import assert from "node:assert/strict";
import test from "node:test";
import { convertCurrency, currencyCacheStatus, fetchCurrencyRates, parseCurrencyRateResponse } from "../src/systems/CurrencyRates.js";

test("currency response validation keeps only finite requested currency rates", () => {
  const parsed = parseCurrencyRateResponse({ base: "MYR", date: "2026-08-22", rates: { USD: 0.23, SGD: 0.3, BAD: "no" } }, "MYR", "2026-08-23T00:00:00.000Z");
  assert.deepEqual(parsed?.rates, { USD: 0.23, SGD: 0.3 });
  assert.equal(parseCurrencyRateResponse({ base: "MYR", date: "bad", rates: {} }, "MYR", "now"), null);
});

test("currency conversion supports direct, inverse, and same-currency values", () => {
  const payload = parseCurrencyRateResponse({ base: "MYR", date: "2026-08-22", rates: { USD: 0.23 } }, "MYR", "2026-08-23T00:00:00.000Z")!;
  assert.equal(convertCurrency(100, "MYR", "USD", payload), 23);
  assert.equal(convertCurrency(23, "USD", "MYR", payload), 100);
  assert.equal(convertCurrency(12, "MYR", "MYR", payload), 12);
});

test("currency fetch uses injected fetch and reports stale cache without fabricating rates", async () => {
  const fetcher: typeof fetch = (async () => new Response(JSON.stringify({ base: "MYR", date: "2026-08-22", rates: { USD: 0.23 } }), { status: 200 })) as typeof fetch;
  const payload = await fetchCurrencyRates("MYR", fetcher, () => "2026-08-23T00:00:00.000Z");
  assert.equal(payload.rates.USD, 0.23);
  assert.equal(currencyCacheStatus(payload, "2026-08-23T01:00:00.000Z", 30 * 60 * 1000), "stale");
  assert.equal(convertCurrency(1, "MYR", "SGD", payload), null);
});
