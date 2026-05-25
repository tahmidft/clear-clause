import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

  return {
    server: {
      host: "::",
      port: 5173,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          // Gemini analysis can take 30–90s; default proxy timeouts are too short.
          timeout: 120_000,
          proxyTimeout: 120_000,
          rewrite: (p) => {
            const rest = p.slice("/api".length);
            return rest.length > 0 ? rest : "/";
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
