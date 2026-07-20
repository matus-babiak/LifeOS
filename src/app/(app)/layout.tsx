import AppShell, { SignOutButton } from "@/components/AppShell";

// Všetko pod (app) je osobný, per-request obsah — nikdy sa nesmie prerendrovať staticky
export const dynamic = "force-dynamic";
import { authDisabled, signOut } from "@/auth";
import { requireUser } from "@/lib/session";
import { ensureSeeded } from "@/db/seed";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  await ensureSeeded();

  const signOutSlot = authDisabled ? null : (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <SignOutButton />
    </form>
  );

  return <AppShell signOutSlot={signOutSlot}>{children}</AppShell>;
}
