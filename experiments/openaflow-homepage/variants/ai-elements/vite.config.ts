import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: {
    port: 5103,
    strictPort: true,
    fs: { allow: [path.resolve(import.meta.dirname), path.resolve(import.meta.dirname, "../../shared")] },
  },
  preview: { port: 5103, strictPort: true },
});
