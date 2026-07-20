/* ============================================================
   KAS THREADZ — parametric garment illustration
   Pure SVG-string builder used by the hero and the live customiser.
   window.KASGarment.build(state) -> "<svg>…</svg>"
   Silhouettes modelled on real Nigerian menswear references:
   kaftan (round neck, placket + chest pocket), jallab (tasselled
   pointed placket, scrollwork), agbada (winged robe), custom shirt.
   ============================================================ */
window.KASGarment = (function () {
  "use strict";

  const CX = 250;                 // horizontal centre of the 500-wide canvas
  const SY = 158;                 // shoulder line Y
  const r2 = (n) => Math.round(n * 100) / 100;

  /* Old fabric ids from earlier saves keep working */
  const FABRIC_ALIAS = { guinea: "shadda", brocade: "shadda", linen: "cashmere" };
  /* Old garment ids from earlier saves keep working */
  const TYPE_ALIAS = { senator: "jallab" };
  /* Old embroidery ids from earlier saves keep working */
  const EMB_ALIAS = { neck: "flap", afterflap: "full" };

  /* Silhouette presets per garment type */
  const PRESET = {
    kaftan: { shoulderHalf: 97, neckW: 24, neckDrop: 16, chestHalf: 84, waistHalf: 82,
              hemHalf: 95, hemShort: 468, hemLong: 566, sleeveFlare: 16,
              collar: "kaftan", buttons: 3, pocket: true },
    jallab: { shoulderHalf: 99, neckW: 23, neckDrop: 15, chestHalf: 86, waistHalf: 84,
              hemHalf: 96, hemShort: 460, hemLong: 566, sleeveFlare: 16,
              collar: "jallab", buttons: 0 },
    shirt:  { shoulderHalf: 95, neckW: 21, neckDrop: 20, chestHalf: 80, waistHalf: 78,
              hemHalf: 91, hemShort: 428, hemLong: 512, sleeveFlare: 14,
              collar: "shirt", buttons: 6 },
    agbada: { shoulderHalf: 152, neckW: 26, neckDrop: 30, chestHalf: 150, waistHalf: 172,
              hemHalf: 180, hemShort: 540, hemLong: 616, sleeveFlare: 0,
              collar: "agbada", buttons: 0, robe: true, drapeHalf: 212 }
  };

  const SLEEVE_END = { short: 268, elbow: 324, long: 432 };
  const ARMHOLE_Y = 96;           // depth of armhole below shoulder line

  /* ---- fabric surface treatments ---- */
  function fabricDefs(fabric, color, id) {
    const light = shade(color, 26);
    const dark = shade(color, -22);
    const darker = shade(color, -40);
    let pattern = "";
    let patternRef = "";

    if (fabric === "express") {
      /* Express (Noble Thinker) — very fine pinstripe */
      pattern = `<pattern id="tex${id}" width="6" height="6" patternUnits="userSpaceOnUse">
        <line x1="1" y1="0" x2="1" y2="6" stroke="${light}" stroke-opacity="0.55" stroke-width="0.9"/></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "noblethinker") {
      /* Noble Thinker — everyday fine stripe, slightly wider spacing */
      pattern = `<pattern id="tex${id}" width="9" height="9" patternUnits="userSpaceOnUse">
        <line x1="1.5" y1="0" x2="1.5" y2="9" stroke="${light}" stroke-opacity="0.5" stroke-width="1"/></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "properstripes") {
      /* Proper Stripes — bold classic pinstripe */
      pattern = `<pattern id="tex${id}" width="26" height="26" patternUnits="userSpaceOnUse">
        <line x1="3" y1="0" x2="3" y2="26" stroke="${light}" stroke-opacity="0.75" stroke-width="1.6"/>
        <line x1="3" y1="0" x2="3" y2="26" stroke="${light}" stroke-opacity="0.25" stroke-width="3.4"/></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "focus") {
      /* Focus — tonal satin stripe bands */
      pattern = `<pattern id="tex${id}" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="9" height="30" fill="${light}" fill-opacity="0.16"/>
        <rect x="9" y="0" width="2" height="30" fill="${darker}" fill-opacity="0.18"/>
        <rect x="18" y="0" width="4" height="30" fill="${darker}" fill-opacity="0.12"/></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "sevenstar") {
      /* Seven Star — smooth solid wool, whisper of a twill */
      pattern = `<pattern id="tex${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(63)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="${darker}" stroke-opacity="0.06" stroke-width="1"/></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "cotton") {
      pattern = `<pattern id="tex${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="${darker}" stroke-opacity="0.10" stroke-width="1"/></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "cashmere") {
      /* soft brushed nap — barely-there vertical strokes */
      pattern = `<pattern id="tex${id}" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M2 0q1.5 6 0 12M8 0q-1.5 6 0 12" stroke="${darker}" stroke-opacity="0.05" stroke-width="1.4" fill="none"/></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "shadda") {
      /* rich damask / jacquard woven motif with a sheen */
      pattern = `<pattern id="tex${id}" width="34" height="34" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="${light}" stroke-opacity="0.5" stroke-width="1.1">
          <path d="M17 4 C24 10 24 14 17 17 C10 14 10 10 17 4Z"/>
          <path d="M17 30 C24 24 24 20 17 17 C10 20 10 24 17 30Z"/>
          <circle cx="17" cy="17" r="1.6" fill="${light}" fill-opacity="0.6" stroke="none"/>
          <path d="M0 17h5M29 17h5" stroke-opacity="0.3"/>
        </g></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "lace") {
      pattern = `<pattern id="tex${id}" width="22" height="22" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="${shade(color,-10)}" stroke-opacity="0.55" stroke-width="1">
          <circle cx="11" cy="11" r="6"/>
          <circle cx="0" cy="0" r="6"/><circle cx="22" cy="0" r="6"/>
          <circle cx="0" cy="22" r="6"/><circle cx="22" cy="22" r="6"/>
        </g></pattern>`;
      patternRef = `tex${id}`;
    } else if (fabric === "ankara") {
      const accent = shade(color, 60);
      const accent2 = shade(color, -46);
      pattern = `<pattern id="tex${id}" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="${color}"/>
        <circle cx="20" cy="20" r="11" fill="none" stroke="${accent2}" stroke-width="3"/>
        <circle cx="20" cy="20" r="4.5" fill="${accent}"/>
        <path d="M20 0v6M20 34v6M0 20h6M34 20h6" stroke="${accent2}" stroke-width="3"/>
        <circle cx="0" cy="0" r="5" fill="${accent}"/><circle cx="40" cy="0" r="5" fill="${accent}"/>
        <circle cx="0" cy="40" r="5" fill="${accent}"/><circle cx="40" cy="40" r="5" fill="${accent}"/>
      </pattern>`;
      patternRef = `tex${id}`;
    }

    const sheen = (fabric === "shadda" || fabric === "lace" || fabric === "focus" || fabric === "sevenstar");
    const softLight = fabric === "cashmere" ? shade(color, 34) : light;
    const gradId = `grad${id}`;
    const grad = `<linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${softLight}"/>
        <stop offset="0.5" stop-color="${color}"/>
        <stop offset="1" stop-color="${dark}"/>
      </linearGradient>`;
    const sheenGrad = sheen
      ? `<linearGradient id="sheen${id}" x1="0" y1="0" x2="1" y2="0">
           <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
           <stop offset="0.42" stop-color="#ffffff" stop-opacity="0.22"/>
           <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
         </linearGradient>` : "";

    return { defs: grad + sheenGrad + pattern, gradId, patternRef, sheen, dark, darker, light };
  }

  /* lighten/darken a hex colour by amt (-100..100) */
  function shade(hex, amt) {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const num = parseInt(c, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* torso outline — square shoulders, straight boxy sides like the references */
  function torsoPath(o) {
    const nL = CX - o.neckW, nR = CX + o.neckW;
    const shL = CX - o.shoulderHalf, shR = CX + o.shoulderHalf;
    const chL = CX - o.chestHalf, chR = CX + o.chestHalf;
    const hmL = CX - o.hemHalf, hmR = CX + o.hemHalf;
    const armY = SY + ARMHOLE_Y;
    const midY = (armY + o.hemY) / 2;
    return [
      `M ${nL} ${SY}`,
      `L ${shL} ${SY + 15}`,                       // slightly sloped shoulder
      `L ${chL} ${armY}`,                          // in to armhole
      `Q ${CX - o.waistHalf} ${midY} ${hmL} ${o.hemY}`, // near-straight side seam
      `Q ${CX} ${o.hemY + 14} ${hmR} ${o.hemY}`,   // gentle hem curve
      `Q ${CX + o.waistHalf} ${midY} ${chR} ${armY}`,
      `L ${shR} ${SY + 15}`,
      `L ${nR} ${SY}`,
      `Q ${CX} ${SY + o.neckDrop} ${nL} ${SY}`,    // shallow round neckline
      "Z"
    ].join(" ");
  }

  /* one sleeve; side = -1 (left) | +1 (right). Straight tube with a cuff. */
  function sleevePath(side, o) {
    const shX = CX + side * (o.shoulderHalf - 1);
    const armpitX = CX + side * (o.chestHalf - 1);
    const armY = SY + ARMHOLE_Y;
    const endY = o.sleeveEndY;
    const outTop = CX + side * (o.shoulderHalf + o.sleeveFlare);
    const cuffOut = CX + side * (o.shoulderHalf + o.sleeveFlare * 0.8);
    const cuffIn = CX + side * (o.chestHalf + 3);
    return [
      `M ${shX} ${SY + 12}`,
      `Q ${outTop} ${SY + 56} ${cuffOut} ${endY - 5}`,
      `Q ${(cuffOut + cuffIn) / 2} ${endY + 9} ${cuffIn} ${endY - 2}`,
      `L ${armpitX} ${armY + 6}`,
      "Z"
    ].join(" ");
  }

  /* agbada — grand open-front robe: straight wide fall with the
     sleeve fabric folded back over each shoulder (drape corners) */
  function robePath(o) {
    const nL = CX - o.neckW, nR = CX + o.neckW;
    const shL = CX - o.shoulderHalf, shR = CX + o.shoulderHalf;
    const drL = CX - o.drapeHalf, drR = CX + o.drapeHalf;
    const hmL = CX - o.hemHalf, hmR = CX + o.hemHalf;
    const drapeY = SY + 248;                       // bottom of the folded drape
    const notchY = SY + 300;                       // where drape meets the body line
    const sideL = CX - o.waistHalf, sideR = CX + o.waistHalf;
    return [
      `M ${nL} ${SY}`,
      `L ${shL} ${SY + 10}`,                        // square shoulder
      `L ${drL} ${drapeY}`,                         // drape falls over the arm
      `L ${sideL} ${notchY}`,                       // fold notch back to the body
      `L ${hmL} ${o.hemY - 4}`,                     // straight fall to hem
      `Q ${CX} ${o.hemY + 18} ${hmR} ${o.hemY - 4}`,
      `L ${sideR} ${notchY}`,
      `L ${drR} ${drapeY}`,
      `L ${shR} ${SY + 10}`,
      `L ${nR} ${SY}`,
      `Q ${CX} ${SY + o.neckDrop} ${nL} ${SY}`,
      "Z"
    ].join(" ");
  }

  /* ---- embroidery helpers ---- */

  function stitchLine(x1, y1, x2, y2, color, w) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}"
      stroke-width="${w || 1.4}" stroke-dasharray="4 3.4" stroke-linecap="round" opacity="0.9"/>`;
  }

  /* nested geometric diamond motif (like aso-oke / kaftan chest details) */
  function diamondMotif(cx, cy, s, ec) {
    const d = (k) => `M ${cx} ${r2(cy - k)} L ${r2(cx + k)} ${cy} L ${cx} ${r2(cy + k)} L ${r2(cx - k)} ${cy} Z`;
    return `<g fill="none" stroke="${ec}" stroke-width="1.7" stroke-linejoin="round" opacity="0.95">
      <path d="${d(13 * s)}"/>
      <path d="${d(8 * s)}" stroke-width="1.3"/>
      <path d="${d(3.4 * s)}" fill="${ec}" stroke="none"/>
      <circle cx="${cx}" cy="${r2(cy - 16.5 * s)}" r="${1.5 * s}" fill="${ec}" stroke="none"/>
      <circle cx="${cx}" cy="${r2(cy + 16.5 * s)}" r="${1.5 * s}" fill="${ec}" stroke="none"/>
      <circle cx="${r2(cx - 16.5 * s)}" cy="${cy}" r="${1.5 * s}" fill="${ec}" stroke="none"/>
      <circle cx="${r2(cx + 16.5 * s)}" cy="${cy}" r="${1.5 * s}" fill="${ec}" stroke="none"/>
    </g>`;
  }

  /* agbada chest panel — chevron rows over a grid of squares */
  function agbadaPanel(cx, top, ec) {
    let s = `<g fill="none" stroke="${ec}" stroke-width="1.8" stroke-linejoin="round" opacity="0.95">`;
    for (let i = 0; i < 3; i++) {
      const y = top + i * 8;
      s += `<path d="M ${cx - 52} ${y + 16} L ${cx} ${y} L ${cx + 52} ${y + 16}"/>`;
    }
    const cell = 20, gap = 7, gTop = top + 36;
    for (let row = 0; row < 3; row++) {
      for (let col = -1; col <= 1; col++) {
        const x = cx + col * (cell + gap) - cell / 2;
        const y = gTop + row * (cell + gap);
        s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}"/>`;
        s += `<rect x="${x + 5}" y="${y + 5}" width="${cell - 10}" height="${cell - 10}" stroke-width="1.1"/>`;
      }
    }
    s += "</g>";
    return s;
  }

  /* interlaced knot motif (below the agbada panel) */
  function knotMotif(cx, cy, ec) {
    return `<g fill="none" stroke="${ec}" stroke-width="2.1" stroke-linejoin="round" opacity="0.95">
      <rect x="${cx - 17}" y="${cy - 17}" width="34" height="34" rx="11"/>
      <rect x="${cx - 17}" y="${cy - 17}" width="34" height="34" rx="11" transform="rotate(45 ${cx} ${cy})"/>
      <circle cx="${cx}" cy="${cy}" r="4" fill="${ec}" stroke="none"/>
    </g>`;
  }

  function build(state) {
    const s = Object.assign(
      { type: "kaftan", color: "#f4f1ec", fabric: "cotton", sleeve: "long",
        length: "regular", embroidery: "neck", embColor: "#cabfb1" },
      state || {}
    );
    s.type = TYPE_ALIAS[s.type] || s.type;
    s.fabric = FABRIC_ALIAS[s.fabric] || s.fabric;
    s.embroidery = EMB_ALIAS[s.embroidery] || s.embroidery;
    const isBack = s.view === "back";                   // rear view: plain back, no front details
    const withSleeves = s.embroidery === "full";   // decorative full style (static pages) adds cuff/hem work
    const base = PRESET[s.type] || PRESET.kaftan;
    const o = Object.assign({}, base);
    o.hemY = s.length === "long" ? base.hemLong : base.hemShort;
    o.sleeveEndY = SLEEVE_END[s.sleeve] || SLEEVE_END.long;
    if (isBack) o.neckDrop = Math.min(o.neckDrop, 10);  // back neckline sits higher

    const id = Math.random().toString(36).slice(2, 7);
    const f = fabricDefs(s.fabric, s.color, id);
    const clipId = `clip${id}`;

    /* real fabric photo mode: fill the garment with a swatch image (continuous
       across body + sleeves) with the volume shading layered on top */
    const photo = !!s.swatch;
    const imgDefs = photo
      ? `<pattern id="img${id}" patternUnits="userSpaceOnUse" width="500" height="660">
           <image href="${s.swatch}" x="42" y="144" width="416" height="490" preserveAspectRatio="xMidYMid slice"/>
         </pattern>`
      : "";

    const isRobe = !!base.robe;
    const body = isRobe ? robePath(o) : torsoPath(o);
    const fillRef = photo ? `url(#img${id})`
      : (s.fabric === "ankara" ? `url(#${f.patternRef})` : `url(#${f.gradId})`);
    const armY = SY + ARMHOLE_Y;

    const clip = `<clipPath id="${clipId}"><path d="${body}"/></clipPath>`;

    /* per-sleeve clip paths so shading hugs each sleeve */
    let sleeveClips = "";
    if (!isRobe) {
      sleeveClips =
        `<clipPath id="scl${id}"><path d="${sleevePath(-1, o)}"/></clipPath>` +
        `<clipPath id="scr${id}"><path d="${sleevePath(1, o)}"/></clipPath>`;
    }

    /* sleeves — base fabric + cylinder volume shading */
    let sleeves = "";
    if (!isRobe) {
      [["-1", "scl"], ["1", "scr"]].forEach(([sd, cl]) => {
        const sp = sleevePath(parseInt(sd, 10), o);
        sleeves += `<path d="${sp}" fill="${fillRef}" stroke="${f.darker}" stroke-opacity="0.4" stroke-width="1"/>`;
        sleeves += `<path d="${sp}" fill="url(#shc${id})"/>`;
        /* shadow along the inner (body-side) edge of the sleeve */
        const inX = CX + parseInt(sd, 10) * (o.chestHalf - 2);
        sleeves += `<path d="M ${inX} ${armY + 4} L ${inX} ${o.sleeveEndY - 12}" clip-path="url(#${cl}${id})"
          stroke="#000" stroke-opacity="0.16" stroke-width="16" filter="url(#ao${id})" stroke-linecap="round"/>`;
      });
    }

    /* texture + sheen + volume shading overlays clipped to torso */
    let overlays = "";
    if (!photo && f.patternRef && s.fabric !== "ankara") {
      overlays += `<rect x="0" y="120" width="500" height="540" fill="url(#${f.patternRef})" clip-path="url(#${clipId})"/>`;
    }
    /* cylindrical (edge-dark, centre-lit) + top-down volume */
    overlays += `<path d="${body}" fill="url(#shc${id})" clip-path="url(#${clipId})"/>`;
    overlays += `<path d="${body}" fill="url(#shv${id})" clip-path="url(#${clipId})"/>`;
    /* soft vertical drape folds */
    if (!isRobe) {
      let folds = "";
      [-1, 1].forEach((sd) => {
        [34, 82].forEach((off, i) => {
          const x = CX + sd * off;
          folds += `<path d="M ${x} ${SY + 74} C ${x - sd * 5} ${(SY + o.hemY) / 2} ${x + sd * 4} ${(SY + o.hemY) / 2} ${x} ${o.hemY - 26}"
            fill="none" stroke="#000" stroke-opacity="${i ? 0.05 : 0.08}" stroke-width="${i ? 9 : 13}" stroke-linecap="round" filter="url(#ao${id})"/>`;
          folds += `<path d="M ${x - sd * 6} ${SY + 90} C ${x - sd * 10} ${(SY + o.hemY) / 2} ${x - sd * 3} ${(SY + o.hemY) / 2} ${x - sd * 5} ${o.hemY - 30}"
            fill="none" stroke="#fff" stroke-opacity="0.05" stroke-width="7" stroke-linecap="round" filter="url(#ao${id})"/>`;
        });
      });
      overlays += `<g clip-path="url(#${clipId})">${folds}</g>`;
    }
    /* ambient occlusion: shadow cast under the collar onto the chest, and armpits */
    overlays += `<ellipse cx="${CX}" cy="${SY + 34}" rx="${o.chestHalf * 0.66}" ry="24" fill="#000" opacity="0.14"
      filter="url(#ao${id})" clip-path="url(#${clipId})"/>`;
    if (!isRobe) {
      [-1, 1].forEach((sd) => {
        overlays += `<ellipse cx="${CX + sd * (o.chestHalf - 10)}" cy="${armY + 4}" rx="20" ry="30" fill="#000" opacity="0.14"
          filter="url(#ao${id})" clip-path="url(#${clipId})"/>`;
      });
    }
    if (f.sheen) {
      overlays += `<rect x="0" y="120" width="500" height="540" fill="url(#sheen${id})" clip-path="url(#${clipId})"/>`;
    }
    overlays += `<path d="${body}" fill="none" stroke="${f.darker}" stroke-opacity="0.4" stroke-width="1.2"/>`;

    /* ---- garment construction details ---- */
    let details = "";
    const seam = f.darker;
    const neckY = SY + o.neckDrop;

    /* inner neckline ring (round collarless neck on all four) */
    details += `<path d="M ${CX - o.neckW + 5} ${SY + 2} Q ${CX} ${neckY + 6} ${CX + o.neckW - 5} ${SY + 2}"
      fill="none" stroke="${seam}" stroke-opacity="0.4" stroke-width="1.6"/>`;

    if (isBack) {
      /* plain back: yoke seam + centre-back seam (+ drape folds for agbada) */
      if (!isRobe) {
        details += `<path d="M ${CX - o.chestHalf + 6} ${SY + 52} Q ${CX} ${SY + 62} ${CX + o.chestHalf - 6} ${SY + 52}"
          fill="none" stroke="${seam}" stroke-opacity="0.28" stroke-width="1.4"/>`;
        details += `<line x1="${CX}" y1="${SY + 58}" x2="${CX}" y2="${o.hemY - 20}"
          stroke="${seam}" stroke-opacity="0.14" stroke-width="1.2"/>`;
      } else {
        const drapeY = SY + 248, notchY = SY + 300;
        details += `<line x1="${CX}" y1="${neckY + 6}" x2="${CX}" y2="${o.hemY - 24}"
          stroke="${seam}" stroke-opacity="0.16" stroke-width="1.4"/>`;
        [-1, 1].forEach((sd) => {
          const drX = CX + sd * (o.drapeHalf - 6);
          const inX = CX + sd * (o.waistHalf + 2);
          details += `<path d="M ${CX + sd * 64} ${SY + 16} L ${drX} ${drapeY - 4} L ${inX} ${notchY - 2}"
            fill="none" stroke="${seam}" stroke-opacity="0.2" stroke-width="1.8"/>`;
        });
      }
    } else if (base.collar === "kaftan") {
      /* narrow placket strip with buttons + chest pocket */
      const pTop = neckY + 2, pBot = SY + 218;
      details += `<rect x="${CX - 7}" y="${pTop}" width="14" height="${pBot - pTop}" rx="2"
        fill="${f.dark}" fill-opacity="0.14" stroke="${seam}" stroke-opacity="0.45" stroke-width="1.2"/>`;
      for (let i = 0; i < base.buttons; i++) {
        const y = pTop + 22 + i * ((pBot - pTop - 44) / (base.buttons - 1));
        details += `<circle cx="${CX}" cy="${r2(y)}" r="3.1" fill="${f.light}" stroke="${seam}" stroke-opacity="0.55"/>`;
      }
      if (base.pocket) {
        details += `<rect x="${CX + 28}" y="${SY + 86}" width="48" height="60" rx="2"
          fill="${f.dark}" fill-opacity="0.10" stroke="${seam}" stroke-opacity="0.45" stroke-width="1.2"/>`;
      }
    } else if (base.collar === "jallab") {
      /* narrow placket ending in a point, with a gold cord tassel */
      const pTop = neckY + 2, pBot = SY + 200, tip = pBot + 24;
      details += `<path d="M ${CX - 8} ${pTop} L ${CX + 8} ${pTop} L ${CX + 8} ${pBot} L ${CX} ${tip} L ${CX - 8} ${pBot} Z"
        fill="${f.dark}" fill-opacity="0.12" stroke="${seam}" stroke-opacity="0.5" stroke-width="1.3"/>`;
      details += `<line x1="${CX}" y1="${pTop + 4}" x2="${CX}" y2="${pBot}"
        stroke="${seam}" stroke-opacity="0.3" stroke-width="1"/>`;
      if (!isBack) {
        const gold = "#c9a45c", goldDark = "#a8843f";
        const cordEnd = tip + 26;
        details += `<path d="M ${CX} ${tip} q 3 ${(cordEnd - tip) / 2} 0 ${cordEnd - tip}"
          fill="none" stroke="${goldDark}" stroke-width="2"/>`;
        details += `<ellipse cx="${CX}" cy="${cordEnd + 6}" rx="4.6" ry="6.5" fill="${gold}" stroke="${goldDark}" stroke-width="1"/>`;
        details += `<path d="M ${CX - 5.5} ${cordEnd + 10} L ${CX - 8} ${cordEnd + 44} Q ${CX} ${cordEnd + 50} ${CX + 8} ${cordEnd + 44} L ${CX + 5.5} ${cordEnd + 10} Z"
          fill="${gold}" stroke="${goldDark}" stroke-width="1"/>`;
        for (let i = -1; i <= 1; i++) {
          details += `<line x1="${CX + i * 4}" y1="${cordEnd + 14}" x2="${CX + i * 5.4}" y2="${cordEnd + 42}"
            stroke="${goldDark}" stroke-opacity="0.5" stroke-width="0.8"/>`;
        }
      }
    } else if (base.collar === "shirt") {
      details += `<path d="M ${CX} ${SY + 6} L ${CX - o.neckW - 12} ${SY + 4} L ${CX - 6} ${SY + 34} Z"
        fill="${f.dark}" stroke="${seam}" stroke-opacity="0.4"/>`;
      details += `<path d="M ${CX} ${SY + 6} L ${CX + o.neckW + 12} ${SY + 4} L ${CX + 6} ${SY + 34} Z"
        fill="${f.dark}" stroke="${seam}" stroke-opacity="0.4"/>`;
      details += `<line x1="${CX}" y1="${SY + 12}" x2="${CX}" y2="${o.hemY - 26}"
        stroke="${seam}" stroke-opacity="0.3" stroke-width="1.4"/>`;
      const top = SY + 42, bottom = o.hemY - 110;
      for (let i = 0; i < base.buttons; i++) {
        const y = top + (i * (bottom - top)) / (base.buttons - 1);
        details += `<circle cx="${CX}" cy="${r2(y)}" r="3" fill="${f.light}" stroke="${seam}" stroke-opacity="0.5"/>`;
      }
    } else if (base.collar === "agbada") {
      const drapeY = SY + 248, notchY = SY + 300;
      /* inner garment showing through the centre-front opening */
      details += `<rect x="${CX - 9}" y="${neckY + 2}" width="18" height="${o.hemY - neckY - 26}"
        fill="${f.dark}" fill-opacity="0.22"/>`;
      /* front facing bands either side of the opening */
      [-1, 1].forEach((sd) => {
        const x = sd === -1 ? CX - 26 : CX + 9;
        details += `<rect x="${x}" y="${neckY - 2}" width="17" height="${o.hemY - neckY - 20}"
          fill="${f.dark}" fill-opacity="0.10" stroke="${seam}" stroke-opacity="0.35" stroke-width="1.1"/>`;
      });
      /* neck facing */
      details += `<path d="M ${CX - o.neckW - 6} ${SY + 2} Q ${CX} ${neckY + 12} ${CX + o.neckW + 6} ${SY + 2}"
        fill="none" stroke="${seam}" stroke-opacity="0.35" stroke-width="2"/>`;
      /* folded shoulder drapes — fold edge + soft shading toward the corner */
      [-1, 1].forEach((sd) => {
        const shX = CX + sd * (o.shoulderHalf - 6);
        const drX = CX + sd * (o.drapeHalf - 6);
        const inX = CX + sd * (o.waistHalf + 2);
        details += `<path d="M ${CX + sd * 64} ${SY + 16} L ${drX} ${drapeY - 4} L ${inX} ${notchY - 2}"
          fill="none" stroke="${seam}" stroke-opacity="0.22" stroke-width="1.8"/>`;
        details += `<line x1="${CX + sd * 108} " y1="${SY + 22}" x2="${CX + sd * (o.drapeHalf - 34)}" y2="${drapeY - 18}"
          stroke="${seam}" stroke-opacity="0.12" stroke-width="1.4"/>`;
        details += `<path d="M ${shX} ${SY + 12} L ${drX + sd * 4} ${drapeY - 2} L ${inX} ${notchY}"
          fill="${f.dark}" fill-opacity="0.08" stroke="none"/>`;
      });
      /* inner sleeves peeking below the drapes */
      [-1, 1].forEach((sd) => {
        const topX = CX + sd * (o.waistHalf - 4);
        const cuffX = CX + sd * (o.waistHalf - 26);
        details += `<path d="M ${topX} ${notchY} L ${CX + sd * (o.waistHalf + 16)} ${notchY + 10}
          L ${cuffX + sd * 18} ${notchY + 116} Q ${cuffX + sd * 4} ${notchY + 128} ${cuffX} ${notchY + 112} Z"
          fill="${f.dark}" fill-opacity="0.16" stroke="${seam}" stroke-opacity="0.25" stroke-width="1"/>`;
      });
    }

    /* sleeve cuff seams */
    if (!isRobe) {
      const cy = o.sleeveEndY - 16;
      const cuffOut = o.shoulderHalf + o.sleeveFlare * 0.8;
      const cuffIn = o.chestHalf + 3;
      details += `<line x1="${CX - cuffOut + 2}" y1="${cy}" x2="${CX - cuffIn - 2}" y2="${cy + 3}"
        stroke="${seam}" stroke-opacity="0.35" stroke-width="1.2"/>`;
      details += `<line x1="${CX + cuffIn + 2}" y1="${cy + 3}" x2="${CX + cuffOut - 2}" y2="${cy}"
        stroke="${seam}" stroke-opacity="0.35" stroke-width="1.2"/>`;
    }

    /* ---- embroidery (front only) ---- */
    let emb = "";
    if (s.embroidery !== "none" && !isBack) {
      const ec = s.embColor;
      if (base.collar === "kaftan") {
        emb += stitchLine(CX - 9, neckY + 6, CX - 9, SY + 214, ec, 1.2);
        emb += stitchLine(CX + 9, neckY + 6, CX + 9, SY + 214, ec, 1.2);
        emb += diamondMotif(CX, SY + 252, 1.0, ec);                    // below placket
        if (base.pocket) emb += diamondMotif(CX + 52, SY + 168, 0.62, ec); // under pocket
        if (withSleeves) {
          emb += diamondMotif(CX, SY + 296, 0.66, ec);
          emb += diamondMotif(CX + 52, SY + 200, 0.45, ec);
          emb += stitchLine(CX - o.hemHalf + 16, o.hemY - 9, CX + o.hemHalf - 16, o.hemY - 9, ec, 1.5);
          const cy2 = o.sleeveEndY - 9;
          emb += stitchLine(CX - (o.shoulderHalf + o.sleeveFlare * 0.8) + 4, cy2, CX - o.chestHalf - 5, cy2, ec, 1.3);
          emb += stitchLine(CX + o.chestHalf + 5, cy2, CX + (o.shoulderHalf + o.sleeveFlare * 0.8) - 4, cy2, ec, 1.3);
        }
      } else if (base.collar === "jallab") {
        /* jallab: mirrored arabesque scroll chains from the shoulders down
           around the pointed placket, like the studio's tasselled robes */
        /* arabesque scroll chain: a running line that curls back on itself,
           the way the studio's tasselled robes are stitched */
        const scroll = (x1, y1, x2, y2, n, w, curl) => {
          const dx = (x2 - x1) / n, dy = (y2 - y1) / n;
          const len = Math.hypot(x2 - x1, y2 - y1) || 1;
          const px = -(y2 - y1) / len, py = (x2 - x1) / len;
          let d = `M ${r2(x1)} ${r2(y1)}`;
          for (let i = 0; i < n; i++) {
            const sg = i % 2 ? 1 : -1;
            const bx = x1 + dx * i, by = y1 + dy * i;
            /* control points thrown well past the segment so the curve
               loops into a curl instead of a shallow wave */
            const c1x = bx + dx * 0.1 + px * curl * sg, c1y = by + dy * 0.1 + py * curl * sg;
            const c2x = bx + dx * 0.9 + px * curl * sg, c2y = by + dy * 0.9 + py * curl * sg;
            d += ` C ${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(bx + dx)} ${r2(by + dy)}`;
          }
          return `<path d="${d}" fill="none" stroke="${ec}" stroke-width="${w}" opacity="0.95"
            stroke-linecap="round" stroke-linejoin="round"/>`;
        };
        [-1, 1].forEach((sd) => {
          /* chain running from the shoulder down beside the placket */
          emb += scroll(CX + sd * 54, SY + 10, CX + sd * 15, SY + 194, 6, 1.7, 15);
          /* finer companion line just inside it */
          emb += scroll(CX + sd * 43, SY + 22, CX + sd * 11, SY + 180, 6, 1.05, -9);
          /* seed dots in the gaps between curls */
          for (let i = 1; i <= 4; i++) {
            const t = i / 5;
            const x = CX + sd * (54 - 39 * t + 12), y = SY + 10 + 184 * t;
            emb += `<circle cx="${r2(x)}" cy="${r2(y)}" r="1.5" fill="${ec}" opacity="0.85"/>`;
          }
        });
        emb += `<path d="M ${CX - o.neckW - 4} ${SY + 4} Q ${CX} ${neckY + 10} ${CX + o.neckW + 4} ${SY + 4}"
          fill="none" stroke="${ec}" stroke-width="1.5" opacity="0.9"/>`;
        if (withSleeves) {
          const cy2 = o.sleeveEndY - 12;
          const outer = o.shoulderHalf + o.sleeveFlare * 0.8;
          emb += scroll(CX - outer + 8, cy2, CX - o.chestHalf - 6, cy2, 3, 1.4, 11);
          emb += scroll(CX + o.chestHalf + 6, cy2, CX + outer - 8, cy2, 3, 1.4, 11);
        }
      } else if (base.collar === "agbada") {
        emb += agbadaPanel(CX, SY + 52, ec);
        if (withSleeves) {
          emb += knotMotif(CX, SY + 208, ec);
          emb += stitchLine(CX - 8, SY + 236, CX - 8, o.hemY - 60, ec, 1.2);
          emb += stitchLine(CX + 8, SY + 236, CX + 8, o.hemY - 60, ec, 1.2);
        }
      } else {
        /* custom shirt: chest monogram motif */
        emb += diamondMotif(CX + 48, SY + 74, 0.6, ec);
        if (withSleeves) {
          emb += stitchLine(CX - 10, SY + 40, CX - 10, o.hemY - 110, ec, 1.2);
          emb += stitchLine(CX + 10, SY + 40, CX + 10, o.hemY - 110, ec, 1.2);
          emb += stitchLine(CX - o.hemHalf + 14, o.hemY - 8, CX + o.hemHalf - 14, o.hemY - 8, ec, 1.4);
        }
      }
    }

    /* mannequin stand + shadow */
    const stand = `
      <ellipse cx="${CX}" cy="632" rx="132" ry="17" fill="#000" opacity="0.09"/>
      <ellipse cx="${CX}" cy="628" rx="70" ry="12" fill="none" stroke="#b9ab99" stroke-width="3" opacity="0.55"/>
      <rect x="${CX - 4}" y="${o.hemY - 6}" width="8" height="${628 - (o.hemY - 6)}" rx="4" fill="#c7b9a7" opacity="0.5"/>
    `;
    const hangerBar = isRobe ? "" :
      `<path d="M ${CX} ${SY - 30} q -2 -12 -14 -12 M ${CX - o.shoulderHalf - 6} ${SY + 4} L ${CX} ${SY - 22} L ${CX + o.shoulderHalf + 6} ${SY + 4}"
        fill="none" stroke="#c7b9a7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>`;

    /* mandarin-style collar band with light top / shadow underside (front only) */
    let collar = "";
    if (!isBack && !isRobe) {
      const nL = CX - o.neckW, nR = CX + o.neckW;
      collar =
        `<path d="M ${nL} ${SY + 2} Q ${CX} ${neckY + 6} ${nR} ${SY + 2}
           L ${nR + 3} ${SY - 9} Q ${CX} ${neckY - 12} ${nL - 3} ${SY - 9} Z"
           fill="url(#collar${id})" stroke="${f.darker}" stroke-opacity="0.45" stroke-width="1.1"/>` +
        `<path d="M ${nL} ${SY + 3} Q ${CX} ${neckY + 7} ${nR} ${SY + 3}"
           fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="3" filter="url(#ao${id})"/>`;
    }

    const shadeDefs = `
      <linearGradient id="shc${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0.42"/>
        <stop offset="0.13" stop-color="#000" stop-opacity="0.13"/>
        <stop offset="0.37" stop-color="#fff" stop-opacity="0.13"/>
        <stop offset="0.52" stop-color="#fff" stop-opacity="0"/>
        <stop offset="0.72" stop-color="#000" stop-opacity="0.07"/>
        <stop offset="0.89" stop-color="#000" stop-opacity="0.24"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.44"/>
      </linearGradient>
      <linearGradient id="shv${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.13"/>
        <stop offset="0.09" stop-color="#fff" stop-opacity="0"/>
        <stop offset="0.72" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.22"/>
      </linearGradient>
      <linearGradient id="collar${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${f.light}"/>
        <stop offset="1" stop-color="${f.dark}"/>
      </linearGradient>`;

    return `<svg class="garment-svg" viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label="${s.type} preview">
      <defs>${f.defs}${shadeDefs}${imgDefs}${clip}${sleeveClips}
        <filter id="soft${id}" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#2a0a0d" flood-opacity="0.24"/>
        </filter>
        <filter id="ao${id}" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
      </defs>
      ${stand}
      ${hangerBar}
      <g filter="url(#soft${id})">
        ${sleeves}
        <path d="${body}" fill="${fillRef}" stroke="${f.darker}" stroke-opacity="0.4" stroke-width="1.2"/>
        ${overlays}
        ${collar}
        ${details}
        ${emb}
      </g>
    </svg>`;
  }

  /* ------------------------------------------------------------
     anchors(state) — overlay positions for design images, in % of
     the 500x660 viewBox. Pages wrap the SVG in an element with
     aspect-ratio 500/660 so these percentages line up exactly.
     Each anchor: { x, y (centre), w, h (max box), rot? }
     ------------------------------------------------------------ */
  function anchors(state) {
    const s = Object.assign({ type: "kaftan", sleeve: "long", length: "short" }, state || {});
    s.type = TYPE_ALIAS[s.type] || s.type;
    const base = PRESET[s.type] || PRESET.kaftan;
    const hemY = s.length === "long" ? base.hemLong : base.hemShort;
    const sleeveEndY = SLEEVE_END[s.sleeve] || SLEEVE_END.long;
    const px = (v) => (v / 500) * 100;
    const py = (v) => (v / 660) * 100;
    const neckY = SY + base.neckDrop;

    if (base.robe) {
      /* agbada: one grand chest panel over the front opening */
      return {
        robe: true,
        flap:   { x: 50, y: py(SY + 126), w: px(112), h: py(188) },
        pocket: null,
        chest:  { x: 50, y: py(SY + 126), w: px(112), h: py(188) },
        full:   { x: 50, y: py(SY + 168), w: px(126), h: py(280) },
        neck:   { x: 50, y: py(neckY + 10), w: px(120), h: py(46) },
        back:   { x: 50, y: py((SY + hemY) / 2), w: px(210), h: py(280) },
        cuffs:  []
      };
    }
    const cuffMidX = base.chestHalf + (base.shoulderHalf + base.sleeveFlare * 0.8 - base.chestHalf) / 2;
    const cuffY = sleeveEndY - 26;
    return {
      robe: false,
      /* flap strip runs down the placket from under the neckline */
      flap:   { x: 50, y: py(neckY + 108), w: px(64), h: py(196) },
      pocket: base.pocket ? { x: px(250 + 52), y: py(SY + 116), w: px(40), h: py(48) }
                          : { x: px(250 + 52), y: py(SY + 112), w: px(40), h: py(48) },
      chest:  { x: 50, y: py(SY + 130), w: px(110), h: py(150) },
      neck:   { x: 50, y: py(neckY + 12), w: px(96), h: py(36) },
      back:   { x: 50, y: py((SY + hemY) / 2), w: px(130), h: py(220) },
      cuffs: [
        { x: 50 - px(cuffMidX), y: py(cuffY), w: px(52), h: py(30) },
        { x: 50 + px(cuffMidX), y: py(cuffY), w: px(52), h: py(30) }
      ]
    };
  }

  /* HTML for one masked design overlay tinted with the thread colour.
     rot=true turns the design 90° (wide bands running down the placket, etc.) */
  function overlay(a, url, color, rot) {
    if (!a) return "";
    /* 1.32 = stage aspect (660/500): keeps rotated boxes the same visual size */
    const w = rot ? a.h * 1.32 : a.w, h = rot ? a.w / 1.32 : a.h;
    const tf = rot ? "translate(-50%,-50%) rotate(90deg)" : "translate(-50%,-50%)";
    return `<div class="design-overlay" style="left:${a.x}%;top:${a.y}%;width:${w}%;height:${h}%;transform:${tf};` +
      `background-color:${color};-webkit-mask-image:url('${url}');mask-image:url('${url}');"></div>`;
  }

  return { build, anchors, overlay, shade, PRESET };
})();
