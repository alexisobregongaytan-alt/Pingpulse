const { app, BrowserWindow, ipcMain } = require("electron");
const { execFile } = require("node:child_process");
const os = require("node:os");

function createWindow() {
  const win = new BrowserWindow({
    width: 1180, height: 780, minWidth: 820, minHeight: 600,
    autoHideMenuBar: true, backgroundColor: "#080d12",
    webPreferences: { preload: require("node:path").join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile("index.html");
}
ipcMain.handle("pingpulse:ping", async (_event, target) => {
  const host = String(target || "").trim();
  if (!/^[a-zA-Z0-9.-]{1,253}$/.test(host) || host.startsWith(".") || host.endsWith(".")) {
    return { ok: false, error: "Enter a valid hostname or IP address." };
  }
  const isWin = process.platform === "win32";
  const args = isWin ? ["-n", "4", "-w", "1500", host] : ["-c", "4", "-W", "2", host];
  return await new Promise(resolve => {
    execFile(isWin ? "ping" : "/sbin/ping", args, { timeout: 10000, windowsHide: true }, (err, stdout, stderr) => {
      const output = String(stdout || stderr || (err && err.message) || "");
      const times = [...output.matchAll(/(?:time[=<]\s*)(\d+(?:\.\d+)?)\s*ms/gi)].map(m => Number(m[1]));
      const avg = output.match(/Average\s*=\s*(\d+)\s*ms/i) || output.match(/rtt min\/avg\/max\/mdev = [\d.]+\/([\d.]+)\//i);
      const loss = output.match(/(\d+(?:\.\d+)?)%\s*(?:packet )?loss/i) || output.match(/Lost = \d+ \((\d+)% loss\)/i);
      resolve({
        ok: !err || times.length > 0,
        host, os: os.platform(),
        averageMs: avg ? Number(avg[1]) : (times.length ? Math.round(times.reduce((a,b)=>a+b,0)/times.length*10)/10 : null),
        replies: times.length, packetLossPercent: loss ? Number(loss[1]) : null,
        output: output.slice(0, 6000),
        error: (!times.length && err) ? "No ping replies received. The target may block ping or be unreachable." : null
      });
    });
  });
});
app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
