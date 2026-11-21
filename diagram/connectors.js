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
     * Settle delay before painting hover — stops flicker while the pointer moves.
     * Gear → Hover delay (0–5s); 0 paints immediately. Default 200ms until settings mount.
     */
    let hoverShowTimer = null;

    function hoverShowMs() {
      const raw = document.documentElement.dataset.emdHoverDelayMs;
      if (raw == null || raw === '') return 200;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) && n >= 0 ? n : 200;
    }

    function cancelHoverShow() {
      if (hoverShowTimer == null) return;
      clearTimeout(hoverShowTimer);
      hoverShowTimer = null;
    }

    function scheduleHoverHighlight(fn) {
      cancelHoverShow();
      // Content slides under the pointer while scrolling — skip work until idle.
      if (emd._scrolling) return;
      const ms = hoverShowMs();
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
      if (focusLock()) return;
      // Content slides under the pointer (and pointer-events drop) while
      // scrolling — freezing paint avoids a whole-board opacity flash.
      if (emd._scrolling) return;
      clearConnectionHighlight();
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
          cancelHoverShow();
          clearTimeout(scrollIdle);
          scrollIdle = setTimeout(() => {
            emd._scrolling = false;
            emd.classList.remove('is-scrolling');
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
      emd._focusLock = null;
      emd.classList.remove('focus-locked');
      const btn = document.querySelector('.emd-unlock-focus');
      if (btn) btn.hidden = true;
      clearConnectionHighlight();
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

    function propNamesOn(card) {
      if (!card) return [];
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

    /** Named value sites on a SCR: prefer data-prop; else infer from labels/table headers. */
    function scrPropSites(scr) {
      const sites = [];
      scr.querySelectorAll('[data-prop]').forEach((el) => {
        const name = el.getAttribute('data-prop').trim();
        if (name) sites.push({ name, el });
      });
      if (sites.length) return sites;
      scr.querySelectorAll('label.text, label.date, label.dropdown').forEach((lab) => {
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

    function applyJoinHighlight(idSet) {
      if (!idSet.size) return;
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
          if (j.cellSi != null) {
            emd
              .querySelectorAll(`.cell.uba[data-slc="${j.cellSi}"] .scr`)
              .forEach(markEndpoint);
          }
          // Projection into RMO: keep reader SCR(s) + MAP lit.
          if (j.toEl && j.toEl.classList.contains('rmo')) {
            const si = sliceOf(j.toEl);
            emd
              .querySelectorAll(`.cell.uba[data-slc="${si}"] .scr`)
              .forEach(markEndpoint);
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
        if (focusLock() || !hoverOn('connectors')) return;
        const ids = joinIdsForConnector(el);
        scheduleHoverHighlight(() => highlightByJoinIds(ids));
      };
      const leave = () => {
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
    // Unlock highlight control or Escape to release.
    emd
      .querySelectorAll('article.scr, article.com, article.rmo, article.evt, article.err')
      .forEach((el) => {
        if (el._joinHover) {
          el.removeEventListener('mouseover', el._joinHover.over);
          el.removeEventListener('mouseout', el._joinHover.out);
          el.removeEventListener('click', el._joinHover.click);
        }
        const over = (e) => {
          if (focusLock()) return;
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
          clearHoverHighlight();
        };
        const click = (e) => {
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
        if (focusLock() || !hoverOn('values')) return;
        scheduleHoverHighlight(() => highlightMap(el));
      };
      const leave = () => {
        clearHoverHighlight();
      };
      const click = (e) => {
        e.stopPropagation();
        if (focusLock() || !hoverOn('values')) return;
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
        if (e.key !== 'Escape' || !emd._focusLock) return;
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

    requestAnimationFrame(() => {
      if (lowerCells.length) paintBandLayout(lowerLayout, crossLower, 'lower');
      if (upperCells.length) paintBandLayout(upperLayout, crossUpper, 'upper');
    });
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
