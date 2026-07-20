import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * Vývojový režim bez prihlásenia: AUTH_DISABLED=1 v .env.local.
 * V produkcii sa nikdy neuplatní.
 */
export const authDisabled =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DISABLED === "1";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  pages: { signIn: "/login" },
  callbacks: {
    // Jediný povolený používateľ — GitHub účet vlastníka
    signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_LOGIN;
      const login = (profile as { login?: string } | null)?.login;
      return (
        !!allowed && !!login && login.toLowerCase() === allowed.toLowerCase()
      );
    },
  },
});
