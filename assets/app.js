/* CosmicTouch app: routing, views, quiz, settings. Plain scripts, no build step, so it runs on GitHub Pages
   (and straight from a double-clicked index.html). */
(function () {
  "use strict";

  var CT = window.CT, P = CT.data.PLANETS, Q = CT.data.QUIZ, art = CT.art, fx = CT.fx;
  var rand = fx.rand, pick = fx.pick;
  var $ = function (id) { return document.getElementById(id); };

  var MAXD = Math.max.apply(null, P.map(function (p) { return p.d; }));
  var MAXR = Math.max.apply(null, P.map(function (p) { return p.r; }));
  var MAXY = Math.max.apply(null, P.map(function (p) { return p.y; }));
  var MINT = Math.min.apply(null, P.map(function (p) { return p.t; }));
  var MAXT = Math.max.apply(null, P.map(function (p) { return p.t; }));
  /* the body circle fills this much of a planet's 120 box (rings stick out past it) */
  var BODY_R = { saturn: 34, uranus: 40 };

  /* ---------- tiny helpers ---------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k, v;
    for (k in attrs || {}) {
      v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    (kids || []).forEach(function (c) { if (c != null) e.append(c); });
    return e;
  }
  function icon(name, cls) { return art.el(art.ico(name, cls)); }
  function planetEl(key, px, opts) { return art.el(art.planet(key, px, opts)); }
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: fine */ } }
  function ordinal(n) { return n + (["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]); }
  function num(n, digits) { return n.toLocaleString(undefined, { maximumFractionDigits: digits == null ? 1 : digits }); }
  function pct(v) { return v < 1 ? "<1%" : Math.round(v) + "%"; }
  function indexOfKey(key) { for (var i = 0; i < P.length; i++) if (P[i].key === key) return i; return -1; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
  function otherTone(tone) {
    var list = fx.TONE_LIST.filter(function (t) { return t !== tone; });
    return pick(list);
  }
  /* planet size for the bubble field / orrery so every body circle has the same visual weight */
  function visualBox(key, bodyDia) { return bodyDia * 120 / (2 * (BODY_R[key] || 46)); }

  /* ---------- settings (saved in localStorage when it is available) ---------- */
  var settings = load("ct.settings", {}) || {};
  var favorites = (load("ct.favs", []) || []).filter(function (n) { return P.some(function (p) { return p.n === n; }); });
  var lastCalm = null;

  function theme() { return settings.theme || (mq("(prefers-color-scheme: dark)") ? "dark" : "light"); }
  function isCalm() { return settings.calm == null ? mq("(prefers-reduced-motion: reduce)") : !!settings.calm; }
  function flag(name, on) {
    var d = document.documentElement;
    if (on) d.setAttribute("data-" + name, ""); else d.removeAttribute("data-" + name);
  }
  function setTool(id, on, name) {
    var b = $(id);
    b.setAttribute("aria-pressed", String(on));
    b.replaceChildren(icon(name));
  }
  function applySettings() {
    var t = theme(), c = isCalm(), s = settings.sound !== false;
    document.documentElement.dataset.theme = t;
    flag("large", !!settings.large); flag("contrast", !!settings.contrast); flag("calm", c);
    fx.setSound(s); fx.setCalm(c);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#120637" : "#f3effd");
    setTool("t-theme", t === "dark", t === "dark" ? "moon" : "sun");
    setTool("t-sound", s, s ? "sound" : "mute");
    setTool("t-calm", c, "wave");
    $("big").checked = !!settings.large; $("hc").checked = !!settings.contrast;
    $("night").checked = t === "dark"; $("calm").checked = c; $("sfx").checked = s;
    if (c !== lastCalm) { lastCalm = c; onCalmChange(c); }
  }
  function change(key, value) {
    settings[key] = value;
    save("ct.settings", settings);
    applySettings();
  }

  /* ---------- speech (original feature, now with a friendly fallback instead of alert) ---------- */
  var speechToken = 0;
  function speak(text, glowEl) {
    if (!("speechSynthesis" in window)) { fx.toast("Audio reading is unavailable in this browser."); return; }
    stopAudio();
    var u = new SpeechSynthesisUtterance(text), mine = ++speechToken;
    u.onstart = function () { if (glowEl && mine === speechToken) glowEl.classList.add("speaking"); };
    u.onend = u.onerror = function () { if (glowEl && mine === speechToken) glowEl.classList.remove("speaking"); };
    window.speechSynthesis.speak(u);
  }
  function stopAudio() {
    speechToken++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    var live = document.querySelectorAll(".speaking");
    for (var i = 0; i < live.length; i++) live[i].classList.remove("speaking");
  }

  /* ---------- router: #/explore  #/planet/earth  #/compare/earth/mars  #/quiz  #/favorites  #/access ---------- */
  var SCREENS = { explore: "explore", planet: "details", compare: "compare", quiz: "quiz", favorites: "favorites", access: "access" };
  var TITLES = { compare: "Compare planets", quiz: "Space quiz", favorites: "My favorite planets", access: "Accessibility" };
  var BASE_TITLE = "CosmicTouch - Explore the Universe";
  var firstRoute = true, current = 0, exploreReady = false;

  function parseHash() {
    var parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return { name: parts[0] || "explore", args: parts.slice(1) };
  }
  function route() {
    var r = parseHash(), id, links, i;
    if (!SCREENS[r.name]) r = { name: "explore", args: [] };
    if (r.name === "planet") {
      r.index = indexOfKey(r.args[0]);
      if (r.index < 0) r = { name: "explore", args: [] };
    }
    id = SCREENS[r.name];
    stopAudio();
    var screens = document.querySelectorAll(".screen");
    for (i = 0; i < screens.length; i++) screens[i].hidden = screens[i].id !== id;
    links = document.querySelectorAll(".navlink");
    for (i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-route") === (id === "details" ? "explore" : id)) links[i].setAttribute("aria-current", "page");
      else links[i].removeAttribute("aria-current");
    }
    if (r.name === "explore") enterExplore();
    else if (r.name === "planet") showPlanet(r.index);
    else if (r.name === "compare") enterCompare(r.args);
    else if (r.name === "quiz") enterQuiz();
    else if (r.name === "favorites") renderFavorites();
    document.title = r.name === "planet" ? P[r.index].n + " - CosmicTouch" : (TITLES[r.name] ? TITLES[r.name] + " - CosmicTouch" : BASE_TITLE);
    if (!firstRoute) {
      window.scrollTo(0, 0);
      var head = $(id).querySelector("h1");
      if (head) head.focus({ preventScroll: true });
    }
    firstRoute = false;
  }

  /* ---------- explore: planet grid ---------- */
  function buildGrid() {
    var grid = $("grid");
    P.forEach(function (p, i) {
      grid.append(h("a", { class: "pcard", href: "#/planet/" + p.key, "aria-label": "Explore " + p.n }, [
        h("span", { class: "chip num", "aria-hidden": "true", text: String(i + 1) }),
        planetEl(p.key, 104),
        h("strong", { class: "shout shout-md name", text: p.n })
      ]));
    });
  }

  /* ---------- explore: the bubble field (poke, pop, gravity) ---------- */
  var hero = { field: null, popped: 0 };

  function heroScale() { return Math.max(0.62, Math.min(1.4, hero.field.w / 900)); }
  function bodyDims(p) {
    var dia = 40 + 66 * Math.sqrt(p.d / MAXD), box = visualBox(p.key, dia);
    var k = p.key === "saturn" ? 0.8 : p.key === "uranus" ? 0.72 : 0.78;
    return { box: box, r: box / 2 * k };
  }
  function makeBody(p, born, x, y) {
    var d = bodyDims(p), ratio = d.box / (2 * d.r);
    var inner = h("div", { class: "inner" + (born ? " born" : "") }, [planetEl(p.key, Math.round(d.box))]);
    inner.style.position = "absolute";
    inner.style.left = inner.style.top = (-(ratio - 1) / 2 * 100) + "%";
    inner.style.width = inner.style.height = ratio * 100 + "%";
    inner.addEventListener("animationend", function () { inner.classList.remove("born"); });
    var el = h("div", { class: "body", "data-name": p.n }, [inner]);
    el.style.borderRadius = "50%";
    var b = hero.field.add(el, d.r, x, y);
    b.p = p; el._b = b;
    return b;
  }
  function layoutSpread() {
    var f = hero.field, n = f.bodies.length;
    f.bodies.forEach(function (b, i) {
      b.x = (i + 0.5) / n * f.w;
      b.y = (i % 2 ? 0.66 : 0.34) * f.h;
      b.vx = rand(-30, 30); b.vy = rand(-30, 30);
    });
    f.render();
  }
  function popBody(b, x, y) {
    if (b.dead) return;
    b.dead = true;
    fx.sfx.pop();
    fx.burst(x, y, { n: 24, tones: [b.p.tone, "yellow", "lime", "orange"] });
    b.el.querySelector(".inner").classList.add("popped");
    hero.popped++;
    $("popped").textContent = "popped " + hero.popped;
    if (hero.popped === 10) fx.toast("rude. they grow back though.");
    if (hero.popped === 30) fx.toast("the sun would like a word.");
    setTimeout(function () { hero.field.remove(b); if (b.el.parentNode) b.el.parentNode.removeChild(b.el); }, 200);
    setTimeout(function () {
      /* the field measures 0 wide while you are on another screen, so fall back to a sane size */
      var f = hero.field, w = f.w || 600, hgt = f.h || 300;
      makeBody(b.p, true, rand(0.2, 0.8) * w, rand(0.2, 0.7) * hgt);
      if (isCalm()) hero.field.settle(90);
    }, rand(2200, 3400));
  }
  function buildField() {
    var host = $("field");
    hero.field = new fx.Field(host, { drift: 40, cruise: 26, repel: 95, bounce: 0.92 });
    hero.field.setScale(heroScale());
    P.forEach(function (p) { makeBody(p, false); });
    layoutSpread();
    if (isCalm()) hero.field.settle(150);
    host.addEventListener("pointerdown", function (e) { var t = e.target.closest(".body"); if (t) fx.sfx.tap(); });
    host.addEventListener("click", function (e) {
      var t = e.target.closest(".body");
      if (t && t._b) popBody(t._b, e.clientX, e.clientY);
    });
    $("gravity").addEventListener("click", function () {
      var on = $("gravity").getAttribute("aria-pressed") !== "true", o = hero.field.o;
      $("gravity").setAttribute("aria-pressed", String(on));
      $("gravity-text").textContent = "gravity: " + (on ? "on" : "off");
      o.gravity = on ? 1300 : 0; o.drift = on ? 0 : 40; o.cruise = on ? 0 : 26;
      o.friction = on ? 0.12 : 0; o.bounce = on ? 0.55 : 0.92;
      if (isCalm()) { layoutSpread(); hero.field.settle(on ? 320 : 120); }
      else if (on) fx.sfx.swoosh();
      else hero.field.bodies.forEach(function (b) { b.vx = rand(-90, 90); b.vy = rand(-160, -60); });
    });
    window.addEventListener("resize", function () {
      var s = heroScale();
      if (Math.abs(s - hero.field.scale) > 0.04) { hero.field.setScale(s); if (isCalm()) { layoutSpread(); hero.field.settle(120); } }
    });
  }

  /* ---------- explore: the whole family (orrery) ---------- */
  var NS = "http://www.w3.org/2000/svg";
  var ORBIT_R = P.map(function (p, i) { return 28 + i * 9; });
  var BODY_VB = [8.5, 10.5, 11, 9.5, 19, 16, 13, 13];
  var orr = { speed: 1, hover: -1, visible: true, last: 0, angle: [0.9, 2.4, 4.1, 5.5, 1.6, 3.3, 0.2, 4.7], g: [], size: [] };
  /* real year lengths, squished so Neptune still moves */
  var ORBIT_T = P.map(function (p) { return 3 + 4.2 * Math.sqrt(p.y / 88); });

  function svgNode(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function placeOrrery() {
    for (var i = 0; i < P.length; i++) {
      var x = 100 + ORBIT_R[i] * Math.cos(orr.angle[i]), y = 100 + ORBIT_R[i] * Math.sin(orr.angle[i]);
      orr.g[i].setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ")");
    }
    if (orr.hover >= 0) {
      var i2 = orr.hover, rect = orr.host.getBoundingClientRect(), k = rect.width / 200;
      var px = (100 + ORBIT_R[i2] * Math.cos(orr.angle[i2])) * k, py = (100 + ORBIT_R[i2] * Math.sin(orr.angle[i2]) - orr.size[i2] * 0.62) * k;
      orr.tip.style.transform = "translate(" + px.toFixed(1) + "px," + (py - 8).toFixed(1) + "px) translate(-50%,-100%)";
    }
  }
  function setSpeed(v) {
    orr.speed = v;
    var chips = document.querySelectorAll("[data-speed]");
    for (var i = 0; i < chips.length; i++) chips[i].setAttribute("aria-pressed", String(+chips[i].getAttribute("data-speed") === v));
  }
  function buildOrrery() {
    var host = $("orrery"), svg = svgNode("svg", { viewBox: "0 0 200 200", class: "sys", "aria-hidden": "true" });
    orr.host = host;
    P.forEach(function (p, i) { svg.appendChild(svgNode("circle", { class: "orbit", cx: 100, cy: 100, r: ORBIT_R[i] })); });
    var sun = art.el(art.sun(120));
    sun.setAttribute("x", 80); sun.setAttribute("y", 80); sun.setAttribute("width", 40); sun.setAttribute("height", 40);
    svg.appendChild(sun);
    orr.tip = h("div", { class: "tip", "aria-hidden": "true" });
    P.forEach(function (p, i) {
      var box = visualBox(p.key, BODY_VB[i]), g = svgNode("g", { class: "pl" });
      var pl = art.el(art.planet(p.key, 26, { lite: true }));
      pl.setAttribute("x", -box / 2); pl.setAttribute("y", -box / 2); pl.setAttribute("width", box); pl.setAttribute("height", box);
      g.appendChild(svgNode("circle", { class: "ring", r: Math.max(box * 0.5, 7) }));
      g.appendChild(pl);
      g.addEventListener("pointerenter", function () { orr.hover = i; orr.tip.textContent = p.n; orr.tip.classList.add("on"); placeOrrery(); });
      g.addEventListener("pointerleave", function () { orr.hover = -1; orr.tip.classList.remove("on"); });
      g.addEventListener("click", function () { fx.sfx.pop(); location.hash = "#/planet/" + p.key; });
      svg.appendChild(g);
      orr.g.push(g); orr.size.push(box);
    });
    host.append(svg, orr.tip);
    placeOrrery();
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { orr.visible = en[0].isIntersecting; }).observe(host);
    var chips = document.querySelectorAll("[data-speed]");
    Array.prototype.forEach.call(chips, function (c) { c.addEventListener("click", function () { setSpeed(+c.getAttribute("data-speed")); }); });
    function frame(t) {
      requestAnimationFrame(frame);
      var dt = orr.last ? Math.min(0.05, (t - orr.last) / 1000) : 0;
      orr.last = t;
      if (!orr.visible || document.hidden || orr.speed === 0) return;
      var k = orr.speed * (orr.hover >= 0 ? 0.12 : 1);
      for (var i = 0; i < P.length; i++) orr.angle[i] += dt * k * 6.2832 / ORBIT_T[i];
      placeOrrery();
    }
    requestAnimationFrame(frame);
    setSpeed(isCalm() ? 0 : 1);
  }

  function onCalmChange(c) {
    if (hero.field) {
      layoutSpread();
      if (c) hero.field.settle(150);
    }
    if (orr.host) setSpeed(c ? 0 : 1);
  }

  function enterExplore() {
    if (exploreReady) {
      /* coming back from another screen: pull any body that wandered outside the freshly measured field back in */
      var f = hero.field;
      f.measure();
      f.bodies.forEach(function (b) {
        if (b.x < 0 || b.y < 0 || b.x > f.w || b.y > f.h) { b.x = rand(0.2, 0.8) * f.w; b.y = rand(0.2, 0.8) * f.h; }
      });
      f.render();
      return;
    }
    exploreReady = true;
    buildGrid();
    buildField();
    buildOrrery();
    $("go-planets").addEventListener("click", function () {
      $("planets").scrollIntoView({ behavior: isCalm() ? "auto" : "smooth", block: "start" });
    });
  }

  /* ---------- planet details ---------- */
  var myAge = 12;
  var KIND = { mercury: "rocky planet", venus: "rocky planet", earth: "rocky planet", mars: "rocky planet",
    jupiter: "gas giant", saturn: "gas giant", uranus: "ice giant", neptune: "ice giant" };

  function bar(value, tone, label) {
    var b = h("div", { class: "bar", style: "--w:" + Math.max(0, Math.min(100, value)).toFixed(1) + "%" }, [
      h("div", { class: "fill tone-" + tone }),
      h("p", { class: "bar-label", text: label })
    ]);
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add("in"); }); });
    return b;
  }
  function statCard(label, value, unit, barEl, caption) {
    return h("div", { class: "card stat-card" }, [
      h("p", { class: "label", text: label }),
      h("p", { class: "stat" }, [value, unit ? h("span", { class: "unit", text: unit }) : null]),
      barEl,
      h("p", { class: "caption", text: caption })
    ]);
  }
  /* bars wear the planet's own colour so a bar, its icon and its name all agree */
  var FILL = { mercury: "lav", venus: "yellow", earth: "teal", mars: "orange", jupiter: "orange", saturn: "yellow", uranus: "teal", neptune: "violet" };
  function feel(t) {
    return t >= 400 ? "scorching" : t >= 100 ? "toasty" : t >= 0 ? "just right" : t >= -100 ? "chilly" : t >= -150 ? "freezing" : "frozen";
  }
  function fmtAge(v) { return v >= 10 ? num(v, 0) : v >= 1 ? num(v, 1) : v >= 0.01 ? num(v, 2) : "under 0.01"; }

  function toggleFavorite(p, btn) {
    var i = favorites.indexOf(p.n), now = i < 0;
    if (now) favorites.push(p.n); else favorites.splice(i, 1);
    save("ct.favs", favorites);
    btn.setAttribute("aria-pressed", String(now));
    btn.querySelector(".t").textContent = now ? "remove favorite" : "add favorite";
    if (now) {
      var r = btn.getBoundingClientRect();
      fx.sfx.good();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 18, tones: ["yellow", "lime"], power: 0.8 });
      fx.toast(p.n + " is in your favorites.");
    } else fx.toast(p.n + " is out of your favorites.");
  }

  function showPlanet(i) {
    current = i;
    var p = P[i], prev = P[(i + P.length - 1) % P.length], nxt = P[(i + 1) % P.length];
    var root = $("details-content"), isFav = favorites.indexOf(p.n) >= 0;
    root.replaceChildren();

    /* hero card */
    var planetBtn = h("div", { class: "pd-planet", role: "button", tabindex: "0", "aria-label": "Bounce " + p.n }, [
      h("div", { class: "squish" }, [planetEl(p.key, 280)])
    ]);
    function hop() {
      planetBtn.classList.remove("hop");
      void planetBtn.offsetWidth;
      planetBtn.classList.add("hop");
      fx.sfx.boing();
      var r = planetBtn.getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 16, tones: [p.tone, "yellow", "lime", "orange", "violet"], power: 0.7 });
    }
    planetBtn.addEventListener("click", hop);
    planetBtn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hop(); } });

    var decor = [[8, 14, 34], [82, 8, 22], [88, 58, 40], [4, 66, 26], [74, 84, 18]].map(function (d, k) {
      var b = h("i", { class: "fb tone-" + otherTone(p.tone), "aria-hidden": "true" });
      b.style.cssText = "left:" + d[0] + "%;top:" + d[1] + "%;width:" + d[2] + "px;height:" + d[2] + "px;animation-delay:-" + k * 1.3 + "s";
      return b;
    });
    var readBtn = h("button", { type: "button", class: "btn", id: "read" }, [icon("sound"), h("span", { text: "read aloud" })]);
    var stopBtn = h("button", { type: "button", class: "btn cream", id: "stop-read" }, [icon("stop"), h("span", { text: "stop audio" })]);
    var favBtn = h("button", { type: "button", class: "btn cream", id: "fav", "aria-pressed": String(isFav) }, [
      icon("star"), h("span", { class: "t", text: isFav ? "remove favorite" : "add favorite" })
    ]);
    readBtn.addEventListener("click", function () { speak(p.n + ". " + p.f + " " + p.x, planetBtn); });
    stopBtn.addEventListener("click", stopAudio);
    favBtn.addEventListener("click", function () { toggleFavorite(p, favBtn); });

    var heroCard = h("div", { class: "card pd-hero tone-" + p.tone }, [
      h("div", { class: "pd-stage" }, decor.concat([planetBtn])),
      h("h1", { class: "shout pd-name", id: "details-title", tabindex: "-1", text: p.n }),
      h("div", { class: "pd-chips" }, [
        h("span", { class: "chip tone-cream", text: ordinal(i + 1) + " from the sun" }),
        h("span", { class: "chip tone-cream", text: KIND[p.key] })
      ]),
      h("div", { class: "pd-actions" }, [readBtn, stopBtn, favBtn])
    ]);
    heroCard.addEventListener("pointermove", function (e) {
      var r = heroCard.getBoundingClientRect();
      planetBtn.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(2));
      planetBtn.style.setProperty("--py", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(2));
    });
    heroCard.addEventListener("pointerleave", function () { planetBtn.style.setProperty("--px", 0); planetBtn.style.setProperty("--py", 0); });

    /* facts + stats */
    var about = h("div", { class: "card pd-about" }, [
      h("p", { class: "label", text: "quick fact" }), h("p", { class: "lead", text: p.f }),
      h("p", { class: "label", text: "up close" }), h("p", { class: "lead", text: p.x })
    ]);
    var stats = h("div", { class: "pd-stats" }, [
      statCard("diameter", num(p.d, 0), "km",
        bar(p.d / MAXD * 100, FILL[p.key], p.d === MAXD ? "the biggest" : pct(p.d / MAXD * 100) + " of Jupiter"),
        "the bar compares its size with Jupiter, the biggest."),
      statCard("length of a year", num(p.y, 0), "earth days",
        bar(p.y / MAXY * 100, FILL[p.key], p.y === MAXY ? "the longest" : pct(p.y / MAXY * 100) + " of Neptune"),
        "the bar compares its year with Neptune's, the longest."),
      statCard("average distance from the sun", num(p.r, 1), "million km",
        bar(p.r / MAXR * 100, FILL[p.key], p.r === MAXR ? "the farthest" : pct(p.r / MAXR * 100) + " of Neptune"),
        "the bar compares its distance with Neptune, the farthest."),
      statCard("approximate average temperature", String(p.t), "°C",
        bar((p.t - MINT) / (MAXT - MINT) * 100, FILL[p.key], feel(p.t)),
        "the bar runs from " + MINT + " °C to " + MAXT + " °C.")
    ]);

    /* how old would you be here */
    var ageNum = h("span", { class: "n" });
    var ageUnit = h("span", { class: "unit", text: p.n + " years" });
    var ageSlider = h("input", { type: "range", id: "age", min: "1", max: "100", value: String(myAge), "aria-describedby": "age-note" });
    var ageOut = h("output", { for: "age", text: String(myAge) });
    function updateAge() {
      myAge = +ageSlider.value;
      ageOut.textContent = String(myAge);
      ageNum.textContent = fmtAge(myAge * 365 / p.y);
    }
    ageSlider.addEventListener("input", updateAge);
    ageSlider.addEventListener("change", function () { fx.sfx.tap(); });
    updateAge();
    var ageCard = h("div", { class: "card age-card" }, [
      h("p", { class: "label", text: "how old would you be here?" }),
      h("div", { class: "agerow" }, [h("label", { for: "age", text: "your age on earth" }), ageOut]),
      ageSlider,
      h("p", { class: "stat" }, [ageNum, ageUnit]),
      h("p", { class: "caption", id: "age-note", text: "a year on " + p.n + " lasts " + num(p.y, 0) + " earth days, so your birthdays come at a different pace." })
    ]);

    /* previous / next */
    function navBtn(target, cls, label, ic) {
      return h("a", { class: "navbtn " + cls, href: "#/planet/" + target.key }, [
        planetEl(target.key, 44), h("span", { class: "go" }, [h("small", { text: label }), target.n]), icon(ic)
      ]);
    }
    var nav = h("div", { class: "pd-nav" }, [navBtn(prev, "prev", "previous", "back"), navBtn(nxt, "next", "next", "fwd")]);

    root.append(h("div", { class: "pd" }, [heroCard, h("div", { class: "pd-main" }, [about, stats, ageCard]), nav]));
  }

  /* ---------- compare ---------- */
  var cmp = { ready: false };

  function cmpPlanet() {
    var orb = h("div", { class: "orb" }), name = h("p", { class: "cmp-name" }), sub = h("p", { class: "cmp-sub" });
    return { wrap: h("div", { class: "cmp-planet" }, [orb, name, sub]), orb: orb, name: name, sub: sub };
  }
  function compareLine(p, tone, text, value) {
    return h("div", { class: "cmp-line" }, [
      planetEl(p.key, 36), h("p", { class: "who", text: p.n }), bar(value, tone, text)
    ]);
  }
  function renderCompare() {
    var a = P[+$("a").value], b = P[+$("b").value];
    $("result").textContent = a.n + ": " + a.d.toLocaleString() + " km diameter; " + a.y.toLocaleString() + " Earth days per year. " +
      b.n + ": " + b.d.toLocaleString() + " km diameter; " + b.y.toLocaleString() + " Earth days per year. " +
      (a.d === b.d ? "They have equal diameters." : (a.d > b.d ? a.n : b.n) + " is larger.");

    /* the size stage: both planets to scale (the tiny one gets a minimum size so you can still see it) */
    var width = cmp.out.clientWidth, base = width < 520 ? 150 : width < 760 ? 190 : 230, maxd = Math.max(a.d, b.d);
    [a, b].forEach(function (p, idx) {
      var raw = p.d / maxd * base, s = Math.max(20, raw), e = cmp.planets[idx];
      e.orb.style.width = e.orb.style.height = s + "px";
      e.orb.replaceChildren(planetEl(p.key, Math.round(s)));
      e.name.textContent = p.n;
      e.sub.textContent = raw < 20 ? "even tinier than this" : num(p.d, 0) + " km wide";
    });

    /* verdict */
    var big = a.d >= b.d ? a : b, small = big === a ? b : a, chips = [];
    if (a.d === b.d) chips.push(h("span", { class: "chip tone-yellow", text: "same size, same everything?" }));
    else {
      chips.push(h("span", { class: "chip tone-yellow", text: num(big.d / small.d, 1) + "x wider" }));
      var longer = a.y >= b.y ? a : b, shorter = longer === a ? b : a;
      if (longer.y !== shorter.y) chips.push(h("span", { class: "chip tone-cream", text: "a year on " + longer.n + " is " + num(longer.y / shorter.y, 1) + "x longer" }));
    }
    cmp.verdict.replaceChildren(
      h("p", { class: "shout shout-md", text: a === b ? "that's the same planet twice" : a.d === b.d ? "a tie" : big.n + " is larger" }), chips[0], chips[1]);

    /* metric bars */
    var toneA = FILL[a.key], toneB = FILL[a.key] === FILL[b.key] ? (toneA === "yellow" ? "violet" : "yellow") : FILL[b.key];
    var rows = [
      ["diameter", "d", function (v) { return num(v, 0) + " km"; }, function (v, m) { return v / m * 100; }],
      ["length of a year", "y", function (v) { return num(v, 0) + " days"; }, function (v, m) { return v / m * 100; }],
      ["distance from the sun", "r", function (v) { return num(v, 1) + " million km"; }, function (v, m) { return v / m * 100; }],
      ["temperature", "t", function (v) { return v + " °C"; }, function (v) { return (v - MINT) / (MAXT - MINT) * 100; }]
    ];
    cmp.rows.replaceChildren.apply(cmp.rows, rows.map(function (r) {
      var m = Math.max(a[r[1]], b[r[1]]);
      return h("div", { class: "card cmp-row" }, [
        h("p", { class: "label", text: r[0] }),
        compareLine(a, toneA, r[2](a[r[1]]), r[3](a[r[1]], m)),
        compareLine(b, toneB, r[2](b[r[1]]), r[3](b[r[1]], m))
      ]);
    }));
  }
  function enterCompare(args) {
    if (!cmp.ready) {
      cmp.ready = true;
      P.forEach(function (p, i) {
        ["a", "b"].forEach(function (id) { $(id).append(h("option", { value: String(i), text: p.n })); });
      });
      $("a").value = "0"; $("b").value = "1";
      cmp.planets = [cmpPlanet(), cmpPlanet()];
      cmp.stage = h("div", { class: "cmp-stage", "aria-hidden": "true" }, [cmp.planets[0].wrap, h("div", { class: "vs", text: "vs" }), cmp.planets[1].wrap]);
      cmp.verdict = h("div", { class: "verdict" });
      cmp.rows = h("div", { class: "cmp-rows" });
      cmp.out = $("compare-out");
      cmp.out.append(cmp.stage, cmp.verdict, cmp.rows);
      var sync = function () {
        renderCompare();
        history.replaceState(null, "", "#/compare/" + P[+$("a").value].key + "/" + P[+$("b").value].key);
      };
      $("a").addEventListener("change", sync);
      $("b").addEventListener("change", sync);
      $("swap").addEventListener("click", function () {
        var t = $("a").value; $("a").value = $("b").value; $("b").value = t;
        sync();
      });
      $("compare-btn").addEventListener("click", function () { fx.sfx.pop(); renderCompare(); });
    }
    var ia = indexOfKey(args[0]), ib = indexOfKey(args[1]);
    if (ia >= 0 && ib >= 0) { $("a").value = String(ia); $("b").value = String(ib); }
    renderCompare();
  }

  /* ---------- quiz (the double-fire "next" bug from the original is gone) ---------- */
  var quiz = { qs: [], qi: 0, points: 0, streak: 0, answered: false, finished: false, jar: null };

  function jarRadius() { return Math.max(13, Math.min(22, quiz.jar.w * 0.092)); }
  function dropBubble() {
    var f = quiz.jar, r = jarRadius(), tone = CT.data.TONES[quiz.points % CT.data.TONES.length];
    var el = h("i", { class: "fb tone-" + tone, "aria-hidden": "true" });
    f.add(el, r / f.scale, f.w / 2 + rand(-24, 24), r + 6, rand(-50, 50), 0);
    if (isCalm()) f.settle(320);
  }
  function resetJar() {
    if (!quiz.jar) return;
    quiz.jar.bodies.slice().forEach(function (b) { if (b.el.parentNode) b.el.parentNode.removeChild(b.el); quiz.jar.remove(b); });
  }
  function updateJarLabels() {
    var total = quiz.qs.length;
    $("jar-wrap").setAttribute("aria-label", "Score jar: " + quiz.points + " of " + total + " correct");
    $("jar-caption").textContent = quiz.points + " of " + total + " right";
    $("streak").textContent = "streak " + quiz.streak;
  }
  function startQuiz() {
    quiz.qs = shuffle(Q.slice());
    quiz.qi = 0; quiz.points = 0; quiz.streak = 0; quiz.finished = false;
    resetJar();
    renderQuestion();
  }
  function setProgress(done, total, label) {
    $("progress-bar").style.setProperty("--w", (done / total * 100).toFixed(1) + "%");
    $("progress").textContent = label;
  }
  function renderQuestion() {
    quiz.answered = false;
    var q = quiz.qs[quiz.qi], total = quiz.qs.length;
    setProgress(quiz.qi, total, "Question " + (quiz.qi + 1) + " of " + total);
    $("question").textContent = q[0];
    $("feedback").textContent = ""; $("score").textContent = "";
    $("next").hidden = true;
    $("answers").replaceChildren();
    q[1].forEach(function (answer, i) {
      var b = h("button", { type: "button", class: "opt" }, [h("span", { text: answer })]);
      b.addEventListener("click", function () { answerQuestion(i, b); });
      $("answers").append(b);
    });
    updateJarLabels();
  }
  function markOption(btn, cls, ico, word) {
    btn.classList.add(cls);
    btn.append(h("span", { class: "tag" }, [icon(ico), word]));
  }
  /* after an answer: say if it was right, teach something about the planet, and offer a link on a miss */
  function showFeedback(text, q, linkIt) {
    var name = q[1][q[2]], pi = indexOfKey(name.toLowerCase()), fb = $("feedback");
    fb.replaceChildren(text + (pi >= 0 ? " " + P[pi].f : ""));
    if (linkIt && pi >= 0) fb.append(h("a", { class: "btn cream sm", href: "#/planet/" + P[pi].key }, ["see " + name]));
  }
  /* wait a beat so a screen reader finishes the feedback before focus jumps to the next button */
  function focusNextSoon() {
    setTimeout(function () {
      var a = document.activeElement;
      if (!$("next").hidden && (a === document.body || $("answers").contains(a))) $("next").focus({ preventScroll: true });
    }, 900);
  }
  function answerQuestion(i, btn) {
    if (quiz.answered) return;
    quiz.answered = true;
    var q = quiz.qs[quiz.qi], ok = i === q[2], opts = $("answers").querySelectorAll("button"), r = btn.getBoundingClientRect();
    opts.forEach(function (o, k) {
      o.disabled = true;
      if (k !== i && k !== q[2]) o.classList.add("dim");
    });
    if (ok) {
      quiz.points++; quiz.streak++;
      markOption(btn, "right", "check", "yes");
      showFeedback("Correct. Great space knowledge!", q);
      fx.sfx.good();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 28 });
      dropBubble();
      if (quiz.streak >= 2) { $("streak").classList.remove("hot"); void $("streak").offsetWidth; $("streak").classList.add("hot"); }
    } else {
      quiz.streak = 0;
      markOption(btn, "wrong", "cross", "nope");
      markOption(opts[q[2]], "right", "check", "this one");
      showFeedback("The correct answer is " + q[1][q[2]] + ".", q, true);
      fx.sfx.bad();
    }
    updateJarLabels();
    $("next").textContent = quiz.qi === quiz.qs.length - 1 ? "see results" : "next question";
    $("next").hidden = false;
    focusNextSoon();
  }
  function nextQuestion() {
    if (quiz.finished) { startQuiz(); return; }
    if (quiz.qi < quiz.qs.length - 1) { quiz.qi++; renderQuestion(); fx.sfx.swoosh(); return; }
    finishQuiz();
  }
  function finishQuiz() {
    quiz.finished = true;
    var total = quiz.qs.length, perfect = quiz.points === total;
    $("question").textContent = "Quiz complete.";
    $("answers").replaceChildren(h("div", { class: "result" }, [
      h("p", { class: "stat" }, [String(quiz.points), h("span", { class: "unit", text: "of " + total })])
    ]));
    setProgress(total, total, "Finished");
    $("feedback").textContent = "You scored " + quiz.points + " out of " + total + ".";
    $("score").textContent = perfect ? "Perfect score!" : "Keep exploring and try again!";
    $("next").textContent = "play again";
    $("next").hidden = false;
    focusNextSoon();
    var rr = $("next").getBoundingClientRect(), cx = window.innerWidth / 2;
    if (perfect) {
      fx.sfx.win();
      [0, 180, 360].forEach(function (d, k) { setTimeout(function () { fx.burst(cx + (k - 1) * 220, rr.top - 120, { n: 46, power: 1.5, big: 14 }); }, d); });
    } else if (quiz.points >= total * 0.6) {
      fx.sfx.good();
      fx.burst(cx, rr.top - 100, { n: 34, power: 1.2 });
    }
  }
  function enterQuiz() {
    if (!quiz.jar) {
      quiz.jar = new fx.Field($("jar"), { shape: "circle", gravity: 1500, bounce: 0.38, friction: 0.5 });
      $("next").addEventListener("click", nextQuestion);
    }
    if (!quiz.qs.length) startQuiz();
  }

  /* ---------- favorites ---------- */
  function renderFavorites() {
    var list = $("favlist");
    list.replaceChildren();
    if (!favorites.length) {
      list.append(h("div", { class: "card empty" }, [
        h("div", { class: "stage" }, [planetEl("mercury", 120), h("p", { class: "lead", text: "No favorites yet. Save a planet first." })]),
        h("a", { class: "btn", href: "#/explore" }, [icon("explore"), "find a planet"])
      ]));
      return;
    }
    favorites.forEach(function (name) {
      var i = P.findIndex(function (p) { return p.n === name; }), p = P[i];
      var rm = h("button", { type: "button", class: "chip toggle", "aria-label": "Remove " + p.n + " from favorites" }, [icon("cross"), "remove"]);
      rm.addEventListener("click", function () {
        favorites.splice(favorites.indexOf(p.n), 1);
        save("ct.favs", favorites);
        fx.sfx.tap();
        renderFavorites();
      });
      list.append(h("div", { class: "card fav-card tone-" + p.tone }, [
        h("a", { class: "fav-orb", href: "#/planet/" + p.key, tabindex: "-1", "aria-hidden": "true" }, [planetEl(p.key, 72)]),
        h("div", { class: "info" }, [
          h("a", { class: "shout fav-name", href: "#/planet/" + p.key, text: p.n }),
          rm
        ])
      ]));
    });
  }

  /* ---------- accessibility page + header tools ---------- */
  function buildControls() {
    $("big").addEventListener("change", function () { change("large", this.checked); });
    $("hc").addEventListener("change", function () { change("contrast", this.checked); });
    $("night").addEventListener("change", function () { change("theme", this.checked ? "dark" : "light"); });
    $("calm").addEventListener("change", function () { change("calm", this.checked); });
    $("sfx").addEventListener("change", function () { change("sound", this.checked); fx.sfx.pop(); });
    $("welcome-button").addEventListener("click", function () { speak("Welcome to CosmicTouch. Choose a planet to explore."); });
    $("stop-audio").addEventListener("click", stopAudio);
    $("t-theme").addEventListener("click", function () { change("theme", theme() === "dark" ? "light" : "dark"); fx.toast(theme() === "dark" ? "night mode is on." : "day mode is on."); });
    $("t-sound").addEventListener("click", function () { change("sound", settings.sound === false); fx.sfx.pop(); fx.toast(settings.sound === false ? "sound is off." : "sound is on."); });
    $("t-calm").addEventListener("click", function () {
      change("calm", !isCalm());
      fx.toast(isCalm() ? "calm motion is on. everything holds still." : "motion is back on.");
    });
  }

  /* ---------- scenery: stars, pointer + scroll parallax ---------- */
  function buildScenery() {
    var stars = $("stars"), i, s;
    for (i = 0; i < 46; i++) {
      s = document.createElement("i");
      s.style.left = rand(0, 100).toFixed(1) + "%"; s.style.top = rand(0, 100).toFixed(1) + "%";
      s.style.animationDelay = "-" + rand(0, 3.4).toFixed(2) + "s";
      s.style.width = s.style.height = rand(2, 5).toFixed(1) + "px";
      stars.appendChild(s);
    }
    var scene = document.querySelector(".scenery"), menu = document.querySelector(".menu"), pending = false, mx = 0, my = 0;
    function flush() {
      pending = false;
      scene.style.setProperty("--mx", mx.toFixed(3)); scene.style.setProperty("--my", my.toFixed(3));
      scene.style.setProperty("--sy", window.scrollY + "px");
      menu.classList.toggle("stuck", window.scrollY > 24);
    }
    function queue() { if (!pending) { pending = true; requestAnimationFrame(flush); } }
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; queue();
    }, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
  }

  /* ---------- keyboard: arrow keys flip between planets ---------- */
  function onKey(e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if ($("details").hidden || tag === "input" || tag === "select" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowLeft") location.hash = "#/planet/" + P[(current + P.length - 1) % P.length].key;
    else if (e.key === "ArrowRight") location.hash = "#/planet/" + P[(current + 1) % P.length].key;
  }

  /* ---------- go ---------- */
  function init() {
    fx.init();
    var marks = document.querySelectorAll("[data-ico]");
    for (var i = 0; i < marks.length; i++) marks[i].append(icon(marks[i].getAttribute("data-ico")));
    $("brand-mark").append(planetEl("logo", 46));
    buildControls();
    buildScenery();
    applySettings();
    document.addEventListener("click", function (e) {
      if (e.target.closest(".navlink, .btn, .chip.toggle, .round, .pcard, .navbtn")) fx.sfx.tap();
    });
    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", route);
    route();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
