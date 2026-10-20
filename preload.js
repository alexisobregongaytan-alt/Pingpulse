const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pingPulse", {
  ping: (host, count) => ipcRenderer.invoke("pingpulse:ping", host, count),
  flushDns: () => ipcRenderer.invoke("pingpulse:flush-dns")
});
