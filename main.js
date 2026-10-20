const { app, BrowserWindow, ipcMain } = require("electron");
const { execFile } = require("node:child_process");
const path = require("node:path");
const os = require("node:os");

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    autoHideMenuBar: true,
    backgroundColor: "#080d12",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile("index.html");
}

function validHost(value) {
  const host = String(value || "").trim();
  return /^[a-zA-Z0-9.-]{1,253}$/.test(host) &&
    !host.startsWith(".") && !host.endsWith(".") &&
    !host.includes("..");
}

ipcMain.handle("pingpulse:ping", async (_event, target, requestedCount = 30) => {
  const host = String(target || "").trim();
  if (!validHost(host)) {
    return { ok: false, error: "Enter a valid hostname or IP address." };
  }

  const count = Math.max(1, Math.min(50, Number.parseInt(requestedCount, 10) || 30));
  const isWin = process.platform === "win32";
  if (!isWin) return { ok: false, error: "This build's detailed ping parser is designed for Windows." };

  const args = ["-n", String(count), "-w", "1200", host];
  return await new Promise(resolve => {
    execFile("ping", args, {
      timeout: count * 1500 + 8000,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    }, (err, stdout, stderr) => {
      const output = String(stdout || stderr || (err && err.message) || "");
      const times = [...output.matchAll(/time[=<]\s*(\d+(?:\.\d+)?)\s*ms/gi)]
        .map(m => Number(m[1]));
      const avgMatch = output.match(/Average\s*=\s*(\d+)\s*ms/i);
      const lossMatch = output.match(/Lost\s*=\s*\d+\s*\((\d+)%\s*loss\)/i)
        || output.match(/(\d+(?:\.\d+)?)%\s*(?:packet )?loss/i);
      const averageMs = times.length
        ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
        : (avgMatch ? Number(avgMatch[1]) : null);
      const minMs = times.length ? Math.min(...times) : null;
      const maxMs = times.length ? Math.max(...times) : null;
      const jitterMs = times.length > 1
        ? Math.round((times.slice(1).reduce((sum, value, i) => sum + Math.abs(value - times[i]), 0) / (times.length - 1)) * 10) / 10
        : null;
      const packetLossPercent = lossMatch
        ? Number(lossMatch[1])
        : Math.round(((count - times.length) / count) * 1000) / 10;

      resolve({
        ok: times.length > 0,
        host,
        os: os.platform(),
        requested: count,
        replies: times.length,
        averageMs,
        minMs,
        maxMs,
        jitterMs,
        packetLossPercent,
        output: output.slice(0, 10000),
        error: times.length ? null : "No ping replies received. The target may block ping or be unreachable."
      });
    });
  });
});

ipcMain.handle("pingpulse:flush-dns", async () => {
  if (process.platform !== "win32") {
    return { ok: false, output: "DNS cache cleanup is only available in this Windows build." };
  }
  return await new Promise(resolve => {
    execFile("ipconfig", ["/flushdns"], { timeout: 10000, windowsHide: true }, (err, stdout, stderr) => {
      const output = String(stdout || stderr || (err && err.message) || "").trim();
      resolve({
        ok: !err,
        output: output || (err ? "DNS cleanup failed. Try running PingPulse as administrator." : "DNS cache cleanup command completed.")
      });
    });
  });
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
