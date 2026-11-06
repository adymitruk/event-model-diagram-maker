const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const EXAMPLE = path.join(__dirname, "examples", "bike-rental.emd");

/** @type {BrowserWindow | null} */
let win = null;
/** @type {string | null} */
let currentPath = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    title: "EMD",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));

  win.webContents.once("did-finish-load", () => {
    loadPath(EXAMPLE, { markAsExample: true });
  });
}

/**
 * @param {string} filePath
 * @param {{ markAsExample?: boolean }} [opts]
 */
function loadPath(filePath, opts = {}) {
  if (!win) return;
  const html = fs.readFileSync(filePath, "utf8");
  currentPath = opts.markAsExample ? null : filePath;
  win.webContents.send("emd:loaded", {
    html,
    path: currentPath,
    title: path.basename(filePath),
  });
  win.setTitle(currentPath ? `EMD — ${path.basename(currentPath)}` : "EMD — bike-rental.emd (example)");
}

ipcMain.handle("emd:open", async () => {
  if (!win) return { ok: false };
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Load event model",
    filters: [{ name: "Event model", extensions: ["emd"] }],
    properties: ["openFile"],
  });
  if (canceled || !filePaths[0]) return { ok: false };
  loadPath(filePaths[0]);
  return { ok: true, path: filePaths[0] };
});

ipcMain.handle("emd:save", async (_event, html) => {
  if (!win) return { ok: false };
  let target = currentPath;
  if (!target) {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "Save event model",
      defaultPath: "diagram.emd",
      filters: [{ name: "Event model", extensions: ["emd"] }],
    });
    if (canceled || !filePath) return { ok: false };
    target = filePath.endsWith(".emd") ? filePath : `${filePath}.emd`;
  }
  fs.writeFileSync(target, html, "utf8");
  currentPath = target;
  win.setTitle(`EMD — ${path.basename(currentPath)}`);
  return { ok: true, path: currentPath };
});

ipcMain.handle("emd:save-as", async (_event, html) => {
  if (!win) return { ok: false };
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "Save event model as",
    defaultPath: currentPath ? path.basename(currentPath) : "diagram.emd",
    filters: [{ name: "Event model", extensions: ["emd"] }],
  });
  if (canceled || !filePath) return { ok: false };
  const target = filePath.endsWith(".emd") ? filePath : `${filePath}.emd`;
  fs.writeFileSync(target, html, "utf8");
  currentPath = target;
  win.setTitle(`EMD — ${path.basename(currentPath)}`);
  return { ok: true, path: currentPath };
});

ipcMain.handle("emd:current-path", () => currentPath);

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
