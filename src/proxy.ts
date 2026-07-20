import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authDisabled, SESSION_COOKIE } from "@/auth";
import { verifyToken } from "@/lib/session-token";

// Ochrana rout: bez platnej session cookie pustí len /login.
export async function proxy(req: NextRequest) {
  if (authDisabled) return NextResponse.next();
  const { pathname } = req.nextUrl;
  const ok = await verifyToken(
    req.cookies.get(SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET ?? "",
  );
  if (!ok && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (ok && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon|apple-icon|manifest|.*\\.png$|.*\\.svg$).*)",
  ],
};
