export const ANDROID_AUTH_REDIRECT = "com.meishuet16.walkbackhome://auth/callback";

export function sessionTokensFromAuthUrl(url: string): { access_token: string; refresh_token: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "com.meishuet16.walkbackhome:" || parsed.host !== "auth" || parsed.pathname !== "/callback") return null;
  const params = new URLSearchParams(parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  return accessToken && refreshToken ? { access_token: accessToken, refresh_token: refreshToken } : null;
}
