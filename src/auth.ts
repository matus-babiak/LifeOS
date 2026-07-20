/**
 * Jednoduché prihlásenie heslom (jeden používateľ).
 * Heslo je v premennej APP_PASSWORD, session je podpísaná cookie cez AUTH_SECRET.
 *
 * Vývojový režim bez prihlásenia: AUTH_DISABLED=1 v .env.local (nikdy v produkcii).
 */
export const authDisabled =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DISABLED === "1";

export const SESSION_COOKIE = "lifeos_session";
export const SESSION_MAX_AGE = 90 * 24 * 60 * 60; // 90 dní v sekundách
