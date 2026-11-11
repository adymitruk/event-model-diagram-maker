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

## Board

A CSS grid. Column 1 is the swim-lane labels. Each later column is one slice, left to right, `SLC1` then `SLC2`. `SLC` is the only abbreviation written on the diagram. Rows from top to bottom:

1. Workflow — one merged cell per workflow run, not one cell per slice. Set `data-span="N"` to the number of slices of that workflow drawn so far (`grid-column: span N`). Put the goal (`Stock a bike`) in a `span` inside that cell. A blue arrow runs along the bottom of the span. The shaft and the arrowhead are one shape — omit `continues` on the merged cell so the head sits at the right end of the run (when you later extend the same workflow, bump `data-span`). The goal `span` is horizontally sticky so it slides along the arrow while the board scrolls, staying clear of the sticky lane column, until that workflow cell scrolls away or the next workflow’s span takes over.
2. One row per user, labeled `<name> (<role>)`.
3. One middle row, with no lane label. Each cell holds a command or a read model. **Every MBA card lines up on one horizontal band across slices** — same top edge for every `com` and `rmo` in that row. Do that by always putting a flexing `.gap` *above* and *below* the card (command and read-model cells alike). The gaps share the spare height so the cards stay aligned; never park an MBA card at the top of the cell with only a gap underneath.
4. One connector row, with no lane label. Vertical shafts continue through it; arrows that leave one slice for another run horizontally through its mid band.
5. One row per service, labeled with the service name. On the **first** LBA service row (the top swim lane under the connector), use `lba-head` with an empty `.lba-head-gap` above a `.lba-head-label`. The gap flexes like the arrow corridor above the EVTs; the label box is sized to `--evt-card-one-prop` so that corridor height matches and the name starts where the event cards start.

```html
<div class="cell lane">Workflow</div>
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

Below the workflow row, cells have no bottom border, including the line above the connector row. The last row keeps its bottom border. Mark the lane labels in those open rows with `open`, and the last row with `foot`. The workflow row also has no horizontal line above it or below it.

### Scroll stacking (horizontal)

The board scrolls inside `.emd`. Column 1 (`.lane`) is `position: sticky; left: 0` with a solid background and **`z-index: 5`** so slice content never paints over the labels. Give `.uba` / `.mba` / `.lba` / `.connector` / `.slc-no` `position: relative; z-index: 0` and an opaque white background. The workflow cell uses `z-index: 2`; its goal `span` is sticky at `left: calc(var(--lane) + 0.4rem)` with `z-index: 3` so the name rides the blue arrow while scrolling without sliding under the lane column.

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

Draw the arrows from step 8 of the event-modeling instructions. Same-slice verticals (`SCR → COM → EVT`, `RMO → SCR`) stay HTML corridors of 30×30 tiles in `diagram/arrows/`. **EVT → RMO projections** use the leftness tile layer in `diagram/connectors.js` (see below) — do not hand-merge several events onto one shared CSS corridor. After editing CSS, bump the `?v=` on the stylesheet link so the preview is not stuck on a cached sheet.

Give each card an `id` of its kind, then its name in kebab case (`evt-bike-received`). The id is for reference only; the arrow markup sits in the cells between the cards.

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

In every `mba` cell, use **both** an upper and a lower `.gap` around the card — including read-model slices, where the upper gap is the shaft continuing down from the uba (gear dock / fill) and the lower gap holds the `arrow-up` from the join. Skipping the upper gap on an RMO pulls that card above the command cards in neighboring slices.

**One join** from an event: `.gap.pair` above the event (center into the card, offset one full `--tile` to the right) and `.rail.pair` in the event’s connector cell. Destination connector: `.rail.single` with inbound `.h-run` + `turn-tl`, upper shaft up into the mba, `arrow-up` under the read model.

**Connector anatomy.** `.rail` has `upper` | `mid` | `lower`. Vertical shafts continue through `upper`/`lower`. Corners and horizontals sit in `mid`. `.rail.single` = centered track only. `.rail.pair` = center + one offset join.

Inside a command slice, put a down arrow into the command (mba `.gap` above the card) and a down arrow into the event (mba out + connector + lba in). When the command failed, the second arrow goes to the error.

Inside a read-model slice, put an up arrow from the read model to the screen when that screen is drawn in the same slice: in the UBA `.gap` under the SCR, `arrow-up` then shaft (`tile` on top, shaft below), so the head points into the screen. That head is separate from the join’s `arrow-up` under the RMO. Empty `uba` cells the shaft crosses stay shaft-only (no second head). When the reader is a processor in the next slice, use the gear-dock path instead — no UBA `arrow-up` into a screen.

**Processor in the next slice.** Leave the RMO column’s uba as a `.gear-dock.split`: `turn-br` on the card midline + `.arr.h` stretching to the right cell border (`margin-right` bridges the border). In the command column, `.gear-dock` (not `.split`) with an absolute inbound `.arr.h` that ends at the gear, then `arrow-right`, then the `pro`. CSS scopes the absolute run to `.gear-dock:not(.split) > .arr.h` so it does not collapse the split dock’s outbound shaft. Add `.arr.v.fill` under the split dock down to the RMO.

Between slices, the joins section of the EMD says which event connects to which read model. Use it only for that. Do not draw the match, the shared id, or the join symbol. A mapping on that arrow is a note below the RMO (or below the COM when the map is on `COM → EVT`), with the mapping's name and its inputs and outputs, and no `MAP` in front.

An error connects to the screen in the next slice with the same tile pieces.

When you add a later slice that joins an earlier event that had no join yet, retrofit that earlier connector from `.rail.single` to `.rail.pair` (or to `.rail.joins-2` if a second join appears — see below). Bump `--slices` and add one cell per row for the new column.

### EVT → RMO projections (leftness tiles)

When more than one event feeds a read model (or one event feeds several), draw projections with `diagram/connectors.js`, not CSS `.rail.joins-2` merges.

1. Give every EVT and RMO card an `id`.
2. On `<main class="emd">` set `data-joins="evt-a:rmo-x,evt-b:rmo-x,…"`.
3. Include `<script src="…/diagram/connectors.js"></script>`.
4. Keep connector cells as `.rail.single` (COM→EVT vertical only) on write slices. JS-only RMO destination connectors stay empty (no orphan upper shaft). Leave those RMO lower MBA gaps empty — the script draws the `arrow-up` into the RMO.
5. **Exception — mapping on the join:** if the RMO has a `.map` note, keep that join as a CSS `.rail.pair` corridor (source + arrival) so the map sits on the shaft between the RMO and the lower-gap `arrow-up`. Do not list that join in `data-joins`.

**Leftness.** Each join gets `leftness = fromSlc + toSlc` and a horizontal `span`. Joins are sorted by leftness; each is assigned the first free track whose spans do not overlap (tracks only search at/above the last assigned track). The result is one independent step-path per join — `turn-br` + `hline` (+ `hop` over write-slice verticals) + `turn-tl` + `arrow-up` — on its own Y, never teed onto a neighbour’s horizontal.

**Anchors.** Multiple joins on the same EVT top or RMO bottom are spaced `0.5 × --tile` apart around center (with a phantom center slot so the CSS COM→EVT shaft stays clear).

### Parallel joins (legacy CSS — one event → several read models)

Prefer leftness tiles above. If you must stay CSS-only for a single event to two RMOs: do **not** merge joins onto one rail. Each join gets its own parallel track.

**Spacing.** Half a tile (`0.5 * --tile` = 15px) between line centers:

- Horizontal: offset-1 at `+0.5 tile` from center, offset-2 at `+1 tile` from center (centers of the three verticals are 15px apart).
- Vertical: wrap both mid bands in `.mids`. The stack is `1.5 * --tile` tall; `mid.a` pins to the top, `mid.b` to the bottom, so the two horizontals are 15px apart. Do not put `mid.a` and `mid.b` as sibling grid rows of the `.rail` — they shrink and lose centering. Always use the `.mids` wrapper.

**Roles.**

| Band | Role |
|---|---|
| `mid.a` | Nearer join (first RMO to the right) |
| `mid.b` | Farther join |

**Every connector cell** from the event column through the farthest arrival uses `.rail.joins-2` so the mid bands line up across slices.

**Event column (source):** `.gap.joins-2` above the event (three `.arr.v`: center, offset-1, offset-2) and `.rail.joins-2.source`. Center track carries the COM→EVT vertical. Each mid band has its own `turn-br` on its offset. Because the near turn sits in `mid.a`, put a `tile.vline` on `offset-1` in `mid.b` so the lower offset shaft still reaches that turn. Lower band has center + offset-1 + offset-2 shafts.

**Near arrival:** `turn-tl` on `mid.a`; `mid.b.through` is a full-width `.h-run` (far join continues).

**Pass-through (far join only — near already arrived):** `mid.a` keeps the centered `vline`; `mid.b` uses inbound `.h-run` + `tile.hop` + outbound `.h-run`. The hop is an arc bridge over the vertical — not a `+` cross — so the joins read as separate lines.

**Pass-through (both joins — near not yet arrived):** use `.rail.joins-2.continue-both`. Both `mid.a` and `mid.b` are inbound `.h-run` + `tile.hop` + outbound `.h-run`. Do not drop `mid.a` until the near arrival column — otherwise the near join’s shaft goes nowhere.

**Merge (later EVT joins the same two RMOs):** use `.rail.joins-2.continue-both.merge` on a continue-both column that also records a new EVT feeding those RMOs. Keep both hops, and add `turn-br` on `offset-1` (near / `mid.a`) and `offset-2` (far / `mid.b`) so this EVT’s LBA offsets join the continuing horizontals. Every EVT that an RMO projects must either be the corridor source or a merge column on that corridor (information completeness).

**Merge far-only (near already arrived):** use `.rail.joins-2.merge-far` when a later EVT feeds only the continuing far RMO. Keep `mid.a` centered `vline`; on `mid.b` keep the hop and add `turn-br` on `offset-2`. LBA uses `.gap.joins-2` with center (arrow) + empty offset-1 placeholder + offset-2 shaft — do not draw an offset-1 shaft when nothing turns onto near.

**Far arrival:** `mid.a` has centered `tile.vline` bridging `upper` down to `mid.b`; `mid.b` has inbound `.h-run` + `turn-tl`.

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

- `--tile: 30px` on `:root`
- `uba`, `mba`, `lba`, `connector` are flex columns with **zero** vertical padding so shafts stay continuous
- Sticky stack: `.lane` z-index 5; `.wfl` 2; `.wfl > span` sticky + z-index 3; slice body cells z-index 0 with white backgrounds
- `.lane.lba-head` + `.lba-head-gap` — first LBA service label; the gap flexes to match the shaft corridor so the name aligns with the EVTs
- `.wfl[data-span="N"]` merges the workflow run; repeating gradient redraws column rules inside the span
- `.gap` / `.gap.pair` / `.gap.joins-2` / `.arr` / `.shaft` / `.tile.*`
- `.rail` / `.rail.single` / `.rail.pair` / `.rail.joins-2` (+ `.source`) / `.mids` / `.rail-band` / `.track` / `.h-run`
- Parallel join offsets: `0.5` and `1.0` × `--tile` from center; `.mids` height `1.5` × `--tile`
- `.gear-dock` / `.gear-dock.split` — absolute inbound run only on `:not(.split)`
