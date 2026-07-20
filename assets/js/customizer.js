/* ============================================================
   KAS THREADZ — Design Studio (live customiser)
   Drives the real-time garment preview, pricing and order.
   ============================================================ */
(function () {
  "use strict";
  if (!window.KASGarment) return;

  /* ---------- option data ---------- */
  const TYPES = [
    { id: "kaftan",  t: "Kaftan",  d: "Flowing traditional top" },
    { id: "agbada",  t: "Agbada",  d: "Grand ceremonial robe" },
    { id: "senator", t: "Senator", d: "Tailored formal set" },
    { id: "shirt",   t: "Custom Shirt", d: "Any material, any style" }
  ];

  /* real fabric library (assets/js/fabrics.js) — the 5 material styles */
  const FABRICS = window.KAS_FABRICS || [];
  const fabById = (id) => FABRICS.find((f) => f.id === id) || FABRICS[0];
  const swatchUrl = (id) => "assets/img/fabrics/" + id + ".jpg";

  /* free colour choice — any colour on any material */
  const COLORS = [
    { hex: "#f3efe9", name: "Ivory" },
    { hex: "#e9e2d6", name: "Cream" },
    { hex: "#cabfb1", name: "Taupe" },
    { hex: "#b99a6b", name: "Gold" },
    { hex: "#8a8f7a", name: "Sage" },
    { hex: "#2f4a3d", name: "Emerald" },
    { hex: "#20364f", name: "Navy" },
    { hex: "#3a6ea5", name: "Royal" },
    { hex: "#521218", name: "Burgundy" },
    { hex: "#7a1f2b", name: "Wine" },
    { hex: "#4a3728", name: "Chocolate" },
    { hex: "#5a5560", name: "Slate" },
    { hex: "#1a1518", name: "Black" },
    { hex: "#d98c3f", name: "Amber" }
  ];

  const EMB_THREADS = [
    { hex: "#cabfb1", name: "Taupe" },
    { hex: "#c9a227", name: "Gold" },
    { hex: "#e9e2d6", name: "Cream" },
    { hex: "#521218", name: "Burgundy" },
    { hex: "#1a1518", name: "Black" },
    { hex: "#20364f", name: "Navy" },
    { hex: "#ffffff", name: "White" },
    { hex: "#2f4a3d", name: "Emerald" }
  ];

  const SLEEVES = [
    { id: "short", t: "Short", d: "" },
    { id: "elbow", t: "Elbow", d: "" },
    { id: "long",  t: "Long",  d: "" }
  ];

  const LENGTHS = [
    { id: "short", t: "Short", d: "Above the knee" },
    { id: "long",  t: "Long",  d: "Full, flowing length" }
  ];

  const EMBROIDERY = [
    { id: "none", t: "None",          d: "Plain finish" },
    { id: "flap", t: "Flap & Pocket", d: "Front placket + pocket" }
  ];

  /* studio design library (assets/js/designs.js)
     agbada garment -> agbada panels; else LD flap+pocket sets */
  const DESIGN_LIB = window.KAS_DESIGNS || { sets: [], agbada: [] };
  const designList = () =>
    state.type === "agbada" ? (DESIGN_LIB.agbada || []) : (DESIGN_LIB.sets || []);
  const designById = (id) => designList().find((d) => d.id === id) || null;
  const dImg = (name) => "assets/img/designs/" + name + ".png";

  /* ---------- pricing (₦) ---------- */
  const BASE = { kaftan: 35000, agbada: 120000, senator: 45000, shirt: 25000 };
  const EMB_ADD = { none: 0, flap: 15000 };
  const LEN_ADD = { short: 0, long: 6000 };

  const fmt = (n) => "₦" + n.toLocaleString("en-NG");
  const nameOf = (arr, id) => (arr.find((x) => x.id === id) || {}).t || id;
  const colorName = (hex) =>
    (COLORS.concat(EMB_THREADS).find((c) => c.hex.toLowerCase() === (hex || "").toLowerCase()) || {}).name || hex;

  /* ---------- state ---------- */
  const state = {
    type: "kaftan",
    fabric: (FABRICS[0] || {}).id || "express",
    color: "#e9e2d6",
    sleeve: "long", length: "short", embroidery: "flap", embColor: "#cabfb1",
    design: null,
    rot: 0                       // 3D turntable angle (deg)
  };

  const $ = (id) => document.getElementById(id);

  /* ---------- render option controls ---------- */
  function optBtn(o, selected) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opt" + (selected ? " selected" : "");
    b.dataset.id = o.id;
    b.innerHTML = `<span class="t">${o.t}</span>` + (o.d ? `<span class="d">${o.d}</span>` : "");
    return b;
  }
  function swatchBtn(c, selected) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + (selected ? " selected" : "");
    b.dataset.hex = c.hex;
    b.innerHTML = `<span class="chip" style="background:${c.hex}"></span><span class="name">${c.name}</span>`;
    return b;
  }
  function dotBtn(c, selected) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "color-dot" + (selected ? " selected" : "");
    b.dataset.hex = c.hex;
    b.title = c.name;
    b.style.background = c.hex;
    return b;
  }

  /* fabric card with a real photo thumbnail of the material style */
  function fabricBtn(fab, selected) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "fab-opt" + (selected ? " selected" : "");
    b.dataset.id = fab.id;
    b.innerHTML =
      `<span class="fab-thumb" style="background-image:url('${swatchUrl(fab.thumb)}')"></span>` +
      `<span class="fab-meta"><span class="t">${fab.name}</span>` +
      (fab.brand ? `<span class="d">${fab.brand}</span>` : "") + "</span>";
    return b;
  }

  function buildControls() {
    const tType = $("opt-type");
    TYPES.forEach((o) => tType.appendChild(optBtn(o, o.id === state.type)));

    const tFab = $("opt-fabric");
    FABRICS.forEach((o) => tFab.appendChild(fabricBtn(o, o.id === state.fabric)));

    const tColor = $("opt-color");
    COLORS.forEach((c) => tColor.appendChild(dotBtn(c, c.hex === state.color)));

    const tSleeve = $("opt-sleeve");
    SLEEVES.forEach((o) => tSleeve.appendChild(optBtn(o, o.id === state.sleeve)));

    const tLen = $("opt-length");
    LENGTHS.forEach((o) => tLen.appendChild(optBtn(o, o.id === state.length)));

    const tEmb = $("opt-embroidery");
    EMBROIDERY.forEach((o) => tEmb.appendChild(optBtn(o, o.id === state.embroidery)));

    const tThread = $("opt-embcolor");
    EMB_THREADS.forEach((c) => tThread.appendChild(dotBtn(c, c.hex === state.embColor)));

    refreshDesigns();
  }

  /* (re)build the design picker for the current garment type */
  function refreshDesigns() {
    const grid = $("opt-design");
    if (!grid) return;
    const list = designList();
    if (!designById(state.design)) state.design = list.length ? list[0].id : null;
    grid.innerHTML = "";
    list.forEach((d) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mini-d" + (d.id === state.design ? " selected" : "");
      b.dataset.id = d.id;
      b.title = d.name;
      b.innerHTML = `<img src="${dImg(d.flap || d.img)}" alt="${d.name}" loading="lazy"><span class="nm">${d.name}</span>`;
      grid.appendChild(b);
    });
    togglePicker();
  }

  function togglePicker() {
    const wrap = document.getElementById("design-picker");
    if (wrap) wrap.style.display = state.embroidery === "none" ? "none" : "";
  }

  /* ---------- selection handlers ---------- */
  function selectIn(container, matchAttr, value, cls) {
    container.querySelectorAll("." + cls).forEach((el) => {
      el.classList.toggle("selected", el.dataset[matchAttr] === value);
    });
  }

  function wire() {
    $("opt-type").addEventListener("click", (e) => {
      const b = e.target.closest(".opt"); if (!b) return;
      state.type = b.dataset.id;
      selectIn($("opt-type"), "id", state.type, "opt");
      updateSleeveAvailability();
      refreshDesigns();
      render();
    });
    $("opt-fabric").addEventListener("click", (e) => {
      const b = e.target.closest(".fab-opt"); if (!b) return;
      state.fabric = b.dataset.id;
      selectIn($("opt-fabric"), "id", state.fabric, "fab-opt");
      render();
    });
    $("opt-color").addEventListener("click", (e) => {
      const b = e.target.closest(".color-dot"); if (!b) return;
      state.color = b.dataset.hex;
      selectIn($("opt-color"), "hex", state.color, "color-dot");
      render();
    });
    $("opt-sleeve").addEventListener("click", (e) => {
      const b = e.target.closest(".opt"); if (!b || b.disabled) return;
      state.sleeve = b.dataset.id;
      selectIn($("opt-sleeve"), "id", state.sleeve, "opt");
      render();
    });
    $("opt-length").addEventListener("click", (e) => {
      const b = e.target.closest(".opt"); if (!b) return;
      state.length = b.dataset.id;
      selectIn($("opt-length"), "id", state.length, "opt");
      render();
    });
    $("opt-embroidery").addEventListener("click", (e) => {
      const b = e.target.closest(".opt"); if (!b) return;
      state.embroidery = b.dataset.id;
      selectIn($("opt-embroidery"), "id", state.embroidery, "opt");
      refreshDesigns();   // LD sets vs AF sets depend on the tier
      render();
    });
    $("opt-embcolor").addEventListener("click", (e) => {
      const b = e.target.closest(".color-dot"); if (!b) return;
      state.embColor = b.dataset.hex;
      selectIn($("opt-embcolor"), "hex", state.embColor, "color-dot");
      render();
    });
    $("opt-design").addEventListener("click", (e) => {
      const b = e.target.closest(".mini-d"); if (!b) return;
      state.design = b.dataset.id;
      $("opt-design").querySelectorAll(".mini-d").forEach((x) =>
        x.classList.toggle("selected", x.dataset.id === state.design));
      render();
    });
    $("send-wa").addEventListener("click", () => sendOrder("wa"));
    $("send-mail").addEventListener("click", () => sendOrder("mail"));

    /* 3D drag-to-rotate (works on the stage and inside the zoom lightbox) */
    function attach3D(container) {
      if (!container) return;
      let startX = 0, startRot = 0, dragging = false;
      const apply = () => {
        document.querySelectorAll(".g3d-inner").forEach((el) => {
          el.style.transform = "rotateX(-4deg) rotateY(" + state.rot + "deg)";
        });
      };
      container.addEventListener("pointerdown", (e) => {
        const g = e.target.closest(".g3d"); if (!g) return;
        dragging = true; startX = e.clientX; startRot = state.rot;
        g.classList.add("dragging");
        g.setPointerCapture && g.setPointerCapture(e.pointerId);
      });
      container.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        state.rot = startRot + (e.clientX - startX) * 0.45;
        apply();
      });
      const end = () => {
        dragging = false;
        container.querySelectorAll(".g3d").forEach((g) => g.classList.remove("dragging"));
      };
      container.addEventListener("pointerup", end);
      container.addEventListener("pointercancel", end);
      container.addEventListener("pointerleave", end);
    }
    attach3D($("preview-stage"));
    attach3D($("lb-stage"));

    /* zoom lightbox */
    const lb = $("lightbox");
    let lbScale = 1;
    const setLbScale = (s) => {
      lbScale = Math.min(3, Math.max(1, s));
      $("lb-stage").style.transform = "scale(" + lbScale + ")";
    };
    const openZoom = () => {
      /* open front-facing and centred */
      state.rot = 0;
      $("lb-stage").innerHTML = $("preview-stage").innerHTML;
      document.querySelectorAll(".g3d-inner").forEach((el) => {
        el.style.transform = "rotateX(-4deg) rotateY(0deg)";
      });
      setLbScale(1);
      $("lb-cap").textContent = nameOf(TYPES, state.type) + " · " + fabName() + " · " + colorName(state.color);
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
    };
    const closeZoom = () => { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); };
    const zBtn = $("preview-zoom");
    if (zBtn) zBtn.addEventListener("click", openZoom);
    if (lb) {
      $("lb-close").addEventListener("click", closeZoom);
      lb.addEventListener("click", (e) => { if (e.target === lb) closeZoom(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeZoom(); });
      $("lb-zoom-in").addEventListener("click", () => setLbScale(lbScale + 0.5));
      $("lb-zoom-out").addEventListener("click", () => setLbScale(lbScale - 0.5));
      lb.addEventListener("wheel", (e) => {
        e.preventDefault();
        setLbScale(lbScale + (e.deltaY < 0 ? 0.25 : -0.25));
      }, { passive: false });
    }
  }

  /* Agbada = draped robe; sleeve length doesn't apply */
  function updateSleeveAvailability() {
    const isAgbada = state.type === "agbada";
    const step = $("step-sleeve");
    step.style.opacity = isAgbada ? "0.45" : "1";
    $("opt-sleeve").querySelectorAll(".opt").forEach((b) => (b.disabled = isAgbada));
    const note = $("sleeve-note");
    if (isAgbada && !note) {
      const p = document.createElement("p");
      p.id = "sleeve-note";
      p.className = "meas-hint";
      p.textContent = "Agbada is a flowing robe — sleeve length is set by the drape.";
      step.appendChild(p);
    } else if (!isAgbada && note) {
      note.remove();
    }
  }

  /* ---------- helpers ---------- */
  const fabName = () => fabById(state.fabric).name;

  /* ---------- price ---------- */
  function price() {
    return BASE[state.type] + (fabById(state.fabric).add || 0) + EMB_ADD[state.embroidery] + LEN_ADD[state.length];
  }

  /* ---------- render everything ---------- */
  function render() {
    /* when a library design is chosen, suppress the generic motifs and
       overlay the real design at the flap/pocket */
    const d = state.embroidery !== "none" ? designById(state.design) : null;
    const buildState = Object.assign({}, state, d ? { embroidery: "none" } : {});
    let overlays = "";
    if (d) {
      const a = window.KASGarment.anchors(state);
      const K = window.KASGarment;
      const AR = window.KAS_DESIGN_AR || {};
      const flapImg = d.flap || d.img;
      const pocketImg = d.pocket || flapImg;

      /* aspect-aware placement:
         wide bands rotate to run down the placket; square yoke/rosette
         designs sit on the wider chest anchor instead of the thin flap slot */
      const fAR = AR[flapImg] || 0.4;
      if (state.type === "agbada" || fAR <= 0.75) {
        overlays += K.overlay(a.flap, dImg(flapImg), state.embColor);
      } else if (fAR >= 1.35) {
        overlays += K.overlay(a.flap, dImg(flapImg), state.embColor, true);
      } else {
        overlays += K.overlay(a.chest, dImg(flapImg), state.embColor);
      }
      if (a.pocket) overlays += K.overlay(a.pocket, dImg(pocketImg), state.embColor);
    }
    /* 3D turntable: front face (details + design) and plain back face */
    const frontHtml = '<div class="garment-stage">' + window.KASGarment.build(buildState) + overlays + "</div>";
    const backHtml = '<div class="garment-stage">' +
      window.KASGarment.build(Object.assign({}, buildState, { view: "back", embroidery: "none" })) + "</div>";
    const stageHtml =
      '<div class="g3d">' +
        '<div class="g3d-inner" style="transform:rotateX(-4deg) rotateY(' + state.rot + 'deg)">' +
          '<div class="g3d-face front">' + frontHtml + "</div>" +
          '<div class="g3d-face back">' + backHtml + "</div>" +
        "</div>" +
      "</div>";
    $("preview-stage").innerHTML = stageHtml;
    /* keep the zoom lightbox in sync while it is open */
    const lb = $("lightbox");
    if (lb && lb.classList.contains("open")) {
      $("lb-stage").innerHTML = stageHtml;
      $("lb-cap").textContent = nameOf(TYPES, state.type) + " · " + fabName() + " · " + colorName(state.color);
    }

    $("p-name").textContent = nameOf(TYPES, state.type);
    const sleeveTxt = state.type === "agbada" ? "Draped" : nameOf(SLEEVES, state.sleeve) + " sleeve";
    $("p-meta").textContent = fabName() + " · " + sleeveTxt;
    const total = price();
    $("p-price").textContent = fmt(total);

    const lines = [
      ["Garment", nameOf(TYPES, state.type)],
      ["Fabric", fabName() + " (" + fabById(state.fabric).brand + ")"],
      ["Colour", colorName(state.color)],
      ["Sleeve", state.type === "agbada" ? "Draped" : nameOf(SLEEVES, state.sleeve)],
      ["Length", nameOf(LENGTHS, state.length)],
      ["Embroidery", nameOf(EMBROIDERY, state.embroidery) + (state.embroidery !== "none" ? " (" + colorName(state.embColor) + " thread)" : "")]
    ];
    if (d) lines.push(["Design", d.name]);
    $("order-lines").innerHTML = lines
      .map((l) => `<div class="order-line"><span>${l[0]}</span><span>${l[1]}</span></div>`)
      .join("");
    $("order-total").textContent = fmt(total);
  }

  /* ---------- compose + send order ---------- */
  function orderMessage() {
    const f = document.getElementById("studio-form");
    const g = (n) => (f.elements[n] ? String(f.elements[n].value).trim() : "");
    const meas = [
      g("chest") && "Chest: " + g("chest") + '"',
      g("shoulder") && "Shoulder: " + g("shoulder") + '"',
      g("sleeveIn") && "Sleeve: " + g("sleeveIn") + '"',
      g("fullLength") && "Full length: " + g("fullLength") + '"',
      g("neck") && "Neck: " + g("neck") + '"',
      g("fit") && "Fit: " + g("fit")
    ].filter(Boolean);

    const L = [];
    L.push("✂️ NEW ORDER — KAS THREADZ");
    L.push("————————————————");
    L.push("Garment: " + nameOf(TYPES, state.type));
    L.push("Fabric: " + fabName() + " — " + fabById(state.fabric).brand);
    L.push("Colour: " + colorName(state.color) + " (" + state.color + ")");
    if (state.type !== "agbada") L.push("Sleeve: " + nameOf(SLEEVES, state.sleeve));
    L.push("Length: " + nameOf(LENGTHS, state.length));
    L.push("Embroidery: " + nameOf(EMBROIDERY, state.embroidery) +
      (state.embroidery !== "none" ? " — " + colorName(state.embColor) + " thread" : ""));
    const chosen = state.embroidery !== "none" ? designById(state.design) : null;
    if (chosen) L.push("Design: " + chosen.name);
    L.push("");
    L.push("Estimated total: " + fmt(price()));
    if (meas.length) { L.push(""); L.push("Measurements:"); meas.forEach((m) => L.push("• " + m)); }
    const name = g("name"), phone = g("phone"), notes = g("notes");
    if (name || phone || notes) {
      L.push("");
      L.push("Customer:");
      if (name) L.push("• Name: " + name);
      if (phone) L.push("• Phone: " + phone);
      if (notes) L.push("• Notes: " + notes);
    }
    L.push("");
    L.push("(Sent from the KAS THREADZ Design Studio)");
    return L.join("\n");
  }

  function sendOrder(channel) {
    const cfg = window.KAS_CONFIG || {};
    const msg = orderMessage();
    if (channel === "mail") {
      window.location.href =
        "mailto:" + (cfg.email || "") +
        "?subject=" + encodeURIComponent("New order — " + nameOf(TYPES, state.type) + " · KAS THREADZ") +
        "&body=" + encodeURIComponent(msg);
    } else {
      window.open("https://wa.me/" + (cfg.whatsapp || "") + "?text=" + encodeURIComponent(msg), "_blank");
    }
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildControls();
    wire();
    updateSleeveAvailability();
    render();
  });
})();
