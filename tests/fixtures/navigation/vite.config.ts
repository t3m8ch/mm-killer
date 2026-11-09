import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "tests/fixtures/navigation",
  plugins: [react()],
  server: { fs: { allow: [process.cwd()] } },
});
