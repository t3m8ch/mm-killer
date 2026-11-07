import { MantineProvider, type MantineColorSchemeManager } from "@mantine/core";
import type { ReactNode } from "react";
import "@mantine/core/styles.css";

// Выбор живёт в Provider до перезагрузки, системная тема отслеживается Mantine.
const sessionTheme: MantineColorSchemeManager = {
  get: () => "light",
  set: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
  clear: () => {},
};

export function Layout({ children }: { children: ReactNode }) {
  return (
    <MantineProvider colorSchemeManager={sessionTheme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
