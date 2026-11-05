// ==========================================================================
// ANIMASI AIR MANCUR (AIR TERJUN BERTINGKAT) — Garden of Prayers  (v2)
// File TAMBAHAN (tidak menyentuh app.js / garden.js / style.css).
//
// Berbeda dari versi 1 (ratusan partikel = terlihat seperti hujan & berat),
// versi ini menggambar air sebagai LEMBARAN tembus pandang (sheet) yang
// meluap dari tiap tier, dengan guratan aliran yang bergerak ke bawah.
// Bentuk digambar sekali (Path2D), tiap frame hanya menggeser guratan,
// jadi jauh lebih ringan. Percikan hanya sedikit, di titik air jatuh.
// ==========================================================================
(function () {
  'use strict';

  function init() {
    var fountain = document.querySelector('.fountain');
    if (!fountain || typeof Path2D === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var W = 340, H = 280;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var canvas = document.createElement('canvas');
    canvas.className = 'fountain-fx';
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    function sizeCanvas() { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    sizeCanvas();
    fountain.appendChild(canvas);
    fountain.classList.add('fx-on');

    // ---- Geometri dunia -> layar ----
    // x kanan, z ke arah penonton, h tinggi dari permukaan kolam.
    var OX = 170, OY = 270, P0 = 29, K = 0.21, G = 430;
    var H_POOL = 0, H_T2 = 101, H_T3 = 137, H_TOP = 165;
    function SX(x) { return OX + x; }
    function SY(z, h) { return OY - (P0 + h - K * z); }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    // ---- Lembaran air yang meluap dari tepi tier ----
    function buildCurtain(r0, h0, vo, hs, nLines) {
      var T = Math.sqrt(2 * (h0 - hs) / G), rl = r0 + vo * T, N = 30, STEPS = 9, i, j, s, r, h, th;
      var fill = new Path2D();
      for (i = 0; i <= N; i++) {
        th = Math.PI * i / N;
        var x = SX(r0 * Math.cos(th)), y = SY(r0 * Math.sin(th), h0);
        if (i === 0) fill.moveTo(x, y); else fill.lineTo(x, y);
      }
      for (j = 1; j <= STEPS; j++) {                       // tepi kiri turun (parabola)
        s = j / STEPS; r = r0 + vo * T * s; h = h0 - (h0 - hs) * s * s;
        fill.lineTo(SX(-r), SY(0, h));
      }
      for (i = N; i >= 0; i--) {                           // garis jatuh (busur bawah)
        th = Math.PI * i / N;
        fill.lineTo(SX(rl * Math.cos(th)), SY(rl * Math.sin(th), hs));
      }
      for (j = STEPS - 1; j >= 0; j--) {                   // tepi kanan naik
        s = j / STEPS; r = r0 + vo * T * s; h = h0 - (h0 - hs) * s * s;
        fill.lineTo(SX(r), SY(0, h));
      }
      fill.closePath();

      var groups = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      for (var k = 0; k < nLines; k++) {
        th = Math.PI * (k + 0.5 + rnd(-0.3, 0.3)) / nLines;
        var g = groups[k % 4], vv = vo * rnd(0.88, 1.12);
        for (j = 0; j <= 10; j++) {
          s = j / 10; r = r0 + vv * T * s; h = h0 - (h0 - hs) * s * s;
          var px = SX(r * Math.cos(th)), py = SY(r * Math.sin(th), h);
          if (j === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
      }
      var foam = new Path2D();
      foam.ellipse(OX, SY(0, hs), rl, K * rl, 0, 0, Math.PI);
      var yTop = SY(0, h0), yBot = SY(rl, hs);
      var grad = ctx.createLinearGradient(0, yTop, 0, yBot);
      grad.addColorStop(0, 'rgba(232,246,253,0.60)');
      grad.addColorStop(0.35, 'rgba(196,228,246,0.40)');
      grad.addColorStop(0.8, 'rgba(205,234,248,0.36)');
      grad.addColorStop(1, 'rgba(240,250,255,0.66)');
      return { fill: fill, groups: groups, foam: foam, grad: grad, rl: rl, hs: hs };
    }
    var curT3 = buildCurtain(34, H_T3, 18, H_T2, 24);     // tier-3 -> tier-2
    var curT2 = buildCurtain(62, H_T2, 24, H_POOL, 54);   // tier-2 -> kolam

    // spesifikasi guratan aliran (pola putus-putus yang digeser = air mengalir)
    var SPEC = [
      { arr: [13, 8, 5, 14, 17, 7], lw: 1.5, a: 0.62, sp: 230 },
      { arr: [8, 17, 12, 9],        lw: 1.1, a: 0.50, sp: 190 },
      { arr: [20, 10, 6, 18],       lw: 1.7, a: 0.50, sp: 270 },
      { arr: [6, 12, 15, 8, 9, 16], lw: 1.2, a: 0.45, sp: 210 }
    ];

    // ---- Semburan puncak: lengkung parabola yang jatuh ke tier-3 ----
    var jetA = new Path2D(), jetB = new Path2D(), jetC = new Path2D(), JET_APEX_H = 0;
    (function () {
      var vh = 190, t = (vh + Math.sqrt(vh * vh + 2 * G * (H_TOP - H_T3))) / G;
      JET_APEX_H = H_TOP + vh * vh / (2 * G);
      var list = [[0, 0]], n = 9, i, s, ph;
      for (i = 0; i < n; i++) { ph = i * 2 * Math.PI / n + 0.4; s = (i % 2 ? 24 : 13) * rnd(0.9, 1.05); list.push([s * Math.cos(ph), s * Math.sin(ph) * 0.85]); }
      list.forEach(function (c, idx) {
        var p = idx === 0 ? jetC : (idx % 2 ? jetA : jetB);
        for (var j = 0; j <= 26; j++) {
          var tt = t * j / 26, x = c[0] * tt, z = c[1] * tt, h = H_TOP + vh * tt - 0.5 * G * tt * tt;
          if (h < H_T3) h = H_T3;
          var px = SX(x), py = SY(z, h);
          if (j === 0) p.moveTo(px, py); else p.lineTo(px, py);
        }
      });
    })();

    // ---- Percikan (sedikit saja) & riak ----
    var spray = [], ripples = [], MAX_SPRAY = 70;
    function addSpray(x, z, h, vx, vz, vh, surf, size) {
      if (spray.length >= MAX_SPRAY) return;
      spray.push({ x: x, z: z, h: h, vx: vx, vz: vz, vh: vh, surf: surf, sz: size });
    }
    function addRipple(x, z, h, r0, max, life, front) {
      if (ripples.length >= 26) return;
      ripples.push({ x: x, z: z, h: h, age: 0, life: life, r0: r0, max: max, front: front });
    }
    var acc = { pool: 0, t2: 0, t3: 0, apex: 0, rip: 0, base: 0 };

    function update(dt) {
      var th, r;
      acc.pool += 24 * dt; acc.t2 += 9 * dt; acc.t3 += 9 * dt; acc.apex += 12 * dt;
      while (acc.pool >= 1) { acc.pool -= 1; th = rnd(0.05, Math.PI - 0.05); r = curT2.rl + rnd(-4, 4);
        addSpray(r * Math.cos(th), r * Math.sin(th), 1, rnd(-14, 14), rnd(-6, 12), rnd(45, 105), H_POOL, rnd(0.9, 1.7)); }
      while (acc.t2 >= 1) { acc.t2 -= 1; th = rnd(0.05, Math.PI - 0.05); r = curT3.rl + rnd(-3, 3);
        addSpray(r * Math.cos(th), r * Math.sin(th), H_T2 + 1, rnd(-9, 9), rnd(-4, 8), rnd(30, 62), H_T2, rnd(0.8, 1.3)); }
      while (acc.t3 >= 1) { acc.t3 -= 1; th = rnd(0, 6.283); r = rnd(6, 22);
        addSpray(r * Math.cos(th), r * Math.sin(th) * 0.8, H_T3 + 1, rnd(-8, 8), rnd(-5, 5), rnd(28, 56), H_T3, rnd(0.8, 1.2)); }
      while (acc.apex >= 1) { acc.apex -= 1; th = rnd(0, 6.283);
        addSpray(0, 0, JET_APEX_H - 4, Math.cos(th) * rnd(6, 20), Math.sin(th) * rnd(4, 14), rnd(-10, 14), H_T3, rnd(0.8, 1.3)); }
      acc.rip += 5 * dt;
      while (acc.rip >= 1) { acc.rip -= 1; th = rnd(0.1, Math.PI - 0.1); r = curT2.rl;
        addRipple(r * Math.cos(th), r * Math.sin(th), H_POOL, 2, 12, 0.9, false); }
      acc.base += dt;
      if (acc.base >= 1.1) { acc.base = 0; addRipple(0, 0, H_POOL, 30, 46, 1.9, true); }

      for (var i = spray.length - 1; i >= 0; i--) {
        var p = spray[i];
        p.vh -= G * dt; p.x += p.vx * dt; p.z += p.vz * dt; p.h += p.vh * dt;
        if (p.vh < 0 && p.h <= p.surf) {
          if (p.surf === H_POOL && Math.random() < 0.15) addRipple(p.x, p.z, H_POOL, 1, 7, 0.6, false);
          spray[i] = spray[spray.length - 1]; spray.pop();
        }
      }
      for (var k = ripples.length - 1; k >= 0; k--) {
        ripples[k].age += dt;
        if (ripples[k].age >= ripples[k].life) { ripples[k] = ripples[ripples.length - 1]; ripples.pop(); }
      }
    }

    // ---- Render ----
    function strokeDashed(path, spec, time, extra, color) {
      ctx.setLineDash(spec.arr);
      ctx.lineDashOffset = -time * spec.sp;
      ctx.lineWidth = spec.lw + extra;
      ctx.strokeStyle = color;
      ctx.stroke(path);
    }
    function drawCurtain(c, time, shimmer) {
      ctx.setLineDash([]);
      ctx.globalAlpha = shimmer;
      ctx.fillStyle = c.grad; ctx.fill(c.fill);
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(110,162,200,0.30)'; ctx.stroke(c.fill);
      ctx.globalAlpha = 1;
      for (var g = 0; g < 4; g++) {
        var sp = SPEC[g];
        strokeDashed(c.groups[g], sp, time, 1.8, 'rgba(100,155,195,0.20)');
        strokeDashed(c.groups[g], sp, time, 0, 'rgba(250,253,255,' + sp.a + ')');
      }
      // busa di titik air jatuh
      ctx.setLineDash([3, 5, 2, 7]); ctx.lineDashOffset = -time * 14;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.stroke(c.foam);
      ctx.setLineDash([]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.stroke(c.foam);
    }

    function draw(time) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      // riak
      var i, rp, u, r;
      for (i = 0; i < ripples.length; i++) {
        rp = ripples[i]; u = rp.age / rp.life; r = rp.r0 + (rp.max - rp.r0) * u;
        ctx.beginPath();
        ctx.ellipse(SX(rp.x), SY(rp.z, rp.h), r, K * r, 0, 0, rp.front ? Math.PI : Math.PI * 2);
        ctx.setLineDash([]); ctx.lineWidth = rp.front ? 1.6 : 1.1;
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - u)).toFixed(3) + ')';
        ctx.stroke();
      }

      var shimmer = 0.92 + 0.08 * Math.sin(time * 2.6);
      drawCurtain(curT2, time, shimmer);
      drawCurtain(curT3, time * 1.1, shimmer);

      // semburan puncak
      ctx.setLineDash([16, 7, 9, 12]); ctx.lineDashOffset = -time * 300;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(110,165,205,0.22)'; ctx.stroke(jetC);
      ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(250,253,255,0.80)'; ctx.stroke(jetC);
      ctx.setLineDash([9, 12, 15, 7]); ctx.lineDashOffset = -time * 260;
      ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(110,165,205,0.22)'; ctx.stroke(jetA);
      ctx.lineWidth = 1.7; ctx.strokeStyle = 'rgba(250,253,255,0.88)'; ctx.stroke(jetA);
      ctx.setLineDash([12, 9, 7, 14]); ctx.lineDashOffset = -time * 280;
      ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(110,165,205,0.22)'; ctx.stroke(jetB);
      ctx.lineWidth = 1.7; ctx.strokeStyle = 'rgba(250,253,255,0.88)'; ctx.stroke(jetB);
      ctx.setLineDash([]);

      // percikan: satu kali fill untuk semua titik
      ctx.beginPath();
      for (i = 0; i < spray.length; i++) {
        var p = spray[i], x = SX(p.x), y = SY(p.z, p.h);
        ctx.moveTo(x + p.sz, y); ctx.arc(x, y, p.sz, 0, 6.2832);
      }
      ctx.fillStyle = 'rgba(244,251,255,0.9)'; ctx.fill();
    }

    // ---- Loop ----
    var visible = true, last = 0, time = 0, raf = 0, slow = 0, downscaled = false;
    function frame(now) {
      raf = 0;
      if (!visible) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now; time += dt;
      // bila perangkat lambat, turunkan resolusi canvas satu kali
      if (!downscaled) {
        slow = dt > 0.034 ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 45 && dpr > 1) { dpr = 1; sizeCanvas(); downscaled = true; }
      }
      update(dt); draw(time);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } }

    for (var w = 0; w < 60; w++) { time += 1 / 60; update(1 / 60); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting; if (visible) start();
      }, { threshold: 0 }).observe(fountain);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
