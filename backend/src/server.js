import { loadEnv, env } from "./config/env.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { ensureOfflineSeedIfEmpty } from "./db/offline/ensureOfflineSeed.js";
import { createApp } from "./app.js";
import { pathToFileURL } from "url";

loadEnv();

let httpServer = null;

export async function startApiServer({ port = env.port } = {}) {
  if (httpServer) return { app: null, server: httpServer, port };
  await connectDb();
  await ensureOfflineSeedIfEmpty();
  const app = createApp();
  await new Promise((resolve, reject) => {
    const srv = app.listen(port, () => {
      httpServer = srv;
      const dbLabel = env.dbMode === "offline" ? "offline (NeDB)" : "online (MongoDB)";
      console.log(`API listening on port ${port} (${env.nodeEnv}, ${dbLabel})`);
      resolve();
    });
    srv.on("error", reject);
  });
  return { app, server: httpServer, port };
}

export async function stopApiServer() {
  const server = httpServer;
  httpServer = null;
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  await disconnectDb();
}

async function main() {
  await startApiServer({ port: env.port });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
