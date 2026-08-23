import assert from "node:assert/strict";
import test from "node:test";
import { convertCurrency, currencyCacheStatus, currencyPayloadMatchesPair, currencyRequestIsCurrent, fetchCurrencyRate, fetchCurrencyRates, parseCurrencyRateResponse } from "../src/systems/CurrencyRates.js";

const rows = [
  { base: "MYR", quote: "USD", rate: 0.23, date: "2026-08-22" },
  { base: "MYR", quote: "SGD", rate: 0.3, date: "2026-08-22" }
];

test("currency response validation parses current Frankfurter v2 flat rows", () => {
  const parsed = parseCurrencyRateResponse(rows, "MYR", "2026-08-23T00:00:00.000Z");
  assert.deepEqual(parsed?.rates, { USD: 0.23, SGD: 0.3 });
  assert.equal(parseCurrencyRateResponse([{ base: "MYR", quote: "USD", rate: "bad", date: "2026-08-22" }], "MYR", "now"), null);
});

test("currency conversion supports direct, inverse, and same-currency values", () => {
  const payload = parseCurrencyRateResponse(rows, "MYR", "2026-08-23T00:00:00.000Z")!;
  assert.equal(convertCurrency(100, "MYR", "USD", payload), 23);
  assert.equal(convertCurrency(23, "USD", "MYR", payload), 100);
  assert.equal(convertCurrency(12, "MYR", "MYR", payload), 12);
});

test("currency fetch uses the v2 direct pair endpoint and reports stale cache", async () => {
  let requested = "";
  const fetcher: typeof fetch = (async (input) => {
    requested = String(input);
    return new Response(JSON.stringify({ base: "MYR", quote: "USD", rate: 0.23, date: "2026-08-22" }), { status: 200 });
  }) as typeof fetch;
  const payload = await fetchCurrencyRate("MYR", "USD", fetcher, () => "2026-08-23T00:00:00.000Z");
  assert.match(requested, /\/v2\/rate\/MYR\/USD/);
  assert.equal(payload.rate, 0.23);
  assert.equal(currencyCacheStatus(payload, "2026-08-23T01:00:00.000Z", 30 * 60 * 1000), "stale");
});

test("currency fetch accepts v2 flat rows for a base cache", async () => {
  const fetcher: typeof fetch = (async () => new Response(JSON.stringify(rows), { status: 200 })) as typeof fetch;
  const payload = await fetchCurrencyRates("MYR", fetcher, () => "2026-08-23T00:00:00.000Z");
  assert.equal(payload.rates.USD, 0.23);
});

test("currency payloads are never valid for a different selected pair", () => {
  const payload = parseCurrencyRateResponse(rows, "MYR", "2026-08-23T00:00:00.000Z", "USD")!;
  assert.equal(currencyPayloadMatchesPair(payload, "MYR", "USD"), true);
  assert.equal(currencyPayloadMatchesPair(payload, "MYR", "JPY"), false);
});

test("currency request identity rejects slower responses from an older pair", () => {
  assert.equal(currencyRequestIsCurrent("MYR/USD", "MYR/JPY", 1, 2), false);
  assert.equal(currencyRequestIsCurrent("MYR/JPY", "MYR/JPY", 2, 2), true);
  assert.equal(currencyRequestIsCurrent("MYR/USD", "MYR/USD", 1, 1), true);
});
