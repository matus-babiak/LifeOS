import { NextResponse } from "next/server";
import { auth, authDisabled } from "@/auth";

// Optimistická ochrana rout - plná kontrola session je v server actions a stránkach.
export const proxy = auth((req) => {
  if (authDisabled) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (!req.auth && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (req.auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon|icon|apple-icon|manifest|.*\\.png$|.*\\.svg$).*)",
  ],
};
