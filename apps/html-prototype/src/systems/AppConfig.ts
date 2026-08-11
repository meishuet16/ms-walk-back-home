export type AppConfig = {
  authProvider: "local" | "supabase";
  supabaseUrl: string;
  supabaseAnonKey: string;
  privateMediaBucket: string;
};

declare global {
  interface Window {
    WALK_BACK_HOME_CONFIG?: Partial<AppConfig>;
  }
}

export function loadAppConfig(): AppConfig {
  const config = typeof window === "undefined" ? {} : window.WALK_BACK_HOME_CONFIG ?? {};
  return {
    authProvider: config.authProvider === "supabase" ? "supabase" : "local",
    supabaseUrl: config.supabaseUrl ?? "",
    supabaseAnonKey: config.supabaseAnonKey ?? "",
    privateMediaBucket: config.privateMediaBucket ?? "walk-private-media"
  };
}
