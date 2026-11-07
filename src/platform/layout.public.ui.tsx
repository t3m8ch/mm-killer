import { MantineProvider, Container } from "@mantine/core";
import type { ReactNode } from "react";
import "@mantine/core/styles.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <MantineProvider>
      <Container>{children}</Container>
    </MantineProvider>
  );
}
