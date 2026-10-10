/* Kurt McAuliffe: portfolio interactions
   - Topographic contour background (marching squares over a synthetic terrain)
   - Generated map thumbnails for the project cards
   - Mobile nav, sticky-nav border, reveal-on-scroll */

(function () {
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  document.documentElement.classList.remove("no-js");
  document.getElementById("year").textContent = new Date().getFullYear();

  // Seeded RNG so the terrain is the same on every visit
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Contour background ---------- */
  function drawTopo() {
    var svg = document.getElementById("topo");
    if (!svg) return;
    var w = svg.clientWidth, h = svg.clientHeight;
    if (!w || !h) return;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var rand = rng(1979);
    var hills = [];
    for (var i = 0; i < 7; i++) {
      hills.push({
        x: (0.35 + rand() * 0.75) * w,
        y: rand() * h,
        r: (0.12 + rand() * 0.22) * Math.max(w, h),
        a: 0.5 + rand() * 0.8
      });
    }
    function height(x, y) {
      var z = 0;
      for (var k = 0; k < hills.length; k++) {
        var hk = hills[k], dx = x - hk.x, dy = y - hk.y;
        z += hk.a * Math.exp(-(dx * dx + dy * dy) / (2 * hk.r * hk.r));
      }
      z += 0.06 * Math.sin(x / 70) * Math.cos(y / 55) + 0.04 * Math.sin((x + y) / 37);
      return z;
    }

    var step = w < 700 ? 10 : 14;
    var cols = Math.ceil(w / step) + 1, rows = Math.ceil(h / step) + 1;
    var grid = new Float32Array(cols * rows), min = Infinity, max = -Infinity;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var v = height(c * step, r * step);
      grid[r * cols + c] = v;
      if (v < min) min = v; if (v > max) max = v;
    }

    var levels = 22;
    for (var L = 1; L < levels; L++) {
      var t = min + (max - min) * (L / levels), d = "";
      for (r = 0; r < rows - 1; r++) for (c = 0; c < cols - 1; c++) {
        var a = grid[r * cols + c], b = grid[r * cols + c + 1],
            cc = grid[(r + 1) * cols + c + 1], dd = grid[(r + 1) * cols + c];
        var idx = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (cc > t ? 2 : 0) | (dd > t ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var x0 = c * step, y0 = r * step;
        var top = [x0 + step * (t - a) / (b - a), y0];
        var right = [x0 + step, y0 + step * (t - b) / (cc - b)];
        var bottom = [x0 + step * (t - dd) / (cc - dd), y0 + step];
        var left = [x0, y0 + step * (t - a) / (dd - a)];
        var segs = {
          1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
          5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]],
          8: [[left, top]], 9: [[top, bottom]], 10: [[left, bottom], [top, right]],
          11: [[top, right]], 12: [[left, right]], 13: [[bottom, right]], 14: [[left, bottom]]
        }[idx];
        for (var s = 0; s < segs.length; s++) {
          d += "M" + segs[s][0][0].toFixed(1) + " " + segs[s][0][1].toFixed(1) +
               "L" + segs[s][1][0].toFixed(1) + " " + segs[s][1][1].toFixed(1);
        }
      }
      if (!d) continue;
      var p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("stroke-linecap", "round");
      if (L % 5 === 0) p.setAttribute("class", "index");
      svg.appendChild(p);
    }
  }

  /* ---------- Card thumbnails ---------- */
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function thumb(container, kind) {
    var W = 320, H = 180;
    var s = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMid slice" });
    var rand = rng(kind.length * 97);

    if (kind === "raster") {
      // Land-cover style classified raster
      var pal = ["#2f5d46", "#4f7f52", "#8fae6b", "#d9cf9a", "#c98f2a", "#3d7ea6"];
      var cell = 10;
      for (var y = 0; y < H; y += cell) for (var x = 0; x < W; x += cell) {
        var n = Math.sin(x / 41) + Math.cos(y / 29) + Math.sin((x - y) / 53) + rand() * 0.6;
        var i = Math.max(0, Math.min(pal.length - 1, Math.floor((n + 2.4) / 5.2 * pal.length)));
        if (Math.abs(y - 120 - Math.sin(x / 30) * 14) < 7) i = 5; // river
        el("rect", { x: x, y: y, width: cell, height: cell, fill: pal[i] }, s);
      }
    } else if (kind === "vector") {
      el("rect", { width: W, height: H, fill: "#efe9d7" }, s);
      var polys = [
        ["0,0 120,0 100,80 0,95", "#cfdcb4"], ["120,0 230,0 210,70 100,80", "#e5d39f"],
        ["230,0 320,0 320,90 210,70", "#b9cfa0"], ["0,95 100,80 140,180 0,180", "#d9e3c2"],
        ["100,80 210,70 250,180 140,180", "#f0c987"], ["210,70 320,90 320,180 250,180", "#cfdcb4"]
      ];
      polys.forEach(function (p) { el("polygon", { points: p[0], fill: p[1], stroke: "#fff", "stroke-width": 2 }, s); });
      el("path", { d: "M-10 140 C 80 120, 140 60, 330 40", stroke: "#3d7ea6", "stroke-width": 6, fill: "none", opacity: .85 }, s);
      el("path", { d: "M60 -10 L 160 190 M 0 60 L 330 120", stroke: "#fff", "stroke-width": 4, fill: "none" }, s);
      el("path", { d: "M60 -10 L 160 190 M 0 60 L 330 120", stroke: "#8a8676", "stroke-width": 1, "stroke-dasharray": "5 4", fill: "none" }, s);
      el("circle", { cx: 190, cy: 120, r: 46, fill: "#c98f2a", opacity: .18, stroke: "#c98f2a", "stroke-dasharray": "4 3" }, s);
      [[190, 120], [70, 50], [262, 52], [120, 150], [228, 150]].forEach(function (pt, k) {
        el("circle", { cx: pt[0], cy: pt[1], r: k ? 4.5 : 7, fill: k ? "#1f3a34" : "#c98f2a", stroke: "#fff", "stroke-width": 2 }, s);
      });
    } else if (kind === "db") {
      el("rect", { width: W, height: H, fill: "#1f3a34" }, s);
      // table
      el("rect", { x: 18, y: 22, width: 170, height: 136, rx: 8, fill: "#25463e", stroke: "#3b6457" }, s);
      el("rect", { x: 18, y: 22, width: 170, height: 24, rx: 8, fill: "#c98f2a" }, s);
      el("rect", { x: 18, y: 38, width: 170, height: 8, fill: "#c98f2a" }, s);
      for (var row = 0; row < 5; row++) {
        var yy = 58 + row * 20;
        el("rect", { x: 30, y: yy, width: 22, height: 8, rx: 2, fill: "#7fb6d6", opacity: .8 }, s);
        el("rect", { x: 62, y: yy, width: 50 + rand() * 30, height: 8, rx: 2, fill: "#ece8dc", opacity: .55 }, s);
        el("rect", { x: 140, y: yy, width: 34, height: 8, rx: 2, fill: "#e9b44c", opacity: .7 }, s);
      }
      // mini map fed by the table
      el("path", { d: "M188 90 C 205 90, 205 90, 214 90", stroke: "#e9b44c", "stroke-width": 2, fill: "none", "stroke-dasharray": "4 3" }, s);
      el("rect", { x: 214, y: 34, width: 90, height: 112, rx: 8, fill: "#2c5247", stroke: "#3b6457" }, s);
      for (var q = 0; q < 14; q++) {
        el("circle", { cx: 226 + rand() * 66, cy: 48 + rand() * 86, r: 3 + rand() * 3, fill: "#e9b44c", opacity: .85 }, s);
      }
    } else if (kind === "stats") {
      el("rect", { width: W, height: H, fill: "#f3efe2" }, s);
      // interpolated surface as nested contours
      var ramp = ["#e9eef0", "#c5dbe6", "#94c1d8", "#5f9fc2", "#3d7ea6", "#285f80"];
      ramp.forEach(function (col, k) {
        var rx = 150 - k * 22, ry = 90 - k * 13;
        el("ellipse", { cx: 190 - k * 4, cy: 96 + k * 2, rx: rx, ry: ry, fill: col, stroke: "#fff", "stroke-width": 1, opacity: .95 }, s);
      });
      for (var p2 = 0; p2 < 18; p2++) {
        el("circle", { cx: 20 + rand() * 280, cy: 16 + rand() * 148, r: 3, fill: "#1f3a34", stroke: "#fff", "stroke-width": 1.2 }, s);
      }
      // semivariogram inset
      el("rect", { x: 14, y: 112, width: 92, height: 56, rx: 6, fill: "#fffdf8", stroke: "#dcd5c3" }, s);
      el("path", { d: "M24 158 Q 52 122, 98 122", stroke: "#c98f2a", "stroke-width": 2, fill: "none" }, s);
      [[30, 150], [42, 138], [55, 131], [68, 125], [82, 123], [94, 121]].forEach(function (pt) {
        el("circle", { cx: pt[0], cy: pt[1], r: 2, fill: "#1f3a34" }, s);
      });
    }
    container.appendChild(s);
  }
  ["raster", "vector", "db", "stats"].forEach(function (k) {
    var node = document.querySelector(".card__map--" + k);
    if (node && !node.querySelector("img")) thumb(node, k);
  });

  /* ---------- Nav ---------- */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav__toggle");
  var links = document.getElementById("nav-links");
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    links.classList.toggle("is-open", !open);
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      links.classList.remove("is-open");
    }
  });
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (n) { io.observe(n); });
  } else {
    items.forEach(function (n) { n.classList.add("is-visible"); });
  }

  /* ---------- Draw + redraw contours ---------- */
  drawTopo();
  var t;
  window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(drawTopo, 150); });
})();
