/**
 * Returns true if the user is logged in (client-side only).
 */
export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("isLoggedIn") === "true";
}

/**
 * Returns the stored user object, or null if not logged in.
 */
export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clears all auth state from localStorage.
 */
export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
}
