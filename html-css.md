# HTML and CSS

Lookup for drawing one slice of an EMD. Terms and what belongs in a slice are in [`event-modeling-instructions.md`](../event-modeling-instructions.md). This file is only how that slice is marked up.

The diagram is one HTML file. Each new slice adds one column. Earlier columns stay as they are.

## Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EMD</title>
  <link rel="stylesheet" href="diagram.css">
</head>
<body>
  <main class="emd" style="--slices: 1">
    <div class="sheet">
      <div class="board"></div>
    </div>
  </main>
</body>
</html>
```

`--slices` is the number of slice columns drawn so far. Bump it by one when a slice is added.

`diagram.css` sets `html, body { height: 100% }`, `body { overflow: hidden }`, and `.emd { height: 100%; overflow: auto }` so **`main.emd` is the only scrollport**. Sticky workflow and lane chrome depend on that — do not scroll the page via `body`/`window`, and do not wrap `.emd` in another `overflow` container.

## Board

A CSS grid. Column 1 is the swim-lane labels. Each later column is one slice, left to right, `SLC1` then `SLC2`. `SLC` is the only abbreviation written on the diagram. Slice tracks are `minmax(var(--col), max-content)` — `--col` (default `16rem`) is the **minimum** width. A slice may grow when a screen (or other intrinsic content) needs more room; do not treat `--col` as a fixed cap. Rows from top to bottom:

1. Workflow — one merged cell per workflow run, not one cell per slice. Set `data-span="N"` to the number of slices of that workflow drawn so far (`grid-column: span N`). Put the goal (`Stock a bike`) in a `span` inside that cell. A blue arrow runs along the bottom of the span. The shaft and the arrowhead are one shape — omit `continues` on the merged cell so the head sits at the right end of the run (when you later extend the same workflow, bump `data-span`). Leave the first-column lane cell empty of workflow text; `settings.js` places a gear (settings) and `?` (board help) there. Do **not** draw vertical rules between slice columns anywhere on the board (`.cell` has `border: 0`); only the sticky lane column keeps a right edge. Slice cells also have no bottom border (including `.foot`). The whole workflow row (`.wfl` cells and the empty corner lane) is sticky to the **top** of `.emd` while scrolling vertically. The goal `span` is also horizontally sticky so it slides along the arrow while the board scrolls sideways, staying clear of the sticky lane column, until that workflow cell scrolls away horizontally or the next workflow’s span takes over.
2. One row per user, labeled `<name> (<role>)`.
3. One middle row, with no lane label. Each cell holds a command or a read model. **Every MBA card lines up on one horizontal band across slices** — same **top** edge for every `com` and `rmo` in that row (not centered). Always put a `.gap` *above* and *below* the card (command and read-model cells alike). The upper gap stays compact (`flex: 0`; min height two tiles for the into-card corridor). The lower gap is the one that flexes (`flex: 1`) and absorbs spare height so taller and shorter cards still share one top line. Never park an MBA card at the top of the cell with only a gap underneath, and never give both gaps equal `flex: 1` — that vertically centers cards and breaks the band.
4. One connector row, with no lane label. Vertical shafts continue through it; arrows that leave one slice for another run horizontally through its mid band.
5. One row per service, labeled with the service name. **Every EVT/ERR card lines up on one top edge across slices**, same rule as MBA: compact `.gap` above the card (min two tiles for shaft + `arrow-down`), spare height below — not equal flex that centers cards. On the **first** LBA service row (the top swim lane under the connector), use `lba-head` with an empty `.lba-head-gap` above a `.lba-head-label`. The head gap is the same compact two-tile height as the EVT corridor so the service name starts where the event cards start.

```html
<div class="cell lane" aria-hidden="true"></div>
<div class="cell wfl" data-slc="1" data-span="4"><span>Stock a bike</span></div>
<div class="cell lane open">Jim (Customer)</div>
<div class="cell uba" data-slc="1" data-lane="jim"></div>
<div class="cell lane open"></div>
<div class="cell mba" data-slc="1"></div>
<div class="cell lane open"></div>
<div class="cell connector" data-slc="1"></div>
<div class="cell lane open lba-head"><div class="lba-head-gap" aria-hidden="true"></div><div class="lba-head-label">Fleet</div></div>
<div class="cell lba" data-slc="1" data-lane="fleet"></div>
```

An empty cell stays an empty `div`. Do not put a placeholder in it.

Slice cells have no bottom border (including the LBA `foot` row) and no vertical borders between columns. Mark the lane labels in open rows with `open`, and the last service row with `foot` (for layout, not a bottom rule). The workflow row has no horizontal line above or below it. Only `.lane` keeps `border-right` so the label column stays edged.

### Scroll stacking

The board scrolls **only** inside `.emd` (both axes). `body` stays `overflow: hidden` with `html, body { height: 100% }` so sticky positioning is relative to `.emd`, not the window.

**Horizontal.** Column 1 (`.lane`) is `position: sticky; left: 0` with a solid background and **`z-index: 5`** so slice content never paints over the labels. Give `.uba` / `.mba` / `.lba` / `.connector` / `.slc-no` `position: relative; z-index: 0` and an opaque white background. Each `.wfl > span` is sticky at `left: calc(var(--lane) + 0.4rem)` with `z-index: 3` so the goal name rides the blue arrow while scrolling sideways without sliding under the lane column.

**Vertical.** The workflow row pins to the top of `.emd`: every `.wfl` is `position: sticky; top: 0` with an opaque white background and **`z-index: 4`**, and the empty corner lane (`.board > .lane:first-child`) is sticky at `top: 0` as well with **`z-index: 6`**. Neither shows slice borders. Swim-lane content (UBA/MBA/connectors/LBA) scrolls under that bar.

## Slice header

The column header is the slice number only.

```html
<div class="cell slc-no" data-slc="1">SLC1</div>
```

## Cards

Every card has its name and its example properties. The title is the name only, with no three-letter kind in front of it. A card is a soft rounded panel: no border, a light shadow, the title in bold, and each property on its own row with the name on the left and the value in bold on the right. A card sits in the cell for its swim lane. Long property values wrap inside the card (`overflow-wrap: anywhere` on `dd`) so a URL or other unbroken string never spills out of the column.

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
| group | `fieldset.group` | A sketched box. Its title is a `legend`. |

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
  <p>no Customer Registered with customerId = C-8</p>
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

**Same-slice verticals** (`SCR → COM → EVT`, `RMO → SCR`) stay HTML corridors of 30×30 tiles in `diagram/arrows/` inside `uba` / `mba` / `lba` gaps. Do **not** put cross-slice join markup in those gaps.

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

When you add a later slice, bump `--slices` and add one empty `.cell.connector` (and the other row cells) for the new column. List every new EVT→RMO edge in `data-joins`.

### EVT → RMO projections (tiling connectors)

All cross-slice projections use `diagram/connectors.js` (same router as `diagram/tiling-example.html`). Never CSS `.rail` / `.joins-2`.

1. Give every EVT and RMO card an `id`.
2. On `<main class="emd">` set `data-joins="evt-a:rmo-x,evt-b:rmo-x,…"`. Include **every** EVT→RMO edge, including joins that also have a `.map` note on the RMO.
3. Include `<script src="…/diagram/connectors.js"></script>` and `<script src="…/diagram/settings.js"></script>`.
4. The sticky corner lane (`.board > .lane:first-child`) hosts gear + `?` from `diagram/settings.js`. Gear opens settings: **Scale items** (`--scale` → slice `--col` + UBA/MBA/LBA type only; WFL labels and lane chrome unchanged), **Fade opacity** (`--focus-fade`), and **Connector tiles** (`--tile`). Scale/tile fire `emd:retile`. `?` explains the board. Values persist in `localStorage`.
5. Leave every `.cell.connector` empty. Leave RMO mba lower gaps empty (no CSS `arrow-up` on the join).
6. Same-slice COM→EVT corridors stop at the mba/lba gaps; the connector segment is JS.

**Routing (tiling-example).** Bands by leftness (`fromSlc + toSlc`) with elbow-clash sharing. Write shaft locked to the CSS card center; outbound stubs push right; arrivals centered as a group. Horizontals hop over verticals (`hop-*.svg`). One tile occupancy — shafts break around hops. **Hover:** by default every connector and card is fully lit (no idle mute, no 3-level color ramp). Hovering a SCR / COM / EVT / RMO / ERR or a connector piece adds `.path-focus` on `.emd`: related path tiles get `.path-hot` / hop hot flags and endpoints get `.endpoint-hot`; everything else fades via `--focus-fade`. Hovering a `.map` note lights that join and marks the mapped property rows (`.prop-hot`) on each side (`inputs → outputs` from the note text).

**Mapping notes** still sit under the RMO (`.map`) on the join shaft; the shaft itself is JS.

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

The live stylesheet is [`diagram/diagram.css`](diagram/diagram.css). Keep this file in sync when you change arrow or layout rules. Key pieces:

- `--tile: 16px` on `:root` (connector elbows, arrowheads, and mid-band packing)
- `--col: 16rem` is the slice **minimum**; board columns are `minmax(var(--col), max-content)`. `.uba > .scr` / `.wire` use `width: max-content` so wide screens widen their slice. COM / RMO / EVT stay `width: fit-content; align-self: center` so a wide SCR does not stretch them
- `uba`, `mba`, `lba`, `connector` are flex columns with **zero** vertical padding so shafts stay continuous
- MBA/LBA top-band: `.mba/.lba > .gap:first-child` is `flex: 0` (min two tiles); `.mba > .gap:last-child` is `flex: 1`; empty `.lba > .gap:only-child` still flexes for fill shafts
- Sticky stack: `.board > .lane:first-child` top+left z-index 6; `.lane` left z-index 5; `.wfl` top sticky z-index 4; `.wfl > span` left sticky z-index 3; slice body cells z-index 0 with white backgrounds
- `.lane.lba-head` + `.lba-head-gap` — first LBA service label; head gap is two tiles so the name aligns with top-banded EVTs
- `.cell { border: 0 }` — no vertical or bottom grid rules between slices; only `.lane` keeps `border-right` (corner `.lane:first-child` has gear/`?`, no right edge); `.wfl[data-span="N"]` merges the workflow run; blue arrow (`::before`) sticks with the row
- `.gap` / `.gap.pair` / `.gap.joins-2` / `.arr` / `.shaft` / `.tile.*`
- `.rail` / `.rail.single` / `.rail.pair` / `.rail.joins-2` (+ `.source`) / `.mids` / `.rail-band` / `.track` / `.h-run`
- Parallel join offsets: `0.5` and `1.0` × `--tile` from center; `.mids` height `1.5` × `--tile`
- `.gear-dock` / `.gear-dock.split` — absolute inbound run only on `:not(.split)`
