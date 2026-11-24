/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // La clave queda en el proceso del servidor de desarrollo; el cliente solo recibe variables VITE_*.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [
      react(),
      {
        name: "api-tutor-dev",
        configureServer(server) {
          server.middlewares.use("/api/tutor", async (req, res) => {
            const { runTutor, estadoIA } = await server.ssrLoadModule("/api/tutor.ts");
            let r: { status: number; json: unknown };
            if (req.method === "GET") r = { status: 200, json: estadoIA() };
            else {
              let raw = "";
              for await (const chunk of req) raw += chunk;
              let body: unknown = null;
              try { body = JSON.parse(raw); } catch { /* entrada inválida: runTutor responde 400 */ }
              r = await runTutor(body, req.socket.remoteAddress ?? "dev", String(req.headers["x-dispositivo"] ?? ""));
            }
            res.statusCode = r.status;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(r.json));
          });
        },
      },
    ],
    test: { include: ["src/**/*.test.ts"] },
  };
});
