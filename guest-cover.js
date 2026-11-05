// ==========================================================================
// NAMA TAMU DI AMPLOP — guest-cover.js
// File TAMBAHAN. Tidak mengubah kode yang sudah ada.
// Tanpa nama di link  -> amplop tampil seperti biasa (tidak ada yang ditambah).
// Dengan nama di link -> teks muncul di kedua daun amplop, mengikuti perspektif lipatan.
// Contoh: https://irsyaad-refa.vercel.app/?to=Budi+Santoso
//         (juga menerima ?nama=..., ?kepada=..., dan "?to%20=..." seperti yang Anda tulis)
// ==========================================================================
(function () {
  'use strict';

  function getGuestName() {
    var params = new URLSearchParams(window.location.search);
    var keys = ['to', 'nama', 'kepada'];
    var v = null, i;
    for (i = 0; i < keys.length && !v; i++) v = params.get(keys[i]);
    if (!v) {
      // toleransi kunci yang terselip spasi, mis. "?to%20=wowo" -> kunci "to "
      params.forEach(function (val, key) {
        if (!v && keys.indexOf(key.trim().toLowerCase()) !== -1) v = val;
      });
    }
    if (!v) return '';
    v = v.replace(/\s+/g, ' ').trim().slice(0, 60);
    return v.replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });
  }

  function nameSize(n) {
    if (n <= 10) return '2.5rem';
    if (n <= 16) return '2rem';
    if (n <= 24) return '1.6rem';
    return '1.3rem';
  }

  function build(name) {
    var span = document.createElement('div');
    span.className = 'gc-span';
    span.setAttribute('aria-hidden', 'true');

    var top = document.createElement('div');
    top.className = 'gc-band gc-top';
    var label = document.createElement('span');
    label.className = 'gc-label';
    label.textContent = 'Kepada Yth.';
    var nm = document.createElement('span');
    nm.className = 'gc-name';
    nm.style.fontSize = nameSize(name.length);
    nm.textContent = name;
    top.appendChild(label);
    top.appendChild(nm);

    var bottom = document.createElement('div');
    bottom.className = 'gc-band gc-bottom';
    var msg = document.createElement('span');
    msg.className = 'gc-msg';
    msg.textContent = 'Dengan penuh suka cita, kami mengundang Anda untuk hadir dan berbagi kebahagiaan di hari pernikahan kami';
    bottom.appendChild(msg);

    span.appendChild(top);
    span.appendChild(bottom);
    return span;
  }

  function init() {
    var name = getGuestName();
    if (!name) return; // tidak ada nama -> amplop tidak diubah sama sekali
    var left = document.getElementById('paperLeft');
    var right = document.getElementById('paperRight');
    if (!left || !right) return;
    left.appendChild(build(name));
    right.appendChild(build(name));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
