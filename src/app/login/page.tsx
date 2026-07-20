import { KeyRound } from "lucide-react";
import { signIn } from "@/auth";

export const metadata = { title: "Prihlásenie" };

export default function LoginPage() {
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
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-3 rounded-xl border border-line bg-surface px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:border-accent"
        >
          <KeyRound className="h-4 w-4" />
          Prihlásiť sa cez GitHub
        </button>
      </form>
    </div>
  );
}
