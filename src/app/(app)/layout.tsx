import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell, { SignOutButton } from "@/components/AppShell";
import { authDisabled, SESSION_COOKIE } from "@/auth";
import { requireUser } from "@/lib/session";
import { ensureSeeded } from "@/db/seed";

// Všetko pod (app) je osobný, per-request obsah - nikdy sa nesmie prerendrovať staticky
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await Promise.all([requireUser(), ensureSeeded()]);

  const signOutSlot = authDisabled ? null : (
    <form
      action={async () => {
        "use server";
        (await cookies()).delete(SESSION_COOKIE);
        redirect("/login");
      }}
    >
      <SignOutButton />
    </form>
  );

  return <AppShell signOutSlot={signOutSlot}>{children}</AppShell>;
}
