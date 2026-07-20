import { redirect } from "next/navigation";
import { auth, authDisabled } from "@/auth";

/** Ochrana stránok a server actions. Vracia prihláseného používateľa. */
export async function requireUser() {
  if (authDisabled) {
    return { name: "dev", email: null, image: null };
  }
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}
