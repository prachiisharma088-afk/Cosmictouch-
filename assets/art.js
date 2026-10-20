/* CosmicTouch art: planets, sun, brand mark and line icons, all drawn as inline SVG.
   Everything returned here is a trusted, static string (no user input ever reaches it). */
(function () {
  "use strict";

  var INK = "#0a0030", ORANGE = "#e0632b", TEAL = "#3daab8", YELLOW = "#ffd000",
      VIOLET = "#9457eb", LIME = "#cfff00", CREAM = "#f5ffcf", LAVENDER = "#e0d4fb";
  var uid = 0;

  /* outline width in viewBox units: about 5px on big planets, never thinner than 2.6px on tiny ones */
  function outline(px) {
    return Math.max(2.6, Math.min(5, px / 20)) * 120 / px;
  }

  /* the soft white gloss from the Gumdrop bubble: 34% x 22% ellipse at left 18% / top 14%, tilted -25deg */
  function gloss(R) {
    var box = R * 2, ex = 60 - R + box * 0.35, ey = 60 - R + box * 0.25;
    return '<ellipse cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" rx="' + (box * 0.17).toFixed(1) +
      '" ry="' + (box * 0.11).toFixed(1) + '" fill="#fff" opacity=".72" transform="rotate(-25 ' +
      ex.toFixed(1) + ' ' + ey.toFixed(1) + ')"/>';
  }

  function ringedParts(sw, ring) {
    var rs = (sw * 0.8).toFixed(2);
    var outer = "M4 60a56 15 0 0 0 112 0a56 15 0 0 0 -112 0z";
    var inner = "M18 60a42 9.5 0 0 0 84 0a42 9.5 0 0 0 -84 0z";
    return {
      back: '<g transform="rotate(-18 60 60)"><path fill-rule="evenodd" fill="' + ring + '" stroke="' + INK +
        '" stroke-width="' + rs + '" stroke-linejoin="round" d="' + outer + " " + inner + '"/></g>',
      front: '<g transform="rotate(-18 60 60)"><path fill="' + ring + '" stroke="' + INK + '" stroke-width="' + rs +
        '" stroke-linejoin="round" d="M4 60a56 15 0 0 0 112 0L102 60a42 9.5 0 0 1 -84 0z"/></g>'
    };
  }

  function planet(key, px, opts) {
    px = px || 100;
    opts = opts || {};
    var lite = !!opts.lite, sw = outline(px), thin = Math.max(1.5, sw * 0.55);
    var id = "cp" + (uid++), R = 46, fill = LAVENDER, details = "", back = "", front = "";

    switch (key) {
      case "mercury":
        details = '<circle cx="44" cy="46" r="8" fill="#cbbaf3"/><circle cx="74" cy="72" r="10" fill="#cbbaf3"/>' +
          (lite ? "" : '<circle cx="72" cy="40" r="5" fill="#cbbaf3"/><circle cx="48" cy="78" r="5" fill="#cbbaf3"/>');
        break;
      case "venus":
        fill = YELLOW;
        details = '<path d="M10 44q12-9 25 0t25 0t25 0t25 0M10 62q12-9 25 0t25 0t25 0t25 0M10 80q12-9 25 0t25 0t25 0t25 0" fill="none"/>';
        break;
      case "earth":
        fill = TEAL;
        details = '<path d="M36 34c10-9 24-6 26 3 2 8-8 11-6 20 1 7-7 10-14 4-9-8-14-19-6-27z" fill="' + LIME + '"/>' +
          '<path d="M72 62c8-5 16 0 15 9-1 9-9 14-16 10-6-4-6-15 1-19z" fill="' + LIME + '"/>';
        break;
      case "mars":
        fill = ORANGE;
        details = '<path d="M34 24c14-8 38-8 52 0c-10 9-42 9-52 0z" fill="' + CREAM + '"/>' +
          '<circle cx="46" cy="64" r="8" fill="none"/><circle cx="74" cy="52" r="5" fill="none"/>' +
          (lite ? "" : '<circle cx="68" cy="82" r="6" fill="none"/>');
        break;
      case "jupiter":
        fill = ORANGE;
        details = '<rect x="10" y="30" width="100" height="12" fill="' + YELLOW + '"/>' +
          '<rect x="10" y="50" width="100" height="9" fill="' + CREAM + '"/>' +
          '<rect x="10" y="68" width="100" height="14" fill="' + YELLOW + '"/>' +
          '<ellipse cx="78" cy="75" rx="10" ry="6.5" fill="' + ORANGE + '"/>';
        break;
      case "saturn":
      case "logo": {
        R = 34;
        fill = key === "logo" ? VIOLET : YELLOW;
        details = key === "logo" ? "" : '<path d="M20 52h80M22 70h76" fill="none"/>';
        var parts = ringedParts(sw, LIME);
        back = parts.back; front = parts.front;
        break;
      }
      case "uranus": {
        R = 40;
        fill = TEAL;
        details = '<path d="M20 50h80M24 72h72" fill="none"/>';
        var w = Math.max(4, sw * 1.2);
        var halfL = "M60 6A10 54 0 0 0 60 114", halfR = "M60 6A10 54 0 0 1 60 114";
        var ringBack = '<g transform="rotate(14 60 60)" fill="none" stroke-linecap="round">' +
          '<path d="' + halfL + '" stroke="' + INK + '" stroke-width="' + (w + thin * 2).toFixed(2) + '"/>' +
          '<path d="' + halfL + '" stroke="' + CREAM + '" stroke-width="' + w.toFixed(2) + '"/></g>';
        var ringFront = '<g transform="rotate(14 60 60)" fill="none" stroke-linecap="round">' +
          '<path d="' + halfR + '" stroke="' + INK + '" stroke-width="' + (w + thin * 2).toFixed(2) + '"/>' +
          '<path d="' + halfR + '" stroke="' + CREAM + '" stroke-width="' + w.toFixed(2) + '"/></g>';
        back = ringBack; front = ringFront;
        break;
      }
      case "neptune":
        fill = VIOLET;
        details = '<path d="M10 48q20-10 40 0t60 0" fill="none" stroke="' + CREAM + '"/>' +
          '<path d="M10 84q20-10 36 0t64-4" fill="none" stroke="' + CREAM + '"/>' +
          '<ellipse cx="46" cy="66" rx="9" ry="6" fill="' + INK + '" opacity=".85"/>';
        break;
    }

    return '<svg class="planet planet-' + key + '" viewBox="0 0 120 120" width="' + px + '" height="' + px +
      '" aria-hidden="true" focusable="false"><defs><clipPath id="' + id + '"><circle cx="60" cy="60" r="' + R +
      '"/></clipPath></defs>' + back +
      '<circle cx="60" cy="60" r="' + R + '" fill="' + fill + '"/>' +
      '<g clip-path="url(#' + id + ')" stroke="' + INK + '" stroke-width="' + thin.toFixed(2) +
      '" stroke-linecap="round" stroke-linejoin="round">' + details + '</g>' +
      '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="' + INK + '" stroke-width="' + sw.toFixed(2) + '"/>' +
      front + gloss(R) + '</svg>';
  }

  /* a happy sun for the orrery */
  function sun(px) {
    px = px || 120;
    var sw = outline(px), rays = "";
    for (var i = 0; i < 12; i++) {
      rays += '<path d="M60 8v9" transform="rotate(' + i * 30 + ' 60 60)"/>';
    }
    return '<svg class="planet planet-sun" viewBox="0 0 120 120" width="' + px + '" height="' + px +
      '" aria-hidden="true" focusable="false"><g stroke="' + INK + '" stroke-width="' + (sw * 0.8).toFixed(2) +
      '" stroke-linecap="round" fill="none">' + rays + '</g>' +
      '<circle cx="60" cy="60" r="40" fill="' + YELLOW + '" stroke="' + INK + '" stroke-width="' + sw.toFixed(2) + '"/>' +
      '<circle cx="47" cy="55" r="3.4" fill="' + INK + '"/><circle cx="73" cy="55" r="3.4" fill="' + INK + '"/>' +
      '<path d="M46 67q14 13 28 0" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<circle cx="40" cy="66" r="4.5" fill="' + ORANGE + '" opacity=".55"/><circle cx="80" cy="66" r="4.5" fill="' + ORANGE + '" opacity=".55"/>' +
      gloss(40) + '</svg>';
  }

  var ICONS = {
    explore: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10.2" ry="3.6" transform="rotate(-24 12 12)"/><circle class="dot" cx="19.6" cy="4.8" r="1.7"/>',
    compare: '<circle cx="8.2" cy="14.8" r="5.4"/><circle cx="17" cy="8.4" r="3.2"/><circle class="dot" cx="19.6" cy="18.6" r="1.7"/>',
    quiz: '<path d="M4 6.5c0-1.7 1.3-3 3-3h10c1.7 0 3 1.3 3 3v7c0 1.7-1.3 3-3 3h-5.3L8 20.3V16.5H7c-1.7 0-3-1.3-3-3z"/><path d="M9.6 8.8c.2-1.4 1.3-2.1 2.5-2.1 1.3 0 2.3.8 2.3 2 0 1.6-2.2 1.7-2.3 3.4"/><circle class="dot" cx="12.1" cy="13.8" r="1.2"/>',
    star: '<path d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.8 6.7 19.6l1.1-5.9L3.5 9.6l5.9-.8z"/>',
    access: '<circle class="dot" cx="12" cy="4.8" r="2"/><path d="M4.5 9.2c5 1.2 10 1.2 15 0M12 9.6v4.2M12 13.8l-3.2 6.2M12 13.8l3.2 6.2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5L7 7M17 17l1.5 1.5M18.5 5.5L17 7M7 17l-1.5 1.5"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/><circle class="dot" cx="17.5" cy="5.5" r="1.5"/>',
    sound: '<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M15.5 9c1.6 1.6 1.6 4.4 0 6M18.2 6.6c3 3 3 7.8 0 10.8"/>',
    mute: '<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    wave: '<path d="M2.8 9.5c2.4-3 4.8-3 7.2 0s4.8 3 7.2 0M2.8 15.5c2.4-3 4.8-3 7.2 0s4.8 3 7.2 0"/><circle class="dot" cx="20.2" cy="12.3" r="1.5"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="3"/>',
    back: '<path d="M19.5 12H5M11 5.8L4.8 12l6.2 6.2"/>',
    fwd: '<path d="M4.5 12H19M13 5.8l6.2 6.2L13 18.2"/>',
    check: '<path d="M4.6 12.8l5 4.8L19.6 6.6"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    swap: '<path d="M4 8.5h14.5M14.5 4.5l4 4-4 4M20 15.5H5.5M9.5 11.5l-4 4 4 4"/>',
    down: '<path d="M12 4.5v14M6 13l6 6 6-6"/>',
    spark: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/>',
    gem: '<path d="M7.2 4.5h9.6l4 4.8L12 20 3.2 9.3z"/><path d="M3.2 9.3h17.6M9.6 4.5L8 9.3 12 20l4-10.7-1.6-4.8"/>',
    redo: '<path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5M19.8 4.5v4.2h-4.2"/>'
  };

  function ico(name, cls) {
    return '<svg class="ico' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (ICONS[name] || "") + "</svg>";
  }

  /* trusted string -> element */
  function el(markup) {
    var t = document.createElement("template");
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  }

  window.CT = window.CT || {};
  window.CT.art = { planet: planet, sun: sun, ico: ico, el: el };
})();
