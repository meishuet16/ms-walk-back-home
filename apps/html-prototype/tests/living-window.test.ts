import assert from "node:assert/strict";
import test from "node:test";
import {
  createLivingWindowViewModel,
  defaultWindowLocation,
  fetchOpenMeteoLocations,
  parseOpenMeteoForecastResponse,
  moonPhaseDescription,
  rainSummaryFor,
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
    temperature_2m: [28, 27],
    weather_code: [61, 61],
    precipitation_probability: [72, 85]
  },
  daily: {
    time: ["2026-08-23", "2026-08-24", "2026-08-25"],
    weather_code: [61, 3, 0],
    temperature_2m_max: [32, 31, 33],
    temperature_2m_min: [25, 24, 25],
    precipitation_probability_max: [91, 70, 15],
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
  assert.equal(snapshot.hourly[1].temperatureC, 27);
  assert.equal(snapshot.daily.precipitationProbabilityMaxPercent, 91);
  assert.notEqual(snapshot.current.precipitationProbabilityPercent, snapshot.current.precipitationMm);
  assert.equal(snapshot.daily.forecast[0].highC, 32);
  assert.equal(snapshot.daily.forecast[1].precipitationProbabilityMaxPercent, 70);
  const view = createLivingWindowViewModel(snapshot, { label: "Waxing crescent", illuminationPercent: 28 }, "ready", new Date("2026-08-23T04:20:00.000Z"));
  assert.equal(view.precipitationLabel, "Rain now 1.2 mm");
  assert.equal(view.probabilityLabel, "Next hour 72%");
  assert.equal(view.forecast[0].probabilityLabel, "91% rain chance");
  assert.equal(view.rainSummary, "Rain likely between 12:00 pm–1:00 pm.");
  assert.equal(view.hourly.length, 2);
});

test("rain summaries stay deterministic and honest when hourly probability is absent", () => {
  const clear = [{ time: "2026-08-23T12:00", condition: weatherCodeToCondition(0), temperatureC: 30, precipitationProbabilityPercent: null }];
  assert.equal(rainSummaryFor(clear, "2026-08-23T12:00"), "No rain expected in the next few hours.");
  assert.equal(rainSummaryFor([{ ...clear[0], precipitationProbabilityPercent: 62 }], "2026-08-23T12:00"), "Rain likely around 12:00 pm.");
});

test("moon phase copy stays human-readable", () => {
  assert.equal(moonPhaseDescription("Waxing gibbous"), "Almost full");
  assert.equal(moonPhaseDescription("Waning crescent"), "A thin moon before the new moon");
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
