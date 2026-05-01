const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("PILL_SMART_API_URL", process.env.ELECTRON_RENDERER_API_URL || "");
