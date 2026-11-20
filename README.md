# Event modeling framework

Generic event modeling and event-sourcing tooling. No client or product-specific models live here.

An EMD is an AST. An EMD board renders that AST using HTML/CSS.

| Path | Role |
|---|---|
| [`event-modeling-instructions.md`](event-modeling-instructions.md) | How to construct an EMD, and the HTML templates that turn an `EMD.md` into `.emd.html` |
| [`html-css.md`](html-css.md) | Stylesheet lookup (tiles, sticky rows, corridor measurements) |
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

An `.emd` file is one EMD board: the outer HTML of `<main class="emd" style="--slices: N">…</main>`. CSS and tiles stay in the app/diagram bundles; the file is board markup only.

## `.emd.html` files

An `.emd.html` file is a shareable EMD board you open in any browser — no Electron app required. It shows the timeline of workflows, screens, commands, events, and read models, with arrows for how data flows between them.

**Features.** Scroll the board in both directions; workflow labels and swim-lane names stay pinned. Hover a card or arrow to highlight that path and fade the rest. Click a connector to bring any end that is partly out of view fully into the viewport. A gear in the top-left corner adjusts scale, connector tile size, and fade strength; `?` opens **About this board** (bands, COM/RMO/ERR/NAV, how to read GWTs, arrows/MAP, interactions — kept in sync with [`event-modeling-instructions.md`](event-modeling-instructions.md)). Preferences stick in the browser.

**How to use.** Open the file in a browser (or serve the repo and open its URL). Keep it under a project folder so its links to `diagram/` resolve — for example `projects/unconference-organizer/unconference-organizer.emd.html`. Name new boards `<name>.emd.html`. To build one from any `EMD.md`, follow **Emit from an EMD** and the templates in [`event-modeling-instructions.md`](event-modeling-instructions.md) (**HTML board**) — that section is the complete markup recipe (including `data-prop`, `com-data` / `rmo-data`, SPA areas, joins, and scripts).
