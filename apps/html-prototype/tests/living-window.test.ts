import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultWindowLocation,
  fetchOpenMeteoLocations,
  parseOpenMeteoForecastResponse,
  weatherCacheStatus,
  weatherCodeToCondition,
  weatherVisualFor
} from "../src/systems/LivingWindow.js";

const forecastFixture = {
  current: {
    time: "2026-08-23T12:00",
    temperature_2m: 28.4,
    apparent_temperature: 31.1,
    relative_humidity_2m: 79,
    precipitation: 1.2,
    rain: 0.8,
    showers: 0,
    snowfall: 0,
    weather_code: 61,
    cloud_cover: 88,
    wind_speed_10m: 9.4
  },
  hourly: {
    time: ["2026-08-23T12:00", "2026-08-23T13:00"],
    precipitation_probability: [72, 85]
  },
  daily: {
    time: ["2026-08-23"],
    weather_code: [61],
    precipitation_probability_max: [91],
    sunrise: ["2026-08-23T07:10"],
    sunset: ["2026-08-23T19:20"],
    uv_index_max: [8.4]
  },
  timezone: "Asia/Kuala_Lumpur",
  utc_offset_seconds: 28800
};

test("Open-Meteo parser keeps current precipitation distinct from hourly probability", () => {
  const snapshot = parseOpenMeteoForecastResponse(forecastFixture, defaultWindowLocation, new Date("2026-08-23T04:00:00.000Z"));
  assert.equal(snapshot.current.precipitationMm, 1.2);
  assert.equal(snapshot.current.precipitationProbabilityPercent, 72);
  assert.equal(snapshot.current.precipitationProbabilitySource, "hourly");
  assert.equal(snapshot.daily.precipitationProbabilityMaxPercent, 91);
  assert.notEqual(snapshot.current.precipitationProbabilityPercent, snapshot.current.precipitationMm);
});

test("weather mapping distinguishes dry, rain, storm, and fog visuals", () => {
  assert.equal(weatherCodeToCondition(0).id, "clear");
  assert.equal(weatherCodeToCondition(61).id, "rain");
  assert.equal(weatherCodeToCondition(95).id, "storm");
  assert.equal(weatherCodeToCondition(45).id, "fog");
  assert.equal(weatherVisualFor({ code: 0, precipitationMm: 0 }).layer, "clear");
  assert.equal(weatherVisualFor({ code: 61, precipitationMm: 0 }).layer, "rain");
  assert.equal(weatherVisualFor({ code: 95, precipitationMm: 0 }).layer, "storm");
});

test("weather cache status supports fresh, stale, and absent values", () => {
  const snapshot = parseOpenMeteoForecastResponse(forecastFixture, defaultWindowLocation, new Date("2026-08-23T04:00:00.000Z"));
  assert.equal(weatherCacheStatus(snapshot, new Date("2026-08-23T04:20:00.000Z")), "fresh");
  assert.equal(weatherCacheStatus(snapshot, new Date("2026-08-23T10:00:00.000Z")), "stale");
  assert.equal(weatherCacheStatus(null, new Date()), "empty");
});

test("geocoding uses injected fetch and strict location parsing", async () => {
  const locations = await fetchOpenMeteoLocations("Kuala Lumpur", async () => new Response(JSON.stringify({ results: [{ id: 1733046, name: "Kuala Lumpur", country: "Malaysia", latitude: 3.139, longitude: 101.6869, timezone: "Asia/Kuala_Lumpur" }] }), { status: 200 }));
  assert.deepEqual(locations[0], { id: 1733046, name: "Kuala Lumpur", country: "Malaysia", latitude: 3.139, longitude: 101.6869, timezone: "Asia/Kuala_Lumpur" });
});
