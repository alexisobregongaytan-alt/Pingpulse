# PingPulse Desktop — v1.1.0

This is a fresh desktop source project, not the earlier visual-only demo.

## What works
- Desktop dashboard with Dashboard, Network Test, and About pages.
- Real OS `ping` command launched from Electron's main process.
- Displays returned reply count, average latency when parseable, packet loss when the OS output provides it, and raw command output.
- GitHub Actions workflow to build a Windows x64 installer in the cloud.

## What does not work yet
- It does **not** reroute game traffic, use gaming relay servers, or promise to lower in-game ping.
- Ping targets may block ICMP. The output is preserved so it can be inspected if parsing differs on a Windows installation.
- The website's preview values are sample values, not live results.

## Build locally (optional)
Requires Node.js and npm:
1. `npm install`
2. `npm start`
3. `npm run build`

## Build in the cloud (no local installs required)
1. Create a GitHub repository and upload the contents of this folder (including `.github/workflows/build-windows.yml`).
2. In the repository, open **Actions** and select **Build PingPulse for Windows**.
3. Click **Run workflow** (or push to `main`).
4. When the workflow finishes, open that run and download the `PingPulse-Windows-Installer` artifact.
5. Extract the downloaded artifact ZIP to find the `.exe` installer.

The first time, GitHub may ask you to enable Actions. The artifact is downloadable from the workflow run; it is not automatically published as a public release.

## Safety note
Review the source before running the installer. PingPulse is an independent prototype, not affiliated with ExitLag or any game publisher.
