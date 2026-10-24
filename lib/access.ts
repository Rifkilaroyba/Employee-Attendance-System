import type { PreviewRole, Role } from "./model";

// These public fixtures simulate login for the UI. Production authorization belongs on the server.
export const DEMO_PASSWORD = "demo12345";
export const DEMO_ACCOUNTS: ReadonlyArray<{ email: string; role: Role }> = [
  { email: "admin@example.com", role: "admin" },
  { email: "pic@example.com", role: "pic" },
  { email: "ratna@example.com", role: "pic" },
  { email: "andi@example.com", role: "employee" },
];

export function authenticateDemoAccount(email: string, password: string): Role | null {
  if (password !== DEMO_PASSWORD) return null;
  const account = DEMO_ACCOUNTS.find(account => account.email === email.trim().toLowerCase());
  return account?.role ?? null;
}

export function canAccessView(sessionRole: Role | null, view: PreviewRole): boolean {
  if (view === "login") return true;
  return sessionRole !== null && (sessionRole === "admin" || sessionRole === view);
}

export function resolveView(sessionRole: Role | null, requestedView: PreviewRole): PreviewRole {
  if (!sessionRole) return "login";
  return canAccessView(sessionRole, requestedView) ? requestedView : sessionRole;
}
