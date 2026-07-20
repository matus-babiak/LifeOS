import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authDisabled, SESSION_COOKIE } from "@/auth";
import { verifyToken } from "@/lib/session-token";

/** Ochrana stránok a server actions. Presmeruje na /login, ak nie je platná session. */
export async function requireUser() {
  if (authDisabled) return { name: "dev" };
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifyToken(token, process.env.AUTH_SECRET ?? ""))) {
    redirect("/login");
  }
  return { name: "matus" };
}
