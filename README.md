# EMD app

Electron viewer for event-model diagrams. Boards are plain `.emd` files: HTML with a root `<main class="emd">` element. Diagram CSS, arrow tiles, and fonts ship with the app; the file only carries the board markup.

## Run

```bash
cd app
npm install
npm start
```

Opens with `examples/bike-rental.emd` (WFL1 · Stock a bike). Click the ☰ control for the side menu: **Load…**, **Save**, and **Save as…**.

If `npm install` skips Electron’s download script, run `npm run postinstall` (or `node scripts/ensure-electron.js`) once so the binary is extracted.

## `.emd` format

An `.emd` file is the outer HTML of `<main class="emd" style="--slices: N">…</main>`. It does not embed CSS or tiles — the shell loads `renderer/diagram/` from the app bundle. This package ships only the bike-rental example; it does not include the conference-kiosk EMD.
