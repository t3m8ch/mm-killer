import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import "@mantine/core/styles.css";

export function Layout({ children }: { children: ReactNode }) {
  return <MantineProvider defaultColorScheme="light">{children}</MantineProvider>;
}
