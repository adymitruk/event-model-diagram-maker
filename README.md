# Event modeling framework

Generic event modeling and event-sourcing tooling. No client or product-specific models live here.

| Path | Role |
|---|---|
| [`event-modeling-instructions.md`](event-modeling-instructions.md) | How to construct an EMD |
| [`html-css.md`](html-css.md) | How to draw an EMD in HTML/CSS (tiles, corridors, cards) |
| [`diagram/`](diagram/) | Shared diagram CSS, arrow tiles, and fonts |
| [`app/`](app/) | Electron viewer — load and save `.emd` boards |

## App

```bash
cd app
npm install
npm start
```

Opens the bike-rental example (generic). Side menu: **Load…**, **Save**, **Save as…**.

## `.emd` files

An `.emd` is the outer HTML of `<main class="emd" style="--slices: N">…</main>`. CSS and tiles stay in the app/diagram bundles; the file is board markup only.
