import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = fileURLToPath(new URL(".", import.meta.url));
const shared = fileURLToPath(new URL("../../shared", import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { port: 5101, strictPort: true, fs: { allow: [here, shared] } },
  preview: { port: 5101, strictPort: true },
});
