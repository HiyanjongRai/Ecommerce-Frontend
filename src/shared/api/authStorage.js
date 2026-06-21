// Centralized auth storage helpers.
// Note: Storing access tokens in localStorage is XSS-sensitive. Longer-term,
// prefer HttpOnly cookies for access tokens too. For now, keep behavior
// consistent with the existing app while avoiding redundant user_id/user_role.

const ACCESS_TOKEN_KEY = 'access_token';

export function setAccessToken(token) {
  if (!token) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, String(token));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  // Backward-compat cleanup for previously stored redundant keys.
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_role');
  localStorage.removeItem('jhapcham_coupon');
}

function base64UrlDecode(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  // atob expects standard base64.
  return atob(padded);
}

export function getJwtClaims(token) {
  const raw = token || getAccessToken();
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  const claims = getJwtClaims(token);
  const exp = claims?.exp;
  if (!exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds >= exp;
}

