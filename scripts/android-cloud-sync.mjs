import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.android.local");

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

function decodeJwtPayload(value) {
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

let localEnv;
try {
  localEnv = parseEnv(await readFile(envPath, "utf8"));
} catch {
  console.error("Missing .env.android.local. Copy .env.example, fill only the public Supabase client values, and save it as .env.android.local.");
  process.exit(1);
}

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
for (const key of required) {
  if (!localEnv[key]) {
    console.error(`Missing ${key} in .env.android.local.`);
    process.exit(1);
  }
}

const clientKey = localEnv.SUPABASE_ANON_KEY;
const jwtPayload = decodeJwtPayload(clientKey);
if (clientKey.startsWith("sb_secret_") || jwtPayload?.role === "service_role") {
  console.error("Refusing to package a Supabase secret/service-role key into the Android app. Use the public anon/publishable client key.");
  process.exit(1);
}

const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm";
const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm run android:sync"] : ["run", "android:sync"];
const child = spawn(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    ...localEnv,
    WALK_BACK_HOME_AUTH_PROVIDER: "supabase"
  }
});

child.on("error", (error) => {
  console.error(`Failed to start Android cloud sync: ${error.message}`);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 1));
