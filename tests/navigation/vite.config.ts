import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "tests/navigation",
  plugins: [react()],
  server: { fs: { allow: [process.cwd()] } },
});
