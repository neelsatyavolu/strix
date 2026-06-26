const { contextBridge, ipcRenderer } = require("electron");

// Bridge the renderer (the Next.js UI) to the Electron main process, where the
// user's ChatGPT/Grok subscription OAuth + API calls live.
contextBridge.exposeInMainWorld("strix", {
  isDesktop: true,
  platform: process.platform,
  ai: {
    status: () => ipcRenderer.invoke("ai:status"),
    connect: (provider) => ipcRenderer.invoke("ai:connect", provider),
    disconnect: (provider) => ipcRenderer.invoke("ai:disconnect", provider),
    ask: (req) => ipcRenderer.invoke("ai:ask", req),
  },
  auth: {
    // Opens Google in the system browser, resolves with the loopback redirect URL.
    google: (authUrl) => ipcRenderer.invoke("auth:google", authUrl),
  },
});
