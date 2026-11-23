/**
 * Dual-band connectors — port of diagram/tiling-example.html.
 *
 * Lower `.cell.connector` (MBA↔LBA): EVT→RMO, ERR→SCR, COM→EVT local vertical.
 * Upper `.cell.connector.connector-upper` (UBA↔MBA): RMO→later SCR, plus
 * same-slice SCR↔COM/RMO local vertical (bridges CSS shafts through the band).
 * CSS keeps arrow tiles in UBA/MBA/LBA gaps; each band paints its middle.
 *
 *   <main class="emd" data-joins="evt-a:rmo-x,rmo-y:scr-z,…">
 */
(function () {
  function tileSize() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--tile').trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : 16;
  }

  function sliceOf(el) {
    if (!el) return 0;
    if (el.dataset && el.dataset.slc) return parseInt(el.dataset.slc, 10);
    const host = el.closest('[data-slc]');
    return host ? parseInt(host.dataset.slc, 10) : 0;
  }

  function drawJoins(emd) {
    emd._propGraph = null; // DOM / joins may have changed
    const TILE = tileSize();
    // Remove legacy absolute layer if present.
    const sheet = emd.querySelector('.sheet') || emd;
    const legacy = sheet.querySelector('#connector-layer');
    if (legacy) legacy.remove();

    const joinsAttr = emd.getAttribute('data-joins') || '';
    const pairs = joinsAttr.split(',').map((s) => s.trim()).filter(Boolean);

    const lowerCells = [
      ...emd.querySelectorAll('.cell.connector:not(.connector-upper)'),
    ].sort((a, b) => sliceOf(a) - sliceOf(b));
    const upperCells = [
      ...emd.querySelectorAll('.cell.connector.connector-upper'),
    ].sort((a, b) => sliceOf(a) - sliceOf(b));
    if (!lowerCells.length && !upperCells.length) return;

    // Slice index from MBA columns (always present) so both bands share si.
    const mbaCells = [...emd.querySelectorAll('.cell.mba[data-slc]')].sort(
      (a, b) => sliceOf(a) - sliceOf(b)
    );
    const sliceIndex = {}; // data-slc → array index
    mbaCells.forEach((cell, idx) => {
      sliceIndex[sliceOf(cell)] = idx;
    });
    const sliceCount = mbaCells.length;
    if (!sliceCount) return;

    function prepareBandCells(cells) {
      const middles = [];
      const cellByIdx = Array(sliceCount).fill(null);
      const middleByIdx = Array(sliceCount).fill(null);
      cells.forEach((cell) => {
        const si = sliceOf(cell);
        const idx = sliceIndex[si];
        if (idx == null) return;
        cell.innerHTML = '';
        const middle = document.createElement('div');
        middle.className = 'middle';
        cell.appendChild(middle);
        cellByIdx[idx] = cell;
        middleByIdx[idx] = middle;
        middles.push(middle);
      });
      return { cells, middles, cellByIdx, middleByIdx };
    }

    const lowerBand = prepareBandCells(lowerCells);
    const upperBand = prepareBandCells(upperCells);

    // Cross-slice joins from data-joins — classify upper vs lower.
    let nextId = 1;
    const crossLower = [];
    const crossUpper = [];
    pairs.forEach((pair) => {
      const [fromId, toId] = pair.split(':').map((s) => s.trim());
      const fromEl = document.getElementById(fromId);
      const toEl = document.getElementById(toId);
      if (!fromEl || !toEl) return;
      const fromSi = sliceOf(fromEl);
      const toSi = sliceOf(toEl);
      if (sliceIndex[fromSi] == null || sliceIndex[toSi] == null) return;
      const isUpperRmoScr =
        fromEl.classList.contains('rmo') &&
        toEl.classList.contains('scr') &&
        toSi > fromSi;
      const entry = {
        id: nextId++,
        fromId,
        toId,
        fromEl,
        toEl,
        from: { si: sliceIndex[fromSi], part: isUpperRmoScr ? 'mba' : 'lower' },
        to: { si: sliceIndex[toSi], part: isUpperRmoScr ? 'uba' : 'upper' },
        fromSi,
        toSi,
        band: isUpperRmoScr ? 'upper' : 'lower',
      };
      if (isUpperRmoScr) crossUpper.push(entry);
      else crossLower.push(entry);
    });

    // Same-slice writes: MBA has a .com → treat as upper→lower local join (lower band).
    const local = [];
    const vertical = Array(sliceCount).fill(null);
    emd.querySelectorAll('.cell.mba[data-slc] .com').forEach((com) => {
      const si = sliceOf(com);
      const idx = sliceIndex[si];
      if (idx == null) return;
      const id = nextId++;
      const evt =
        emd.querySelector(`.cell.lba[data-slc="${si}"] .evt`) ||
        emd.querySelector(`.cell.lba[data-slc="${si}"] .err`);
      local.push({
        id,
        fromId: com.id || null,
        toId: evt ? evt.id : null,
        fromEl: com,
        toEl: evt || null,
        from: { si: idx, part: 'upper' },
        to: { si: idx, part: 'lower' },
        cellSi: si,
        band: 'lower',
      });
      vertical[idx] = 'down';
    });

    // Same-slice UBA↔MBA: SCR above COM/RMO → local vertical through the upper band
    // (same mechanism as COM→EVT through the lower band). CSS keeps the gap shafts
    // and arrow tiles; the band middle bridges the gap the upper row opened.
    const localUpper = [];
    const verticalUpper = Array(sliceCount).fill(null);
    emd.querySelectorAll('.cell.mba[data-slc]').forEach((mba) => {
      const host = mba.querySelector(':scope > .com, :scope > .rmo');
      if (!host) return;
      const si = sliceOf(mba);
      const idx = sliceIndex[si];
      if (idx == null) return;
      const scr = emd.querySelector(`.cell.uba[data-slc="${si}"] .scr`);
      if (!scr) return;
      const mbaTopGap = mba.querySelector(':scope > .gap .arr.v');
      const ubaShaft = emd.querySelector(
        `.cell.uba[data-slc="${si}"] .gap .arr.v .shaft, .cell.uba[data-slc="${si}"] .gap .arr.v .tile`
      );
      if (!mbaTopGap && !ubaShaft) return;
      const id = nextId++;
      const isRmo = host.classList.contains('rmo');
      localUpper.push({
        id,
        fromId: isRmo ? host.id || null : scr.id || null,
        toId: isRmo ? scr.id || null : host.id || null,
        fromEl: isRmo ? host : scr,
        toEl: isRmo ? scr : host,
        from: { si: idx, part: isRmo ? 'mba' : 'uba' },
        to: { si: idx, part: isRmo ? 'uba' : 'mba' },
        cellSi: si,
        band: 'upper',
      });
      verticalUpper[idx] = 'up';
    });

    const cross = crossLower.concat(crossUpper);
    const joins = local.concat(localUpper).concat(cross);
    // Shared across drawJoins re-entries (scrub / one-shot listeners).
    emd._joins = joins;
    if (emd._rmoScrub && emd._rmoScrub.index >= 0 && typeof emd._restoreScrubHighlight === 'function') {
      // Join ids were renumbered — repaint connectors for the current scrub step.
      queueMicrotask(() => emd._restoreScrubHighlight());
    }

    // --- Leftness band assignment (tiling-example), per connector band ---
    const leftnessOf = (j) => j.from.si + j.to.si;
    const throughSlice = (j, si) => j.from.si < si && si < j.to.si;
    function bandConflicts(a, b) {
      if (throughSlice(a, b.to.si) || throughSlice(b, a.to.si)) return true;
      if (throughSlice(a, b.from.si) || throughSlice(b, a.from.si)) return true;
      return false;
    }

    function assignBands(crossList) {
      const bandOf = new Map();
      const bandMembers = [];
      let leftnessFloor = 0;

      // Bundle joins that share a destination (e.g. many EVTs → one RMO) onto
      // consecutive bands. Bundle leftness = first source + destination
      // (earliest EVT with that RMO), so unrelated joins cannot wedge between.
      const byTo = new Map();
      for (const j of crossList) {
        const key = j.toId || `\0${j.id}`;
        if (!byTo.has(key)) byTo.set(key, []);
        byTo.get(key).push(j);
      }
      const bundles = [...byTo.values()].map((members) => {
        const sorted = [...members].sort(
          (a, b) =>
            a.from.si - b.from.si || a.to.si - b.to.si || a.id - b.id
        );
        const first = sorted[0];
        return {
          members: sorted,
          leftness: leftnessOf(first),
          fromSi: first.from.si,
          toSi: first.to.si,
          id: first.id,
        };
      });
      bundles.sort(
        (a, b) =>
          a.leftness - b.leftness ||
          a.fromSi - b.fromSi ||
          a.toSi - b.toSi ||
          a.id - b.id
      );

      function bandFreeFor(band, join) {
        const existing = bandMembers[band];
        if (!existing || !existing.length) return true;
        return existing.every((o) => !bandConflicts(join, o));
      }

      bundles.forEach((bundle) => {
        const n = bundle.members.length;
        let placedAt = -1;
        const searchEnd = bandMembers.length + n + 1;
        for (let b = leftnessFloor; b < searchEnd; b++) {
          let ok = true;
          for (let k = 0; k < n; k++) {
            if (!bandFreeFor(b + k, bundle.members[k])) {
              ok = false;
              break;
            }
          }
          if (ok) {
            placedAt = b;
            break;
          }
        }
        if (placedAt < 0) placedAt = Math.max(leftnessFloor, bandMembers.length);
        for (let k = 0; k < n; k++) {
          const band = placedAt + k;
          if (!bandMembers[band]) bandMembers[band] = [];
          bandMembers[band].push(bundle.members[k]);
          bandOf.set(bundle.members[k].id, band);
        }
        leftnessFloor = placedAt;
      });

      const nBands = bandMembers.length;
      const middleTiles = Math.max(3, nBands + 2);
      const middleH = middleTiles * TILE;
      return { bandOf, nBands, middleH };
    }

    function layoutBandHost(bandPrep, crossList, localList, vertArr) {
      const { bandOf, nBands, middleH } = assignBands(crossList);
      bandPrep.middles.forEach((m) => {
        if (!m) return;
        // minHeight only — flex grows .middle if the grid row is taller (lane pad).
        m.style.minHeight = middleH + 'px';
        m.style.height = '';
        m.innerHTML = '';
      });
      bandPrep.cells.forEach((cell) => {
        cell.style.minHeight = middleH + 'px';
      });
      const outFrom = Array.from({ length: sliceCount }, () => []);
      const inTo = Array.from({ length: sliceCount }, () => []);
      for (const j of crossList) {
        outFrom[j.from.si].push(j);
        inTo[j.to.si].push(j);
      }
      const byLeftness = (a, b) =>
        leftnessOf(a) - leftnessOf(b) || a.from.si - b.from.si || a.id - b.id;
      outFrom.forEach((list) => list.sort(byLeftness));
      inTo.forEach((list) => list.sort(byLeftness));
      return {
        bandOf,
        nBands,
        middleH,
        outFrom,
        inTo,
        localList: localList || [],
        vertArr: vertArr || Array(sliceCount).fill(null),
        cellByIdx: bandPrep.cellByIdx,
        middleByIdx: bandPrep.middleByIdx,
      };
    }

    const lowerLayout = layoutBandHost(
      lowerBand,
      crossLower,
      local,
      vertical
    );
    const upperLayout = layoutBandHost(
      upperBand,
      crossUpper,
      localUpper,
      verticalUpper
    );
    // EVT→RMO (lower) may share the destination column’s SCR↔RMO corridor for
    // path-hot. Do NOT attach RMO→later SCR ids here — those leave on an offset
    // spur; sharing them lit the same-slice vertical when hovering the horizontals.
    const upperCorridorExtra = Array.from({ length: sliceCount }, () => []);
    crossLower.forEach((j) => {
      const idx = sliceIndex[j.toSi];
      if (idx == null || verticalUpper[idx] == null) return;
      upperCorridorExtra[idx].push(j.id);
    });
    upperLayout.corridorExtra = upperCorridorExtra;

    function tagJoins(el, joinIds) {
      if (!joinIds || !joinIds.length) return;
      el.dataset.joinIds = joinIds.join(',');
    }

    /**
     * When set on the board, hover leave/enter must not clear or replace the
     * active highlight. Stored on `emd` so Escape / re-init share one lock.
     */
    function focusLock() {
      return emd._focusLock || null;
    }

    function clearConnectionHighlight() {
      emd.classList.remove('path-focus');
      emd.querySelectorAll('.path-hot').forEach((el) => el.classList.remove('path-hot'));
      emd.querySelectorAll('.hop.hot-v, .hop.hot-h').forEach((el) => {
        el.classList.remove('hot-v', 'hot-h');
      });
      emd.querySelectorAll('.endpoint-hot').forEach((el) => el.classList.remove('endpoint-hot'));
      emd.querySelectorAll('.prop-hot').forEach((el) => el.classList.remove('prop-hot'));
    }

    /**
     * MBA RMO time scrubber — clock opens Start + EVTs this RMO family
     * subscribes to (EMD GWT feeds). Same-title instances chain so later feeds
     * (past this column) stay in the strip and update the card; footprint is
     * the final projection. Own feeds stay lit; other subscribed rows are dim.
     */
    // Scrub session on emd so retile / one-shot listeners share one state.

    function rmoCardTitle(el) {
      return (el?.querySelector(':scope > h2')?.textContent || '').trim();
    }

    function sliceOf(el) {
      const cell = el?.closest?.('[data-slc]');
      if (!cell) return 0;
      const n = parseInt(cell.getAttribute('data-slc'), 10);
      return Number.isFinite(n) ? n : 0;
    }

    /** EMD GWT timeline on the last SLC that features this RMO (`id` = data-emd-gwt). */
    function rmoEmdGwtTimeline(el) {
      if (!el || !el.classList.contains('rmo') || !el.closest('.cell.mba')) return null;
      const id = el.getAttribute('data-emd-gwt');
      if (!id) return null;
      const node = document.getElementById(id);
      if (!node) return null;
      if (node.classList.contains('timeline')) return node;
      return node.querySelector('.timeline.emd-gwt, .timeline');
    }

    /** Parse EMD GWT into Start + progress EVT → RMO snapshot pairs (cloned cards). */
    function parseRmoGwtProgress(timelineSrc) {
      if (!timelineSrc) return null;
      const timeline = timelineSrc.cloneNode(true);
      const cards = [...timeline.children].filter((el) =>
        el.matches('article.rmo, article.evt')
      );
      if (!cards.length || !cards[0].classList.contains('rmo')) return null;
      const progress = [];
      let i = 1;
      while (i < cards.length) {
        const evt = cards[i];
        const rmo = cards[i + 1];
        if (!evt || !evt.classList.contains('evt') || !rmo || !rmo.classList.contains('rmo')) {
          break;
        }
        progress.push({ evt, rmo });
        i += 2;
      }
      return { startRmo: cards[0], progress };
    }

    /** Every LBA EVT left→right (story order), including those after this RMO. */
    function allLbaEvts() {
      return [...emd.querySelectorAll('.cell.lba article.evt')];
    }

    /** MBA RMOs with the same title, story order (e.g. Agenda Builder ×2). */
    function sameTitleRmos(rmoEl) {
      const title = rmoCardTitle(rmoEl);
      return [...emd.querySelectorAll('.cell.mba article.rmo[data-emd-gwt]')]
        .filter((el) => rmoCardTitle(el) === title)
        .sort((a, b) => sliceOf(a) - sliceOf(b));
    }

    /**
     * Chain every same-title EMD GWT. Snapshots from later instances let you walk
     * past this column; footprint uses the final snapshot of the family.
     */
    function collectFamilyScrubStory(rmoEl) {
      const family = sameTitleRmos(rmoEl);
      const familyIds = new Set(family.map((el) => el.id).filter(Boolean));
      let startRmo = null;
      const familyHits = [];
      const ownProgressIds = new Set();
      // Same timeline id on two MBA cards (or overlapping GWTs) must not
      // replay a board EVT twice — e.g. Pat Registered joined to both
      // Registrations instances while both pointed at one full EMD GWT.
      const seenBoardEvtIds = new Set();
      const seenTimelines = new Set();
      family.forEach((member) => {
        const timeline = rmoEmdGwtTimeline(member);
        if (!timeline || seenTimelines.has(timeline)) return;
        seenTimelines.add(timeline);
        const gwt = parseRmoGwtProgress(timeline);
        if (!gwt) return;
        if (!startRmo) startRmo = gwt.startRmo;
        gwt.progress.forEach((p) => {
          // Match against whichever family member actually subscribes to the EVT.
          let boardEvt = null;
          let matchRmo = null;
          for (const m of family) {
            boardEvt = matchBoardEvtForScrub(p.evt, m);
            if (boardEvt) {
              matchRmo = m;
              break;
            }
          }
          if (!boardEvt) return;
          if (boardEvt.id && seenBoardEvtIds.has(boardEvt.id)) return;
          if (boardEvt.id) seenBoardEvtIds.add(boardEvt.id);
          familyHits.push({
            boardEvt,
            rmo: p.rmo,
            scrubEvt: p.evt,
            matchRmo,
          });
        });
      });
      // Own feeds = EVTs this card's data-joins subscribe to (not "first matcher").
      familyHits.forEach((hit) => {
        if (hit.boardEvt?.id && matchBoardEvtForScrub(hit.scrubEvt, rmoEl)) {
          ownProgressIds.add(hit.boardEvt.id);
        }
      });
      const endRmo = familyHits.length
        ? familyHits[familyHits.length - 1].rmo
        : startRmo;
      return { startRmo, endRmo, familyHits, familyIds, ownProgressIds, family };
    }

    /**
     * Scrub strip: Start + only EVTs this RMO family subscribes to (EMD GWT).
     * That includes later same-title feeds past this column (walk forward); it
     * never includes unrelated LBA EVTs. Own feeds stay lit; other subscribed
     * rows (pre-previous instance / later instance) are dimmed but still update.
     */
    function buildRmoScrubSteps(rmoEl) {
      const story = collectFamilyScrubStory(rmoEl);
      if (!story.startRmo) return null;
      const thisSlice = sliceOf(rmoEl);
      let snap = story.startRmo;
      let openIndex = 0;
      const steps = [
        {
          kind: 'blank',
          rmo: story.startRmo,
          evt: null,
          boardEvt: null,
          progress: false,
          matchRmo: null,
          affects: false,
        },
      ];
      // Story order of subscribed feeds only (familyHits already left→right).
      story.familyHits.forEach((hit) => {
        const boardEvt = hit.boardEvt;
        snap = hit.rmo;
        const progress = !!(boardEvt.id && story.ownProgressIds.has(boardEvt.id));
        steps.push({
          kind: 'evt',
          rmo: snap,
          evt: boardEvt,
          boardEvt,
          scrubEvt: hit.scrubEvt,
          progress,
          matchRmo: hit.matchRmo,
          affects: true,
        });
        if (progress && sliceOf(boardEvt) <= thisSlice) {
          openIndex = steps.length - 1;
        }
      });
      if (openIndex === 0) {
        for (let i = steps.length - 1; i >= 0; i--) {
          if (steps[i].progress) {
            openIndex = i;
            break;
          }
        }
      }
      return {
        steps,
        openIndex,
        endRmo: story.endRmo,
        familyIds: story.familyIds,
      };
    }

    function rmoBodyNodes(rmoArticle) {
      return [...rmoArticle.children].filter((ch) => ch.tagName !== 'H2');
    }

    /** Pin collection table columns (and dl label widths) to the end-state sizer. */
    function lockRmoScrubColumnWidths(stack) {
      const sizer = stack.querySelector(':scope > .emd-rmo-scrub-sizer');
      if (!sizer) return;
      const layers = [...stack.querySelectorAll(':scope > .emd-rmo-scrub-layer')];

      function applyTableWidths(srcTable, destTable) {
        const headerCells = srcTable.tHead?.rows?.[0]
          ? [...srcTable.tHead.rows[0].cells]
          : srcTable.rows[0]
            ? [...srcTable.rows[0].cells]
            : [];
        if (!headerCells.length) return;
        const widths = headerCells.map((cell) => cell.getBoundingClientRect().width);
        const tableW = srcTable.getBoundingClientRect().width;
        destTable.style.tableLayout = 'fixed';
        if (tableW > 0) destTable.style.width = `${tableW}px`;
        let colgroup = destTable.querySelector(':scope > colgroup');
        if (!colgroup) {
          colgroup = document.createElement('colgroup');
          destTable.insertBefore(colgroup, destTable.firstChild);
        }
        colgroup.replaceChildren();
        widths.forEach((w) => {
          const col = document.createElement('col');
          col.style.width = `${Math.max(0, w)}px`;
          colgroup.appendChild(col);
        });
      }

      const sizerTables = [...sizer.querySelectorAll('table.collection')];
      sizerTables.forEach((src, ti) => {
        applyTableWidths(src, src);
        layers.forEach((layer) => {
          const dest = layer.querySelectorAll('table.collection')[ti];
          if (dest) applyTableWidths(src, dest);
        });
      });

      // Flat dl rows: freeze dt width so values don't shove the label column.
      const sizerDts = [...sizer.querySelectorAll('.props > div > dt')];
      sizerDts.forEach((srcDt, i) => {
        const w = srcDt.getBoundingClientRect().width;
        if (w <= 0) return;
        const applyDt = (dt) => {
          dt.style.flex = `0 0 ${w}px`;
          dt.style.width = `${w}px`;
          dt.style.maxWidth = `${w}px`;
        };
        applyDt(srcDt);
        layers.forEach((layer) => {
          const dest = layer.querySelectorAll('.props > div > dt')[i];
          if (dest) applyDt(dest);
        });
      });
    }

    /**
     * Prefetch snapshots as absolute layers. Invisible sizer uses the family's
     * final RMO body so the card keeps the end footprint while scrubbing.
     */
    function mountRmoScrubStack(rmoEl, steps, endRmo) {
      const h2 = rmoEl.querySelector(':scope > h2');
      if (!h2) return [];
      // Drop the MBA body (caller saved clones); footprint comes from the end.
      rmoBodyNodes(rmoEl).forEach((ch) => ch.remove());
      const stack = document.createElement('div');
      stack.className = 'emd-rmo-scrub-stack';
      const sizer = document.createElement('div');
      sizer.className = 'emd-rmo-scrub-sizer';
      sizer.setAttribute('aria-hidden', 'true');
      const footprint = endRmo || steps[steps.length - 1]?.rmo;
      if (footprint) {
        rmoBodyNodes(footprint).forEach((ch) => sizer.appendChild(ch.cloneNode(true)));
      }
      stack.appendChild(sizer);
      const layers = steps.map((step) => {
        const layer = document.createElement('div');
        layer.className = 'emd-rmo-scrub-layer';
        rmoBodyNodes(step.rmo).forEach((ch) => {
          layer.appendChild(ch.cloneNode(true));
        });
        stack.appendChild(layer);
        return layer;
      });
      rmoEl.appendChild(stack);
      lockRmoScrubColumnWidths(stack);
      return layers;
    }

    function evtTitle(evtEl) {
      return (evtEl?.querySelector(':scope > h2')?.textContent || '').trim();
    }

    function evtPropMap(evtEl) {
      const map = new Map();
      if (!evtEl) return map;
      evtEl.querySelectorAll('dt').forEach((dt) => {
        const dd = dt.nextElementSibling;
        map.set(
          (dt.textContent || '').trim(),
          (dd?.textContent || '').trim()
        );
      });
      return map;
    }

    /**
     * Match a scrub-timeline EVT to the board EVT that feeds this RMO.
     * EMD GWT examples may omit props — require title + every scrub prop/value
     * present on the board card (subset match), prefer the tightest fit.
     */
    function matchBoardEvtForScrub(scrubEvt, rmoEl) {
      if (!scrubEvt || !rmoEl?.id) return null;
      const title = evtTitle(scrubEvt);
      const want = evtPropMap(scrubEvt);
      const liveJoins = emd._joins || joins;
      const candidates = liveJoins.filter(
        (j) => j.toId === rmoEl.id && j.fromEl && j.fromEl.classList.contains('evt')
      );
      let best = null;
      let bestScore = -1;
      candidates.forEach((j) => {
        if (evtTitle(j.fromEl) !== title) return;
        const have = evtPropMap(j.fromEl);
        for (const [k, v] of want) {
          if (have.get(k) !== v) return;
        }
        // More overlapping props + closer prop counts win (disambiguate twins).
        const score = want.size * 100 - Math.abs(have.size - want.size);
        if (score > bestScore) {
          bestScore = score;
          best = j.fromEl;
        }
      });
      return best;
    }

    /** Re-paint scrub time highlight after a hover session ends. */
    function restoreScrubHighlight() {
      if (!emd._rmoScrub || emd._rmoScrub.index < 0) return;
      highlightScrubStep(emd._rmoScrub.index);
    }
    emd._restoreScrubHighlight = restoreScrubHighlight;

    /**
     * Light EVT → same-title RMO joins for every family hit through the selected
     * step (including future instances you walked into). Never touch SCRs.
     */
    function highlightScrubStep(i) {
      if (!emd._rmoScrub) return;
      const { rmo, steps, familyIds } = emd._rmoScrub;
      clearConnectionHighlight();
      const liveJoins = emd._joins || joins;
      const targets = familyIds?.size ? familyIds : new Set(rmo.id ? [rmo.id] : []);
      const idSet = new Set();
      for (let s = 0; s <= i; s++) {
        const step = steps[s];
        if (!step || !step.affects || !step.boardEvt?.id) continue;
        liveJoins
          .filter((j) => j.fromId === step.boardEvt.id && targets.has(j.toId))
          .forEach((j) => idSet.add(String(j.id)));
      }
      if (idSet.size) {
        applyJoinHighlight(idSet, { skipScr: true });
        markEndpoint(rmo); // keep the card being scrubbed lit even when joins target a later same-title RMO
        return;
      }
      emd.classList.add('path-focus');
      markEndpoint(rmo);
    }

    /**
     * Expand this MBA card to at least the last same-title instance’s box
     * before mounting scrub layers (width especially — a narrow early card
     * wraps the end-state last column and bumps height).
     */
    function sizeRmoToFamilyFootprint(rmoEl) {
      const family = sameTitleRmos(rmoEl);
      const last = family.length ? family[family.length - 1] : rmoEl;
      const r = (last || rmoEl).getBoundingClientRect();
      const w = Math.ceil(r.width);
      const h = Math.ceil(r.height);
      rmoEl.style.boxSizing = 'border-box';
      rmoEl.style.width = `${w}px`;
      rmoEl.style.minWidth = `${w}px`;
      rmoEl.style.minHeight = `${h}px`;
      rmoEl.style.maxHeight = '';
      rmoEl.style.overflow = '';
    }

    /**
     * After layers mount, grow further if any scrub snapshot is taller/wider
     * than the last MBA card (e.g. Agenda Builder with 10 unassigned rows vs
     * a later card that moved most into schedule). Avoids scroll-off clipping.
     */
    function fitRmoToScrubLayers(rmoEl) {
      const stack = rmoEl.querySelector(':scope > .emd-rmo-scrub-stack');
      if (!stack) return;
      const h2 = rmoEl.querySelector(':scope > h2');
      const h2h = h2 ? h2.getBoundingClientRect().height : 0;
      const sizer = stack.querySelector(':scope > .emd-rmo-scrub-sizer');
      let bodyH = sizer ? sizer.scrollHeight : 0;
      let bodyW = sizer ? sizer.scrollWidth : 0;
      stack.querySelectorAll(':scope > .emd-rmo-scrub-layer').forEach((layer) => {
        // Absolute layers report the stack box, not content — probe statically.
        const css = layer.style.cssText;
        layer.style.position = 'static';
        layer.style.visibility = 'hidden';
        layer.style.inset = 'auto';
        layer.style.width = '100%';
        layer.style.height = 'auto';
        layer.style.overflow = 'visible';
        bodyH = Math.max(bodyH, layer.scrollHeight);
        bodyW = Math.max(bodyW, layer.scrollWidth);
        layer.style.cssText = css;
      });
      const pad = 10;
      const needBody = Math.ceil(bodyH);
      const needH = Math.ceil(h2h + needBody + pad);
      const needW = Math.ceil(bodyW + 16);
      // Grow the in-flow sizer so absolute layers (inset:0) get that tall a box.
      if (sizer && needBody > sizer.offsetHeight) {
        sizer.style.minHeight = `${needBody}px`;
      }
      stack.style.minHeight = `${needBody}px`;
      const curH = parseFloat(rmoEl.style.minHeight) || 0;
      const curW = parseFloat(rmoEl.style.width) || 0;
      if (needH > curH) rmoEl.style.minHeight = `${needH}px`;
      if (needW > curW) {
        rmoEl.style.width = `${needW}px`;
        rmoEl.style.minWidth = `${needW}px`;
      }
    }

    function unlockRmoScrubLayout(rmoEl) {
      rmoEl.style.boxSizing = '';
      rmoEl.style.width = '';
      rmoEl.style.minWidth = '';
      rmoEl.style.minHeight = '';
      rmoEl.style.maxHeight = '';
      rmoEl.style.overflow = '';
    }

    function retileConnectors() {
      window.dispatchEvent(new Event('emd:retile'));
    }

    /** Immediate retile (no 40ms debounce) — scrub resize must re-aim shafts now. */
    function retileConnectorsSync() {
      window.dispatchEvent(new Event('emd:retile-sync'));
    }

    /**
     * After the scrub card’s final box is known, wait for layout then re-aim
     * lower/upper band shafts at the RMO (growth is absorbed by the MBA bottom
     * flex gap, so the connector row does not move — tips must be redrawn).
     */
    function afterScrubLayout(fn) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          retileConnectorsSync();
          if (typeof fn === 'function') fn();
        });
      });
    }

    /** Whole history strip slides so the selected step’s top meets the overlay pin. */
    function slideScrubToStep(i) {
      if (!emd._rmoScrub || i < 0) return;
      const { col, stepEls } = emd._rmoScrub;
      const row = stepEls[i];
      if (!row) return;
      // Arrow is position:absolute at top:0 on the overlay — pin in overlay space.
      col.style.transform = `translateY(${-row.offsetTop}px)`;
    }

    function positionScrubOverlay() {
      if (!emd._rmoScrub) return;
      const { shell, slide, rmo } = emd._rmoScrub;
      const r = rmo.getBoundingClientRect();
      const gap = 10;
      const arrowSpace = 14; // room for absolute pin between tape and RMO
      const w = (slide && slide.offsetWidth) || shell.offsetWidth || 220;
      let left = r.left - w - arrowSpace - gap;
      if (left < 8) left = Math.min(r.right + gap, window.innerWidth - w - 8);
      shell.style.left = `${Math.round(left)}px`;
      shell.style.top = `${Math.round(r.top)}px`;
      if (emd._rmoScrub.index >= 0) slideScrubToStep(emd._rmoScrub.index);
    }

    function ensureRmoClock(rmoEl) {
      const h2 = rmoEl.querySelector(':scope > h2');
      if (!h2) return null;
      h2.classList.add('emd-rmo-title');
      let btn = h2.querySelector(':scope > .emd-rmo-clock');
      if (btn) return btn;
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emd-rmo-clock';
      btn.title = 'Scrub read-model over time';
      btn.setAttribute('aria-label', 'Scrub read-model over time');
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleRmoScrub(rmoEl);
      });
      h2.appendChild(btn);
      return btn;
    }

    function setRmoClockVisible(rmoEl, on) {
      const btn = rmoEl.querySelector(':scope > h2 > .emd-rmo-clock');
      if (!btn) return;
      btn.classList.toggle('is-visible', !!on);
    }

    function beginRmoScrubSession() {
      cancelHoverShow();
      cancelHoverClear();
      emd._hoverClearPending = false;
      emd.classList.add('is-rmo-scrubbing');
    }

    function closeRmoScrub() {
      if (!emd._rmoScrub) return;
      const { rmo, savedBody, shell, onReposition, onOutside } = emd._rmoScrub;
      if (onReposition) {
        emd.removeEventListener('scroll', onReposition);
        window.removeEventListener('scroll', onReposition, true);
        window.removeEventListener('resize', onReposition);
      }
      if (onOutside) {
        document.removeEventListener('pointerdown', onOutside, true);
      }
      const h2 = rmo.querySelector(':scope > h2');
      while (h2 && h2.nextSibling) h2.nextSibling.remove();
      savedBody.forEach((node) => rmo.appendChild(node));
      shell.remove();
      unlockRmoScrubLayout(rmo);
      rmo.classList.remove('is-scrubbing');
      emd.classList.remove('is-rmo-scrubbing');
      clearConnectionHighlight();
      emd._rmoScrub = null;
      setRmoClockVisible(rmo, rmo.matches(':hover'));
      afterScrubLayout();
    }

    function selectRmoScrubStep(index) {
      if (!emd._rmoScrub) return;
      const { stepEls, layers } = emd._rmoScrub;
      const i = Math.max(0, Math.min(index, stepEls.length - 1));
      if (i === emd._rmoScrub.index) return;
      const prev = emd._rmoScrub.index;
      if (prev >= 0) {
        stepEls[prev].classList.remove('is-selected');
        if (layers[prev]) layers[prev].classList.remove('is-active');
      }
      emd._rmoScrub.index = i;
      stepEls[i].classList.add('is-selected');
      if (layers[i]) layers[i].classList.add('is-active');
      // Strip moves under the pointer — ignore hover re-entry for a frame.
      emd._rmoScrub.ignoreHover = true;
      slideScrubToStep(i);
      highlightScrubStep(i);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (emd._rmoScrub) emd._rmoScrub.ignoreHover = false;
        });
      });
    }

    function openRmoScrub(rmoEl) {
      if (!rmoEmdGwtTimeline(rmoEl)) return;
      const built = buildRmoScrubSteps(rmoEl);
      if (!built?.steps?.length) return;
      const { steps, openIndex, endRmo, familyIds } = built;
      if (emd._rmoScrub) closeRmoScrub();

      beginRmoScrubSession();

      const savedBody = rmoBodyNodes(rmoEl).map((n) => n.cloneNode(true));
      // Grow to last same-title RMO, mount layers, pin columns, then fit height.
      // Column lock can change wrap/height — fit must run after it, and connectors
      // retile only once the final box is laid out (see afterScrubLayout below).
      sizeRmoToFamilyFootprint(rmoEl);
      const layers = mountRmoScrubStack(rmoEl, steps, endRmo);
      const stack = rmoEl.querySelector(':scope > .emd-rmo-scrub-stack');
      if (stack) lockRmoScrubColumnWidths(stack);
      fitRmoToScrubLayers(rmoEl);

      const shell = document.createElement('div');
      shell.className = 'emd-rmo-scrub';
      shell.setAttribute('role', 'dialog');
      shell.setAttribute('aria-label', 'Read-model history');

      const slide = document.createElement('div');
      slide.className = 'emd-rmo-scrub-slide';
      const col = document.createElement('div');
      col.className = 'emd-rmo-scrub-col';
      col.tabIndex = 0;

      const stepEls = steps.map((step, idx) => {
        const row = document.createElement('div');
        row.className = 'emd-rmo-scrub-step';
        row.dataset.step = String(idx);
        if (step.kind === 'blank') {
          row.classList.add('emd-rmo-scrub-blank');
          row.innerHTML = '<span class="emd-rmo-scrub-blank-label">Start</span>';
        } else {
          row.classList.add(step.progress ? 'is-progress' : 'is-context');
          const clone = step.evt.cloneNode(true);
          clone.removeAttribute('id');
          clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
          row.appendChild(clone);
        }
        row.addEventListener('mouseenter', () => {
          if (emd._rmoScrub && emd._rmoScrub.ignoreHover) return;
          selectRmoScrubStep(idx);
        });
        col.appendChild(row);
        return row;
      });

      const onWheel = (e) => {
        if (!emd._rmoScrub) return;
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY === 0 ? e.deltaX : e.deltaY;
        if (delta === 0) return;
        selectRmoScrubStep(emd._rmoScrub.index + (delta > 0 ? 1 : -1));
      };
      shell.addEventListener('wheel', onWheel, { passive: false });

      slide.appendChild(col);
      const arrow = document.createElement('div');
      arrow.className = 'emd-rmo-scrub-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      shell.appendChild(slide);
      shell.appendChild(arrow);
      // Hide until left/top are set — fixed + auto insets paint at the viewport
      // edge for a frame if we wait on afterScrubLayout alone.
      shell.style.visibility = 'hidden';
      // Overlay on body: tape + pin share this layer (not the board / connector band).
      document.body.appendChild(shell);

      rmoEl.classList.add('is-scrubbing');
      ensureRmoClock(rmoEl);
      setRmoClockVisible(rmoEl, true);
      const onReposition = () => positionScrubOverlay();
      const onOutside = (e) => {
        if (!emd._rmoScrub) return;
        const t = e.target;
        if (t && t.closest && t.closest('.emd-rmo-scrub, .emd-rmo-clock')) return;
        closeRmoScrub();
      };
      emd._rmoScrub = {
        rmo: rmoEl,
        steps,
        openIndex,
        familyIds,
        index: -1,
        savedBody,
        shell,
        slide,
        col,
        arrow,
        stepEls,
        layers,
        ignoreHover: false,
        onReposition,
        onOutside,
      };
      emd.addEventListener('scroll', onReposition, { passive: true });
      window.addEventListener('scroll', onReposition, { passive: true, capture: true });
      window.addEventListener('resize', onReposition);
      // Defer so the opening clock click cannot immediately dismiss.
      requestAnimationFrame(() => {
        document.addEventListener('pointerdown', onOutside, true);
      });
      // Open step first (active layer), pin beside the RMO before first paint,
      // then retile shafts to the final RMO box and re-pin if the card shifted.
      selectRmoScrubStep(openIndex);
      positionScrubOverlay();
      shell.style.visibility = '';
      afterScrubLayout(() => positionScrubOverlay());
      col.focus({ preventScroll: true });
    }

    function toggleRmoScrub(rmoEl) {
      if (emd._rmoScrub && emd._rmoScrub.rmo === rmoEl) {
        closeRmoScrub();
        return;
      }
      openRmoScrub(rmoEl);
    }

    function bindRmoScrubClocks() {
      emd.querySelectorAll('.cell.mba article.rmo[data-emd-gwt]').forEach((rmoEl) => {
        if (rmoEl._rmoScrubBound) return;
        rmoEl._rmoScrubBound = true;
        ensureRmoClock(rmoEl);
        rmoEl.addEventListener('mouseenter', () => {
          if (!rmoEmdGwtTimeline(rmoEl)) return;
          setRmoClockVisible(rmoEl, true);
        });
        rmoEl.addEventListener('mouseleave', (e) => {
          if (emd._rmoScrub && emd._rmoScrub.rmo === rmoEl) return;
          const to = e.relatedTarget;
          if (to && (rmoEl.contains(to) || to.closest?.('.emd-rmo-scrub'))) return;
          setRmoClockVisible(rmoEl, false);
        });
      });
    }
    bindRmoScrubClocks();

    /**
     * Settle delay before painting hover — stops flicker while the pointer moves.
     * Gear → Hover delay (0–5s); 0 paints/clears immediately. Default 200ms until settings mount.
     * When delay > 0 and a hover has already painted: leave does not clear right away
     * (clear is deferred by the same delay); moving to another hover target in that
     * window paints immediately (delay treated as 0).
     * Scroll drops pointer-events on hoverables, so leave may not fire — after scroll
     * settles, clear if the pointer is no longer over a hover target.
     */
    let hoverShowTimer = null;
    let hoverClearTimer = null;

    function hoverShowMs() {
      const raw = document.documentElement.dataset.emdHoverDelayMs;
      if (raw == null || raw === '') return 200;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) && n >= 0 ? n : 200;
    }

    /** Hover path-focus is up, or a deferred clear is still holding the last paint. */
    function hoverSessionActive() {
      if (focusLock()) return false;
      return (
        emd.classList.contains('path-focus') ||
        hoverClearTimer != null ||
        !!emd._hoverClearPending
      );
    }

    function cancelHoverShow() {
      if (hoverShowTimer == null) return;
      clearTimeout(hoverShowTimer);
      hoverShowTimer = null;
    }

    function cancelHoverClear() {
      if (hoverClearTimer == null) return;
      clearTimeout(hoverClearTimer);
      hoverClearTimer = null;
    }

    function pointerOverHoverTarget() {
      const pt = emd._hoverPointer;
      if (!pt) return false;
      const el = document.elementFromPoint(pt.x, pt.y);
      if (!el || !emd.contains(el)) return false;
      if (
        el.closest(
          'article.scr, article.com, article.rmo, article.evt, article.err, .mba > .map'
        )
      ) {
        return true;
      }
      if (el.closest('[data-join-ids]')) return true;
      return false;
    }

    function scheduleDeferredClear() {
      cancelHoverClear();
      const ms = hoverShowMs();
      emd._hoverClearPending = true;
      if (ms <= 0) {
        emd._hoverClearPending = false;
        clearConnectionHighlight();
        restoreScrubHighlight();
        return;
      }
      hoverClearTimer = setTimeout(() => {
        hoverClearTimer = null;
        if (focusLock()) {
          emd._hoverClearPending = false;
          return;
        }
        if (emd._scrolling) {
          // Keep pending — scroll settle will finish the clear.
          return;
        }
        emd._hoverClearPending = false;
        if (pointerOverHoverTarget()) return;
        clearConnectionHighlight();
        restoreScrubHighlight();
      }, ms);
    }

    function scheduleHoverHighlight(fn) {
      // History simulator owns the path — ignore board hover until it closes.
      if (emd._rmoScrub) return;
      cancelHoverShow();
      // Content slides under the pointer while scrolling — skip work until idle.
      if (emd._scrolling) return;
      let ms = hoverShowMs();
      // After a hover has painted (or leave deferred a clear), switch targets now.
      if (ms > 0 && hoverSessionActive()) ms = 0;
      cancelHoverClear();
      emd._hoverClearPending = false;
      if (ms <= 0) {
        if (focusLock()) return;
        fn();
        return;
      }
      hoverShowTimer = setTimeout(() => {
        hoverShowTimer = null;
        if (focusLock() || emd._scrolling) return;
        fn();
      }, ms);
    }

    function clearHoverHighlight() {
      cancelHoverShow();
      if (focusLock() || emd._rmoScrub) return;
      // Content slides under the pointer (and pointer-events drop) while
      // scrolling — remember to clear after scroll settles.
      if (emd._scrolling) {
        if (emd.classList.contains('path-focus')) emd._hoverClearPending = true;
        return;
      }
      const ms = hoverShowMs();
      // Delay > 0 and highlight already showing: defer clear so leave does not
      // flash off; entering another target cancels this and paints with delay 0.
      if (ms > 0 && emd.classList.contains('path-focus')) {
        scheduleDeferredClear();
        return;
      }
      cancelHoverClear();
      emd._hoverClearPending = false;
      clearConnectionHighlight();
    }

    /** After fling: drop sticky hover if the pointer is no longer on a target. */
    function settleHoverAfterScroll() {
      if (focusLock()) return;
      if (!emd.classList.contains('path-focus') && !emd._hoverClearPending) return;
      if (pointerOverHoverTarget()) {
        cancelHoverClear();
        emd._hoverClearPending = false;
        return;
      }
      cancelHoverClear();
      emd._hoverClearPending = false;
      clearConnectionHighlight();
      restoreScrubHighlight();
    }

    // Latest paint owns these so the one-shot scroll guard can call current logic.
    emd._hoverScrollBegin = () => {
      cancelHoverShow();
      if (hoverClearTimer != null || emd._hoverClearPending) {
        cancelHoverClear();
        emd._hoverClearPending = true;
      }
    };
    emd._hoverScrollSettle = settleHoverAfterScroll;

    if (!emd._hoverPointerBound) {
      emd._hoverPointerBound = true;
      emd._hoverPointer = { x: 0, y: 0 };
      document.addEventListener(
        'pointermove',
        (e) => {
          emd._hoverPointer.x = e.clientX;
          emd._hoverPointer.y = e.clientY;
        },
        { passive: true }
      );
    }

    // One scroll guard per board: cancel pending hover paint; flag idle for retile;
    // toggle .is-scrolling so CSS can drop transitions / pointer-events mid-fling.
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
          if (typeof emd._hoverScrollBegin === 'function') emd._hoverScrollBegin();
          clearTimeout(scrollIdle);
          scrollIdle = setTimeout(() => {
            emd._scrolling = false;
            emd.classList.remove('is-scrolling');
            if (typeof emd._hoverScrollSettle === 'function') emd._hoverScrollSettle();
            if (emd._retileAfterScroll) {
              emd._retileAfterScroll = false;
              // Soft check only — forced retile wiped every connector tile
              // even when the board size never changed (visible post-scroll jump).
              window.dispatchEvent(new Event('emd:retile-check'));
            }
          }, 180);
        },
        { passive: true }
      );
    }

    function ensureUnlockButton() {
      let btn = document.querySelector('.emd-unlock-focus');
      if (btn) return btn;
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emd-unlock-focus';
      btn.textContent = 'Unlock highlight';
      btn.hidden = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        unlockFocus();
      });
      document.body.appendChild(btn);
      return btn;
    }

    function unlockFocus() {
      cancelHoverShow();
      cancelHoverClear();
      emd._hoverClearPending = false;
      emd._focusLock = null;
      emd.classList.remove('focus-locked');
      const btn = document.querySelector('.emd-unlock-focus');
      if (btn) btn.hidden = true;
      clearConnectionHighlight();
      restoreScrubHighlight();
    }

    /** Pin the current highlight; Unlock button or Escape releases it. */
    function lockFocus(apply) {
      cancelHoverShow();
      emd._focusLock = { apply };
      emd.classList.add('focus-locked');
      ensureUnlockButton().hidden = false;
      apply();
    }

    function propTargetFromEvent(el, target) {
      const propEl =
        target.closest('.props > table.collection td[data-prop]') ||
        target.closest('.props > div') ||
        target.closest('[data-prop]') ||
        (target.closest('article.scr') === el
          ? (() => {
              const site = scrPropSites(el).find(
                (s) => s.el === target || s.el.contains(target)
              );
              return site ? site.el : null;
            })()
          : null);
      return propEl && el.contains(propEl) ? propEl : null;
    }

    /** Hover prefs from settings.js (`data-emd-hover-*`); default on when unset. */
    function hoverOn(kind) {
      const key =
        kind === 'connectors'
          ? 'emdHoverConnectors'
          : kind === 'values'
            ? 'emdHoverValues'
            : 'emdHoverCards';
      return document.documentElement.dataset[key] !== '0';
    }

    /** "Signup Url: signupToken → signupUrl" → { inputs, outputs }. */
    function parseMapNote(text) {
      const raw = String(text || '').replace(/\s+/g, ' ').trim();
      const arrow = raw.indexOf('→');
      if (arrow < 0) return { inputs: [], outputs: [] };
      let left = raw.slice(0, arrow).trim();
      const right = raw.slice(arrow + 1).trim();
      const colon = left.indexOf(':');
      if (colon >= 0) left = left.slice(colon + 1).trim();
      const splitProps = (s) =>
        s
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
      return { inputs: splitProps(left), outputs: splitProps(right) };
    }

    /**
     * Flat `.props > div` rows, or `td[data-prop]` cells in named collection
     * tables (multi-row RMOs).
     */
    function propRows(card) {
      if (!card) return [];
      return [
        ...card.querySelectorAll(
          '.props > div, .props > table.collection td[data-prop]'
        ),
      ];
    }

    /** Property name on a flat `dt`/`dd` row or a `data-prop` cell. */
    function propNameOf(el) {
      if (!el) return '';
      if (el.hasAttribute && el.hasAttribute('data-prop')) {
        return el.getAttribute('data-prop').trim();
      }
      const dt = el.querySelector && el.querySelector(':scope > dt');
      return dt ? dt.textContent.trim() : '';
    }

    /** Example value on a prop row or SCR control (input/select/td/span). */
    function propValueOf(el) {
      if (!el) return '';
      if (el.matches && el.matches('input, select, textarea')) {
        return String(el.value || '').trim();
      }
      if (el.matches && el.matches('td[data-prop]')) {
        return String(el.textContent || '').trim();
      }
      const dd = el.matches && el.matches('dd') ? el : el.querySelector(':scope > dd');
      if (dd) return dd.textContent.trim();
      return String(el.textContent || '').trim();
    }

    /**
     * Value sites for one property on a card. Optional `value` keeps only that
     * example (so a collection row does not light every sibling's same field).
     */
    function propSitesOn(card, prop, value) {
      if (!card || !prop) return [];
      const wantVal = value == null ? null : String(value).trim();
      const sites = [];
      propRows(card).forEach((row) => {
        const name = propNameOf(row);
        if (name !== prop) return;
        const val = propValueOf(row);
        if (wantVal != null && val !== wantVal) return;
        sites.push({ el: row, prop, value: val });
      });
      if (card.classList.contains('scr')) {
        const matches = [...card.querySelectorAll('[data-prop]')].filter(
          (el) => el.getAttribute('data-prop').trim() === prop
        );
        const live = matches.filter(
          (el) => el.classList.contains('com-data') || el.classList.contains('rmo-data')
        );
        (live.length ? live : matches).forEach((el) => {
          const val = propValueOf(el);
          if (wantVal != null && val !== wantVal) return;
          sites.push({ el, prop, value: val });
        });
      }
      return sites;
    }

    function markProps(card, names, value) {
      if (!card || !names.length) return;
      names.forEach((name) => {
        propSitesOn(card, name, value === undefined ? null : value).forEach((site) => {
          site.el.classList.add('prop-hot');
        });
      });
    }

    /** Named value sites on a SCR: prefer data-prop; else infer from labels/table headers. */
    function scrPropSites(scr) {
      const sites = [];
      scr.querySelectorAll('[data-prop]').forEach((el) => {
        const name = el.getAttribute('data-prop').trim();
        if (name) sites.push({ name, el });
      });
      if (sites.length) return sites;
      scr.querySelectorAll('label.text, label.date, label.dropdown, label.check, label.radio').forEach((lab) => {
        const control = lab.querySelector('input, select');
        if (!control) return;
        const name = lab.childNodes[0] && lab.childNodes[0].textContent
          ? lab.childNodes[0].textContent.trim()
          : '';
        if (name) sites.push({ name, el: control });
      });
      scr.querySelectorAll('table').forEach((table) => {
        const headers = [...table.querySelectorAll('thead th')].map((th) =>
          th.textContent.trim()
        );
        table.querySelectorAll('tbody tr').forEach((tr) => {
          [...tr.children].forEach((td, i) => {
            const name = headers[i];
            if (name && td.tagName === 'TD') sites.push({ name, el: td });
          });
        });
      });
      return sites;
    }

    function propNamesOn(card) {
      if (!card) return [];
      // SCR wires use UX captions; schema names live on data-prop (needed so
      // ERR→SCR / RMO→SCR joins still match message, title, …).
      if (card.classList.contains('scr')) {
        return [
          ...new Set(scrPropSites(card).map((s) => s.name).filter(Boolean)),
        ];
      }
      return [...new Set(propRows(card).map(propNameOf).filter(Boolean))];
    }

    function mapElForJoin(j) {
      if (j.fromEl && j.fromEl.classList.contains('com')) {
        return j.fromEl.parentElement
          ? j.fromEl.parentElement.querySelector(':scope > .map')
          : null;
      }
      if (j.toEl && j.toEl.classList.contains('rmo')) {
        return j.toEl.parentElement
          ? j.toEl.parentElement.querySelector(':scope > .map')
          : null;
      }
      return null;
    }

    function siteKey(card, prop, value) {
      return (card.id || '') + '\0' + prop + '\0' + String(value ?? '');
    }

    /**
     * Undirected graph of property *values* across SCR ↔ COM/RMO ↔ EVT/ERR.
     * Same-name edges keep one example value; MAP edges rename the property and
     * pick up the destination site's own example value(s).
     */
    function buildPropGraph() {
      const adj = new Map(); // key → [{ key, joinId, mapEl, card, prop, value }]
      function linkSites(aCard, aProp, aValue, bCard, bProp, bValue, joinId, mapEl) {
        if (!aCard || !bCard || !aProp || !bProp) return;
        const a = siteKey(aCard, aProp, aValue);
        const b = siteKey(bCard, bProp, bValue);
        if (!adj.has(a)) adj.set(a, []);
        if (!adj.has(b)) adj.set(b, []);
        adj.get(a).push({
          key: b,
          joinId,
          mapEl,
          card: bCard,
          prop: bProp,
          value: bValue,
        });
        adj.get(b).push({
          key: a,
          joinId,
          mapEl,
          card: aCard,
          prop: aProp,
          value: aValue,
        });
      }

      joins.forEach((j) => {
        if (!j.fromEl || !j.toEl) return;
        const mapEl = mapElForJoin(j);
        const { inputs, outputs } = mapEl
          ? parseMapNote(mapEl.textContent)
          : { inputs: [], outputs: [] };
        const fromNames = propNamesOn(j.fromEl);
        const toNames = propNamesOn(j.toEl);
        const mappedIn = new Set(inputs);
        const mappedOut = new Set(outputs);
        // MAP: each input example links to each output example on the other card.
        inputs.forEach((inp) => {
          const fromSites = propSitesOn(j.fromEl, inp);
          outputs.forEach((out) => {
            const toSites = propSitesOn(j.toEl, out);
            fromSites.forEach((fs) => {
              toSites.forEach((ts) => {
                linkSites(
                  j.fromEl,
                  inp,
                  fs.value,
                  j.toEl,
                  out,
                  ts.value,
                  j.id,
                  mapEl
                );
              });
            });
          });
        });
        // Same name: only when both sides share that exact example value.
        fromNames.forEach((p) => {
          if (!toNames.includes(p)) return;
          if (mappedIn.has(p) && mappedOut.size && !mappedOut.has(p)) return;
          const fromSites = propSitesOn(j.fromEl, p);
          const toByVal = new Map();
          propSitesOn(j.toEl, p).forEach((ts) => {
            if (!toByVal.has(ts.value)) toByVal.set(ts.value, []);
            toByVal.get(ts.value).push(ts);
          });
          fromSites.forEach((fs) => {
            (toByVal.get(fs.value) || []).forEach((ts) => {
              linkSites(j.fromEl, p, fs.value, j.toEl, p, ts.value, j.id, null);
            });
          });
        });
      });

      // Same-slice SCR ↔ COM / RMO by property name + matching example value.
      emd.querySelectorAll('.cell.mba[data-slc]').forEach((mba) => {
        const si = sliceOf(mba);
        const host = mba.querySelector(':scope > .com, :scope > .rmo');
        if (!host) return;
        const hostNames = new Set(propNamesOn(host));
        // COM: prefer COM→EVT local. RMO: SCR↔RMO upper local. Do not attach an
        // EVT→RMO join (that would light an unrelated earlier EVT when several
        // EVTs feed the same RMO).
        const joinId = (() => {
          if (host.classList.contains('com')) {
            const localJoin = local.find(
              (j) => j.cellSi === si && j.fromEl === host
            );
            return localJoin ? localJoin.id : null;
          }
          const upperJoin = localUpper.find(
            (j) => j.cellSi === si && (j.fromEl === host || j.toEl === host)
          );
          return upperJoin ? upperJoin.id : null;
        })();
        const wantClass = host.classList.contains('com') ? 'com-data' : 'rmo-data';
        emd.querySelectorAll(`.cell.uba[data-slc="${si}"] .scr`).forEach((scr) => {
          const sites = scrPropSites(scr);
          const live = sites.filter(({ el }) => el.classList.contains(wantClass));
          (live.length ? live : sites).forEach(({ name, el }) => {
            if (!hostNames.has(name)) return;
            const scrVal = propValueOf(el);
            propSitesOn(host, name, scrVal).forEach((hs) => {
              linkSites(scr, name, scrVal, host, name, hs.value, joinId, null);
            });
          });
        });
      });

      // SCR → SCR: same name + value carried in session / query state across screens
      // (a later SCR assumes what an earlier SCR already showed, even when that
      // field is display-only and not on the COM).
      const scrByPropVal = new Map();
      emd.querySelectorAll('article.scr').forEach((scr) => {
        scrPropSites(scr).forEach(({ name, el }) => {
          const value = propValueOf(el);
          if (!name || value === '') return;
          const k = name + '\0' + value;
          if (!scrByPropVal.has(k)) scrByPropVal.set(k, []);
          scrByPropVal.get(k).push({ scr, name, value });
        });
      });
      scrByPropVal.forEach((sites) => {
        for (let i = 0; i < sites.length; i++) {
          for (let j = i + 1; j < sites.length; j++) {
            if (sites[i].scr === sites[j].scr) continue;
            linkSites(
              sites[i].scr,
              sites[i].name,
              sites[i].value,
              sites[j].scr,
              sites[j].name,
              sites[j].value,
              null,
              null
            );
          }
        }
      });

      return adj;
    }

    function resolvePropStart(el) {
      if (!el) return null;
      const cell = el.closest('.props > table.collection td[data-prop]');
      if (cell) {
        const card = cell.closest('article.com, article.rmo, article.evt, article.err');
        const prop = propNameOf(cell);
        if (card && prop) {
          return { card, prop, row: cell, value: propValueOf(cell) };
        }
      }
      const row = el.closest('.props > div');
      if (row) {
        const card = row.closest('article.com, article.rmo, article.evt, article.err');
        const prop = propNameOf(row);
        if (card && prop) {
          return {
            card,
            prop,
            row,
            value: propValueOf(row),
          };
        }
      }
      const field = el.closest('[data-prop]');
      if (field) {
        const card = field.closest(
          'article.scr, article.com, article.rmo, article.evt, article.err'
        );
        const prop = field.getAttribute('data-prop').trim();
        if (card && prop) {
          return { card, prop, row: field, value: propValueOf(field) };
        }
      }
      const scr = el.closest('article.scr');
      if (scr) {
        const site = scrPropSites(scr).find((s) => s.el === el || s.el.contains(el));
        if (site) {
          return {
            card: scr,
            prop: site.name,
            row: site.el,
            value: propValueOf(site.el),
          };
        }
      }
      return null;
    }

    function propGraph() {
      if (!emd._propGraph) emd._propGraph = buildPropGraph();
      return emd._propGraph;
    }

    function highlightPropTrace(startEl) {
      clearConnectionHighlight();
      const start = resolvePropStart(startEl);
      if (!start || !start.prop) return;
      const adj = propGraph();
      const startKey = siteKey(start.card, start.prop, start.value);
      const seen = new Set([startKey]);
      const queue = [startKey];
      // card → Map(prop → Set(value)) so collections only light the hovered example
      const cards = new Map();
      const joinIds = new Set();
      const maps = new Set();
      function remember(card, prop, value) {
        if (!cards.has(card)) cards.set(card, new Map());
        const byProp = cards.get(card);
        if (!byProp.has(prop)) byProp.set(prop, new Set());
        byProp.get(prop).add(value);
      }
      remember(start.card, start.prop, start.value);

      while (queue.length) {
        const key = queue.shift();
        const edges = adj.get(key) || [];
        edges.forEach((edge) => {
          if (edge.joinId != null) joinIds.add(String(edge.joinId));
          if (edge.mapEl) maps.add(edge.mapEl);
          remember(edge.card, edge.prop, edge.value);
          if (!seen.has(edge.key)) {
            seen.add(edge.key);
            queue.push(edge.key);
          }
        });
      }

      if (joinIds.size) {
        applyJoinHighlight(joinIds);
      } else {
        emd.classList.add('path-focus');
      }
      cards.forEach((byProp, card) => {
        markEndpoint(card);
        byProp.forEach((values, prop) => {
          values.forEach((value) => markProps(card, [prop], value));
        });
      });
      maps.forEach(markEndpoint);
      if (start.row) start.row.classList.add('prop-hot');
    }

    function joinsForMap(mapEl) {
      const mba = mapEl.closest('.mba');
      if (!mba) return [];
      const host = mba.querySelector(':scope > .com, :scope > .rmo');
      if (!host) return [];
      if (host.classList.contains('rmo')) {
        return joins.filter((j) => j.toId === host.id);
      }
      if (host.classList.contains('com')) {
        return local.filter((j) => j.fromId === host.id);
      }
      return [];
    }

    function highlightMap(mapEl) {
      clearConnectionHighlight();
      const related = joinsForMap(mapEl);
      if (related.length) {
        applyJoinHighlight(new Set(related.map((j) => String(j.id))));
      } else {
        emd.classList.add('path-focus');
      }
      markEndpoint(mapEl);
      const { inputs, outputs } = parseMapNote(mapEl.textContent);
      related.forEach((j) => {
        markProps(j.fromEl, inputs);
        markProps(j.toEl, outputs);
      });
    }

    function markEndpoint(el) {
      if (el) el.classList.add('endpoint-hot');
    }

    function applyJoinHighlight(idSet, opts) {
      if (!idSet.size) return;
      const skipScr = !!(opts && opts.skipScr);
      emd.classList.add('path-focus');
      emd.querySelectorAll('[data-join-ids]').forEach((el) => {
        if (el.classList.contains('hop')) {
          const hIds = (el.dataset.hJoinIds || '').split(',').filter(Boolean);
          const vIds = (el.dataset.vJoinIds || '').split(',').filter(Boolean);
          if (hIds.some((id) => idSet.has(id))) el.classList.add('hot-h');
          if (vIds.some((id) => idSet.has(id))) el.classList.add('hot-v');
          return;
        }
        const ids = el.dataset.joinIds.split(',');
        if (ids.some((id) => idSet.has(id))) el.classList.add('path-hot');
      });
      joins
        .filter((j) => idSet.has(String(j.id)))
        .forEach((j) => {
          markEndpoint(j.fromEl);
          markEndpoint(j.toEl);
          // Same-slice write: keep SCR(s) above the COM lit.
          if (!skipScr && j.cellSi != null) {
            emd
              .querySelectorAll(`.cell.uba[data-slc="${j.cellSi}"] .scr`)
              .forEach(markEndpoint);
          }
          // Projection into RMO: keep reader SCR(s) + MAP lit (SCR optional for scrub).
          if (j.toEl && j.toEl.classList.contains('rmo')) {
            if (!skipScr) {
              const si = sliceOf(j.toEl);
              emd
                .querySelectorAll(`.cell.uba[data-slc="${si}"] .scr`)
                .forEach(markEndpoint);
            }
            const map = j.toEl.parentElement
              ? j.toEl.parentElement.querySelector(':scope > .map')
              : null;
            markEndpoint(map);
          }
        });
    }

    function highlightByJoinIds(joinIdsCsv) {
      clearConnectionHighlight();
      applyJoinHighlight(
        new Set(
          String(joinIdsCsv || '')
            .split(',')
            .filter(Boolean)
        )
      );
    }

    /**
     * Visible content box inside `.emd`, excluding sticky chrome that covers
     * the board (lane labels on the left, workflow row on top) and the
     * scrollbar gutters (`clientWidth` / `clientHeight` omit those).
     */
    function effectiveViewport() {
      const cr = emd.getBoundingClientRect();
      const lane = emd.querySelector('.board > .lane');
      const wfl = emd.querySelector('.board > .wfl');
      const left = lane ? lane.getBoundingClientRect().right : cr.left;
      const top = wfl ? wfl.getBoundingClientRect().bottom : cr.top;
      // client* excludes classic scrollbar tracks that sit over the board edge.
      return {
        left,
        top,
        right: cr.left + emd.clientWidth,
        bottom: cr.top + emd.clientHeight,
      };
    }

    /** True when the card is inside the effective viewport (1px epsilon; oversized cards count if they cover the viewport). */
    function isFullyInScroller(el) {
      const er = el.getBoundingClientRect();
      const v = effectiveViewport();
      const eps = 1;
      const viewW = v.right - v.left;
      const viewH = v.bottom - v.top;
      const inX =
        (er.left >= v.left - eps && er.right <= v.right + eps) ||
        (er.width > viewW && er.left <= v.left + eps && er.right >= v.right - eps);
      const inY =
        (er.top >= v.top - eps && er.bottom <= v.bottom + eps) ||
        (er.height > viewH && er.top <= v.top + eps && er.bottom >= v.bottom - eps);
      return inX && inY;
    }

    /** How far `card` sticks out of the effective viewport (px). */
    function overflowDistance(card) {
      const er = card.getBoundingClientRect();
      const v = effectiveViewport();
      let d = 0;
      if (er.left < v.left) d += v.left - er.left;
      if (er.right > v.right) d += er.right - v.right;
      if (er.top < v.top) d += v.top - er.top;
      if (er.bottom > v.bottom) d += er.bottom - v.bottom;
      return d;
    }

    /** Scroll so `card` sits fully inside the effective viewport (nearest edges). */
    function scrollCardIntoEffectiveView(card) {
      const er = card.getBoundingClientRect();
      const v = effectiveViewport();
      let dx = 0;
      let dy = 0;
      if (er.left < v.left) dx = er.left - v.left;
      else if (er.right > v.right) dx = er.right - v.right;
      if (er.top < v.top) dy = er.top - v.top;
      else if (er.bottom > v.bottom) dy = er.bottom - v.bottom;
      // Ignore subpixel jitter so repeat clicks don't nudge horizontally.
      if (Math.abs(dx) < 1) dx = 0;
      if (Math.abs(dy) < 1) dy = 0;
      if (dx || dy) {
        emd.scrollBy({ left: dx, top: dy, behavior: 'smooth' });
      }
    }

    // Last end brought into view per join-id set — enables click back-and-forth.
    if (!emd._emdLastReveal) emd._emdLastReveal = new Map();

    /**
     * Reveal targets depend on what was clicked:
     * - UBA/MBA/LBA corridor → same-slice vertical ends (SCR↔RMO / SCR↔COM↔EVT)
     * - connector tiles (shaft-h, etc.) → join wire ends only (EVT↔RMO), never SCR
     */
    function endsForReveal(related, originEl) {
      const ends = [];
      const seen = new Set();
      const add = (card) => {
        if (!card || seen.has(card)) return;
        seen.add(card);
        ends.push(card);
      };
      const ubaActors = (si) =>
        emd.querySelectorAll(
          `.cell.uba[data-slc="${si}"] .scr, .cell.uba[data-slc="${si}"] .pro`
        );

      const cell = originEl && originEl.closest('.cell[data-slc]');
      const verticalCorridor =
        cell &&
        (cell.classList.contains('uba') ||
          cell.classList.contains('mba') ||
          cell.classList.contains('lba'));

      if (verticalCorridor) {
        const si = parseInt(cell.dataset.slc, 10);
        for (const j of related) {
          if (j.fromEl && sliceOf(j.fromEl) === si) add(j.fromEl);
          if (j.toEl && sliceOf(j.toEl) === si) add(j.toEl);
          if (j.cellSi === si) ubaActors(si).forEach(add);
          if (j.toEl && j.toEl.classList.contains('rmo') && sliceOf(j.toEl) === si) {
            ubaActors(si).forEach(add);
          }
        }
        return ends;
      }

      // Horizontal (and other) connector tiles: EVT ↔ RMO / COM ↔ EVT only.
      for (const j of related) {
        add(j.fromEl);
        add(j.toEl);
      }
      return ends;
    }

    /**
     * Bring a clipped path end into view. One end per click so repeated clicks
     * ping-pong when ends cannot fit in the viewport at once (including
     * vertical SCR ↔ COM/RMO ↔ EVT corridors).
     */
    function revealJoinEndpointSlices(joinIdsCsv, originEl) {
      const idSet = new Set(
        String(joinIdsCsv || '')
          .split(',')
          .filter(Boolean)
      );
      const related = joins.filter((j) => idSet.has(String(j.id)));
      const ends = endsForReveal(related, originEl);
      if (!ends.length) return;

      const clipped = ends.filter((card) => !isFullyInScroller(card));
      if (!clipped.length) return;

      const key = [...idSet].sort().join(',');
      const last = emd._emdLastReveal.get(key);
      let target;
      if (clipped.length === 1) {
        target = clipped[0];
      } else {
        // Prefer a different end than last time; otherwise the most out-of-view one.
        const others = clipped.filter((card) => card !== last);
        if (others.length) {
          others.sort((a, b) => overflowDistance(b) - overflowDistance(a));
          target = others[0];
        } else {
          target = clipped[0];
        }
      }
      emd._emdLastReveal.set(key, target);
      scrollCardIntoEffectiveView(target);
    }

    function joinIdsForConnector(el) {
      if (el.classList.contains('hop')) {
        return el.dataset.hJoinIds || el.dataset.joinIds;
      }
      return el.dataset.joinIds;
    }

    function bindConnectorHover(el) {
      if (!el.dataset.joinIds) return;
      if (el._joinHover) {
        el.removeEventListener('mouseenter', el._joinHover.enter);
        el.removeEventListener('mouseleave', el._joinHover.leave);
        el.removeEventListener('click', el._joinHover.click);
      }
      const enter = () => {
        if (focusLock() || emd._rmoScrub || !hoverOn('connectors')) return;
        const ids = joinIdsForConnector(el);
        scheduleHoverHighlight(() => highlightByJoinIds(ids));
      };
      const leave = () => {
        if (emd._rmoScrub) return;
        clearHoverHighlight();
      };
      const click = (e) => {
        e.stopPropagation();
        const ids = joinIdsForConnector(el);
        // Connectors never lock: click only pans clipped ends into view.
        // If a value/card lock is already on, re-apply it after scrolling.
        revealJoinEndpointSlices(ids, el);
        if (focusLock()) focusLock().apply();
      };
      el._joinHover = { enter, leave, click };
      el.style.cursor = 'pointer';
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      el.addEventListener('click', click);
    }

    function tagCorridorPieces(pieces, joinIds) {
      const ids = joinIds.map(String);
      pieces.forEach((el) => {
        const existing = (el.dataset.joinIds || '').split(',').filter(Boolean);
        tagJoins(el, [...new Set(existing.concat(ids))]);
        el.style.cursor = 'pointer';
        bindConnectorHover(el);
      });
    }

    /**
     * Shafts and arrow tiles inside CSS corridors only — never the wrapping
     * `.gap` (that was a full-slice hit target; hovering empty column space
     * painted path-focus while scrolling and hitching the fling).
     */
    function piecesFromGaps(gaps) {
      const pieces = [];
      gaps.forEach((gap) => {
        pieces.push(...gap.querySelectorAll('.shaft, .tile'));
      });
      return pieces;
    }

    // Tag CSS corridor shafts/tiles so card/connector hover can light them;
    // hover/click stay on those elements (and cards / values / MAP / JS tiles).
    function bindCssCorridors() {
      local.forEach((j) => {
        const si = j.cellSi;
        const pieces = piecesFromGaps([
          ...emd.querySelectorAll(`.cell.uba[data-slc="${si}"] .gap`),
        ]);
        const mba = emd.querySelector(`.cell.mba[data-slc="${si}"]`);
        if (mba) {
          pieces.push(...piecesFromGaps([...mba.querySelectorAll(':scope > .gap')]));
        }
        const lbaCells = emd.querySelectorAll(`.cell.lba[data-slc="${si}"]`);
        lbaCells.forEach((lba) => {
          pieces.push(...piecesFromGaps([...lba.querySelectorAll('.gap')]));
        });
        tagCorridorPieces(pieces, [j.id]);
      });
      // Upper local SCR↔COM/RMO: UBA pass-through shafts + MBA top gap only.
      localUpper.forEach((j) => {
        const si = j.cellSi;
        const pieces = piecesFromGaps([
          ...emd.querySelectorAll(`.cell.uba[data-slc="${si}"] .gap`),
        ]);
        const mba = emd.querySelector(`.cell.mba[data-slc="${si}"]`);
        if (mba) {
          const gaps = [...mba.querySelectorAll(':scope > .gap')];
          if (gaps[0]) pieces.push(...piecesFromGaps([gaps[0]]));
        }
        tagCorridorPieces(pieces, [j.id]);
      });
      crossLower.forEach((j) => {
        const si = j.toSi;
        const pieces = piecesFromGaps([
          ...emd.querySelectorAll(`.cell.uba[data-slc="${si}"] .gap`),
        ]);
        const mba = emd.querySelector(`.cell.mba[data-slc="${si}"]`);
        if (mba) {
          const gaps = [...mba.querySelectorAll(':scope > .gap')];
          if (gaps[0]) pieces.push(...piecesFromGaps([gaps[0]]));
        }
        tagCorridorPieces(pieces, [j.id]);
      });
      // Upper RMO→SCR: only the destination SCR corridor (CSS under the SCR).
      // Source RMO’s MBA top shaft is the same-slice SCR↔RMO local — leave it
      // to localUpper, not these cross joins.
      crossUpper.forEach((j) => {
        const pieces = piecesFromGaps([
          ...emd.querySelectorAll(`.cell.uba[data-slc="${j.toSi}"] .gap`),
        ]);
        tagCorridorPieces(pieces, [j.id]);
      });
    }
    bindCssCorridors();

    function placeTile(middle, className, x, y, joinIds) {
      const el = document.createElement('div');
      el.className = 'tile ' + className;
      el.dataset.tile = className;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      tagJoins(el, joinIds);
      bindConnectorHover(el);
      middle.appendChild(el);
      return el;
    }

    function placeHop(middle, x, y, hJoinIds, vJoinIds) {
      const el = document.createElement('div');
      el.className = 'tile hop';
      el.dataset.tile = 'hop';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      const hIds = hJoinIds || [];
      const vIds = vJoinIds || [];
      if (hIds.length) el.dataset.hJoinIds = hIds.join(',');
      if (vIds.length) el.dataset.vJoinIds = vIds.join(',');
      tagJoins(el, [...new Set([...hIds, ...vIds])]);
      bindConnectorHover(el);
      middle.appendChild(el);
      return el;
    }

    function placeShaftV(middle, x, y, h, joinIds) {
      if (h <= 0) return;
      const el = document.createElement('div');
      el.className = 'shaft-v';
      el.dataset.tile = 'shaft-v';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.height = h + 'px';
      tagJoins(el, joinIds);
      bindConnectorHover(el);
      middle.appendChild(el);
    }

    function placeShaftH(middle, x, y, w, joinIds) {
      if (w <= 0) return;
      const el = document.createElement('div');
      el.className = 'shaft-h';
      el.dataset.tile = 'shaft-h';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.width = w + 'px';
      tagJoins(el, joinIds);
      bindConnectorHover(el);
      middle.appendChild(el);
    }

    function placeShaftHHopped(middle, y, x0, x1, obstacles, joinIds, vIdsAt) {
      const hits = obstacles
        .filter((x) => x + TILE > x0 && x < x1)
        .sort((a, b) => a - b);
      let x = x0;
      for (const ox of hits) {
        if (ox > x) placeShaftH(middle, x, y, ox - x, joinIds);
        if (ox + TILE > x0 && ox < x1) {
          placeHop(middle, ox, y, joinIds, vIdsAt ? vIdsAt(ox) : []);
        }
        x = Math.max(x, ox + TILE);
      }
      if (x1 > x) placeShaftH(middle, x, y, x1 - x, joinIds);
    }

    function placeShaftVHopped(middle, x, y0, y1, hopYs, joinIds) {
      const hops = [...new Set(hopYs)]
        .filter((y) => y + TILE > y0 && y < y1)
        .sort((a, b) => a - b);
      let y = y0;
      for (const hy of hops) {
        if (hy > y) placeShaftV(middle, x, y, hy - y, joinIds);
        y = Math.max(y, hy + TILE);
      }
      if (y1 > y) placeShaftV(middle, x, y, y1 - y, joinIds);
    }

    function relatedJoinsFor(el) {
      const direct = joins.filter(
        (j) => j.fromId === el.id || j.toId === el.id
      );
      if (direct.length) return direct;
      if (el.classList.contains('scr')) {
        const si = sliceOf(el);
        const localsAt = local.filter((j) => j.cellSi === si);
        if (localsAt.length) return localsAt;
        const rmo = emd.querySelector(`.cell.mba[data-slc="${si}"] .rmo`);
        if (rmo) return joins.filter((j) => j.toId === rmo.id);
      }
      return [];
    }

    function highlightCard(el) {
      clearConnectionHighlight();
      const related = relatedJoinsFor(el);
      if (related.length) {
        applyJoinHighlight(new Set(related.map((j) => String(j.id))));
        return;
      }
      emd.classList.add('path-focus');
      markEndpoint(el);
    }

    // Card / property hover — a property value isolates that example through
    // the system (name + value); otherwise the card's joins stay lit.
    // Click the hovered target to lock the highlight for scrolling; use the
    // Unlock highlight control or Escape to release. MBA RMO time scrubbing is
    // separate (clock on the title — see bindRmoScrubClocks).
    emd
      .querySelectorAll('article.scr, article.com, article.rmo, article.evt, article.err')
      .forEach((el) => {
        if (el._joinHover) {
          el.removeEventListener('mouseover', el._joinHover.over);
          el.removeEventListener('mouseout', el._joinHover.out);
          el.removeEventListener('click', el._joinHover.click);
        }
        const over = (e) => {
          if (focusLock() || emd._rmoScrub) return;
          const propEl = propTargetFromEvent(el, e.target);
          if (propEl && hoverOn('values')) {
            scheduleHoverHighlight(() => highlightPropTrace(propEl));
            return;
          }
          if (hoverOn('cards')) {
            scheduleHoverHighlight(() => highlightCard(el));
            return;
          }
          clearHoverHighlight();
        };
        const out = (e) => {
          if (el.contains(e.relatedTarget)) return;
          if (emd._rmoScrub) return;
          clearHoverHighlight();
        };
        const click = (e) => {
          if (e.target.closest('.emd-rmo-clock, .emd-rmo-scrub')) return;
          if (emd._rmoScrub) return;
          if (focusLock()) {
            e.stopPropagation();
            return;
          }
          const propEl = propTargetFromEvent(el, e.target);
          if (propEl && hoverOn('values')) {
            e.stopPropagation();
            lockFocus(() => highlightPropTrace(propEl));
            return;
          }
          if (!hoverOn('cards')) return;
          e.stopPropagation();
          lockFocus(() => highlightCard(el));
        };
        el._joinHover = { over, out, click };
        el.addEventListener('mouseover', over);
        el.addEventListener('mouseout', out);
        el.addEventListener('click', click);
      });

    emd
      .querySelectorAll(
        '.props > div, .props > table.collection td[data-prop], [data-prop]'
      )
      .forEach((el) => {
        el.style.cursor = 'pointer';
      });

    // MAP hover — light the join and the mapped property rows on each side.
    emd.querySelectorAll('.mba > .map').forEach((el) => {
      if (el._joinHover) {
        el.removeEventListener('mouseenter', el._joinHover.enter);
        el.removeEventListener('mouseleave', el._joinHover.leave);
        el.removeEventListener('click', el._joinHover.click);
      }
      const enter = () => {
        if (focusLock() || emd._rmoScrub || !hoverOn('values')) return;
        scheduleHoverHighlight(() => highlightMap(el));
      };
      const leave = () => {
        if (emd._rmoScrub) return;
        clearHoverHighlight();
      };
      const click = (e) => {
        e.stopPropagation();
        if (focusLock() || emd._rmoScrub || !hoverOn('values')) return;
        lockFocus(() => highlightMap(el));
      };
      el._joinHover = { enter, leave, click };
      el.style.cursor = 'pointer';
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      el.addEventListener('click', click);
    });

    if (!emd._hoverPrefsBound) {
      emd._hoverPrefsBound = true;
      window.addEventListener('emd:hover-prefs', () => unlockFocus());
    }
    if (!emd._focusLockEscBound) {
      emd._focusLockEscBound = true;
      window.addEventListener('keydown', (e) => {
        if (emd._rmoScrub && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          selectRmoScrubStep(emd._rmoScrub.index + (e.key === 'ArrowUp' ? -1 : 1));
          return;
        }
        if (e.key !== 'Escape') return;
        if (emd._rmoScrub) {
          closeRmoScrub();
          return;
        }
        if (!emd._focusLock) return;
        unlockFocus();
      });
    }

    function paintBandLayout(layout, crossList, bandKind) {
      const {
        bandOf,
        nBands,
        middleH: layoutMiddleH,
        outFrom,
        inTo,
        localList,
        vertArr,
        cellByIdx,
        middleByIdx,
        corridorExtra,
      } = layout;

      for (let si = 0; si < sliceCount; si++) {
        const middle = middleByIdx[si];
        if (!middle) continue;
        const w = middle.clientWidth;
        // Prefer measured height so local verticals fill a row stretched by lane pad.
        const middleH = Math.max(middle.clientHeight || 0, layoutMiddleH);
        const stubY = middleH - TILE;
        const bands = [];
        for (let b = 0; b < nBands; b++) {
          bands[b] = middleH - TILE * (nBands - b + 1);
        }
        const cell = cellByIdx[si];
        const cellSi = cell ? sliceOf(cell) : mbaCells[si] ? sliceOf(mbaCells[si]) : si + 1;
        const arr = emd.querySelector(`.cell.mba[data-slc="${cellSi}"] .gap .arr.v`);
        let cx;
        if (arr) {
          const mr = middle.getBoundingClientRect();
          const ar = arr.getBoundingClientRect();
          cx = ar.left - mr.left;
        } else {
          cx = (w - TILE) / 2;
        }

        const hasVert = vertArr[si] != null;
        const outBase = hasVert ? 1 : 0;
        const outXs = outFrom[si].map((_, oi) => cx + TILE * (oi + outBase));
        const nIn = inTo[si].length;
        const inStart = cx - ((nIn - 1) * TILE) / 2;
        const inXs = inTo[si].map((_, ii) => inStart + TILE * ii);

        const throughByBand = new Map();
        for (const j of crossList) {
          if (j.from.si >= si || j.to.si <= si) continue;
          const b = bandOf.get(j.id);
          if (!throughByBand.has(b)) throughByBand.set(b, []);
          throughByBand.get(b).push(j.id);
        }
        const throughBands = new Set(throughByBand.keys());

        function obstaclesOnBand(b, { skipOutOi = -1, skipInIi = -1 } = {}) {
          const obstacles = [];
          if (hasVert) obstacles.push(cx);
          outFrom[si].forEach((j, oi) => {
            if (oi === skipOutOi) return;
            if (bandOf.get(j.id) < b) obstacles.push(outXs[oi]);
          });
          inTo[si].forEach((j, ii) => {
            if (ii === skipInIi) return;
            if (bandOf.get(j.id) > b) obstacles.push(inXs[ii]);
          });
          return obstacles;
        }

        function hopYsAt(x) {
          const ys = [];
          for (let b = 0; b < nBands; b++) {
            if (!obstaclesOnBand(b).some((ox) => Math.abs(ox - x) < 0.5)) continue;
            let covers = throughBands.has(b);
            outFrom[si].forEach((j, oi) => {
              if (bandOf.get(j.id) !== b) return;
              if (outXs[oi] + TILE <= x + 0.5 && x < w) covers = true;
            });
            inTo[si].forEach((j, ii) => {
              if (bandOf.get(j.id) !== b) return;
              if (x < inXs[ii]) covers = true;
            });
            if (covers) ys.push(bands[b]);
          }
          return ys;
        }

        const localJoinIds = localList
          .filter((j) => j.from.si === si || j.to.si === si)
          .map((j) => j.id);
        const vertJoinIds = [
          ...new Set([
            ...localJoinIds,
            ...((corridorExtra && corridorExtra[si]) || []),
          ]),
        ];

        function vJoinIdsAt(x) {
          const ids = [];
          if (hasVert && Math.abs(x - cx) < 0.5) ids.push(...vertJoinIds);
          outFrom[si].forEach((j, oi) => {
            if (Math.abs(outXs[oi] - x) < 0.5) ids.push(j.id);
          });
          inTo[si].forEach((j, ii) => {
            if (Math.abs(inXs[ii] - x) < 0.5) ids.push(j.id);
          });
          return ids;
        }

        // Local vertical through the middle (CSS keeps arrow tiles in UBA/MBA/LBA).
        if (hasVert) {
          placeShaftVHopped(middle, cx, 0, stubY + TILE, hopYsAt(cx), vertJoinIds);
        }

        // Outbound from below the band (EVT or RMO) up into the stub row.
        outFrom[si].forEach((j, oi) => {
          const band = bandOf.get(j.id);
          const y = bands[band];
          const ox = outXs[oi];
          const ids = [j.id];
          const hops = new Set(hopYsAt(ox));
          const mr = middle.getBoundingClientRect();
          const fromTop = j.fromEl.getBoundingClientRect().top - mr.top;

          if (fromTop > stubY + TILE) {
            placeShaftV(middle, ox, stubY + TILE, fromTop - (stubY + TILE), ids);
          }
          placeTile(middle, 'vline', ox, stubY, ids);
          for (let b = nBands - 1; b > band; b--) {
            if (hops.has(bands[b])) continue;
            placeTile(middle, 'vline', ox, bands[b], ids);
          }
          placeTile(middle, 'elbow-br', ox, y, ids);
          placeShaftHHopped(
            middle,
            y,
            ox + TILE,
            w,
            obstaclesOnBand(band, { skipOutOi: oi }),
            ids,
            vJoinIdsAt
          );
        });

        for (const b of throughBands) {
          placeShaftHHopped(
            middle,
            bands[b],
            0,
            w,
            obstaclesOnBand(b),
            throughByBand.get(b),
            vJoinIdsAt
          );
        }

        // Inbound rises into targets above the band (RMO or SCR).
        inTo[si].forEach((j, ii) => {
          const band = bandOf.get(j.id);
          const y = bands[band];
          const ax = inXs[ii];
          const ids = [j.id];
          const hops = hopYsAt(ax);
          const mr = middle.getBoundingClientRect();
          const toBottom = j.toEl.getBoundingClientRect().bottom - mr.top;

          placeShaftHHopped(
            middle,
            y,
            0,
            ax,
            obstaclesOnBand(band, { skipInIi: ii }),
            ids,
            vJoinIdsAt
          );
          placeTile(middle, 'elbow-tl', ax, y, ids);

          // Upper band → SCR: UBA already has the CSS shaft (+ arrow-up). Painting
          // another shaft/arrow up into that gap doubles the stroke near the tip.
          // Stay inside this middle; CSS corridor continues to the screen.
          if (bandKind === 'upper' && toBottom < 0) {
            if (y > 0) placeShaftVHopped(middle, ax, 0, y, hops, ids);
            return;
          }

          if (y > toBottom + TILE) {
            placeShaftVHopped(middle, ax, toBottom + TILE, y, hops, ids);
          }
          placeTile(middle, 'arrow-up', ax, toBottom, ids);
        });
      }
    }

    const paintBands = () => {
      if (lowerCells.length) paintBandLayout(lowerLayout, crossLower, 'lower');
      if (upperCells.length) paintBandLayout(upperLayout, crossUpper, 'upper');
    };
    // Scrub open/close needs shafts aimed at the post-resize RMO in the same
    // turn — a deferred rAF left tips short while the card had already grown.
    if (emd._scrubSyncPaint) paintBands();
    else requestAnimationFrame(paintBands);
  }

  function boot() {
    document.querySelectorAll('main.emd[data-joins]').forEach((emd) => {
      let timer = 0;
      let lastW = 0;
      let lastH = 0;
      const board = () => emd.querySelector('.board') || emd;
      /**
       * Full connector retile is expensive. Skip no-op resizes, and defer any
       * ResizeObserver blip that fires while the board is scrolling (scrollbar
       * gutter / sticky reflow) until scroll settles.
       */
      const run = (force) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const el = board();
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (!force && emd._scrolling) {
            // Only schedule a post-scroll retile when size actually moved.
            if (w !== lastW || h !== lastH) emd._retileAfterScroll = true;
            return;
          }
          // Scrub stack holds max snapshot size — skip expensive retile while open.
          if (!force && emd.classList.contains('is-rmo-scrubbing')) return;
          if (!force && w === lastW && h === lastH) return;
          lastW = w;
          lastH = h;
          drawJoins(emd);
        }, 40);
      };
      drawJoins(emd);
      const el0 = board();
      lastW = el0.clientWidth;
      lastH = el0.clientHeight;
      window.addEventListener('resize', () => run(true));
      window.addEventListener('emd:retile', () => run(true));
      window.addEventListener('emd:retile-check', () => run(false));
      // Scrub open/close: redraw shafts immediately at the post-resize RMO box
      // (syncPaint so tips land in this turn, not the next animation frame).
      window.addEventListener('emd:retile-sync', () => {
        clearTimeout(timer);
        const el = board();
        lastW = el.clientWidth;
        lastH = el.clientHeight;
        emd._scrubSyncPaint = true;
        try {
          drawJoins(emd);
        } finally {
          emd._scrubSyncPaint = false;
        }
      });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => run(true));
      }
      const ro = new ResizeObserver(() => run(false));
      ro.observe(el0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
