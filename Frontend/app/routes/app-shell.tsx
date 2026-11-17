import { DataProvider } from "../lib/store";
import { ToastProvider } from "../Components/ui/toast";
import { AppShell } from "../Components/layout/app-shell";

export default function AppShellRoute() {
  return (
    <DataProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </DataProvider>
  );
}
