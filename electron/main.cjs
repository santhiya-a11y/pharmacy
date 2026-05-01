const path = require("path");
const { pathToFileURL } = require("url");
const net = require("net");
const { app, BrowserWindow } = require("electron");

const preferredApiPort = Number(process.env.ELECTRON_API_PORT || process.env.PORT || 4000);
const isDev = process.env.ELECTRON_DEV === "1";

process.env.DB_MODE = process.env.DB_MODE || "offline";
process.env.PORT = String(preferredApiPort);
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-in-prod-32chars";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-prod-32";

let stopApiServerRef = null;
let boundApiPort = preferredApiPort;

function canListen(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port);
  });
}

async function resolveApiPort(startPort) {
  for (let p = startPort; p < startPort + 30; p += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await canListen(p)) return p;
  }
  throw new Error(`No free local API port found near ${startPort}`);
}

async function startEmbeddedApi() {
  boundApiPort = await resolveApiPort(preferredApiPort);
  if (!process.env.NEDB_DATA_DIR) {
    process.env.NEDB_DATA_DIR = path.join(app.getPath("userData"), "nedb");
  }
  process.env.PORT = String(boundApiPort);
  process.env.ELECTRON_RENDERER_API_URL = `http://127.0.0.1:${boundApiPort}/api/v1`;

  const serverPath = pathToFileURL(path.join(__dirname, "..", "backend", "src", "server.js")).href;
  const serverMod = await import(serverPath);
  await serverMod.startApiServer({ port: boundApiPort });
  stopApiServerRef = serverMod.stopApiServer;
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:8080");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadURL(`http://127.0.0.1:${boundApiPort}`);
  }
}

app.whenReady().then(async () => {
  try {
    await startEmbeddedApi();
    createMainWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  } catch (err) {
    console.error("Failed to start Electron app", err);
    app.quit();
  }
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    if (typeof stopApiServerRef === "function") await stopApiServerRef();
    app.quit();
  }
});
