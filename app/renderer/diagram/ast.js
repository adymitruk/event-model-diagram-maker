/**
 * AST export — Settings → AST downloads EMD.md for the current board.
 * An EMD is an AST; the board is its HTML rendering. This walks the live
 * DOM and rebuilds the markdown notation from event-modeling-instructions.md.
 */
(function () {
  function text(el) {
    return el ? String(el.textContent || "").replace(/\s+/g, " ").trim() : "";
  }

  function laneLabel(lane) {
    if (!lane) return "";
    const chip = lane.querySelector(":scope > .lane-label, :scope > .lba-head-label");
    if (chip) return text(chip);
    return text(lane);
  }

  function cardTitle(article) {
    const h2 = article && article.querySelector(":scope > h2");
    if (!h2) return "";
    const clone = h2.cloneNode(true);
    clone
      .querySelectorAll(
        "button, .emd-edit-x, .emd-rmo-hist, [contenteditable], .emd-edit-part"
      )
      .forEach((n) => n.remove());
    return text(clone);
  }

  function kindOf(article) {
    if (!article || !article.classList) return "";
    for (const k of ["scr", "pro", "com", "rmo", "evt", "err"]) {
      if (article.classList.contains(k)) return k;
    }
    return "";
  }

  function prefix(kind) {
    return kind ? kind.toUpperCase() : "";
  }

  function propPairs(card) {
    const out = [];
    if (!card) return out;
    card.querySelectorAll(":scope > .props > div, :scope > dl.props > div").forEach((row) => {
      const dt = row.querySelector(":scope > dt");
      const dd = row.querySelector(":scope > dd");
      if (!dt) return;
      out.push({ name: text(dt), value: dd ? text(dd) : "" });
    });
    return out;
  }

  function collections(card) {
    const tables = [
      ...card.querySelectorAll(":scope > .props > table.collection, :scope > div.props > table.collection"),
    ];
    return tables.map((table) => {
      const caption = text(table.querySelector(":scope > caption")) || "";
      const headers = [...table.querySelectorAll(":scope > thead th")].map((th) => text(th)).filter(Boolean);
      const rows = [...table.querySelectorAll(":scope > tbody > tr")].map((tr) =>
        [...tr.querySelectorAll(":scope > td")].map((td) => {
          const name = (td.getAttribute("data-prop") || "").trim() || text(td);
          return { name: (td.getAttribute("data-prop") || "").trim(), value: text(td) };
        })
      );
      return { caption, headers, rows };
    });
  }

  function formatPropsInline(pairs) {
    if (!pairs.length) return "";
    return pairs.map((p) => p.name + " = " + p.value).join(", ");
  }

  function formatSchemaNames(card) {
    const pairs = propPairs(card);
    if (pairs.length) return pairs.map((p) => p.name).join(", ");
    const cols = collections(card);
    if (!cols.length) return "";
    if (cols.length === 1) {
      return "[" + cols[0].headers.join(", ") + "]";
    }
    return cols
      .map((c) => {
        const name = c.caption || "collection";
        return name + " [" + c.headers.join(", ") + "]";
      })
      .join("; ");
  }

  function mapsNear(card) {
    if (!card || !card.parentElement) return [];
    return [...card.parentElement.querySelectorAll(":scope > p.map, :scope > .map")].map((p) =>
      text(p)
    );
  }

  function parseMap(raw) {
    // "Name: a, b → c" or "Name: a → b"
    const m = raw.match(/^([^:]+):\s*(.+?)\s*→\s*(.+)$/);
    if (!m) return { raw, name: raw, inputs: "", outputs: "" };
    return { raw, name: m[1].trim(), inputs: m[2].trim(), outputs: m[3].trim() };
  }

  function scrLines(scr, usrName) {
    const lines = [];
    const title = cardTitle(scr);
    const who = usrName ? " (" + usrName.replace(/\s*\(.*$/, "").trim() + ")" : "";
    lines.push("- SCR " + title + who + ":");
    const wire = scr.querySelector(".wire");
    if (!wire) return lines;
    const areas = [...wire.querySelectorAll(":scope fieldset.area")];
    if (areas.length) {
      areas.forEach((area) => {
        const legend = text(area.querySelector(":scope > legend")) || "area";
        const bits = [];
        area.querySelectorAll("label, button, td[data-prop]").forEach((el) => {
          if (el.tagName === "BUTTON") {
            bits.push("button " + text(el));
            return;
          }
          if (el.tagName === "LABEL") {
            const input = el.querySelector("input, select, textarea");
            const prop = (input && input.getAttribute("data-prop")) || "";
            const val = input
              ? String(input.value || "").trim()
              : "";
            const labelBits = text(el);
            const label = (prop
              ? labelBits.replace(new RegExp("\\b" + prop + "\\b", "i"), "").trim()
              : labelBits) || prop || "field";
            bits.push(
              label +
                (prop ? " (" + prop + ")" : "") +
                (val !== "" ? " = " + val : "")
            );
            return;
          }
          if (el.matches && el.matches("td[data-prop]")) {
            const prop = el.getAttribute("data-prop") || "";
            bits.push((prop || "field") + (text(el) !== "" ? " = " + text(el) : ""));
          }
        });
        lines.push("  - area " + legend + ": " + (bits.length ? bits.join("; ") : "(empty)"));
      });
      return lines;
    }
    // Flat wire: dump data-prop sites and buttons.
    const bits = [];
    wire.querySelectorAll("[data-prop], button").forEach((el) => {
      if (el.tagName === "BUTTON") {
        bits.push("button " + text(el));
        return;
      }
      const prop = el.getAttribute("data-prop") || "";
      const val =
        el.matches("input, select, textarea")
          ? String(el.value || "").trim()
          : text(el);
      bits.push(prop + (val !== "" ? " = " + val : ""));
    });
    if (bits.length) lines.push("  - " + bits.join("; "));
    return lines;
  }

  function cardPropLine(kind, card, svcOrUsr) {
    const title = cardTitle(card);
    const head = "- " + prefix(kind) + " " + title;
    const side = svcOrUsr ? " (" + svcOrUsr + ")" : "";
    const pairs = propPairs(card);
    const cols = collections(card);
    if (cols.length) {
      const body = cols
        .map((c) => {
          const name = c.caption ? c.caption + " " : "";
          if (!c.rows.length) {
            return name + "(empty) [" + c.headers.join(", ") + "]";
          }
          const rowText = c.rows
            .map((row) =>
              row
                .map((cell, i) => {
                  const n = cell.name || c.headers[i] || "";
                  return n + " = " + cell.value;
                })
                .join(", ")
            )
            .join("; ");
          return name + rowText;
        })
        .join("; ");
      return head + side + ": " + body;
    }
    if (pairs.length) return head + side + ": " + formatPropsInline(pairs);
    return head + side;
  }

  function gwtLines(cell) {
    const lines = [];
    if (!cell) return lines;
    const timelines = [...cell.querySelectorAll(":scope > .timeline, :scope .timeline")];
    if (!timelines.length) {
      // Bare stacked cards without .timeline wrapper.
      const cards = [...cell.querySelectorAll(":scope > article")];
      if (!cards.length) return lines;
      lines.push("- GWT timeline:");
      cards.forEach((card) => {
        const k = kindOf(card);
        lines.push("  " + cardPropLine(k, card, "").replace(/^- /, "- "));
      });
      return lines;
    }
    timelines.forEach((tl, i) => {
      const isEmd = tl.classList.contains("emd-gwt");
      const id = tl.id || "";
      const label = isEmd
        ? "EMD GWT timeline" + (id ? " (" + id + ")" : "")
        : timelines.length > 1
          ? "GWT timeline " + String.fromCharCode(65 + i)
          : "GWT timeline";
      lines.push("- " + label + ":");
      [...tl.querySelectorAll(":scope > article")].forEach((card) => {
        const k = kindOf(card);
        lines.push("  " + cardPropLine(k, card, "").replace(/^- /, "- "));
      });
    });
    return lines;
  }

  function byId(root, id) {
    if (!id) return null;
    try {
      return root.querySelector("#" + CSS.escape(id));
    } catch (_) {
      return document.getElementById(id);
    }
  }

  function sliceOf(el) {
    const cell = el && el.closest("[data-slc]");
    return cell ? parseInt(cell.getAttribute("data-slc"), 10) : 0;
  }

  function buildAst(root) {
    const board = root.querySelector(".board") || root;
    const sliceCount = Math.max(
      0,
      parseInt(
        (root.style && root.style.getPropertyValue("--slices")) ||
          getComputedStyle(root).getPropertyValue("--slices") ||
          "0",
        10
      ) || 0
    );
    const slices = sliceCount || Math.max(
      0,
      ...[...board.querySelectorAll("[data-slc]")].map((el) => parseInt(el.getAttribute("data-slc"), 10) || 0)
    );

    // USRs: UBA lanes (have .uba siblings / lane text with role).
    const usrs = [];
    const svcs = [];
    [...board.children].forEach((cell) => {
      if (!cell.classList.contains("lane") || !cell.classList.contains("open")) return;
      if (cell.classList.contains("emd-corner")) return;
      const label = laneLabel(cell);
      if (!label || label === "GWT") return;
      // Peek next sibling class to know band.
      let next = cell.nextElementSibling;
      while (next && next.classList.contains("lane")) next = next.nextElementSibling;
      if (!next) return;
      if (next.classList.contains("uba")) usrs.push(label);
      else if (next.classList.contains("lba")) {
        if (!svcs.includes(label)) svcs.push(label);
      }
    });

    // WFLs
    const wfls = [...board.querySelectorAll(":scope > .wfl")].map((w, i) => {
      const start = parseInt(w.getAttribute("data-slc"), 10) || 1;
      const span = parseInt(w.getAttribute("data-span"), 10) || 1;
      return {
        n: i + 1,
        goal: text(w.querySelector("span") || w),
        start,
        end: start + span - 1,
      };
    });

    function wflFor(slc) {
      return wfls.find((w) => slc >= w.start && slc <= w.end) || null;
    }

    // Index cards per slice (MBA / LBA / UBA only — not GWT copies).
    const mbaBySlc = {};
    const lbaBySlc = {};
    const ubaBySlc = {};
    for (let s = 1; s <= slices; s++) {
      mbaBySlc[s] = [];
      lbaBySlc[s] = [];
      ubaBySlc[s] = [];
    }
    board.querySelectorAll(":scope > .mba[data-slc]").forEach((cell) => {
      const s = parseInt(cell.getAttribute("data-slc"), 10);
      cell.querySelectorAll(":scope > article").forEach((a) => mbaBySlc[s].push(a));
    });
    board.querySelectorAll(":scope > .lba[data-slc]").forEach((cell) => {
      const s = parseInt(cell.getAttribute("data-slc"), 10);
      const lane = cell.getAttribute("data-lane") || "";
      cell.querySelectorAll(":scope > article").forEach((a) => {
        a._emdSvcLane = lane;
        lbaBySlc[s].push(a);
      });
    });
    board.querySelectorAll(":scope > .uba[data-slc]").forEach((cell) => {
      const s = parseInt(cell.getAttribute("data-slc"), 10);
      const lane = cell.getAttribute("data-lane") || "";
      // Match USR display name for this lane.
      let usr = usrs.find((u) => u.toLowerCase().startsWith(lane.replace(/-/g, " "))) || "";
      if (!usr) {
        // Fallback: find UBA lane row whose data-lane matches via first uba of that lane.
        usr = usrs.find((u) => {
          const name = u.replace(/\s*\(.*$/, "").trim().toLowerCase().replace(/\s+/g, "-");
          return name === lane;
        }) || "";
      }
      cell.querySelectorAll(":scope > article").forEach((a) => {
        a._emdUsr = usr;
        ubaBySlc[s].push(a);
      });
    });

    function svcNameForEvt(card) {
      const lane = card._emdSvcLane || "";
      if (!lane) return svcs[0] || "";
      const hit = svcs.find((s) => s.toLowerCase().replace(/\s+/g, "-") === lane);
      return hit || lane;
    }

    // Catalog keyed by title (first appearance).
    const comCatalog = new Map();
    const evtCatalog = new Map();
    const rmoCatalog = new Map();
    const errCatalog = new Map();
    const mapCatalog = [];

    for (let s = 1; s <= slices; s++) {
      mbaBySlc[s].forEach((card) => {
        const k = kindOf(card);
        const title = cardTitle(card);
        if (k === "com" && !comCatalog.has(title)) {
          const from =
            ubaBySlc[s].find((a) => kindOf(a) === "scr" || kindOf(a) === "pro") || null;
          const to =
            lbaBySlc[s].find((a) => kindOf(a) === "evt") ||
            lbaBySlc[s].find((a) => kindOf(a) === "err") ||
            null;
          comCatalog.set(title, {
            title,
            props: formatSchemaNames(card),
            from: from ? prefix(kindOf(from)) + " " + cardTitle(from) : "",
            to: to ? prefix(kindOf(to)) + " " + cardTitle(to) : "",
            fails: "",
            card,
          });
          mapsNear(card).forEach((raw) => {
            const m = parseMap(raw);
            mapCatalog.push({
              ...m,
              on:
                "COM " +
                title +
                " → " +
                (to ? prefix(kindOf(to)) + " " + cardTitle(to) : "?") +
                " (SLC" +
                s +
                ")",
            });
          });
        }
        if (k === "rmo" && !rmoCatalog.has(title)) {
          const schema = formatSchemaNames(card);
          const isColl = schema.includes("[");
          rmoCatalog.set(title, {
            title,
            props: isColl ? "" : schema,
            collections: isColl ? schema : "",
            from: [],
            to: "",
            svc: svcs[0] || "",
            card,
          });
          mapsNear(card).forEach((raw) => {
            const m = parseMap(raw);
            mapCatalog.push({
              ...m,
              on: "→ RMO " + title + " (SLC" + s + ")",
            });
          });
        }
      });
      lbaBySlc[s].forEach((card) => {
        const k = kindOf(card);
        const title = cardTitle(card);
        if (k === "evt" && !evtCatalog.has(title)) {
          const fromCom = mbaBySlc[s].find((a) => kindOf(a) === "com");
          evtCatalog.set(title, {
            title,
            svc: svcNameForEvt(card),
            props: formatSchemaNames(card),
            from: fromCom ? "COM " + cardTitle(fromCom) : "",
            to: [],
            card,
          });
        }
        if (k === "err" && !errCatalog.has(title)) {
          const fromCom = mbaBySlc[s].find((a) => kindOf(a) === "com");
          errCatalog.set(title, {
            title,
            on: fromCom ? "COM " + cardTitle(fromCom) + " (SLC" + s + ")" : "SLC" + s,
            to: "",
            card,
            slc: s,
          });
          if (fromCom && comCatalog.has(cardTitle(fromCom))) {
            // filled after joins
          }
        }
      });
    }

    // Joins
    const joinsRaw = (root.getAttribute("data-joins") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const arrows = [];
    joinsRaw.forEach((pair) => {
      const [fromId, toId] = pair.split(":").map((s) => s.trim());
      if (!fromId || !toId) return;
      const fromEl = byId(root, fromId);
      const toEl = byId(root, toId);
      if (!fromEl || !toEl) return;
      const fk = kindOf(fromEl);
      const tk = kindOf(toEl);
      const fs = sliceOf(fromEl);
      const ts = sliceOf(toEl);
      const line =
        prefix(fk) +
        " " +
        cardTitle(fromEl) +
        " (SLC" +
        fs +
        ") → " +
        prefix(tk) +
        " " +
        cardTitle(toEl) +
        " (SLC" +
        ts +
        ")";
      arrows.push({ line, fk, tk, fromEl, toEl, fs, ts });

      if (fk === "evt" && tk === "rmo") {
        const et = cardTitle(fromEl);
        const rt = cardTitle(toEl);
        if (evtCatalog.has(et)) {
          const list = evtCatalog.get(et).to;
          const label = "RMO " + rt;
          if (!list.includes(label)) list.push(label);
        }
        if (rmoCatalog.has(rt)) {
          const list = rmoCatalog.get(rt).from;
          const label = "EVT " + et;
          if (!list.includes(label)) list.push(label);
        }
      }
      if (fk === "rmo" && tk === "scr") {
        const rt = cardTitle(fromEl);
        if (rmoCatalog.has(rt)) {
          rmoCatalog.get(rt).to = "SCR " + cardTitle(toEl);
        }
      }
      if (fk === "err" && tk === "scr") {
        const et = cardTitle(fromEl);
        if (errCatalog.has(et)) {
          errCatalog.get(et).to = "SCR " + cardTitle(toEl) + " (SLC" + ts + ")";
        }
        // Attach fails to COM of that ERR's slice.
        const errMeta = errCatalog.get(et);
        if (errMeta) {
          const com = mbaBySlc[errMeta.slc] && mbaBySlc[errMeta.slc].find((a) => kindOf(a) === "com");
          if (com && comCatalog.has(cardTitle(com))) {
            const c = comCatalog.get(cardTitle(com));
            const fail =
              "ERR " + et + " → SCR " + cardTitle(toEl);
            c.fails = c.fails ? c.fails + "; " + fail : fail;
          }
        }
      }
    });

    // RMO → same-slice SCR as catalog to when missing.
    rmoCatalog.forEach((meta) => {
      if (meta.to) return;
      for (let s = 1; s <= slices; s++) {
        const hit = mbaBySlc[s].find((a) => kindOf(a) === "rmo" && cardTitle(a) === meta.title);
        if (!hit) continue;
        const scr = ubaBySlc[s].find((a) => kindOf(a) === "scr" || kindOf(a) === "pro");
        if (scr) {
          meta.to = prefix(kindOf(scr)) + " " + cardTitle(scr);
          break;
        }
      }
    });

    // Fill evt to: none
    evtCatalog.forEach((meta) => {
      if (!meta.to.length) meta.to = ["none"];
    });

    // Slice types
    const comSlices = [];
    const rmoSlices = [];
    const navSlices = [];
    for (let s = 1; s <= slices; s++) {
      const hasCom = mbaBySlc[s].some((a) => kindOf(a) === "com");
      const hasRmo = mbaBySlc[s].some((a) => kindOf(a) === "rmo");
      const hasErr = lbaBySlc[s].some((a) => kindOf(a) === "err");
      if (hasCom) comSlices.push(hasErr ? "SLC" + s + " (ERR)" : "SLC" + s);
      else if (hasRmo) rmoSlices.push("SLC" + s);
      else navSlices.push("SLC" + s);
    }

    const title =
      text(document.querySelector("title")) ||
      (wfls[0] && wfls[0].goal) ||
      "EMD";

    const out = [];
    out.push("# EMD: " + title);
    out.push("");
    out.push("**USRs:** " + (usrs.length ? usrs.join(", ") : "(none)"));
    out.push("**SVCs:** " + (svcs.length ? svcs.join(", ") : "(none)"));
    out.push("");

    out.push("**COMs:**");
    if (!comCatalog.size) out.push("(none)");
    comCatalog.forEach((c) => {
      out.push("- COM " + c.title);
      out.push("  - properties: " + (c.props || "(none)"));
      if (c.from) out.push("  - from: " + c.from);
      if (c.to) out.push("  - to: " + c.to);
      if (c.fails) out.push("  - fails: " + c.fails);
    });

    out.push("**EVTs:**");
    if (!evtCatalog.size) out.push("(none)");
    evtCatalog.forEach((e) => {
      out.push("- EVT " + e.title + " (" + e.svc + ")");
      out.push("  - properties: " + (e.props || "(none)"));
      if (e.from) out.push("  - from: " + e.from);
      out.push("  - to: " + e.to.join(", "));
    });

    out.push("**RMOs:**");
    if (!rmoCatalog.size) out.push("(none)");
    rmoCatalog.forEach((r) => {
      out.push("- RMO " + r.title + (r.svc ? " (" + r.svc + ")" : ""));
      if (r.collections) out.push("  - collections: " + r.collections);
      else out.push("  - properties: " + (r.props || "(none)"));
      out.push("  - from: " + (r.from.length ? r.from.join(", ") : "none"));
      if (r.to) out.push("  - to: " + r.to);
    });

    out.push("");
    out.push("**WFLs:**");
    if (!wfls.length) out.push("(none)");
    wfls.forEach((w) => {
      out.push(
        "- WFL" + w.n + " " + w.goal + ": SLC" + w.start + "–SLC" + w.end
      );
    });

    out.push("");
    out.push("**MAPs:**");
    if (!mapCatalog.length) out.push("(none)");
    else {
      mapCatalog.forEach((m) => {
        out.push(
          "- MAP " + m.name + ": " + m.inputs + " → " + m.outputs + ", on " + m.on
        );
      });
    }

    out.push("");
    out.push("**ERRs:**");
    if (!errCatalog.size) out.push("(none)");
    else {
      errCatalog.forEach((e) => {
        out.push(
          "- ERR " + e.title + ", on " + e.on + (e.to ? " → " + e.to : "")
        );
      });
    }

    // Diagram table
    out.push("");
    out.push("**Diagram:**");
    out.push("");
    const header = ["| |"].concat(
      Array.from({ length: slices }, (_, i) => " SLC" + (i + 1) + " |")
    );
    out.push(header.join(""));
    out.push(
      "|" +
        Array.from({ length: slices + 1 }, () => "---").join("|") +
        "|"
    );

    // WFL row
    const wflRow = ["| **WFL** |"];
    for (let s = 1; s <= slices; s++) {
      const w = wflFor(s);
      if (!w) {
        wflRow.push(" |");
        continue;
      }
      if (s === w.start) wflRow.push(" WFL" + w.n + " " + w.goal + " |");
      else wflRow.push(" WFL" + w.n + " |");
    }
    out.push(wflRow.join(""));

    usrs.forEach((usr) => {
      const laneKey = usr
        .replace(/\s*\(.*$/, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
      const row = ["| **UBA: " + usr + "** |"];
      for (let s = 1; s <= slices; s++) {
        const cards = ubaBySlc[s].filter((a) => {
          const u = a._emdUsr || "";
          const key = u
            .replace(/\s*\(.*$/, "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");
          return key === laneKey || !u;
        });
        // Prefer cards whose lane matches; if _emdUsr empty, check cell data-lane.
        const cellCards = [
          ...board.querySelectorAll(
            ':scope > .uba[data-slc="' + s + '"][data-lane="' + laneKey + '"] > article'
          ),
        ];
        const use = cellCards.length ? cellCards : cards.filter((a) => (a._emdUsr || "") === usr);
        if (!use.length) {
          row.push(" |");
          continue;
        }
        row.push(
          " " +
            use.map((a) => prefix(kindOf(a)) + " " + cardTitle(a)).join(", ") +
            " |"
        );
      }
      out.push(row.join(""));
    });

    const mbaRow = ["| **MBA** |"];
    for (let s = 1; s <= slices; s++) {
      const cards = mbaBySlc[s];
      if (!cards.length) {
        mbaRow.push(" |");
        continue;
      }
      const maps = cards.flatMap((c) => mapsNear(c).map((m) => "MAP " + parseMap(m).name));
      mbaRow.push(
        " " +
          cards.map((a) => prefix(kindOf(a)) + " " + cardTitle(a)).join(", ") +
          (maps.length ? " ← " + maps.join(", ") : "") +
          " |"
      );
    }
    out.push(mbaRow.join(""));

    svcs.forEach((svc) => {
      const laneKey = svc.toLowerCase().replace(/\s+/g, "-");
      const row = ["| **LBA: " + svc + "** |"];
      for (let s = 1; s <= slices; s++) {
        const cellCards = [
          ...board.querySelectorAll(
            ':scope > .lba[data-slc="' + s + '"][data-lane="' + laneKey + '"] > article'
          ),
        ];
        if (!cellCards.length) {
          row.push(" |");
          continue;
        }
        row.push(
          " " +
            cellCards.map((a) => prefix(kindOf(a)) + " " + cardTitle(a)).join(", ") +
            " |"
        );
      }
      out.push(row.join(""));
    });

    const gwtRow = ["| **GWT** |"];
    for (let s = 1; s <= slices; s++) {
      const cell = board.querySelector(':scope > .gwt[data-slc="' + s + '"]');
      const has = cell && cell.querySelector("article");
      gwtRow.push(has ? " yes |" : " |");
    }
    out.push(gwtRow.join(""));

    out.push("");
    out.push("**Slice types:**");
    if (comSlices.length) out.push("- COM slices: " + comSlices.join(", "));
    if (rmoSlices.length) out.push("- RMO slices: " + rmoSlices.join(", "));
    if (navSlices.length) out.push("- NAV slices: " + navSlices.join(", "));

    out.push("");
    out.push("**Arrows between SLCs:**");
    if (!arrows.length) out.push("(none)");
    else arrows.forEach((a) => out.push("- " + a.line));

    out.push("");
    out.push("**Properties:**");
    out.push("");

    wfls.forEach((w) => {
      out.push("**WFL" + w.n + " " + w.goal + " (SLC" + w.start + "–SLC" + w.end + ")**");
      out.push("");
      for (let s = w.start; s <= w.end; s++) {
        const hasCom = mbaBySlc[s].some((a) => kindOf(a) === "com");
        const hasRmo = mbaBySlc[s].some((a) => kindOf(a) === "rmo");
        const hasErr = lbaBySlc[s].some((a) => kindOf(a) === "err");
        const kind = hasCom
          ? hasErr
            ? "COM slice, ERR"
            : "COM slice"
          : hasRmo
            ? "RMO slice"
            : "NAV slice";
        out.push("**SLC" + s + " (" + kind + ")**");
        ubaBySlc[s].forEach((a) => {
          const k = kindOf(a);
          if (k === "scr") {
            scrLines(a, a._emdUsr || "").forEach((line) => out.push(line));
          } else if (k === "pro") {
            out.push("- PRO " + cardTitle(a) + (a._emdUsr ? " (" + a._emdUsr.replace(/\s*\(.*$/, "").trim() + ")" : ""));
          }
        });
        mbaBySlc[s].forEach((a) => {
          const k = kindOf(a);
          out.push(cardPropLine(k, a, k === "rmo" ? svcs[0] || "" : ""));
          mapsNear(a).forEach((raw) => {
            const m = parseMap(raw);
            out.push("  - MAP " + m.name + ": " + m.inputs + " → " + m.outputs);
          });
        });
        lbaBySlc[s].forEach((a) => {
          const k = kindOf(a);
          out.push(cardPropLine(k, a, k === "evt" || k === "err" ? svcNameForEvt(a) : ""));
        });
        const gwtCell = board.querySelector(':scope > .gwt[data-slc="' + s + '"]');
        gwtLines(gwtCell).forEach((line) => out.push(line));
        out.push("");
      }
    });

    // Orphan slices (no WFL)
    const covered = new Set();
    wfls.forEach((w) => {
      for (let s = w.start; s <= w.end; s++) covered.add(s);
    });
    const orphans = [];
    for (let s = 1; s <= slices; s++) if (!covered.has(s)) orphans.push(s);
    if (orphans.length) {
      out.push("**(unassigned slices)**");
      out.push("");
      orphans.forEach((s) => {
        out.push("**SLC" + s + "**");
        ubaBySlc[s].forEach((a) => {
          if (kindOf(a) === "scr") scrLines(a, a._emdUsr || "").forEach((l) => out.push(l));
          else out.push(cardPropLine(kindOf(a), a, ""));
        });
        mbaBySlc[s].forEach((a) => out.push(cardPropLine(kindOf(a), a, "")));
        lbaBySlc[s].forEach((a) =>
          out.push(cardPropLine(kindOf(a), a, svcNameForEvt(a)))
        );
        out.push("");
      });
    }

    return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
  }

  function downloadAst() {
    const root = document.querySelector("main.emd");
    if (!root) return;
    // Prefer a clean board: temporarily strip edit chrome if the helper exists.
    const board = root.querySelector(".board");
    if (board && window.emdEdit && typeof window.emdEdit.stripEditChrome === "function") {
      window.emdEdit.stripEditChrome(board);
    }
    const md = buildAst(root);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EMD.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function ensureButton(pop) {
    if (document.getElementById("emd-ast-btn")) return;
    const row = document.createElement("div");
    row.className = "emd-settings-actions";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "emd-ast-btn";
    btn.className = "emd-settings-action";
    btn.title = "Download EMD.md (AST) for this board";
    btn.textContent = "AST";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadAst();
    });
    row.appendChild(btn);
    // Place above Modules fieldset when present, else at end.
    const modules = document.getElementById("emd-modules-fieldset");
    if (modules) pop.insertBefore(row, modules);
    else pop.appendChild(row);
  }

  function whenSettings(done) {
    const pop = document.getElementById("emd-settings-pop");
    if (pop) {
      done(pop);
      return;
    }
    const observer = new MutationObserver(() => {
      const found = document.getElementById("emd-settings-pop");
      if (!found) return;
      observer.disconnect();
      done(found);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  const style = document.createElement("style");
  style.textContent =
    ".emd-settings-actions { margin: 0.85rem 0 0; display: flex; gap: 0.4rem; }" +
    ".emd-settings-action {" +
    "  flex: 1; font: 600 0.8rem/1.2 system-ui, sans-serif; padding: 0.4rem 0.55rem;" +
    "  border: 1px solid #c8c8c8; border-radius: 4px; background: #fff; cursor: pointer;" +
    "}" +
    ".emd-settings-action:hover { background: #f3f3f3; }";
  document.head.appendChild(style);

  window.emdAst = { build: buildAst, download: downloadAst };

  whenSettings((pop) => {
    ensureButton(pop);
    const gear = document.getElementById("emd-settings-btn");
    if (gear) {
      gear.addEventListener("click", () => ensureButton(pop));
    }
  });
})();
