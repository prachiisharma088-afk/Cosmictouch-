/* CosmicTouch fx: pop sounds, bubble confetti, cursor trail, a tiny bubble physics engine and toasts. */
(function () {
  "use strict";

  var TONES = { orange: "#e0632b", teal: "#3daab8", yellow: "#ffd000", violet: "#9457eb", lime: "#cfff00" };
  var TONE_LIST = Object.keys(TONES);
  var INK = "#0a0030";
  var state = { sound: true, calm: false };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[(Math.random() * list.length) | 0]; }

  /* ---------- sound: tiny synthesised blips, no audio files ---------- */
  var actx = null;
  function audio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = false; }
    }
    if (actx && actx.state === "suspended") actx.resume();
    return actx || null;
  }
  function blip(freq, dur, o) {
    if (!state.sound) return;
    var c = audio();
    if (!c) return;
    o = o || {};
    var t = c.currentTime + (o.delay || 0), osc = c.createOscillator(), gain = c.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * o.slide), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(o.vol || 0.14, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }
  var sfx = {
    pop: function () { blip(rand(420, 640), 0.13, { slide: 2.4, vol: 0.2 }); },
    tap: function () { blip(rand(300, 360), 0.07, { slide: 1.5, type: "triangle", vol: 0.12 }); },
    boing: function () { blip(180, 0.28, { slide: 2.6, type: "triangle", vol: 0.16 }); },
    good: function () { [523, 659, 784].forEach(function (f, i) { blip(f, 0.2, { delay: i * 0.075, type: "triangle", vol: 0.14 }); }); },
    bad: function () { blip(240, 0.28, { slide: 0.55, type: "sawtooth", vol: 0.07 }); },
    win: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { blip(f, 0.26, { delay: i * 0.09, type: "triangle", vol: 0.15 }); }); },
    swoosh: function () { blip(220, 0.18, { slide: 3, type: "sine", vol: 0.07 }); }
  };

  /* ---------- bubble confetti + cursor trail on one canvas ---------- */
  var cv, g, W = 0, H = 0, parts = [], raf = 0, lastT = 0;

  function resizeCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function frame(t) {
    var dt = Math.min(0.04, (t - lastT) / 1000 || 0.016);
    lastT = t;
    g.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += dt;
      if (p.life >= p.max || p.y > H + 40) { parts.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      p.vx *= 0.992;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      var k = 1 - p.life / p.max;
      g.globalAlpha = p.kind === "t" ? k * 0.9 : Math.min(1, k * 2.2);
      g.beginPath();
      g.arc(p.x, p.y, p.r * (p.kind === "t" ? 0.6 + k * 0.4 : 1), 0, 6.2832);
      g.fillStyle = p.c;
      g.fill();
      g.lineWidth = p.kind === "t" ? 1.6 : 2.4;
      g.strokeStyle = INK;
      g.stroke();
      if (p.kind === "b" && p.r > 6) {
        g.beginPath();
        g.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.22, 0, 6.2832);
        g.fillStyle = "rgba(255,255,255,.75)";
        g.fill();
      }
    }
    g.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(frame);
    else { raf = 0; g.clearRect(0, 0, W, H); }
  }
  function kick() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }

  /* x, y are viewport coordinates */
  function burst(x, y, o) {
    if (state.calm || !cv) return;
    o = o || {};
    var n = o.n || 26, power = o.power || 1, tones = o.tones || TONE_LIST;
    for (var i = 0; i < n; i++) {
      var a = rand(0, 6.2832), sp = rand(140, 460) * power;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 140 * power,
        r: rand(4, o.big || 11), c: TONES[pick(tones)], life: 0, max: rand(0.7, 1.4), grav: 1000, kind: "b" });
    }
    if (parts.length > 400) parts.splice(0, parts.length - 400);
    kick();
  }
  function trail(x, y) {
    if (state.calm || !cv) return;
    parts.push({ x: x, y: y, vx: rand(-14, 14), vy: rand(-50, -20), r: rand(3, 8), c: TONES[pick(TONE_LIST)],
      life: 0, max: rand(0.6, 1), grav: -30, kind: "t" });
    kick();
  }

  var tx = 0, ty = 0, tOn = false;
  function onMove(e) {
    if (e.pointerType !== "mouse") return;
    if (!tOn) { tOn = true; tx = e.clientX; ty = e.clientY; return; }
    var dx = e.clientX - tx, dy = e.clientY - ty;
    if (dx * dx + dy * dy > 1100) { tx = e.clientX; ty = e.clientY; trail(tx, ty); }
  }

  /* ---------- bubble physics ---------- */
  var fields = [];

  function Field(host, o) {
    this.host = host;
    this.o = { shape: "rect", gravity: 0, drift: 0, repel: 0, bounce: 0.9, friction: 0, cruise: 0, pad: 0 };
    for (var k in o) this.o[k] = o[k];
    this.bodies = [];
    this.scale = 1;
    this.w = 0; this.h = 0;
    this.ptr = null;
    this.visible = true;
    this.active = true;
    this.raf = 0;
    this.last = 0;
    var self = this;
    this.measure();
    if (window.ResizeObserver) new ResizeObserver(function () { self.measure(); }).observe(host);
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; }).observe(host);
    }
    host.addEventListener("pointermove", function (e) {
      var r = host.getBoundingClientRect();
      self.ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    host.addEventListener("pointerleave", function () { self.ptr = null; });
    fields.push(this);
    this.run();
  }
  Field.prototype.measure = function () {
    this.w = this.host.clientWidth;
    this.h = this.host.clientHeight;
  };
  Field.prototype.add = function (el, baseR, x, y, vx, vy) {
    var b = { el: el, base: baseR, r: baseR * this.scale,
      x: x == null ? rand(0.15, 0.85) * this.w : x, y: y == null ? rand(0.2, 0.8) * this.h : y,
      vx: vx == null ? rand(-30, 30) : vx, vy: vy == null ? rand(-30, 30) : vy };
    el.style.width = el.style.height = b.r * 2 + "px";
    this.host.appendChild(el);
    this.bodies.push(b);
    this.render();
    return b;
  };
  Field.prototype.remove = function (b) {
    var i = this.bodies.indexOf(b);
    if (i >= 0) this.bodies.splice(i, 1);
  };
  Field.prototype.setScale = function (s) {
    this.scale = s;
    this.bodies.forEach(function (b) {
      b.r = b.base * s;
      b.el.style.width = b.el.style.height = b.r * 2 + "px";
    });
    this.render();
  };
  Field.prototype.setActive = function (on) { this.active = on; };
  Field.prototype.step = function (dt) {
    var o = this.o, B = this.bodies, n = B.length, e = o.bounce, w = this.w, h = this.h, sub = 2, s, i, j, b;
    dt /= sub;
    for (s = 0; s < sub; s++) {
      for (i = 0; i < n; i++) {
        b = B[i];
        if (o.gravity) b.vy += o.gravity * dt;
        if (o.drift) { b.vx += rand(-1, 1) * o.drift * dt; b.vy += rand(-1, 1) * o.drift * dt; }
        if (o.cruise) {
          var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (sp < o.cruise * 0.6) { var a = rand(0, 6.2832); b.vx += Math.cos(a) * o.cruise * 0.4; b.vy += Math.sin(a) * o.cruise * 0.4; }
          else if (sp > o.cruise * 2.4) { b.vx *= 0.96; b.vy *= 0.96; }
        }
        if (this.ptr && o.repel) {
          var dx = b.x - this.ptr.x, dy = b.y - this.ptr.y, d = Math.sqrt(dx * dx + dy * dy), range = b.r + o.repel;
          if (d < range && d > 0.01) {
            var f = (1 - d / range) * 1500 * dt;
            b.vx += dx / d * f; b.vy += dy / d * f;
          }
        }
        if (o.friction) { var fr = 1 - o.friction * dt; b.vx *= fr; b.vy *= fr; }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (o.shape === "circle") {
          var cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - o.pad, ox = b.x - cx, oy = b.y - cy,
              dist = Math.sqrt(ox * ox + oy * oy) || 0.001;
          if (dist + b.r > R) {
            var nx = ox / dist, ny = oy / dist;
            b.x = cx + nx * (R - b.r); b.y = cy + ny * (R - b.r);
            var vn = b.vx * nx + b.vy * ny;
            if (vn > 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; }
          }
        } else {
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * e; }
          else if (b.x > w - b.r) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * e; }
          if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * e; }
          else if (b.y > h - b.r) {
            b.y = h - b.r; b.vy = -Math.abs(b.vy) * e;
            if (o.gravity) b.vx *= 0.985;
          }
        }
      }
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          var A = B[i], C = B[j], ddx = C.x - A.x, ddy = C.y - A.y, min = A.r + C.r, d2 = ddx * ddx + ddy * ddy;
          if (d2 < min * min && d2 > 0.0001) {
            var dd = Math.sqrt(d2), px = ddx / dd, py = ddy / dd, ov = min - dd,
                ma = A.r * A.r, mc = C.r * C.r, tm = ma + mc;
            A.x -= px * ov * mc / tm; A.y -= py * ov * mc / tm;
            C.x += px * ov * ma / tm; C.y += py * ov * ma / tm;
            var rv = (C.vx - A.vx) * px + (C.vy - A.vy) * py;
            if (rv < 0) {
              var imp = -(1 + e) * rv / (1 / ma + 1 / mc);
              A.vx -= imp * px / ma; A.vy -= imp * py / ma;
              C.vx += imp * px / mc; C.vy += imp * py / mc;
            }
          }
        }
      }
    }
  };
  Field.prototype.render = function () {
    for (var i = 0; i < this.bodies.length; i++) {
      var b = this.bodies[i];
      b.el.style.transform = "translate3d(" + (b.x - b.r).toFixed(1) + "px," + (b.y - b.r).toFixed(1) + "px,0)";
    }
  };
  /* run the sim without drawing so a pile is already settled (used for calm mode and the jar) */
  Field.prototype.settle = function (steps) {
    for (var i = 0; i < steps; i++) this.step(1 / 60);
    this.render();
  };
  Field.prototype.run = function () {
    var self = this;
    function loop(t) {
      self.raf = requestAnimationFrame(loop);
      if (state.calm || !self.active || !self.visible || document.hidden) { self.last = 0; return; }
      var dt = self.last ? Math.min(0.033, (t - self.last) / 1000) : 0.016;
      self.last = t;
      self.step(dt);
      self.render();
    }
    if (!this.raf) this.raf = requestAnimationFrame(loop);
  };

  /* ---------- toasts: surface-white, no outline, soft shadow, violet dot ---------- */
  function toast(message) {
    var box = document.getElementById("toasts");
    if (!box) return;
    var t = document.createElement("div"), dot = document.createElement("span"), body = document.createElement("div"),
        meta = document.createElement("div"), title = document.createElement("div");
    t.className = "toast";
    dot.className = "toast-dot"; dot.textContent = "c"; dot.setAttribute("aria-hidden", "true");
    meta.className = "toast-meta"; meta.textContent = "cosmictouch · now";
    title.className = "toast-title"; title.textContent = message;
    body.append(meta, title);
    t.append(dot, body);
    box.appendChild(t);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () {
      t.classList.add("out");
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 3600);
  }

  function setSound(on) { state.sound = !!on; }
  function setCalm(on) {
    state.calm = !!on;
    if (on) parts.length = 0;
  }
  function init() {
    cv = document.getElementById("fx");
    if (cv) {
      g = cv.getContext("2d");
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    /* browsers keep audio locked until a gesture; wake it on the first one */
    window.addEventListener("pointerdown", function () { if (state.sound) audio(); }, { once: true });
  }

  window.CT = window.CT || {};
  window.CT.fx = { TONES: TONES, TONE_LIST: TONE_LIST, sfx: sfx, burst: burst, trail: trail, Field: Field,
    toast: toast, setSound: setSound, setCalm: setCalm, init: init, rand: rand, pick: pick,
    isCalm: function () { return state.calm; } };
})();
