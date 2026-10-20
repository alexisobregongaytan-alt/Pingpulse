const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("pingPulse", {
  ping: (host) => ipcRenderer.invoke("pingpulse:ping", host)
});
