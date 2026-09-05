const DEFAULT_POST_LOGIN_PATH = "/portal/orders";

export interface AuthorizationProfile {
  role: string | null;
  is_approved: boolean | null;
}

export function safeRedirectPath(
  raw: string | null,
  fallback = DEFAULT_POST_LOGIN_PATH
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("\\") || raw.includes("@") || raw.includes(":")) {
    return fallback;
  }
  return raw;
}

export function getPostLoginPath(
  profile: AuthorizationProfile | null,
  requestedPath = DEFAULT_POST_LOGIN_PATH
): string {
  if (profile?.role === "admin") return "/admin";
  if (!profile?.is_approved) return "/pending-approval";
  return safeRedirectPath(requestedPath);
}
