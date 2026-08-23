export type WindowLocation = {
  id?: number;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export type WeatherCondition = { id: "clear" | "cloud" | "fog" | "rain" | "snow" | "storm"; label: string; code: number };
export type WeatherForecastDay = {
  date: string;
  condition: WeatherCondition;
  highC: number;
  lowC: number;
  precipitationProbabilityMaxPercent: number | null;
};
export type WeatherSnapshot = {
  provider: "open-meteo";
  fetchedAt: string;
  location: WindowLocation;
  timezone: string;
  current: {
    time: string;
    condition: WeatherCondition;
    temperatureC: number;
    apparentTemperatureC: number;
    humidityPercent: number;
    precipitationMm: number;
    rainMm: number;
    showersMm: number;
    snowfallMm: number;
    cloudCoverPercent: number;
    windSpeedKmh: number;
    precipitationProbabilityPercent: number | null;
    precipitationProbabilitySource: "hourly" | "unavailable";
  };
  daily: {
    date: string;
    condition: WeatherCondition;
    precipitationProbabilityMaxPercent: number | null;
    sunrise: string;
    sunset: string;
    uvIndexMax: number | null;
    forecast: WeatherForecastDay[]
  };
};

export type WeatherVisual = {
  layer: "clear" | "cloud" | "fog" | "rain" | "snow" | "storm";
  tint: string;
  cloudOpacity: number;
  rainOpacity: number;
  fogOpacity: number;
  lightning: boolean;
};

export const defaultWindowLocation: WindowLocation = {
  id: 1733046,
  name: "Kuala Lumpur",
  country: "Malaysia",
  latitude: 3.139,
  longitude: 101.6869,
  timezone: "Asia/Kuala_Lumpur"
};

const conditionMap: Record<number, WeatherCondition> = {
  0: { id: "clear", label: "Clear", code: 0 },
  1: { id: "clear", label: "Mainly clear", code: 1 },
  2: { id: "cloud", label: "Partly cloudy", code: 2 },
  3: { id: "cloud", label: "Overcast", code: 3 },
  45: { id: "fog", label: "Fog", code: 45 },
  48: { id: "fog", label: "Rime fog", code: 48 },
  51: { id: "rain", label: "Light drizzle", code: 51 },
  53: { id: "rain", label: "Drizzle", code: 53 },
  55: { id: "rain", label: "Dense drizzle", code: 55 },
  56: { id: "rain", label: "Freezing drizzle", code: 56 },
  57: { id: "rain", label: "Dense freezing drizzle", code: 57 },
  61: { id: "rain", label: "Slight rain", code: 61 },
  63: { id: "rain", label: "Rain", code: 63 },
  65: { id: "rain", label: "Heavy rain", code: 65 },
  66: { id: "rain", label: "Freezing rain", code: 66 },
  67: { id: "rain", label: "Heavy freezing rain", code: 67 },
  71: { id: "snow", label: "Slight snow", code: 71 },
  73: { id: "snow", label: "Snow", code: 73 },
  75: { id: "snow", label: "Heavy snow", code: 75 },
  77: { id: "snow", label: "Snow grains", code: 77 },
  80: { id: "rain", label: "Rain showers", code: 80 },
  81: { id: "rain", label: "Rain showers", code: 81 },
  82: { id: "rain", label: "Violent rain showers", code: 82 },
  85: { id: "snow", label: "Snow showers", code: 85 },
  86: { id: "snow", label: "Heavy snow showers", code: 86 },
  95: { id: "storm", label: "Thunderstorm", code: 95 },
  96: { id: "storm", label: "Thunderstorm with hail", code: 96 },
  99: { id: "storm", label: "Thunderstorm with heavy hail", code: 99 }
};

export function weatherCodeToCondition(code: number): WeatherCondition {
  return conditionMap[code] ?? { id: "cloud", label: "Unmapped sky", code };
}

export function weatherVisualFor(input: { code: number; precipitationMm: number }): WeatherVisual {
  const condition = weatherCodeToCondition(input.code);
  if (condition.id === "storm") return { layer: "storm", tint: "rgba(57, 72, 108, .30)", cloudOpacity: .95, rainOpacity: .9, fogOpacity: .12, lightning: true };
  if (condition.id === "rain") return { layer: "rain", tint: "rgba(68, 105, 133, .22)", cloudOpacity: .72, rainOpacity: Math.min(1, .42 + input.precipitationMm * .08), fogOpacity: .08, lightning: false };
  if (condition.id === "snow") return { layer: "snow", tint: "rgba(168, 188, 208, .18)", cloudOpacity: .45, rainOpacity: .5, fogOpacity: .06, lightning: false };
  if (condition.id === "fog") return { layer: "fog", tint: "rgba(184, 198, 194, .18)", cloudOpacity: .38, rainOpacity: 0, fogOpacity: .6, lightning: false };
  if (condition.id === "cloud") return { layer: "cloud", tint: "rgba(112, 133, 146, .12)", cloudOpacity: .54, rainOpacity: 0, fogOpacity: .04, lightning: false };
  return { layer: "clear", tint: "rgba(94, 151, 178, .04)", cloudOpacity: .16, rainOpacity: 0, fogOpacity: 0, lightning: false };
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function finitePercent(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

function arrayValue(source: Record<string, unknown>, key: string): unknown[] {
  const value = source[key];
  return Array.isArray(value) ? value : [];
}

function nearestIndex(times: unknown[], target: string): number {
  const exact = times.indexOf(target);
  if (exact >= 0) return exact;
  const targetMs = Date.parse(target);
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  times.forEach((value, index) => {
    const distance = Math.abs(Date.parse(String(value)) - targetMs);
    if (Number.isFinite(distance) && distance < bestDistance) { best = index; bestDistance = distance; }
  });
  return best;
}

export function parseOpenMeteoForecastResponse(value: unknown, location: WindowLocation, fetchedAt: Date = new Date()): WeatherSnapshot {
  if (!value || typeof value !== "object") throw new Error("Weather response was unavailable");
  const source = value as Record<string, unknown>;
  if (!source.current || typeof source.current !== "object" || !source.hourly || typeof source.hourly !== "object" || !source.daily || typeof source.daily !== "object") throw new Error("Weather response is incomplete");
  const current = source.current as Record<string, unknown>;
  const hourly = source.hourly as Record<string, unknown>;
  const daily = source.daily as Record<string, unknown>;
  const currentTime = typeof current.time === "string" ? current.time : "";
  const hourlyTimes = arrayValue(hourly, "time");
  const probabilityValues = arrayValue(hourly, "precipitation_probability");
  const hourlyIndex = nearestIndex(hourlyTimes, currentTime);
  const probability = finitePercent(probabilityValues[hourlyIndex]);
  const dailyTimes = arrayValue(daily, "time");
  const date = typeof dailyTimes[0] === "string" ? dailyTimes[0] : currentTime.slice(0, 10);
  const dailyCodes = arrayValue(daily, "weather_code");
  const dailyProbabilityValues = arrayValue(daily, "precipitation_probability_max");
  const dailyHighValues = arrayValue(daily, "temperature_2m_max");
  const dailyLowValues = arrayValue(daily, "temperature_2m_min");
  const dailyProbability = finitePercent(dailyProbabilityValues[0]);
  const code = finite(current.weather_code);
  const forecast = dailyTimes.map((value, index) => ({
    date: String(value),
    condition: weatherCodeToCondition(finite(dailyCodes[index], code)),
    highC: finite(dailyHighValues[index]),
    lowC: finite(dailyLowValues[index]),
    precipitationProbabilityMaxPercent: finitePercent(dailyProbabilityValues[index])
  }));
  return {
    provider: "open-meteo",
    fetchedAt: fetchedAt.toISOString(),
    location,
    timezone: typeof source.timezone === "string" ? source.timezone : location.timezone ?? "auto",
    current: {
      time: currentTime,
      condition: weatherCodeToCondition(code),
      temperatureC: finite(current.temperature_2m),
      apparentTemperatureC: finite(current.apparent_temperature),
      humidityPercent: finite(current.relative_humidity_2m),
      precipitationMm: finite(current.precipitation),
      rainMm: finite(current.rain),
      showersMm: finite(current.showers),
      snowfallMm: finite(current.snowfall),
      cloudCoverPercent: finite(current.cloud_cover),
      windSpeedKmh: finite(current.wind_speed_10m),
      precipitationProbabilityPercent: probability,
      precipitationProbabilitySource: probability === null ? "unavailable" : "hourly"
    },
    daily: {
      date,
      condition: weatherCodeToCondition(finite(dailyCodes[0], code)),
      precipitationProbabilityMaxPercent: dailyProbability,
      sunrise: String(arrayValue(daily, "sunrise")[0] ?? ""),
      sunset: String(arrayValue(daily, "sunset")[0] ?? ""),
      uvIndexMax: finitePercent(arrayValue(daily, "uv_index_max")[0]),
      forecast
    }
  };
}

export function weatherCacheStatus(snapshot: WeatherSnapshot | null, now: Date = new Date(), maxAgeMs = 30 * 60 * 1000): "fresh" | "stale" | "empty" {
  if (!snapshot) return "empty";
  const age = now.getTime() - Date.parse(snapshot.fetchedAt);
  return Number.isFinite(age) && age >= 0 && age <= maxAgeMs ? "fresh" : "stale";
}

export async function fetchOpenMeteoWeather(location: WindowLocation, fetcher: typeof fetch = fetch, now: () => Date = () => new Date()): Promise<WeatherSnapshot> {
  const current = "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m";
  const hourly = "precipitation_probability";
  const daily = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=${current}&hourly=${hourly}&daily=${daily}&timezone=auto&forecast_days=4`;
  const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
  return parseOpenMeteoForecastResponse(await response.json(), location, now());
}

export async function fetchOpenMeteoLocations(query: string, fetcher: typeof fetch = fetch): Promise<WindowLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const response = await fetcher(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Location request failed: ${response.status}`);
  const payload = await response.json() as { results?: unknown };
  if (!Array.isArray(payload.results)) return [];
  return payload.results.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    if (typeof item.name !== "string" || typeof item.latitude !== "number" || typeof item.longitude !== "number") return [];
    return [{ id: typeof item.id === "number" ? item.id : undefined, name: item.name, country: typeof item.country === "string" ? item.country : undefined, latitude: item.latitude, longitude: item.longitude, timezone: typeof item.timezone === "string" ? item.timezone : undefined }];
  });
}

export type LivingWindowViewModel = {
  locationLabel: string;
  conditionLabel: string;
  temperatureLabel: string;
  feelsLikeLabel: string;
  precipitationLabel: string;
  probabilityLabel: string;
  humidityLabel: string;
  windLabel: string;
  sunsetLabel: string;
  moonLabel: string;
  moonIlluminationLabel: string;
  forecast: Array<{
    date: string;
    conditionLabel: string;
    highLabel: string;
    lowLabel: string;
    probabilityLabel: string;
  }>;
  statusLabel: string;
};

export function livingWindowStatusCopy(snapshot: WeatherSnapshot | null, status: "loading" | "ready" | "error", now: Date = new Date()): string {
  if (status === "loading") return "Looking outside…";
  if (status === "error") return snapshot ? "Cached · updated " + new Date(snapshot.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Weather unavailable";
  if (!snapshot) return "Weather unavailable";
  return weatherCacheStatus(snapshot, now) === "fresh" ? "Updated just now" : "Cached · updated " + new Date(snapshot.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function createLivingWindowViewModel(snapshot: WeatherSnapshot | null, moon: { label: string; illuminationPercent: number }, status: "loading" | "ready" | "error", now: Date = new Date()): LivingWindowViewModel {
  const locationLabel = snapshot ? [snapshot.location.name, snapshot.location.country].filter(Boolean).join(", ") : "Choose a location";
  if (!snapshot) return {
    locationLabel,
    conditionLabel: "Weather unavailable",
    temperatureLabel: "—",
    feelsLikeLabel: "Feels like —",
    precipitationLabel: "Rain now —",
    probabilityLabel: "Next hour —",
    humidityLabel: "Humidity —",
    windLabel: "Wind —",
    sunsetLabel: "Sunset —",
    moonLabel: moon.label,
    moonIlluminationLabel: moon.illuminationPercent + "% illuminated",
    forecast: [],
    statusLabel: livingWindowStatusCopy(null, status, now)
  };
  const formatTime = (value: string) => value ? new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
  return {
    locationLabel,
    conditionLabel: snapshot.current.condition.label,
    temperatureLabel: snapshot.current.temperatureC.toFixed(1) + "°C",
    feelsLikeLabel: "Feels like " + snapshot.current.apparentTemperatureC.toFixed(1) + "°C",
    precipitationLabel: "Rain now " + snapshot.current.precipitationMm.toFixed(1) + " mm",
    probabilityLabel: snapshot.current.precipitationProbabilityPercent === null ? "Next hour probability unavailable" : "Next hour " + snapshot.current.precipitationProbabilityPercent + "%",
    humidityLabel: "Humidity " + snapshot.current.humidityPercent + "%",
    windLabel: "Wind " + snapshot.current.windSpeedKmh.toFixed(1) + " km/h",
    sunsetLabel: "Sunset " + formatTime(snapshot.daily.sunset),
    moonLabel: moon.label,
    moonIlluminationLabel: moon.illuminationPercent + "% illuminated",
    forecast: snapshot.daily.forecast.map((day) => ({
      date: day.date,
      conditionLabel: day.condition.label,
      highLabel: day.highC.toFixed(0) + "°",
      lowLabel: day.lowC.toFixed(0) + "°",
      probabilityLabel: day.precipitationProbabilityMaxPercent === null ? "—" : day.precipitationProbabilityMaxPercent + "% rain chance"
    })),
    statusLabel: livingWindowStatusCopy(snapshot, status, now)
  };
}