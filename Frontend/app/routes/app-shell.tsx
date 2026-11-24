import { DataProvider } from "../lib/store";
import { ToastProvider } from "../Components/ui/toast";
import { AppShell } from "../Components/layout/app-shell";
import { exigirSesion } from "../lib/session.server";
import type { Route } from "./+types/app-shell";

export function loader({ request, url }: Route.LoaderArgs) {
  return exigirSesion(request, url.pathname);
}

export default function AppShellRoute() {
  return (
    <DataProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </DataProvider>
  );
}
