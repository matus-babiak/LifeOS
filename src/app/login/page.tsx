import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/auth";
import { createToken } from "@/lib/session-token";

export const metadata = { title: "Prihlásenie" };

async function login(formData: FormData) {
  "use server";
  const pw = String(formData.get("password") ?? "");
  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected || pw !== expected) {
    redirect("/login?error=1");
  }
  const token = await createToken(process.env.AUTH_SECRET ?? "", 90);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="relative inline-flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-muted/40" />
          <span className="absolute inset-[11px] rounded-full border border-muted/60" />
          <span className="h-4 w-4 rounded-full bg-accent" />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">LifeOS</h1>
        <p className="max-w-xs text-sm text-muted">
          Kým sa stávam a aké kroky ma k tomu dnes približujú?
        </p>
      </div>

      <form action={login} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          name="password"
          autoFocus
          required
          placeholder="Heslo"
          aria-label="Heslo"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
        />
        {error && (
          <p className="text-center text-sm text-danger">
            Nesprávne heslo, skús znova.
          </p>
        )}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
        >
          <LogIn className="h-4 w-4" />
          Prihlásiť sa
        </button>
      </form>
    </div>
  );
}
