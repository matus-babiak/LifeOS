import { NextResponse } from "next/server";
import { auth, authDisabled } from "@/auth";

// Optimistická ochrana rout - plná kontrola session je v server actions a stránkach.
export const proxy = auth((req) => {
  if (authDisabled) return NextResponse.next();
  const { pathname } = req.nextUrl;
  // Kontrolujeme req.auth?.user, nie len req.auth: pri chybnej konfigurácii
  // (napr. chýbajúci AUTH_SECRET) vráti next-auth truthy chybový objekt bez
  // user a samotné req.auth by spôsobilo presmerovaciu slučku / <-> /login.
  const user = req.auth?.user;
  if (!user && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon|icon|apple-icon|manifest|.*\\.png$|.*\\.svg$).*)",
  ],
};
