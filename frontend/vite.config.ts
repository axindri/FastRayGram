import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxy = {
  target: "http://localhost:8000",
  changeOrigin: true,
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": apiProxy,
    },
  },
  build: {
    outDir: "../src/static/dist",
    emptyOutDir: true,
  },
});
