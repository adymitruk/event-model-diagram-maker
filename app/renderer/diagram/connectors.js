/**
 * EVT → RMO connectors — port of diagram/tiling-example.html.
 *
 * Each `.cell.connector` gets a `.middle` band. Tiles are local to that middle
 * (one cell occupancy, hopped shafts, leftness bands). Leave stubs reach down
 * to EVT tops and arrival rises reach up to RMO bottoms (overflow visible).
 *
 *   <main class="emd" data-joins="evt-a:rmo-x,…">
 *   <div class="cell connector" data-slc="N"></div>  <!-- empty; JS fills -->
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
    const TILE = tileSize();
    // Remove legacy absolute layer if present.
    const sheet = emd.querySelector('.sheet') || emd;
    const legacy = sheet.querySelector('#connector-layer');
    if (legacy) legacy.remove();

    const joinsAttr = emd.getAttribute('data-joins') || '';
    const pairs = joinsAttr.split(',').map((s) => s.trim()).filter(Boolean);

    const connectorCells = [...emd.querySelectorAll('.cell.connector')].sort(
      (a, b) => sliceOf(a) - sliceOf(b)
    );
    if (!connectorCells.length) return;

    // Build per-slice middle hosts; clear prior tiles.
    const middles = [];
    const sliceIndex = {}; // si → array index
    connectorCells.forEach((cell, idx) => {
      const si = sliceOf(cell);
      sliceIndex[si] = idx;
      cell.innerHTML = '';
      const middle = document.createElement('div');
      middle.className = 'middle';
      cell.appendChild(middle);
      middles.push(middle);
    });
    const sliceCount = middles.length;
    if (!sliceCount) return;

    // Cross-slice projection joins from data-joins.
    let nextId = 1;
    const cross = [];
    pairs.forEach((pair) => {
      const [fromId, toId] = pair.split(':').map((s) => s.trim());
      const fromEl = document.getElementById(fromId);
      const toEl = document.getElementById(toId);
      if (!fromEl || !toEl) return;
      const fromSi = sliceOf(fromEl);
      const toSi = sliceOf(toEl);
      if (sliceIndex[fromSi] == null || sliceIndex[toSi] == null) return;
      cross.push({
        id: nextId++,
        fromId,
        toId,
        fromEl,
        toEl,
        from: { si: sliceIndex[fromSi], part: 'lower' },
        to: { si: sliceIndex[toSi], part: 'upper' },
        fromSi,
        toSi,
      });
    });

    // Same-slice writes: MBA has a .com → treat as upper→lower local join.
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
      });
      vertical[idx] = 'down';
    });

    const joins = local.concat(cross);

    // --- Leftness band assignment (tiling-example) ---
    const leftnessOf = (j) => j.from.si + j.to.si;
    const throughSlice = (j, si) => j.from.si < si && si < j.to.si;
    function bandConflicts(a, b) {
      if (throughSlice(a, b.to.si) || throughSlice(b, a.to.si)) return true;
      if (throughSlice(a, b.from.si) || throughSlice(b, a.from.si)) return true;
      return false;
    }

    const bandOf = new Map();
    const bandMembers = [];
    let leftnessFloor = 0;
    [...cross]
      .sort(
        (a, b) =>
          leftnessOf(a) - leftnessOf(b) ||
          a.from.si - b.from.si ||
          a.to.si - b.to.si ||
          a.id - b.id
      )
      .forEach((j) => {
        let placed = false;
        for (let b = leftnessFloor; b < bandMembers.length; b++) {
          if (bandMembers[b].every((o) => !bandConflicts(j, o))) {
            bandMembers[b].push(j);
            bandOf.set(j.id, b);
            leftnessFloor = b;
            placed = true;
            break;
          }
        }
        if (!placed) {
          leftnessFloor = bandMembers.length;
          bandOf.set(j.id, leftnessFloor);
          bandMembers.push([j]);
        }
      });
    const nBands = bandMembers.length;
    const middleTiles = Math.max(3, nBands + 2);
    const middleH = middleTiles * TILE;

    middles.forEach((m) => {
      m.style.height = middleH + 'px';
      m.innerHTML = '';
    });
    connectorCells.forEach((cell) => {
      cell.style.minHeight = middleH + 'px';
    });

    const outFrom = Array.from({ length: sliceCount }, () => []);
    const inTo = Array.from({ length: sliceCount }, () => []);
    for (const j of cross) {
      outFrom[j.from.si].push(j);
      inTo[j.to.si].push(j);
    }
    const byLeftness = (a, b) =>
      leftnessOf(a) - leftnessOf(b) || a.from.si - b.from.si || a.id - b.id;
    outFrom.forEach((list) => list.sort(byLeftness));
    inTo.forEach((list) => list.sort(byLeftness));

    function bandYs() {
      const stubY = middleH - TILE;
      const bands = [];
      for (let b = 0; b < nBands; b++) {
        bands[b] = middleH - TILE * (nBands - b + 1);
      }
      return { stubY, bands };
    }

    function tagJoins(el, joinIds) {
      if (!joinIds || !joinIds.length) return;
      el.dataset.joinIds = joinIds.join(',');
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

    function markProps(card, names) {
      if (!card || !names.length) return;
      const want = new Set(names);
      card.querySelectorAll('.props > div').forEach((row) => {
        const dt = row.querySelector('dt');
        if (dt && want.has(dt.textContent.trim())) row.classList.add('prop-hot');
      });
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

    function bindConnectorHover(el) {
      if (!el.dataset.joinIds) return;
      if (el._joinHover) {
        el.removeEventListener('mouseenter', el._joinHover.enter);
        el.removeEventListener('mouseleave', el._joinHover.leave);
      }
      const enter = () => {
        if (el.classList.contains('hop')) {
          highlightByJoinIds(el.dataset.hJoinIds || el.dataset.joinIds);
          return;
        }
        highlightByJoinIds(el.dataset.joinIds);
      };
      const leave = () => clearConnectionHighlight();
      el._joinHover = { enter, leave };
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
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

    // Tag CSS corridors so hover lights the whole SCR↔COM↔EVT / RMO↔SCR path.
    function bindCssCorridors() {
      local.forEach((j) => {
        const si = j.cellSi;
        const pieces = [
          ...emd.querySelectorAll(
            `.cell.uba[data-slc="${si}"] .gap .shaft, .cell.uba[data-slc="${si}"] .gap .tile`
          ),
        ];
        const mba = emd.querySelector(`.cell.mba[data-slc="${si}"]`);
        if (mba) {
          pieces.push(
            ...mba.querySelectorAll(':scope > .gap .shaft, :scope > .gap .tile')
          );
        }
        const lbaCells = emd.querySelectorAll(`.cell.lba[data-slc="${si}"]`);
        lbaCells.forEach((lba) => {
          pieces.push(...lba.querySelectorAll('.gap .shaft, .gap .tile'));
        });
        tagCorridorPieces(pieces, [j.id]);
      });
      cross.forEach((j) => {
        const si = j.toSi;
        const pieces = [
          ...emd.querySelectorAll(
            `.cell.uba[data-slc="${si}"] .gap .shaft, .cell.uba[data-slc="${si}"] .gap .tile`
          ),
        ];
        const mba = emd.querySelector(`.cell.mba[data-slc="${si}"]`);
        if (mba) {
          const gaps = [...mba.querySelectorAll(':scope > .gap')];
          if (gaps[0]) pieces.push(...gaps[0].querySelectorAll('.shaft, .tile'));
        }
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
      if (el.classList.contains('scr')) {
        const si = sliceOf(el);
        const localsAt = local.filter((j) => j.cellSi === si);
        if (localsAt.length) return localsAt;
        const rmo = emd.querySelector(`.cell.mba[data-slc="${si}"] .rmo`);
        if (rmo) return joins.filter((j) => j.toId === rmo.id);
        return [];
      }
      return joins.filter((j) => j.fromId === el.id || j.toId === el.id);
    }

    // Card hover — SCR/COM/EVT/RMO: related path stays lit; everything else fades.
    emd
      .querySelectorAll('article.scr, article.com, article.rmo, article.evt, article.err')
      .forEach((el) => {
        if (el._joinHover) {
          el.removeEventListener('mouseenter', el._joinHover.enter);
          el.removeEventListener('mouseleave', el._joinHover.leave);
        }
        const enter = () => {
          clearConnectionHighlight();
          const related = relatedJoinsFor(el);
          if (related.length) {
            applyJoinHighlight(new Set(related.map((j) => String(j.id))));
            return;
          }
          emd.classList.add('path-focus');
          markEndpoint(el);
        };
        const leave = () => clearConnectionHighlight();
        el._joinHover = { enter, leave };
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
      });

    // MAP hover — light the join and the mapped property rows on each side.
    emd.querySelectorAll('.mba > .map').forEach((el) => {
      if (el._joinHover) {
        el.removeEventListener('mouseenter', el._joinHover.enter);
        el.removeEventListener('mouseleave', el._joinHover.leave);
      }
      const enter = () => highlightMap(el);
      const leave = () => clearConnectionHighlight();
      el._joinHover = { enter, leave };
      el.style.cursor = 'pointer';
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
    });

    requestAnimationFrame(() => {
      const { stubY, bands } = bandYs();

      for (let si = 0; si < sliceCount; si++) {
        const middle = middles[si];
        const w = middle.clientWidth;
        // Prefer CSS COM corridor x when present.
        const cellSi = sliceOf(connectorCells[si]);
        const arr = emd.querySelector(`.cell.mba[data-slc="${cellSi}"] .gap .arr.v`);
        let cx;
        if (arr) {
          const mr = middle.getBoundingClientRect();
          const ar = arr.getBoundingClientRect();
          cx = ar.left - mr.left;
        } else {
          cx = (w - TILE) / 2;
        }

        const hasVert = vertical[si] !== null;
        const outBase = hasVert ? 1 : 0;
        const outXs = outFrom[si].map((_, oi) => cx + TILE * (oi + outBase));
        const nIn = inTo[si].length;
        const inStart = cx - ((nIn - 1) * TILE) / 2;
        const inXs = inTo[si].map((_, ii) => inStart + TILE * ii);

        const throughByBand = new Map();
        for (const j of cross) {
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

        const localJoinIds = local
          .filter((j) => j.from.si === si)
          .map((j) => j.id);

        function vJoinIdsAt(x) {
          const ids = [];
          if (hasVert && Math.abs(x - cx) < 0.5) ids.push(...localJoinIds);
          outFrom[si].forEach((j, oi) => {
            if (Math.abs(outXs[oi] - x) < 0.5) ids.push(j.id);
          });
          inTo[si].forEach((j, ii) => {
            if (Math.abs(inXs[ii] - x) < 0.5) ids.push(j.id);
          });
          return ids;
        }

        // Write shaft through the middle (arrow-down stays in CSS LBA).
        if (hasVert) {
          placeShaftVHopped(middle, cx, 0, stubY + TILE, hopYsAt(cx), localJoinIds);
        }

        // Outbound projections from events
        outFrom[si].forEach((j, oi) => {
          const band = bandOf.get(j.id);
          const y = bands[band];
          const ox = outXs[oi];
          const ids = [j.id];
          const hops = new Set(hopYsAt(ox));
          const mr = middle.getBoundingClientRect();
          const evtTop = j.fromEl.getBoundingClientRect().top - mr.top;

          // LBA: event top up to stub row
          if (evtTop > stubY + TILE) {
            placeShaftV(middle, ox, stubY + TILE, evtTop - (stubY + TILE), ids);
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

        // Inbound rises into RMOs
        inTo[si].forEach((j, ii) => {
          const band = bandOf.get(j.id);
          const y = bands[band];
          const ax = inXs[ii];
          const ids = [j.id];
          const hops = hopYsAt(ax);
          const mr = middle.getBoundingClientRect();
          const rmoBottom = j.toEl.getBoundingClientRect().bottom - mr.top;

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

          // Rise from elbow to arrow under RMO (may be above middle, y < 0).
          if (y > rmoBottom + TILE) {
            placeShaftVHopped(middle, ax, rmoBottom + TILE, y, hops, ids);
          }
          placeTile(middle, 'arrow-up', ax, rmoBottom, ids);
        });
      }
    });
  }

  function boot() {
    document.querySelectorAll('main.emd[data-joins]').forEach((emd) => {
      let timer = 0;
      const run = () => {
        clearTimeout(timer);
        timer = setTimeout(() => drawJoins(emd), 40);
      };
      drawJoins(emd);
      window.addEventListener('resize', run);
      window.addEventListener('emd:retile', run);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
      const ro = new ResizeObserver(run);
      ro.observe(emd.querySelector('.board') || emd);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
