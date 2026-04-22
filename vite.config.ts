import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import path from "path";

  const BACKEND_PORT = process.env.BACKEND_PORT || "5555";

  export default defineConfig({
    base: process.env.BASE_PATH || "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      outDir: "dist/public",
      emptyOutDir: true,
      sourcemap: false,
    },
    server: {
      port: parseInt(process.env.PORT || "3000"),
      host: "0.0.0.0",
      proxy: {
        "/scan":     { target: `http://localhost:${BACKEND_PORT}`, changeOrigin: true },
        "/stream":   { target: `http://localhost:${BACKEND_PORT}`, changeOrigin: true },
        "/result":   { target: `http://localhost:${BACKEND_PORT}`, changeOrigin: true },
        "/download": { target: `http://localhost:${BACKEND_PORT}`, changeOrigin: true },
        "/network":  { target: `http://localhost:${BACKEND_PORT}`, changeOrigin: true },
        "/proxy":    { target: `http://localhost:${BACKEND_PORT}`, changeOrigin: true },
        "/health":   { target: `http://localhost:${BACKEND_PORT}`, changeOrigin: true },
      },
    },
  });
  