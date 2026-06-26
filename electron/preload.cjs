const { contextBridge, ipcRenderer } = require("electron");

// Bridge the renderer (the Next.js UI) to the Electron main process, where the
// user's ChatGPT/Grok subscription OAuth + API calls live.
contextBridge.exposeInMainWorld("strix", {
  isDesktop: true,
  platform: process.platform,
  ai: {
    status: () => ipcRenderer.invoke("ai:status"),
    connect: (provider) => ipcRenderer.invoke("ai:connect", provider),
    submitCode: (provider, code) => ipcRenderer.invoke("ai:submitCode", { provider, code }),
    cancelConnect: (provider) => ipcRenderer.invoke("ai:cancelConnect", provider),
    disconnect: (provider) => ipcRenderer.invoke("ai:disconnect", provider),
    ask: (req) => ipcRenderer.invoke("ai:ask", req),
  },
  auth: {
    // Opens Google in the system browser, resolves with the loopback redirect URL.
    google: (authUrl) => ipcRenderer.invoke("auth:google", authUrl),
  },
  // Auto-update bridge (electron-updater in the main process).
  updates: {
    state: () => ipcRenderer.invoke("updates:state"),
    check: () => ipcRenderer.invoke("updates:check"),
    install: () => ipcRenderer.invoke("updates:install"),
    openDownload: () => ipcRenderer.invoke("updates:openDownload"),
    // Subscribe to update lifecycle events; returns an unsubscribe fn.
    subscribe: (cb) => {
      const handler = (_e, payload) => cb(payload);
      ipcRenderer.on("updates:event", handler);
      return () => ipcRenderer.removeListener("updates:event", handler);
    },
  },
});
