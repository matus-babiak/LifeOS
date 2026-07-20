// Podpísaný session token (HMAC-SHA256 cez AUTH_SECRET).
// Web Crypto funguje v edge (proxy.ts) aj v Node (server actions).

const enc = new TextEncoder();

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64urlFromBytes(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Vytvorí podpísaný token s expiráciou (predvolene 90 dní). */
export async function createToken(secret: string, days = 90): Promise<string> {
  const payload = b64urlFromBytes(
    enc.encode(JSON.stringify({ exp: Date.now() + days * 86_400_000 })),
  );
  return `${payload}.${await sign(payload, secret)}`;
}

/** Overí podpis aj expiráciu tokenu. */
export async function verifyToken(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token || !secret) return false;
  const i = token.lastIndexOf(".");
  if (i <= 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!timingSafeEqual(sig, await sign(payload, secret))) return false;
  try {
    const { exp } = JSON.parse(
      new TextDecoder().decode(bytesFromB64url(payload)),
    );
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}
