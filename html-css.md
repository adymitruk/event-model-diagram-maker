# HTML and CSS

Stylesheet lookup for an EMD board: sticky rows, tiles, corridors, and continuity. The markup for every slice, card, screen control, processor dock, and GWT timeline — and the **Emit from an EMD** procedure for building any board — is in [`event-modeling-instructions.md`](event-modeling-instructions.md) (**HTML board**). Use that file to build `<name>.emd.html` from an `EMD.md`; this file does not replace it.

The diagram is one file named `<name>.emd.html`. Each new slice adds one column. Earlier columns stay as they are.

## Page

Write the board to `<name>.emd.html`. Link the **shared** `diagram/diagram.css`, `diagram/connectors.js`, and `diagram/settings.js` with paths relative to that file — never inline or fork those files into the board. A board under `projects/<name>/` uses `../../diagram/`. Every new board inherits scroll smoothness, hover, and connector tiling from those shared files.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EMD</title>
  <link rel="stylesheet" href="../../diagram/diagram.css">
</head>
<body>
  <main class="emd" style="--slices: 1">
    <div class="sheet">
      <div class="board"></div>
    </div>
  </main>
  <script src="../../diagram/connectors.js"></script>
  <script src="../../diagram/settings.js"></script>
</body>
</html>
```

`--slices` is the number of slice columns drawn so far. Bump it by one when a slice is added. After editing `diagram/diagram.css` or `diagram/connectors.js`, sync the copies under `app/renderer/diagram/` and bump the `?v=` on the board's stylesheet and script links so browsers pick up the change.

`diagram.css` sets `html, body { height: 100% }`, `body { overflow: hidden }`, and `.emd { height: 100%; overflow: auto }` so **`main.emd` is the only scrollport**. Sticky workflow and lane chrome depend on that — do not scroll the page via `body`/`window`, and do not wrap `.emd` in another `overflow` container.

## Board

A CSS grid. Column 1 is the swim-lane labels. Each later column is one slice, left to right, `SLC1` then `SLC2`. `SLC` and `GWT` are the abbreviations written on the diagram. Slice tracks are `minmax(var(--col), max-content)` — `--col` (default `16rem`) is the **minimum** width. A slice may grow when a screen (or other intrinsic content) needs more room; do not treat `--col` as a fixed cap. Rows from top to bottom:

1. Workflow — one merged cell per workflow run, not one cell per slice. Set `data-span="N"` to the number of slices of that workflow drawn so far (`grid-column: span N`). Put the goal (`Stock a bike`) in a `span` inside that cell. A blue arrow runs along the bottom of the span. The shaft and the arrowhead are one shape — omit `continues` on the merged cell so the head sits at the right end of the run (when you later extend the same workflow, bump `data-span`). Leave the first-column lane cell empty of workflow text; `settings.js` places a gear (settings) and `?` (board help) there. Do **not** draw vertical rules between slice columns anywhere on the board (`.cell` has `border: 0`). Slice cells also have no bottom border (including `.foot`). The whole workflow row (`.wfl` cells and the empty corner lane) is sticky to the **top** of `.emd` while scrolling vertically. The goal `span` is also horizontally sticky so it slides along the arrow while the board scrolls sideways, staying clear of the sticky lane column, until that workflow cell scrolls away horizontally or the next workflow’s span takes over.
2. One row per user, labeled `<name> (<role>)`.
3. One **upper connector** row (`.cell.connector.connector-upper`), with no lane label — between UBA and MBA. `connectors.js` draws **RMO → later SCR** joins here.
4. One middle row, with no lane label. Each cell holds a command or a read model. **Every MBA card lines up on one horizontal band across slices** — same **top** edge for every `com` and `rmo` in that row (not centered). Always put a `.gap` *above* and *below* the card (command and read-model cells alike). The upper gap stays compact (`flex: 0`; min height two tiles for the into-card corridor). The lower gap is the one that flexes (`flex: 1`) and absorbs spare height so taller and shorter cards still share one top line. Never park an MBA card at the top of the cell with only a gap underneath, and never give both gaps equal `flex: 1` — that vertically centers cards and breaks the band.
5. One **lower connector** row (`.cell.connector`), with no lane label — between MBA and LBA. Vertical COM→EVT shafts continue through it; **EVT → RMO** and **ERR → SCR** arrows run horizontally through its mid band.
6. One row per service, labeled with the service name. **Every EVT/ERR card lines up on one top edge across slices**, same rule as MBA: compact `.gap` above the card (min two tiles for shaft + `arrow-down`), spare height below — not equal flex that centers cards. On the **first** LBA service row (the top swim lane under the lower connector), use `lba-head` with an empty `.lba-head-gap` above a `.lba-head-label`. The head gap is the same compact two-tile height as the EVT corridor so the service name starts where the event cards start.
7. One GWT row below every service row, labeled `GWT`. Each cell holds that slice's GWT timelines (or is empty when the slice has none) and is part of the slice. A slice may carry no GWTs or many, on one or more vertical `.timeline` stacks. For a COM: EVT / COM / EVT (or ERR) cards. For an RMO: RMO, EVT, RMO, …, RMO (read model at the start, between each event, and at the end; include lookup entries when the RMO joins). When GWTs share the same timeline, the previous COM's or RMO's Given EVTs and Then EVTs are included as the next When's Given; separate timelines do not share that history. `foot` stays on the last service row; the GWT row follows it. Writing rules, board-help (`?`) copy, and filled samples are in [`event-modeling-instructions.md`](event-modeling-instructions.md).

```html
<div class="cell lane" aria-hidden="true"></div>
<div class="cell wfl" data-slc="1" data-span="4"><span>Stock a bike</span></div>
<div class="cell lane open">Jim (Customer)</div>
<div class="cell uba" data-slc="1" data-lane="jim"></div>
<div class="cell lane open"></div>
<div class="cell connector connector-upper" data-slc="1"></div>
<div class="cell lane open"></div>
<div class="cell mba" data-slc="1"></div>
<div class="cell lane open"></div>
<div class="cell connector" data-slc="1"></div>
<div class="cell lane open lba-head"><div class="lba-head-gap" aria-hidden="true"></div><div class="lba-head-label">Fleet</div></div>
<div class="cell lba" data-slc="1" data-lane="fleet"></div>
<div class="cell lane open">GWT</div>
<div class="cell gwt" data-slc="1">
  <div class="timeline">
    <article class="com"><h2>Receive Bike</h2>…</article>
    <div class="arr v">
      <div class="shaft"></div>
      <div class="tile arrow-down"></div>
    </div>
    <article class="evt"><h2>Bike Received</h2>…</article>
  </div>
</div>
```
Put a vertical corridor (`.arr.v` with shaft + `arrow-down`) between every consecutive card on a GWT timeline.

An empty cell stays an empty `div`. Do not put a placeholder in it.

Slice cells have no bottom border (including the LBA `foot` row) and no vertical borders between columns. Mark the lane labels in open rows with `open`, and the last service row with `foot` (for layout, not a bottom rule). The workflow row has no horizontal line above or below it. Large `.lane` cells are a transparent stub (behind slices, click-through); SWL names live in small floating `.lane-label` chips (normal type size) that stick over the board. `diagram/settings.js` wraps plain lane text into those chips on load and sets `--lane` to the widest chip (+ air) so slice 1 clears the labels. The corner gear/`?` lane stays opaque and clickable.

### Scroll stacking

The board scrolls **only** inside `.emd` (both axes). `body` stays `overflow: hidden` with `html, body { height: 100% }` so sticky positioning is relative to `.emd`, not the window.

**Horizontal.** Column 1 (`.lane`) is a sticky stub (`left: 0`, transparent, click-through, low z-index). SWL titles are `.lane-label` chips (`position: sticky`, high z-index) that float over slice content so the swim lane stays readable. Give `.uba` / `.mba` / `.lba` / `.gwt` opaque white backgrounds above the stub. Each `.wfl > span` is sticky at `left: calc(var(--lane) + 0.4rem)` with `z-index: 3` so the goal name rides the blue arrow while scrolling sideways.

**Vertical.** The workflow row pins to the top of `.emd`: every `.wfl` is `position: sticky; top: 0` with an opaque white background and **`z-index: 4`**, and the empty corner lane (`.board > .lane:first-child`) is sticky at `top: 0` as well with **`z-index: 6`**. Neither shows slice borders. Swim-lane content (UBA/MBA/connectors/LBA) scrolls under that bar.

## Slice header

The column header is the slice number only.

```html
<div class="cell slc-no" data-slc="1">SLC1</div>
```

## Cards

Every card has its name and its example properties. The title is the name only, with no three-letter kind in front of it. A card is a soft rounded panel: no border, a light shadow, the title in bold, and each property on its own row with the name on the left and the value in bold on the right. Multi-row RMOs use `table.collection` blocks (header once, compact value rows): no caption when there is only one table; when there are several, one caption is the RMO name and the others are named. A card sits in the cell for its swim lane. Long property values wrap inside the card (`overflow-wrap: anywhere` on `dd` / collection cells) so a URL or other unbroken string never spills out of the column.

| Kind | Class | Cell | Color |
|---|---|---|---|
| screen | `scr` | that user's row | white wireframe |
| processor | `pro` | that user's row | gear icon |
| command | `com` | middle row | blue |
| read model | `rmo` | middle row | green |
| event | `evt` | that service's row | orange |
| error | `err` | the service the command would have changed | red |
| mapping | `map` | on the arrow, noted below the COM or RMO | amber |

```html
<article class="com">
  <h2>Receive Bike</h2>
  <dl class="props">
    <div><dt>bikeId</dt><dd>B-101</dd></div>
    <div><dt>serialNumber</dt><dd>SN-48213</dd></div>
  </dl>
</article>
```

A TODO read model keeps `TODO` in the name: `Bike Listings TODO`.

## Screen

A screen is a Balsamiq-style sketch: handwritten type, white fills, a thick black stroke, and a short hard shadow. The card title is the screen name, in the diagram font. Only the inside of `.wire` is sketched.

The handwritten font is Patrick Hand Regular, SIL Open Font License. The CSS loads it from `fonts/PatrickHand-Regular.ttf`, relative to `diagram.css`, so the file is `diagram/fonts/PatrickHand-Regular.ttf`. If that file is missing, download it from `https://github.com/google/fonts/raw/main/ofl/patrickhand/PatrickHand-Regular.ttf` and save it at that path before drawing a screen. Without the file, the sketch falls back to Comic Sans.

Build the sketch from the containers and elements below, top to bottom and left to right. Do not use the browser's native control look.

**Containers.** They only hold other pieces. They show no data of their own.

| Container | Markup | What it does |
|---|---|---|
| wire | `div.wire` | The sketch page. One per screen. |
| column | `div.col` | Stacks its children top to bottom. |
| row | `div.row` | Places its children left to right. `row end` packs them to the right. |
| area | `fieldset.area` | A named region of an SPA (Add, Open, Done, …). Its title is a `legend`. |
| group | `fieldset.group` | A sketched box. Its title is a `legend`. |

**COM / RMO highlights.** Put `com-data` (light blue) or `rmo-data` (light green) on the **value field only** — the `input` / `select`, a `td`, or a `span` around the value in a `p.label`. On a COM slice, also put `com-data` on the button that issues the COM. Never on the outer `label`, `th`, legend, or heading. An empty RMO has no values — do not put `rmo-data` on the table. Markup rules and SPA examples are in [`event-modeling-instructions.md`](event-modeling-instructions.md) (**Screen**).

**Elements.** Each one is a single HTML control.

| Element | Markup |
|---|---|
| heading | `p.heading` |
| label | `p.label` — text only, not a field |
| text | `label.text` containing an `input` |
| dropdown | `label.dropdown` containing a `select` |
| date | `label.date` containing an `input` |
| check | `label.check` containing `input type="checkbox"` |
| table | `table` with one header row and the example row |
| button | `button type="button"`. Its text is only the label the person sees. |

**Visible text.** Every control shows the words a person sees on that screen.

The EMD writes a button as `button <label> → <command or screen>`. Draw `<label>` as the button text. Leave the `→` and the name after it off the sketch. That command or screen is already its own card, titled with its name only.

`button Start over → COM Reset Demo` is drawn as:

```html
<button type="button">Start over</button>
```

```html
<article class="scr">
  <h2>Receive Bike Form</h2>
  <div class="wire">
    <div class="col">
      <p class="heading">Receive Bike</p>
      <label class="text">serialNumber <input value="SN-48213" readonly></label>
      <label class="text">model <input value="Trailblazer 29" readonly></label>
      <label class="dropdown">type <select disabled><option>Mountain</option></select></label>
      <div class="row end">
        <button type="button">Receive</button>
      </div>
    </div>
  </div>
</article>
```

`readonly` and `disabled` keep the sketch from being a working form. The CSS still draws those controls as sketches.

## Processor

A processor sits in the same row as a screen. It is a gear icon and its name. The name sits above the gear. It shows no properties and no other data.

When a read-model slice has a processor and the next slice is that same processor issuing a command, draw the gear only in the command slice. Leave the read-model slice's user cell empty.

```html
<article class="pro" id="pro-bike-lister">
  <h2>Bike Lister</h2>
  <svg class="gear" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.26.42.49.42h3.8c.23 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>
  </svg>
</article>
```

## Read model

Show the example row. Do not write what the read model is matched on.

```html
<article class="rmo">
  <h2>Bike Catalog</h2>
  <dl class="props">
    <div><dt>bikeId</dt><dd>B-101</dd></div>
    <div><dt>model</dt><dd>Trailblazer 29</dd></div>
  </dl>
</article>
```

## Event and error

An event is past tense. An error names the facts the command was checked against and the message. A slice holds an event or an error, never both.

```html
<article class="err">
  <h2>Unknown Customer</h2>
  <dl class="props">
    <div><dt>customerId</dt><dd>C-8</dd></div>
    <div><dt>message</dt><dd>"Customer C-8 is not registered"</dd></div>
  </dl>
</article>
```

## Mapping

A mapping names properties only. No values and no formula. Write it on the arrow it belongs to. Do not write `MAP` in front of it.

```html
<p class="map">Rental End: startDate, days → endDate</p>
```

Place the note in the middle band, **below** the COM or RMO card, on the shaft of that arrow — never above the card and never on the event. On a command-to-event arrow (`COM → EVT`), put it under the command, between the COM and the lower `.gap` that runs down to the event. On an event-to-read-model arrow (`EVT → RMO`), put it under the read model, between the RMO and the lower `.gap` that holds the join’s `arrow-up`.

## Arrows

Draw the arrows from step 8 of the event-modeling instructions.

**Same-slice verticals** keep arrow tiles and gap shafts in `uba` / `mba` / `lba` HTML (`diagram/arrows/`). Each connector **band** paints the segment through its `.middle` the same way: lower band for `COM → EVT`, upper band for `SCR ↔ COM` / `SCR ↔ RMO`. Do **not** put cross-slice join markup in those gaps.

**EVT → RMO projections** (and the COM→EVT segment that crosses the connector row) are drawn only by `diagram/connectors.js` — a port of `diagram/tiling-example.html`. Do not hand-build CSS `.rail` / `.joins-2` corridors for joins. After editing CSS or the script, bump the `?v=` on the stylesheet and script links.

Give every EVT and RMO card an `id` of its kind, then its name in kebab case (`evt-bike-received`).

### Continuity rules

These are mandatory. Most “broken arrow” bugs are one of them.

1. **No vertical padding** on `uba` / `mba` / `lba` / `connector`. Padding opens a gap in the shaft. Cards get air with margin on the first/last article instead.
1b. **MBA cards align across slices.** Every middle-row card has a `.gap` above and a `.gap` below so flex equalizes their vertical position.
2. **True center stays centered.** The COM→EVT (or RMO up) vertical is the geometric midline of the cell. Offset joins share that same grid column and shift right with `left` — never a wider grid that pushes “center” left of the cards.
3. **Abutting pieces.** Turn right edge must meet the next `.h-run` / `.shaft` left edge (gap `0` or `−1px` across a cell border). Measure if unsure.
4. **Empty lanes on a vertical.** A SCR/PRO or EVT may sit several rows away from the MBA. Keep a vertical `.gap > .arr.v > .shaft` through every empty cell on that path so the shaft does not break. That means: empty `uba` cells *below* the actor whose SCR/PRO is drawn (users whose rows sit between that actor and the MBA), and empty `lba` cells *above* the service whose EVT/ERR is drawn (services whose rows sit between the MBA/connector and that event). The same shafts carry an RMO→SCR path upward through those empty `uba` cells. An empty cell with no shaft on the path is the usual cause of a disconnected arrow between a screen and its command.
5. **Workflow run.** One `.wfl` cell with `data-span="N"` covering all drawn slices of that workflow. No per-slice empty `.wfl` cells. Bump `N` when the same workflow gains another slice. Leave off `continues` so the arrowhead is at the end of the run.
6. **Never tee joins.** One event to several read models = parallel tracks, not `tee-up` / one shared horizontal that branches.

### Tiles

| File | Role |
|---|---|
| `vline.svg` | Vertical shaft tile. Long vertical runs repeat this. |
| `hline.svg` | Horizontal shaft tile. Long horizontal runs repeat this. |
| `turn-tr.svg` | Corner from top to right |
| `turn-tl.svg` | Corner from top to left |
| `turn-br.svg` | Corner from bottom to right |
| `turn-bl.svg` | Corner from bottom to left |
| `hop.svg` | Horizontal join hops over a vertical COM→EVT shaft (arc bridge; lines do not connect) |
| `arrow-down.svg` | Head pointing down, with a short vertical stub |
| `arrow-up.svg` | Head pointing up |
| `arrow-right.svg` | Head pointing right |

A long shaft is a `div.shaft` whose background is the matching line tile with `background-repeat`. A corner or head is a `div.tile` with the matching class (`turn-br`, `arrow-down`, …). Tile size is `--tile: 30px`. In a `.rail-band.mid` track (row flex), a vertical continuation must be a `tile.vline` (or corner), not a lone `.shaft` — a shaft collapses to zero height there.

```html
<div class="gap">
  <div class="arr v">
    <div class="shaft"></div>
    <div class="tile arrow-down"></div>
  </div>
</div>
```

### Where pieces go

`uba`, `mba`, and `lba` cells are flex columns. Put a `.gap` above and/or below the card. The gap grows to fill the space between cards, so the shaft stretches. Center a single track with `.gap > .arr.v`. An empty `uba` or `lba` cell that a vertical crosses is not left blank — it holds only that same `.gap > .arr.v > .shaft` so the line continues (see continuity rule 4).

In every `mba` cell, use **both** an upper and a lower `.gap` around the card — including read-model slices, where the upper gap is the shaft continuing down from the uba (gear dock / fill) and the lower gap is empty so JS can draw the join `arrow-up`. Skipping the upper gap on an RMO pulls that card above the command cards in neighboring slices. CSS keeps upper gaps compact and lower gaps flexing so every MBA card shares one top edge.

**Connector row.** Leave every `.cell.connector` empty in markup. `connectors.js` inserts a `.middle` band (tiling playground) and paints write shafts + EVT→RMO projections there. Do not put `.rail`, `.h-run`, or join tiles in connector cells.

Inside a command slice, put a down arrow into the command (mba `.gap` above the card) and a shaft in the mba lower gap toward the connector. In the LBA, shaft + `arrow-down` into the event. The connector segment of that vertical is JS. When the command failed, the LBA arrow goes to the error.

Inside a read-model slice, leave the mba **lower** `.gap` empty — JS draws the join `arrow-up` under the RMO. Put an up arrow from the read model to the screen when that screen is drawn in the same slice: in the UBA `.gap` under the SCR, `arrow-up` then shaft (`tile` on top, shaft below). That head is separate from the join’s `arrow-up`. Empty `uba` cells the shaft crosses stay shaft-only (no second head). When the reader is a processor in the next slice, use the gear-dock path instead — no UBA `arrow-up` into a screen.

**Processor in the next slice.** Leave the RMO column’s uba as a `.gear-dock.split`: `turn-br` on the card midline + `.arr.h` stretching to the right cell border (`margin-right` bridges the border). In the command column, `.gear-dock` (not `.split`) with an absolute inbound `.arr.h` that ends at the gear, then `arrow-right`, then the `pro`. CSS scopes the absolute run to `.gear-dock:not(.split) > .arr.h` so it does not collapse the split dock’s outbound shaft. Add `.arr.v.fill` under the split dock down to the RMO.

Between slices, the joins section of the EMD says which event connects to which read model. Use it only for that. Do not draw the match, the shared id, or the join symbol. A mapping on that arrow is a note below the RMO (or below the COM when the map is on `COM → EVT`), with the mapping's name and its inputs and outputs, and no `MAP` in front.

An error connects to the screen in the next slice with the same tile pieces.

When you add a later slice, bump `--slices` and add one empty `.cell.connector.connector-upper`, one empty `.cell.connector`, and the other row cells for the new column. List every new EVT→RMO and RMO→later SCR edge in `data-joins`.

### EVT → RMO and RMO → SCR projections (tiling connectors)

All cross-slice projections use `diagram/connectors.js` (same router as `diagram/tiling-example.html`). Never CSS `.rail` / `.joins-2`.

1. Give every EVT, RMO, and cross-slice destination SCR card an `id`.
2. On `<main class="emd">` set `data-joins="evt-a:rmo-x,rmo-y:scr-z,…"`. Include **every forward-in-time** EVT→RMO edge (lower band), every **RMO → later SCR** edge (upper band), and ERR→SCR. **Timeline rule:** for each `fromId:toId`, the source card's slice must be strictly left of the destination. Never list a later EVT into an earlier RMO, or an RMO into an earlier SCR — `connectors.js` paints the pairs you give and will draw reverse-time hops if you emit them. Same-slice `SCR ↔ RMO` / `SCR ↔ COM` omit from `data-joins` — CSS shafts plus the upper-band local vertical (like COM→EVT on the lower band). Full wording is in [`event-modeling-instructions.md`](event-modeling-instructions.md) (**Connect All SLCs**, **Ids and joins**).
3. Include `<script src="…/diagram/connectors.js"></script>` and `<script src="…/diagram/settings.js"></script>`.
4. The sticky corner lane (`.board > .lane:first-child`) hosts gear + `?` from `diagram/settings.js`. Gear opens settings: **Scale items** (`--scale` → slice `--col` + UBA/MBA/LBA type only; WFL labels and lane chrome unchanged), **Fade opacity** (`--focus-fade`), **Connector tiles** (`--tile`), and **Highlight on hover** checkboxes for connectors, values, and cards (each on by default; stored as `emd-hover-*` in `localStorage`, reflected on `document.documentElement.dataset`). Scale/tile fire `emd:retile`; hover prefs fire `emd:hover-prefs` and clear any active path focus. `?` explains the board. Values persist in `localStorage`.
5. Leave every `.cell.connector` and `.cell.connector.connector-upper` empty. Leave RMO mba lower gaps empty (no CSS `arrow-up` on the lower join).
6. Same-slice corridors: COM→EVT uses the lower connector middle; SCR↔COM / SCR↔RMO use the upper connector middle. Leave gap shafts in HTML; leave both connector rows empty for JS.

### Several EVTs → one RMO (bundled bands)

When more than one EVT projects into the same RMO, list **each** edge in `data-joins` (only EVTs in columns left of that RMO). Put the **earliest** source EVT first for that RMO, then the later ones (story / slice order). Do not collapse them into one pair.

```html
<main
  class="emd"
  style="--slices: 15"
  data-joins="
    evt-attendee-registered-pat:rmo-topic-ballot,
    evt-attendee-registered-riley:rmo-topic-ballot,
    evt-attendee-registered-jordan:rmo-topic-ballot,
    evt-topic-suggested-pat:rmo-topic-ballot,
    evt-topic-suggested-riley:rmo-topic-ballot,
    evt-topic-suggested-jordan:rmo-topic-ballot
  "
>
```

`connectors.js` (`assignBands`) treats every join that shares the same `toId` as one **bundle**:

- Leftness for the whole bundle is `fromSlc + toSlc` of the **first** EVT in that group (earliest `from.si`) plus the RMO.
- Members take **consecutive** horizontal bands (still separate lines — not merged into one shaft).
- Other joins (ERR→SCR, edges into a different RMO, …) cannot claim a band **between** members of the bundle.

```js
// Pseudocode of the bundling rule in assignBands:
const byTo = groupBy(crossList, (j) => j.toId);
for (const members of byTo.values()) {
  members.sort((a, b) => a.from.si - b.from.si || a.id - b.id);
  const leftness = members[0].from.si + members[0].to.si; // first EVT + RMO
  // place members on consecutive free bands; search starts at leftnessFloor
}
```

Empty lower `.cell.connector` cells only — JS paints the bundled horizontals. Full id / join rules: [`event-modeling-instructions.md`](event-modeling-instructions.md) (**Ids and joins**).

### RMO → later SCR (upper band)

Cross-slice **RMO → SCR** joins paint in `.cell.connector.connector-upper` (between UBA and MBA). Lower `.cell.connector` stays for EVT→RMO / ERR→SCR / COM→EVT. Markup for both rows (empty cells; JS fills `.middle`):

```html
<!-- after every UBA actor row -->
<div class="cell lane open"></div>
<div class="cell connector connector-upper" data-slc="1"></div>
<div class="cell connector connector-upper" data-slc="2"></div>
<div class="cell connector connector-upper" data-slc="3"></div>

<!-- MBA row… then lower band -->
<div class="cell lane open"></div>
<div class="cell connector" data-slc="1"></div>
<div class="cell connector" data-slc="2"></div>
<div class="cell connector" data-slc="3"></div>
```

```html
<main
  class="emd"
  style="--slices: 3"
  data-joins="evt-registration-opened:rmo-signup-qr,rmo-signup-qr:scr-signup-form-pat-title"
>
```

`connectors.js` classifies each `data-joins` pair (sync to `app/renderer/diagram/` when you change this):

```js
const isUpperRmoScr =
  fromEl.classList.contains('rmo') &&
  toEl.classList.contains('scr') &&
  toSi > fromSi;
// upper → .connector-upper middles; everything else → lower .connector
```

Same-slice RMO→SCR keeps `arrow-up` under the SCR and the MBA top shaft in HTML; `connectors.js` bridges them with a local vertical in `.connector-upper` (shared mechanism with COM→EVT on the lower band). Cross-slice RMO→later SCR also keeps `arrow-up` + shaft under the destination SCR in HTML — the upper band paints only inside `.connector-upper` (no second shaft up through the UBA gap). Later SCRs that only **carry** the same values by session/query convention must **not** get another `rmo:scr` edge — property hover still links them via matching `data-prop` name + value. Full title-view NAV markup is in [`event-modeling-instructions.md`](event-modeling-instructions.md) (**NAV slice**).

**Routing (tiling-example).** Bands by leftness (`fromSlc + toSlc`) with elbow-clash sharing. Multiple EVTs into the same RMO: see **Several EVTs → one RMO (bundled bands)** above. Write shaft locked to the CSS card center; outbound stubs push right; arrivals centered as a group. Horizontals hop over verticals (`hop-*.svg`). One tile occupancy — shafts break around hops. **Hover / click:** by default every connector and card is fully lit (no idle mute, no 3-level color ramp). Hover targets are **elements only** — cards (SCR / COM / EVT / RMO / ERR), MAP notes, property values, JS connector tiles/shafts, and CSS corridor `.shaft` / `.tile` pieces. Do **not** bind hover on the wrapping `.gap` (that was a full-slice hit target and hitching scrolls). Hovering a card or connector piece adds `.path-focus` on `.emd`: related path tiles get `.path-hot` / hop hot flags and endpoints get `.endpoint-hot`; everything else fades via `--focus-fade`. Hovering a **property value** (a `.props > div` row, a collection `td[data-prop]`, or a SCR control with `data-prop="<name>"`) traces that **example value** through SCR ↔ COM/RMO ↔ EVT joins (same name and same value; MAP renames follow the mapped outputs), marks matching fields `.prop-hot` without lighting sibling collection rows, lights the connecting tiles, and fades the rest the same way. **Click** the hovered value (or card / MAP) to lock that highlight (`.focus-locked` on `.emd`) so scrolling does not clear it; release with the **padlock** (fixed top right), by clicking elsewhere on the board, or Escape. Hovering a `.map` note lights that join and marks the mapped property rows on each side (`inputs → outputs` from the note text). Clicking a connector scrolls any related end card that is partly (or fully) out of view into the board viewport — connectors never lock. Put `data-prop` on every named SCR value so the trace can find the screen; card `dt`s already name COM / RMO / EVT / ERR properties.

### Scroll performance

Boards must keep scrolling smooth on large models. The contract lives in `diagram/diagram.css` + `diagram/connectors.js` (sync both to `app/renderer/diagram/` when you change them). Do **not** reintroduce `filter:` on connector tiles, force a full retile on every scroll, clear path-focus while the board is flinging, or bind hover on empty `.gap` slice corridors (elements only — cards, values, MAP, shafts/tiles).

**CSS — opacity only; cheap paint while flinging.** Connector and card highlights transition `opacity` only. While `.emd` has `.is-scrolling`, drop transitions, disable pointer-events on board chrome, and use a flat card shadow:

```css
.emd {
  position: relative;
  overflow: auto;
  height: 100%;
  will-change: scroll-position;
}
.cell.connector .tile,
.cell.connector .shaft-v,
.cell.connector .shaft-h {
  /* Opacity only — never filter (filter on every tile stalls scroll compositing). */
  transition: opacity 0.12s ease;
}
.emd.is-scrolling .cell.connector .tile,
.emd.is-scrolling .cell.connector .shaft-v,
.emd.is-scrolling .cell.connector .shaft-h,
.emd.is-scrolling .scr,
.emd.is-scrolling .com,
.emd.is-scrolling .rmo,
.emd.is-scrolling .evt,
.emd.is-scrolling .err,
.emd.is-scrolling .pro,
.emd.is-scrolling .map {
  transition: none !important;
}
.emd.is-scrolling .cell.connector,
.emd.is-scrolling article.scr,
.emd.is-scrolling article.com,
.emd.is-scrolling article.rmo,
.emd.is-scrolling article.evt,
.emd.is-scrolling article.err,
.emd.is-scrolling .map {
  pointer-events: none;
}
.emd.is-scrolling article {
  box-shadow: 0 1px 2px rgba(28, 28, 28, 0.05);
}
```

Line/turn SVGs under `diagram/arrows/` use a solid dark fill/stroke (e.g. `#1c1c1c`) — do not darken them with `filter: brightness(0)` in CSS.

**JS — scroll guard, freeze hover paint, soft retile.** One passive `scroll` listener per board toggles `.is-scrolling`, skips hover work while flinging, and only schedules a size-check retile after idle (never a forced redraw when width/height did not change):

```js
function scheduleHoverHighlight(fn) {
  cancelHoverShow();
  if (emd._scrolling) return; // content slides under the pointer — skip until idle
  // …delay then fn()…
}

function clearHoverHighlight() {
  cancelHoverShow();
  if (focusLock()) return;
  if (emd._scrolling) return; // freeze paint — avoids a whole-board opacity flash
  clearConnectionHighlight();
}

if (!emd._scrollGuardBound) {
  emd._scrollGuardBound = true;
  let scrollIdle = 0;
  emd.addEventListener(
    'scroll',
    () => {
      emd._scrolling = true;
      if (!emd.classList.contains('is-scrolling')) {
        emd.classList.add('is-scrolling');
      }
      cancelHoverShow();
      clearTimeout(scrollIdle);
      scrollIdle = setTimeout(() => {
        emd._scrolling = false;
        emd.classList.remove('is-scrolling');
        if (emd._retileAfterScroll) {
          emd._retileAfterScroll = false;
          window.dispatchEvent(new Event('emd:retile-check')); // soft size check
        }
      }, 180);
    },
    { passive: true }
  );
}

// boot ResizeObserver path:
const run = (force) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const el = board();
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!force && emd._scrolling) {
      if (w !== lastW || h !== lastH) emd._retileAfterScroll = true;
      return;
    }
    if (!force && w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    drawJoins(emd);
  }, 40);
};
window.addEventListener('emd:retile', () => run(true));       // settings / fonts
window.addEventListener('emd:retile-check', () => run(false)); // after scroll idle
```

**Mapping notes** still sit under the RMO (`.map`) on the join shaft; the shaft itself is JS.

The rail samples below show an older hand-drawn join. Do not copy them into a board. Leave every `.cell.connector` and `.cell.connector.connector-upper` empty and list joins as `data-joins`, using the templates in the **HTML board** section of [`event-modeling-instructions.md`](event-modeling-instructions.md). `connectors.js` clears those cells and paints the tiles.

### Command slice (no join yet)

```html
<!-- uba: screen, then shaft leaving the cell -->
<article class="scr" id="scr-demo-console">…</article>
<div class="gap">
  <div class="arr v"><div class="shaft"></div></div>
</div>

<!-- mba: head into the command, then shaft leaving toward the event -->
<div class="gap">
  <div class="arr v">
    <div class="shaft"></div>
    <div class="tile arrow-down"></div>
  </div>
</div>
<article class="com" id="com-reset-demo">…</article>
<div class="gap">
  <div class="arr v"><div class="shaft"></div></div>
</div>

<!-- connector: centered vertical track only until a join appears -->
<div class="rail single">
  <div class="rail-band upper">
    <div class="track"><div class="shaft"></div></div>
  </div>
  <div class="rail-band mid">
    <div class="track"><div class="tile vline"></div></div>
  </div>
  <div class="rail-band lower">
    <div class="track"><div class="shaft"></div></div>
  </div>
</div>

<!-- lba: head into the event -->
<div class="gap">
  <div class="arr v">
    <div class="shaft"></div>
    <div class="tile arrow-down"></div>
  </div>
</div>
<article class="evt" id="evt-demo-reset">…</article>
```

### Single join (event → one read model)

```html
<!-- lba above the event -->
<div class="gap pair">
  <div class="arr v">
    <div class="shaft"></div>
    <div class="tile arrow-down"></div>
  </div>
  <div class="arr v"><div class="shaft"></div></div>
</div>

<!-- event column connector -->
<div class="rail pair">
  <div class="rail-band upper">
    <div class="track center"><div class="shaft"></div></div>
    <div class="track offset"></div>
  </div>
  <div class="rail-band mid">
    <div class="track center"><div class="tile vline"></div></div>
    <div class="track offset"><div class="tile turn-br"></div></div>
    <div class="h-run"><div class="shaft"></div></div>
  </div>
  <div class="rail-band lower">
    <div class="track center"><div class="shaft"></div></div>
    <div class="track offset"><div class="shaft"></div></div>
  </div>
</div>

<!-- read-model column connector -->
<div class="rail single">
  <div class="rail-band upper">
    <div class="track"><div class="shaft"></div></div>
  </div>
  <div class="rail-band mid">
    <div class="h-run"><div class="shaft"></div></div>
    <div class="track"><div class="tile turn-tl"></div></div>
  </div>
  <div class="rail-band lower"></div>
</div>
```

### Two parallel joins (templates)

```html
<!-- lba above the event -->
<div class="gap joins-2">
  <div class="arr v">
    <div class="shaft"></div>
    <div class="tile arrow-down"></div>
  </div>
  <div class="arr v"><div class="shaft"></div></div>
  <div class="arr v"><div class="shaft"></div></div>
</div>

<!-- event column connector -->
<div class="rail joins-2 source">
  <div class="rail-band upper">
    <div class="track center"><div class="shaft"></div></div>
  </div>
  <div class="mids">
    <div class="rail-band mid a">
      <div class="track center"><div class="tile vline"></div></div>
      <div class="track offset-1"><div class="tile turn-br"></div></div>
      <div class="h-run"><div class="shaft"></div></div>
    </div>
    <div class="rail-band mid b">
      <div class="track center"><div class="tile vline"></div></div>
      <div class="track offset-1"><div class="tile vline"></div></div>
      <div class="track offset-2"><div class="tile turn-br"></div></div>
      <div class="h-run"><div class="shaft"></div></div>
    </div>
  </div>
  <div class="rail-band lower">
    <div class="track center"><div class="shaft"></div></div>
    <div class="track offset-1"><div class="shaft"></div></div>
    <div class="track offset-2"><div class="shaft"></div></div>
  </div>
</div>

<!-- near RMO column: join ends on mid.a; mid.b continues -->
<div class="rail joins-2">
  <div class="rail-band upper">
    <div class="track center"><div class="shaft"></div></div>
  </div>
  <div class="mids">
    <div class="rail-band mid a">
      <div class="h-run"><div class="shaft"></div></div>
      <div class="track"><div class="tile turn-tl"></div></div>
    </div>
    <div class="rail-band mid b through">
      <div class="h-run"><div class="shaft"></div></div>
    </div>
  </div>
  <div class="rail-band lower"></div>
</div>

<!-- column with COM→EVT vertical that the far join crosses (near already arrived) -->
<div class="rail joins-2">
  <div class="rail-band upper">
    <div class="track center"><div class="shaft"></div></div>
  </div>
  <div class="mids">
    <div class="rail-band mid a">
      <div class="track center"><div class="tile vline"></div></div>
    </div>
    <div class="rail-band mid b">
      <div class="h-run"><div class="shaft"></div></div>
      <div class="track center"><div class="tile hop"></div></div>
      <div class="h-run"><div class="shaft"></div></div>
    </div>
  </div>
  <div class="rail-band lower">
    <div class="track center"><div class="shaft"></div></div>
  </div>
</div>

<!-- both joins continue (near not yet arrived); hop each mid over the COM→EVT vertical -->
<div class="rail joins-2 continue-both">
  <div class="rail-band upper">
    <div class="track center"><div class="shaft"></div></div>
  </div>
  <div class="mids">
    <div class="rail-band mid a">
      <div class="h-run"><div class="shaft"></div></div>
      <div class="track center"><div class="tile hop"></div></div>
      <div class="h-run"><div class="shaft"></div></div>
    </div>
    <div class="rail-band mid b">
      <div class="h-run"><div class="shaft"></div></div>
      <div class="track center"><div class="tile hop"></div></div>
      <div class="h-run"><div class="shaft"></div></div>
    </div>
  </div>
  <div class="rail-band lower">
    <div class="track center"><div class="shaft"></div></div>
  </div>
</div>

<!-- later EVT merges onto the same two RMO joins (continue-both + turn-br into each mid) -->
<div class="rail joins-2 continue-both merge">
  <div class="rail-band upper">
    <div class="track center"><div class="shaft"></div></div>
  </div>
  <div class="mids">
    <div class="rail-band mid a">
      <div class="h-run"><div class="shaft"></div></div>
      <div class="track center"><div class="tile hop"></div></div>
      <div class="track offset-1"><div class="tile turn-br"></div></div>
      <div class="h-run"><div class="shaft"></div></div>
    </div>
    <div class="rail-band mid b">
      <div class="h-run"><div class="shaft"></div></div>
      <div class="track center"><div class="tile hop"></div></div>
      <div class="track offset-2"><div class="tile turn-br"></div></div>
      <div class="h-run"><div class="shaft"></div></div>
    </div>
  </div>
  <div class="rail-band lower">
    <div class="track center"><div class="shaft"></div></div>
    <div class="track offset-1"><div class="shaft"></div></div>
    <div class="track offset-2"><div class="shaft"></div></div>
  </div>
</div>

<!-- later EVT merges onto the far join only (near already arrived) -->
<div class="rail joins-2 merge-far">
  <div class="rail-band upper">
    <div class="track center"><div class="shaft"></div></div>
  </div>
  <div class="mids">
    <div class="rail-band mid a">
      <div class="track center"><div class="tile vline"></div></div>
    </div>
    <div class="rail-band mid b">
      <div class="h-run"><div class="shaft"></div></div>
      <div class="track center"><div class="tile hop"></div></div>
      <div class="track offset-2"><div class="tile turn-br"></div></div>
      <div class="h-run"><div class="shaft"></div></div>
    </div>
  </div>
  <div class="rail-band lower">
    <div class="track center"><div class="shaft"></div></div>
    <div class="track offset-2"><div class="shaft"></div></div>
  </div>
</div>

<!-- far RMO column -->
<div class="rail joins-2">
  <div class="rail-band upper">
    <div class="track center"><div class="shaft"></div></div>
  </div>
  <div class="mids">
    <div class="rail-band mid a">
      <div class="track center"><div class="tile vline"></div></div>
    </div>
    <div class="rail-band mid b">
      <div class="h-run"><div class="shaft"></div></div>
      <div class="track"><div class="tile turn-tl"></div></div>
    </div>
  </div>
  <div class="rail-band lower"></div>
</div>
```

### Read-model MBA cell (aligned with commands)

```html
<!-- gap above (from uba) AND gap below (join) — required for MBA alignment -->
<div class="cell mba" data-slc="2">
  <div class="gap">
    <div class="arr v"><div class="shaft"></div></div>
  </div>
  <article class="rmo" id="rmo-session-reset-todo">…</article>
  <!-- optional: EVT→RMO map sits under the RMO, on the join arrow -->
  <p class="map">Signup Url: signupToken → signupUrl</p>
  <div class="gap">
    <div class="arr v">
      <div class="tile arrow-up"></div>
      <div class="shaft"></div>
    </div>
  </div>
</div>
```

### Gear dock (RMO column → processor in next column)

```html
<!-- RMO column uba: turn on midline, run to the right border -->
<div class="gear-dock split">
  <div class="tile turn-br"></div>
  <div class="arr h"><div class="shaft"></div></div>
</div>
<div class="arr v fill"><div class="shaft"></div></div>

<!-- command column uba: run ends at the gear, not the wide title -->
<div class="gear-dock">
  <div class="arr h">
    <div class="shaft"></div>
    <div class="tile arrow-right"></div>
  </div>
  <article class="pro" id="pro-session-resetter">…</article>
  <div class="balance" aria-hidden="true"></div>
</div>
```

## CSS

The live stylesheet is [`diagram/diagram.css`](diagram/diagram.css). Keep this file (and `app/renderer/diagram/diagram.css`) in sync when you change arrow, layout, or scroll-performance rules. Key pieces:

- `--tile: 16px` on `:root` (connector elbows, arrowheads, and mid-band packing)
- `--col: 16rem` is the slice **minimum**; board columns are `minmax(var(--col), max-content)`. `.uba > .scr` / `.wire` use `width: max-content` so wide screens widen their slice. COM / RMO / EVT stay `width: fit-content; align-self: center` so a wide SCR does not stretch them
- `.emd` — only scrollport; `will-change: scroll-position`; see **Scroll performance**
- `.cell.connector.connector-upper` — upper band (UBA↔MBA) for RMO→later SCR; see **RMO → later SCR (upper band)**
- Connector / card highlight transitions are **opacity only** — never `filter` on tiles
- `.emd.is-scrolling` — `transition: none`, `pointer-events: none` on connectors/cards, flat article shadow while flinging
- `uba`, `mba`, `lba`, `connector` are flex columns with **zero** vertical padding so shafts stay continuous
- MBA/LBA top-band: `.mba/.lba > .gap:first-child` is `flex: 0` (min two tiles); `.mba > .gap:last-child` is `flex: 1`; empty `.lba > .gap:only-child` still flexes for fill shafts
- Sticky stack: `.board > .lane:first-child` / `.emd-corner` top+left z-index 26 (opaque, clickable tools); `.wfl` top sticky z-index 22; `.board > .lane.open` z-index 20 with `.lane-label` chips floating over slices (click-through); `.wfl > span` left sticky z-index 3
- `.lane.lba-head` + `.lba-head-gap` — first LBA service label; head gap is two tiles so the name aligns with top-banded EVTs
- `.cell { border: 0 }` — no vertical or bottom grid rules between slices; corner `.lane:first-child` has gear/`?`; `.wfl[data-span="N"]` merges the workflow run; blue arrow (`::before`) sticks with the row
- `.gap` / `.gap.pair` / `.gap.joins-2` / `.arr` / `.shaft` / `.tile.*`
- `.rail` / `.rail.single` / `.rail.pair` / `.rail.joins-2` (+ `.source`) / `.mids` / `.rail-band` / `.track` / `.h-run`
- Parallel join offsets: `0.5` and `1.0` × `--tile` from center; `.mids` height `1.5` × `--tile`
- `.gear-dock` / `.gear-dock.split` — absolute inbound run only on `:not(.split)`
