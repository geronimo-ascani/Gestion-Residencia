import { AppShell } from "../Components/layout/app-shell";
import type { Role } from "../types/residence";

/** Compatibility wrapper: navigation and permissions come from the active session. */
export function PortalLayout(_props: { role: Role }) {
  return <AppShell />;
}
