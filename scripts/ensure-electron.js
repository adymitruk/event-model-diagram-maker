#!/usr/bin/env node
/**
 * Ensure the Electron binary is present. Some npm setups block the
 * electron postinstall script; fall back to unzipping the cached zip.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const os = require("os");

const electronRoot = path.dirname(require.resolve("electron/package.json"));
const distDir = path.join(electronRoot, "dist");
const pathFile = path.join(electronRoot, "path.txt");
const binaryName = process.platform === "win32" ? "electron.exe" : "electron";
const binaryPath = path.join(distDir, binaryName);

if (fs.existsSync(binaryPath)) {
  if (!fs.existsSync(pathFile) || fs.readFileSync(pathFile, "utf8").trim() !== binaryName) {
    fs.writeFileSync(pathFile, binaryName);
  }
  process.exit(0);
}

const version = require(path.join(electronRoot, "package.json")).version;
const platform = process.platform === "win32" ? "win32" : process.platform === "darwin" ? "darwin" : "linux";
const arch = process.arch === "arm64" ? "arm64" : "x64";
const zipName = `electron-v${version}-${platform}-${arch}.zip`;

const cacheRoots = [
  process.env.ELECTRON_CACHE,
  path.join(os.homedir(), ".cache", "electron"),
  path.join(os.homedir(), "Library", "Caches", "electron"),
  path.join(os.homedir(), "AppData", "Local", "electron", "Cache"),
].filter(Boolean);

let zipPath = null;
for (const root of cacheRoots) {
  if (!fs.existsSync(root)) continue;
  for (const entry of fs.readdirSync(root)) {
    const candidate = path.join(root, entry, zipName);
    if (fs.existsSync(candidate)) {
      zipPath = candidate;
      break;
    }
  }
  if (zipPath) break;
}

if (!zipPath) {
  console.warn("[ensure-electron] Binary missing and no cached zip found. Run: node node_modules/electron/install.js");
  process.exit(0);
}

fs.mkdirSync(distDir, { recursive: true });
const result = spawnSync("unzip", ["-o", zipPath, "-d", distDir], { stdio: "inherit" });
if (result.status !== 0) {
  console.error("[ensure-electron] unzip failed");
  process.exit(1);
}
fs.writeFileSync(pathFile, binaryName);
console.log("[ensure-electron] Extracted", zipName);
