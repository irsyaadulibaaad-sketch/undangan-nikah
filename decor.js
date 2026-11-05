// ==========================================================================
// DEKORASI TAMBAHAN — Irsyaadul & Refalina   (decor.js)
// File TAMBAHAN: tidak mengubah HTML/CSS/JS yang sudah ada. Hanya MENAMBAH
// lapisan dekorasi (SVG) di belakang konten tiap section.
// Semua gambar berupa SVG yang dibuat lewat kode (tanpa emoji).
// ==========================================================================
(function () {
  'use strict';
  if (window.__dcInit) return;
  window.__dcInit = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.innerWidth < 560;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function f(n) { return Math.round(n * 10) / 10; }

  // ---------- Definisi bersama (gradasi & bentuk bunga/kelopak) ----------
  var DEFS =
    '<svg aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="dc-sage" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B2C4A2"/><stop offset="1" stop-color="#7E9370"/></linearGradient>' +
    '<linearGradient id="dc-sage2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C6D3B6"/><stop offset="1" stop-color="#93A682"/></linearGradient>' +
    '<radialGradient id="dc-blush" cx="0.5" cy="0.85" r="0.95"><stop offset="0" stop-color="#FFF3F6"/><stop offset="0.55" stop-color="#F6BFCF"/><stop offset="1" stop-color="#E58BA6"/></radialGradient>' +
    '<radialGradient id="dc-blush2" cx="0.5" cy="0.8" r="0.9"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F7D0DB"/></radialGradient>' +
    '<radialGradient id="dc-gold" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#FBEFD0"/><stop offset="0.6" stop-color="#D9BB80"/><stop offset="1" stop-color="#9E7A3E"/></radialGradient>' +
    '<linearGradient id="dc-wingA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBD3DD"/><stop offset="1" stop-color="#E58BA6"/></linearGradient>' +
    '<linearGradient id="dc-wingB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFEBB0"/><stop offset="1" stop-color="#DDA93A"/></linearGradient>' +
    '<g id="dc-petal"><path d="M10 0 C20 8 18 22 10 28 C2 22 0 8 10 0Z" fill="url(#dc-blush)" stroke="rgba(201,164,92,0.45)" stroke-width="0.5"/><path d="M10 4 Q10.6 14 10 24" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="0.7"/></g>' +
    '<g id="dc-petal-gold"><path d="M10 0 C20 8 18 22 10 28 C2 22 0 8 10 0Z" fill="url(#dc-gold)" opacity="0.9"/><path d="M10 4 Q10.6 14 10 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.7"/></g>' +
    '<g id="dc-star"><path d="M0 -10 Q1.4 -1.4 10 0 Q1.4 1.4 0 10 Q-1.4 1.4 -10 0 Q-1.4 -1.4 0 -10Z" fill="url(#dc-gold)"/></g>' +
    '<g id="dc-blossom">' +
      '<g id="dc-bl-outer"><path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush)" stroke="rgba(201,164,92,0.55)" stroke-width="0.5"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush)" stroke="rgba(201,164,92,0.55)" stroke-width="0.5" transform="rotate(60)"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush)" stroke="rgba(201,164,92,0.55)" stroke-width="0.5" transform="rotate(120)"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush)" stroke="rgba(201,164,92,0.55)" stroke-width="0.5" transform="rotate(180)"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush)" stroke="rgba(201,164,92,0.55)" stroke-width="0.5" transform="rotate(240)"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush)" stroke="rgba(201,164,92,0.55)" stroke-width="0.5" transform="rotate(300)"/></g>' +
      '<g transform="rotate(30) scale(0.62)" opacity="0.95"><path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush2)"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush2)" transform="rotate(72)"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush2)" transform="rotate(144)"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush2)" transform="rotate(216)"/>' +
      '<path d="M0 0 C-6.5 -5 -6.5 -15 0 -19 C6.5 -15 6.5 -5 0 0Z" fill="url(#dc-blush2)" transform="rotate(288)"/></g>' +
      '<circle r="3.3" fill="url(#dc-gold)"/><circle cx="1.2" cy="-1" r="0.7" fill="#FFF8E0"/>' +
    '</g>' +
    '</defs></svg>';

  // ---------- Pembuat ranting daun (kurva bezier + daun berpasangan) ----------
  function sprig(seed) {
    var P = seed ? [[8, -4], [96, 34], [40, 150], [128, 252]] : [[6, -4], [124, 26], [66, 160], [156, 248]];
    function bz(t) {
      var u = 1 - t;
      return [u*u*u*P[0][0] + 3*u*u*t*P[1][0] + 3*u*t*t*P[2][0] + t*t*t*P[3][0],
              u*u*u*P[0][1] + 3*u*u*t*P[1][1] + 3*u*t*t*P[2][1] + t*t*t*P[3][1]];
    }
    function dv(t) {
      var u = 1 - t;
      return [3*u*u*(P[1][0]-P[0][0]) + 6*u*t*(P[2][0]-P[1][0]) + 3*t*t*(P[3][0]-P[2][0]),
              3*u*u*(P[1][1]-P[0][1]) + 6*u*t*(P[2][1]-P[1][1]) + 3*t*t*(P[3][1]-P[2][1])];
    }
    var s = '<svg viewBox="-20 -20 230 290" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    var d = 'M' + P[0][0] + ' ' + P[0][1] + ' C' + P[1][0] + ' ' + P[1][1] + ' ' + P[2][0] + ' ' + P[2][1] + ' ' + P[3][0] + ' ' + P[3][1];
    s += '<path d="' + d + '" fill="none" stroke="#86996F" stroke-width="2.2" stroke-linecap="round"/>';
    s += '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.6" stroke-linecap="round" transform="translate(0.8 0)"/>';
    var N = 15, i;
    for (i = 0; i < N; i++) {
      var t = 0.1 + 0.86 * i / (N - 1), p = bz(t), v = dv(t);
      var ang = Math.atan2(v[1], v[0]) * 180 / Math.PI;
      var sc = 1.05 - 0.5 * t, side = (i % 2) ? 1 : -1;
      var fill = (i % 3 === 0) ? 'url(#dc-sage2)' : 'url(#dc-sage)';
      s += '<g transform="translate(' + f(p[0]) + ' ' + f(p[1]) + ') rotate(' + f(ang + side * 58) + ') scale(' + f(sc) + ')">' +
           '<path d="M0 0 C4 -7 15 -8.5 24 0 C15 8.5 4 7 0 0Z" fill="' + fill + '" opacity="0.96"/>' +
           '<path d="M2 0 L20 0" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/></g>';
    }
    [0.3, 0.56, 0.8].forEach(function (t, k) {
      var p = bz(t), q = [p[0] + (k % 2 ? 12 : -11), p[1] + 8];
      s += '<path d="M' + f(p[0]) + ' ' + f(p[1]) + ' Q' + f(p[0] + (k % 2 ? 4 : -4)) + ' ' + f(p[1] + 8) + ' ' + f(q[0]) + ' ' + f(q[1]) + '" fill="none" stroke="#86996F" stroke-width="1"/>' +
           '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="2.8" fill="url(#dc-gold)"/>';
    });
    var b1 = bz(0.5), tip = bz(1), b2 = bz(0.74);
    s += '<g class="dc-bl" style="animation-delay:-1.2s"><use href="#dc-blossom" transform="translate(' + f(b1[0] + (seed ? -16 : 18)) + ' ' + f(b1[1] - 4) + ') scale(0.95)"/></g>';
    s += '<g class="dc-bl"><use href="#dc-blossom" transform="translate(' + f(tip[0]) + ' ' + f(tip[1]) + ') scale(1.3)"/></g>';
    s += '<g class="dc-bl" style="animation-delay:-3s"><use href="#dc-blossom" transform="translate(' + f(b2[0] + (seed ? 14 : -15)) + ' ' + f(b2[1] + 4) + ') scale(0.62)"/></g>';
    return s + '</svg>';
  }
  var SPRIG_A = sprig(0), SPRIG_B = sprig(1);

  // ---------- Potongan HTML dekorasi ----------
  function sparkles(n) {
    var h = '';
    for (var i = 0; i < n; i++) {
      h += '<span class="dc-spark" style="--x:' + f(rnd(3, 96)) + '%;--y:' + f(rnd(4, 94)) + '%;--w:' + f(rnd(7, 15)) + 'px;--d:' + f(rnd(3, 5.6)) +
           's;--dl:' + f(-rnd(0, 5)) + 's"><svg viewBox="-11 -11 22 22" aria-hidden="true"><use href="#dc-star"/></svg></span>';
    }
    return h;
  }
  function petals(n) {
    var h = '';
    for (var i = 0; i < n; i++) {
      var d = rnd(18, 32), gold = Math.random() < 0.22;
      h += '<span class="dc-petal" style="--x:' + f(rnd(2, 96)) + '%;--d:' + f(d) + 's;--dl:' + f(-rnd(0, d)) + 's;--sw:' + f(rnd(-50, 60)) +
           'px;--w:' + f(rnd(10, 17)) + 'px;--sd:' + f(rnd(3.6, 6.4)) + 's;--r0:' + Math.round(rnd(-70, -10)) + 'deg;--r1:' + Math.round(rnd(30, 90)) +
           'deg"><svg viewBox="0 0 20 28" aria-hidden="true"><use href="#' + (gold ? 'dc-petal-gold' : 'dc-petal') + '"/></svg></span>';
    }
    return h;
  }
  function corners() {
    return '<div class="dc-corner tl">' + SPRIG_A + '</div><div class="dc-corner tr">' + SPRIG_B + '</div>';
  }
  function build(o) {
    var half = small ? 0.5 : 1;
    var h = '';
    if (o.grain !== false) h += '<div class="dc-grain"></div>';
    if (o.glow) h += '<div class="dc-glow g1"></div><div class="dc-glow g2"></div>';
    if (o.beam) h += '<div class="dc-beam b1"></div><div class="dc-beam b2"></div>';
    if (o.vine !== false) h += '<div class="dc-vine vl"></div><div class="dc-vine vr"></div>';
    if (o.fade !== false) h += '<div class="dc-fade"></div>';
    if (o.corners !== false) h += corners();
    h += sparkles(Math.max(2, Math.round((o.sparks || 6) * half)));
    if (o.petals) h += petals(Math.max(2, Math.round(o.petals * half)));
    return h;
  }
  function attach(host, o) {
    if (!host || host.querySelector(':scope > .dc-layer')) return null;
    var layer = document.createElement('div');
    layer.className = 'dc-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = build(o);
    host.insertBefore(layer, host.firstChild);
    return layer;
  }

  // ---------- Tambahan khusus taman: kupu-kupu & serbuk cahaya ----------
  var BUTTERFLY =
    '<svg class="dc-bf" viewBox="0 0 40 30" width="30" height="22" aria-hidden="true"><g class="dc-wing">' +
    '<g><path d="M20 14 C24 2 38 0 37 10 C36 16 28 17 20 14Z" fill="url(#dc-wingA)"/><path d="M20 15 C27 16 33 20 30 26 C27 29 22 24 20 15Z" fill="url(#dc-wingB)"/><circle cx="31" cy="8" r="1.6" fill="rgba(255,255,255,0.7)"/></g>' +
    '<g transform="translate(40 0) scale(-1 1)"><path d="M20 14 C24 2 38 0 37 10 C36 16 28 17 20 14Z" fill="url(#dc-wingA)"/><path d="M20 15 C27 16 33 20 30 26 C27 29 22 24 20 15Z" fill="url(#dc-wingB)"/><circle cx="31" cy="8" r="1.6" fill="rgba(255,255,255,0.7)"/></g>' +
    '</g><ellipse cx="20" cy="15" rx="1.1" ry="6" fill="#6E5B3A"/>' +
    '<path d="M20 9.5 Q17 4 14 3.5 M20 9.5 Q23 4 26 3.5" fill="none" stroke="#6E5B3A" stroke-width="0.6"/></svg>';
  function gardenExtras(garden) {
    if (!garden || garden.querySelector('.dc-fly')) return;
    var gw = (garden.clientWidth || 780) + 60;
    garden.style.setProperty('--gw', gw + 'px');
    var h = '', i, n = small ? 2 : 3;
    for (i = 0; i < n; i++) {
      var dur = rnd(26, 42);
      h += '<span class="dc-fly' + (i % 2 ? ' rev' : '') + '" style="top:' + f(rnd(26, 58)) + '%;--dur:' + f(dur) + 's;--dl:' + f(-rnd(0, dur)) +
           's"><span class="dc-bob" style="--bd:' + f(rnd(2.8, 4.2)) + 's">' + BUTTERFLY + '</span></span>';
    }
    var m = small ? 8 : 14;
    for (i = 0; i < m; i++) {
      h += '<span class="dc-mote" style="--x:' + f(rnd(4, 96)) + '%;--y:' + f(rnd(38, 82)) + '%;--w:' + f(rnd(3, 6)) + 'px;--d:' + f(rnd(7, 12)) +
           's;--dl:' + f(-rnd(0, 10)) + 's;--dx:' + Math.round(rnd(-20, 24)) + 'px"></span>';
    }
    var box = document.createElement('div');
    box.innerHTML = h;
    while (box.firstChild) garden.appendChild(box.firstChild);
  }

  // ---------- Pasang ke setiap bagian ----------
  var layers = [];
  function reg(host, layer) { if (layer) layers.push({ host: host, layer: layer }); }

  var body = document.body;
  var defsBox = document.createElement('div');
  defsBox.innerHTML = DEFS;
  body.insertBefore(defsBox.firstChild, body.firstChild);

  var cover = document.getElementById('cover');
  reg(cover, attach(cover, { glow: true, vine: false, sparks: 9, petals: 7, grain: false, fade: false }));

  var map = [
    ['.hero-section',        { glow: true, beam: true, sparks: 9, petals: 9 }],
    ['.venue-section',       { beam: true, sparks: 7, petals: 4 }],
    ['.rsvp-section',        { sparks: 6, petals: 5 }],
    ['.taman-section',       { glow: true, sparks: 6, petals: 5 }],
    ['.faq-section',         { sparks: 6, petals: 3 }],
    ['.interactive-section', { sparks: 6, petals: 3 }]
  ];
  map.forEach(function (m) {
    var el = document.querySelector(m[0]);
    reg(el, attach(el, m[1]));
  });
  var foot = document.querySelector('footer');
  if (foot) { foot.classList.add('dc-host'); reg(foot, attach(foot, { sparks: 5, petals: 2, vine: false })); }

  gardenExtras(document.querySelector('.css-garden'));

  // jarak jatuh kelopak mengikuti tinggi masing-masing bagian
  function setFall() {
    layers.forEach(function (x) {
      var h = (x.host === cover ? window.innerHeight : x.host.offsetHeight) || 900;
      x.layer.style.setProperty('--fall', (h + 70) + 'px');
    });
    var g = document.querySelector('.css-garden');
    if (g) g.style.setProperty('--gw', ((g.clientWidth || 780) + 60) + 'px');
  }
  setFall();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(setFall, 200); });
  window.addEventListener('load', function () { setFall(); setTimeout(setFall, 1500); });

  // jeda animasi saat bagian tidak terlihat (hemat baterai)
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        for (var i = 0; i < layers.length; i++) {
          if (layers[i].host === e.target) layers[i].layer.classList.toggle('dc-off', !e.isIntersecting);
        }
      });
    }, { threshold: 0 });
    layers.forEach(function (x) { io.observe(x.host); });
  }

  // ---------- Percikan kelopak kecil saat disentuh ----------
  if (!reduce) {
    var burst = document.createElement('div');
    burst.className = 'dc-burst';
    burst.setAttribute('aria-hidden', 'true');
    body.appendChild(burst);
    var lastB = 0;
    document.addEventListener('pointerdown', function (e) {
      var now = Date.now();
      if (now - lastB < 180) return;
      lastB = now;
      var n = small ? 5 : 7;
      for (var i = 0; i < n; i++) {
        var a = rnd(0, 6.283), r = rnd(26, 62), el = document.createElement('span'), star = Math.random() < 0.4;
        el.className = 'dc-bp';
        el.style.cssText = 'left:' + e.clientX + 'px;top:' + e.clientY + 'px;--w:' + f(star ? rnd(8, 13) : rnd(9, 14)) + 'px;--dx:' + f(Math.cos(a) * r) +
          'px;--dy:' + f(Math.sin(a) * r - 12) + 'px;--r:' + Math.round(rnd(-160, 160)) + 'deg';
        el.innerHTML = star
          ? '<svg viewBox="-11 -11 22 22"><use href="#dc-star"/></svg>'
          : '<svg viewBox="0 0 20 28"><use href="#' + pick(['dc-petal', 'dc-petal', 'dc-petal-gold']) + '"/></svg>';
        el.addEventListener('animationend', function () { if (this.parentNode) this.parentNode.removeChild(this); });
        burst.appendChild(el);
      }
    }, { passive: true });
  }
})();
