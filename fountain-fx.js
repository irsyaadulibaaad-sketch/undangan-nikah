// ==========================================================================
// ANIMASI AIR MANCUR REALISTIS — Garden of Prayers
// File TAMBAHAN (tidak menyentuh app.js / garden.js / style.css).
// Simulasi partikel 3D sederhana: gravitasi, lengkungan parabola, air meluap
// dari tier atas ke tier bawah ke kolam, cipratan, dan riak air.
// ==========================================================================
(function () {
  'use strict';

  function init() {
    var fountain = document.querySelector('.fountain');
    if (!fountain) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ---- Canvas (tidak mengubah elemen yang ada, hanya menambah satu anak) ----
    var W = 340, H = 280;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var canvas = document.createElement('canvas');
    canvas.className = 'fountain-fx';
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    fountain.appendChild(canvas);
    fountain.classList.add('fx-on');

    // ---- Geometri (sama dengan style.css setelah fountain-fix.css) ----
    // Dunia: x kanan, z ke arah penonton, h tinggi dari permukaan kolam.
    // Layar: x = 170 + x ; y = 270 - (29 + h - K*z)
    var OX = 170, OY = 270, P0 = 29, K = 0.21, G = 430;
    var H_POOL = 0, H_T2 = 101, H_T3 = 137, H_TOP = 165;
    var MAX_P = 1100;

    var parts = [], ripples = [];

    function rnd(a, b) { return a + Math.random() * (b - a); }

    // ---- Nozzle luapan di tepi tier ----
    function makeNozzles(n, r, h, rate, surf, type, vmin, vmax) {
      var arr = [], a0 = -0.12, a1 = Math.PI + 0.12;
      for (var i = 0; i < n; i++) {
        var th = a0 + (a1 - a0) * (i + 0.5 + rnd(-0.3, 0.3)) / n;
        arr.push({ th: th, r: r, h: h, rate: rate, surf: surf, type: type,
                   vmin: vmin, vmax: vmax, acc: Math.random(), ph: Math.random() * 6.28 });
      }
      return arr;
    }
    var nozzles = []
      .concat(makeNozzles(14, 32, H_T3 - 2, 20, H_T2, 1, 12, 26))
      .concat(makeNozzles(26, 60, H_T2 - 2, 22, H_POOL, 2, 15, 30));
    var jetAcc = 0;

    function advance(p, t) {
      p.vh -= G * t; p.x += p.vx * t; p.z += p.vz * t; p.h += p.vh * t;
    }

    function spawnJet(tau) {
      var f = rnd(0, 6.2832), s = Math.pow(Math.random(), 0.6) * 24;
      var p = { type: 0, x: 0, z: 0, h: H_TOP, vx: Math.cos(f) * s, vz: Math.sin(f) * s * 0.8,
                vh: rnd(180, 212), surf: H_T3 };
      advance(p, tau); parts.push(p);
    }
    function spawnNozzle(n, tau) {
      var th = n.th + rnd(-0.02, 0.02), r = n.r + rnd(-1.5, 1.5);
      var v = rnd(n.vmin, n.vmax), c = Math.cos(th), s = Math.sin(th);
      var p = { type: n.type, x: c * r, z: s * r, h: n.h, vx: c * v, vz: s * v, vh: rnd(-6, 4), surf: n.surf };
      advance(p, tau); parts.push(p);
    }
    function spawnSplash(x, z, surf, power) {
      if (parts.length >= MAX_P) return;
      var a = rnd(0, 6.2832), v = rnd(10, 38);
      parts.push({ type: 3, x: x, z: z, h: surf + 0.5,
        vx: Math.cos(a) * v, vz: Math.sin(a) * v * 0.7,
        vh: rnd(45, 85) * power, surf: surf });
    }
    function addRipple(x, z, surf, big) {
      if (ripples.length > 46) return;
      ripples.push({ x: x, z: z, h: surf, age: 0, life: big ? 1.1 : 0.8, max: big ? 20 : 11 });
    }

    function land(p) {
      if (p.type === 0) {
        if (Math.random() < 0.55) addRipple(p.x, p.z, H_T3, false);
        if (Math.random() < 0.7) spawnSplash(p.x, p.z, H_T3, 0.6);
      } else if (p.type === 1) {
        if (Math.random() < 0.12) addRipple(p.x, p.z, H_T2, false);
        if (Math.random() < 0.4) spawnSplash(p.x, p.z, H_T2, 0.75);
      } else if (p.type === 2) {
        if (Math.random() < 0.09) addRipple(p.x, p.z, H_POOL, true);
        if (Math.random() < 0.55) spawnSplash(p.x, p.z, H_POOL, 1.0);
        if (Math.random() < 0.18) spawnSplash(p.x, p.z, H_POOL, 1.25);
      }
    }

    function update(dt, time) {
      jetAcc += 150 * dt;
      while (jetAcc >= 1) { jetAcc -= 1; if (parts.length < MAX_P) spawnJet(Math.random() * dt); }
      for (var i = 0; i < nozzles.length; i++) {
        var n = nozzles[i];
        n.acc += n.rate * (0.78 + 0.22 * Math.sin(time * 2.3 + n.ph)) * dt;
        while (n.acc >= 1) { n.acc -= 1; if (parts.length < MAX_P) spawnNozzle(n, Math.random() * dt); }
      }
      for (var j = parts.length - 1; j >= 0; j--) {
        var p = parts[j];
        advance(p, dt);
        if (p.vh < 0 && p.h <= p.surf) {
          p.h = p.surf; land(p);
          parts[j] = parts[parts.length - 1]; parts.pop();
        }
      }
      for (var k = ripples.length - 1; k >= 0; k--) {
        ripples[k].age += dt;
        if (ripples[k].age >= ripples[k].life) { ripples[k] = ripples[ripples.length - 1]; ripples.pop(); }
      }
    }

    // ---- Render ----
    function sx(x) { return OX + x; }
    function sy(z, h) { return OY - (P0 + h - K * z); }

    function ring(h, r, w, a, front) {
      ctx.beginPath();
      ctx.ellipse(OX, sy(0, h), r, K * r, 0, 0, front ? Math.PI : Math.PI * 2);
      ctx.lineWidth = w; ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.stroke();
    }

    function drawBatch(list, tail, wCore, coreA) {
      if (!list.length) return;
      ctx.beginPath();
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var x1 = sx(p.x), y1 = sy(p.z, p.h);
        var x0 = sx(p.x - p.vx * tail), y0 = sy(p.z - p.vz * tail, p.h - p.vh * tail);
        ctx.moveTo(x0, y0); ctx.lineTo(x1 + 0.01, y1);
      }
      ctx.lineCap = 'round';
      ctx.lineWidth = wCore + 1.6; ctx.strokeStyle = 'rgba(96,150,190,0.30)'; ctx.stroke();
      ctx.lineWidth = wCore; ctx.strokeStyle = 'rgba(240,249,255,' + coreA + ')'; ctx.stroke();
    }

    function draw(time) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // cincin busa lembut tempat air jatuh
      var pulse = 0.5 + 0.5 * Math.sin(time * 3.1);
      ring(H_POOL, 72, 6, 0.10 + 0.04 * pulse, true);
      ring(H_POOL, 72, 2.2, 0.20 + 0.08 * pulse, true);
      ring(H_T2, 40, 3, 0.16 + 0.05 * pulse, true);

      // riak
      for (var i = 0; i < ripples.length; i++) {
        var rp = ripples[i], u = rp.age / rp.life, r = 2 + rp.max * u;
        ctx.beginPath();
        ctx.ellipse(sx(rp.x), sy(rp.z, rp.h), r, K * r, 0, 0, Math.PI * 2);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - u)).toFixed(3) + ')';
        ctx.stroke();
      }

      // partikel dikelompokkan per jenis (batch) agar ringan di HP
      var jet = [], t3 = [], t2 = [], sp = [];
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        (p.type === 0 ? jet : p.type === 1 ? t3 : p.type === 2 ? t2 : sp).push(p);
      }
      drawBatch(t2, 0.040, 1.5, 0.80);
      drawBatch(t3, 0.040, 1.4, 0.82);
      drawBatch(jet, 0.028, 2.0, 0.88);
      drawBatch(sp, 0.022, 1.3, 0.92);
    }

    // ---- Loop (berhenti saat tidak terlihat) ----
    var visible = true, last = 0, time = 0, raf = 0;
    function frame(now) {
      raf = 0;
      if (!visible) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now; time += dt;
      update(dt, time); draw(time);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } }

    // pemanasan agar aliran sudah penuh saat pertama terlihat
    for (var w = 0; w < 90; w++) { time += 1 / 60; update(1 / 60, time); }

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
