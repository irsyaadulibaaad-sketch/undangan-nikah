// ====== CONFIG ======
const TANGGAL_NIKAH = "2026-12-24T09:00:00+07:00";
const VENUE_NAME = "Rumah Makan Alam Pilemburan";
const VENUE_ADDR = "Jl. Raya Gadobangkong No.112, Gadobangkong, Kec. Ngamprah, Kabupaten Bandung Barat, Jawa Barat 40552";
const GMAP_QUERY = "-6.866054,107.517273";

// ====== COUNTDOWN ======
function updateCountdown() {
  const target = new Date(TANGGAL_NIKAH).getTime();
  const now = Date.now();
  const diff = target - now;
  if (isNaN(target)) return;
  if (diff <= 0) {
    document.getElementById("countdown").innerHTML =
      '<div class="cd-done">Alhamdulillah, The Day Has Come</div>';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  cd("cd-days", d); cd("cd-hours", h); cd("cd-mins", m); cd("cd-secs", s);
}
function cd(id, v) { const el = document.getElementById(id); if (el) el.textContent = String(v).padStart(2, "0"); }
setInterval(updateCountdown, 1000);
updateCountdown();

// ====== MAPS ======
document.getElementById("gmap").src = `https://www.google.com/maps?q=${GMAP_QUERY}&output=embed`;
document.getElementById("gmapLink").href = `https://www.google.com/maps/search/?api=1&query=${GMAP_QUERY}`;
document.getElementById("venueName").textContent = VENUE_NAME;
document.getElementById("venueAddr").textContent = VENUE_ADDR;

// ====== RSVP FORM ======
const rsvpHadir = document.getElementById("rsvpHadir");
const hadirFields = document.getElementById("hadirFields");
const doaFields = document.getElementById("doaFields");

rsvpHadir.addEventListener("change", () => {
  const hadir = rsvpHadir.value === "1";
  hadirFields.hidden = !hadir;
  doaFields.hidden = hadir;
});

// ====== SISA KUOTA ======
async function loadSisaKuota() {
  const { data, error } = await supabaseClient.from("total_pax").select("terpakai").single();
  if (error) { console.warn(error); return; }
  const sisa = KUOTA_PAX - (data?.terpakai || 0);
  document.getElementById("sisaKuota").textContent = sisa;
  return sisa;
}
loadSisaKuota();

// ====== SUBMIT RSVP ======
document.getElementById("rsvpForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("rsvpMsg");
  msg.textContent = "Mengirim...";

  const nama = document.getElementById("rsvpNama").value.trim();
  const hadir = rsvpHadir.value === "1";
  let payload = { nama, hadir };

  if (hadir) {
    const pax = parseInt(document.getElementById("rsvpPax").value) || 1;
    const kategori = document.getElementById("rsvpKategori").value;
    const sisa = await loadSisaKuota();
    if (pax > sisa) {
      msg.textContent = `Maaf, sisa kuota hanya ${sisa} pax.`;
      return;
    }
    payload.jumlah_pax = pax;
    payload.kategori = kategori;
  } else {
    const pesan = document.getElementById("rsvpDoa").value.trim();
    if (!pesan) { msg.textContent = "Mohon tulis doa/ucapan."; return; }
    await supabaseClient.from("doa").insert({
      nama, pesan, sumber: "rsvp",
      bunga: ["mawar","tulip","matahari","sakura","lily"][Math.floor(Math.random()*5)]
    });
  }

  const { error } = await supabaseClient.from("rsvp").insert(payload);
  if (error) { msg.textContent = "Gagal kirim: " + error.message; return; }

  msg.textContent = hadir
    ? "Terima kasih! Kami tunggu kehadiran Anda."
    : "Terima kasih atas doanya — sebuah bunga telah mekar di taman.";
  e.target.reset();
  hadirFields.hidden = true;
  doaFields.hidden = true;
  loadSisaKuota();
  loadTaman();
});

// ====== POPUP DOA ELEGAN ======
const prayerModal = document.getElementById("prayerModal");
const prayerCard = document.getElementById("prayerCard");

function openPrayerModal(nama, pesan) {
  document.getElementById("prayerName").textContent = nama;
  document.getElementById("prayerMessage").textContent = "\u201C" + pesan + "\u201D";
  prayerModal.hidden = false;
  document.body.style.overflow = "hidden";
  if (window.gsap) {
    gsap.fromTo(".prayer-modal-backdrop", { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" });
    gsap.fromTo(prayerCard, { opacity: 0, y: 46, scale: 0.92, rotateX: 8 }, { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.65, ease: "back.out(1.6)" });
  }
}

function closePrayerModal() {
  if (window.gsap) {
    gsap.to(prayerCard, { opacity: 0, y: 30, scale: 0.94, duration: 0.32, ease: "power2.in" });
    gsap.to(".prayer-modal-backdrop", {
      opacity: 0, duration: 0.35, ease: "power2.in",
      onComplete: () => { prayerModal.hidden = true; document.body.style.overflow = ""; }
    });
  } else {
    prayerModal.hidden = true;
    document.body.style.overflow = "";
  }
}

document.getElementById("prayerClose").addEventListener("click", closePrayerModal);
document.getElementById("prayerBackdrop").addEventListener("click", closePrayerModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !prayerModal.hidden) closePrayerModal();
});

// ====== TAMAN DOA (BUNGA CSS MURNI) ======
const BUNGA_TYPES = ["mawar", "tulip", "matahari", "sakura", "lily"];

function flowerPosition(seed) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return {
    x: 4 + (h % 840) / 10,
    h: 58 + (h % 30),
    scale: 0.8 + ((h >> 4) % 40) / 100,
    swayDelay: (h % 40) / 10
  };
}

function buildFlower(d) {
  const pos = flowerPosition(d.id);
  const type = BUNGA_TYPES.includes(d.bunga) ? d.bunga : "mawar";

  const wrapper = document.createElement("div");
  wrapper.className = "flower-wrapper flower-" + type;
  wrapper.style.left = pos.x + "%";
  wrapper.style.height = pos.h + "px";
  wrapper.style.scale = String(pos.scale);
  wrapper.style.animationDelay = "0s, " + pos.swayDelay + "s";

  const stem = document.createElement("div");
  stem.className = "flower-stem";

  const leafL = document.createElement("div");
  leafL.className = "flower-leaf left";
  const leafR = document.createElement("div");
  leafR.className = "flower-leaf right";

  const head = document.createElement("div");
  head.className = "flower-head";
  for (let i = 0; i < 6; i++) {
    const petal = document.createElement("div");
    petal.className = "flower-petal";
    head.appendChild(petal);
  }
  const center = document.createElement("div");
  center.className = "flower-center";
  head.appendChild(center);

  stem.appendChild(leafL);
  stem.appendChild(leafR);
  wrapper.appendChild(stem);
  wrapper.appendChild(head);

  wrapper.addEventListener("click", () => openPrayerModal(d.nama, d.pesan));

  return wrapper;
}

async function loadTaman() {
  const { data, error } = await supabaseClient.from("doa").select("*").order("created_at", { ascending: true });
  if (error) return;

  const container = document.getElementById("flowerContainer");
  container.innerHTML = "";

  if (data && data.length > 0) {
    data.forEach((d, index) => {
      const flower = buildFlower(d);
      flower.style.animationDelay = Math.min(index * 0.08, 2) + "s, " +
        (flowerPosition(d.id).swayDelay + Math.min(index * 0.08, 2)) + "s";
      container.appendChild(flower);
    });
  }
}
loadTaman();

supabaseClient.channel("doa-rt")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "doa" }, () => loadTaman())
  .subscribe();

// ====== KETERANGAN TAMAN DOA ======
(function () {
  const g = document.getElementById("garden");
  if (g && !document.getElementById("gardenHint")) {
    const hint = document.createElement("p");
    hint.id = "gardenHint";
    hint.className = "garden-hint";
    hint.textContent = "Ketuk bunga untuk melihat doa";
    g.parentNode.insertBefore(hint, g.nextSibling);
  }
})();

// ====== SIMPUL PITA DI COVER (bow) — versi tarik & lepas realistis ======
(function () {
  const env = document.getElementById("luxuryEnvelope");
  if (!env || document.getElementById("ribbonBow")) return;

  const NS = "http://www.w3.org/2000/svg";
  const CX = 170, CY = 230;          // pusat amplop (340 x 460)
  const BAND_W = 24;                 // lebar pita
  const BAND_X0 = -16, BAND_X1 = 356; // pita membungkus sedikit melewati sisi amplop

  // ---------- util ----------
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t * t;
  const easeInOutBack = t => {
    const c1 = 1.2, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  };
  function bez(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    };
  }

  // ---------- bangun SVG ----------
  const wrap = document.createElement("div");
  wrap.className = "ribbon-bow";
  wrap.id = "ribbonBow";
  wrap.innerHTML = `
    <svg class="ribbon-svg" viewBox="0 0 340 460" xmlns="${NS}" aria-hidden="true">
      <defs>
        <linearGradient id="rbLoop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff5d63"/>
          <stop offset=".35" stop-color="#d62839"/>
          <stop offset="1" stop-color="#7d0b14"/>
        </linearGradient>
        <linearGradient id="rbKnot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff6b70"/>
          <stop offset=".45" stop-color="#c8182a"/>
          <stop offset="1" stop-color="#6d0911"/>
        </linearGradient>
        <radialGradient id="rbGloss" cx=".35" cy=".25" r=".7">
          <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g id="rbRoot">
        <g id="rbBand"></g>
        <g id="rbTailL"></g>
        <g id="rbTailR"></g>
        <g id="rbLoopL"></g>
        <g id="rbLoopR"></g>
        <g id="rbKnot"></g>
      </g>
    </svg>`;
  env.insertAdjacentHTML("beforeend", wrap.outerHTML);

  const $ = id => document.getElementById(id);
  const gRoot = $("rbRoot"), gBand = $("rbBand"), gTailL = $("rbTailL"), gTailR = $("rbTailR");
  const gLoopL = $("rbLoopL"), gLoopR = $("rbLoopR"), gKnot = $("rbKnot");

  function mk(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  // ---------- pita satin (lapisan berundak agar terlihat berkilau) ----------
  const LAYERS = [
    { w: 1.00, off: 0,     fill: "#7a0a13", op: 1 },
    { w: 0.84, off: 0,     fill: "#b11222", op: 1 },
    { w: 0.58, off: -0.04, fill: "#d9303f", op: 1 },
    { w: 0.20, off: -0.16, fill: "#ff8a8f", op: 0.55 }
  ];

  function makeRibbon(group, notch) {
    const shadow = mk("path", { fill: "rgba(40,20,10,0.22)", transform: "translate(2 7)" }, group);
    const layers = LAYERS.map(L => mk("path", { fill: L.fill, "fill-opacity": L.op }, group));
    return { shadow, layers, notch };
  }

  // pts = titik tengah pita; menghasilkan poligon dengan ujung berbentuk V
  function shapeRibbon(r, pts, width) {
    const n = pts.length;
    const nrm = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      nrm.push({ x: -dy / len, y: dx / len, tx: dx / len, ty: dy / len });
    }
    const build = (w, off, notchDepth) => {
      const L = [], R = [];
      for (let i = 0; i < n; i++) {
        const o = off * width, h = (w * width) / 2;
        L.push((pts[i].x + nrm[i].x * (o + h)).toFixed(2) + "," + (pts[i].y + nrm[i].y * (o + h)).toFixed(2));
        R.push((pts[i].x + nrm[i].x * (o - h)).toFixed(2) + "," + (pts[i].y + nrm[i].y * (o - h)).toFixed(2));
      }
      let d = "M" + L.join(" L");
      if (r.notch) {
        const e = pts[n - 1], t = nrm[n - 1];
        d += " L" + (e.x - t.tx * notchDepth).toFixed(2) + "," + (e.y - t.ty * notchDepth).toFixed(2);
      }
      d += " L" + R.reverse().join(" L") + " Z";
      return d;
    };
    const full = build(1, 0, width * 0.55);
    r.shadow.setAttribute("d", full);
    r.layers.forEach((el, i) => el.setAttribute("d", build(LAYERS[i].w, LAYERS[i].off, width * 0.55 * LAYERS[i].w)));
  }

  function straightPts(x0, x1, y, n) {
    const a = [];
    for (let i = 0; i < n; i++) a.push({ x: lerp(x0, x1, i / (n - 1)), y });
    return a;
  }
  function bezPts(p0, p1, p2, p3, n) {
    const a = [];
    for (let i = 0; i < n; i++) a.push(bez(p0, p1, p2, p3, i / (n - 1)));
    return a;
  }

  // pita datar yang membungkus amplop
  const band = makeRibbon(gBand, false);
  shapeRibbon(band, straightPts(BAND_X0, BAND_X1, CY, 14), BAND_W);
  // garis halus tepi atas/bawah pita
  mk("rect", { x: BAND_X0, y: CY - BAND_W / 2, width: BAND_X1 - BAND_X0, height: 1, fill: "rgba(255,200,200,0.35)" }, gBand);

  const tailL = makeRibbon(gTailL, true);
  const tailR = makeRibbon(gTailR, true);

  // ---------- kelokan (loop) & simpul ----------
  function loopShape(group, dir) {
    const s = dir; // -1 = kiri, 1 = kanan
    const outer = `M0,0 C${22 * s},-44 ${78 * s},-52 ${88 * s},-22 C${96 * s},6 ${44 * s},24 0,2 Z`;
    const inner = `M${6 * s},-2 C${24 * s},-26 ${64 * s},-32 ${70 * s},-16 C${74 * s},-2 ${40 * s},12 ${6 * s},0 Z`;
    mk("path", { d: outer, fill: "rgba(40,20,10,0.22)", transform: "translate(2 7)" }, group);
    mk("path", { d: outer, fill: "url(#rbLoop)" }, group);
    mk("path", { d: inner, fill: "#5a070f", "fill-opacity": ".72" }, group);
    mk("path", { d: `M${8 * s},-8 C${28 * s},-34 ${60 * s},-38 ${74 * s},-24`, fill: "none", stroke: "#ffb3b6", "stroke-opacity": ".45", "stroke-width": "2.2", "stroke-linecap": "round" }, group);
  }
  loopShape(gLoopL, -1);
  loopShape(gLoopR, 1);

  mk("rect", { x: -17, y: -14, width: 34, height: 28, rx: 9, fill: "rgba(40,20,10,0.25)", transform: "translate(2 6)" }, gKnot);
  mk("rect", { x: -17, y: -14, width: 34, height: 28, rx: 9, fill: "url(#rbKnot)" }, gKnot);
  mk("rect", { x: -17, y: -14, width: 34, height: 28, rx: 9, fill: "url(#rbGloss)" }, gKnot);
  mk("path", { d: "M-12,-4 Q0,-9 12,-4", fill: "none", stroke: "#ff9ea2", "stroke-opacity": ".5", "stroke-width": "1.6", "stroke-linecap": "round" }, gKnot);
  mk("path", { d: "M-12,6 Q0,2 12,6", fill: "none", stroke: "#4a050b", "stroke-opacity": ".45", "stroke-width": "1.6", "stroke-linecap": "round" }, gKnot);

  // ---------- pose berdasarkan progres ----------
  // sway = goyangan halus saat idle; p = progres tarikan 0..1; k = progres simpul lepas 0..1
  function pose(p, k, sway) {
    // ekor kanan: dari menjuntai -> ditarik lurus ke kanan sepanjang pita
    const wig = Math.sin(p * Math.PI * 3) * 12 * (1 - p);
    const r0 = { x: lerp(CX + 5, CX, p), y: lerp(CY + 8, CY, p) };
    const r1 = { x: lerp(CX + 20 + sway * 2, CX + 70, p), y: lerp(CY + 52, CY, p) + wig };
    const r2 = { x: lerp(CX + 32 + sway * 5, CX + 140, p), y: lerp(CY + 108, CY, p) - wig * 0.6 };
    const r3 = { x: lerp(CX + 46 + sway * 9, CX + 210, p), y: lerp(CY + 150, CY, p) };
    shapeRibbon(tailR, bezPts(r0, r1, r2, r3, 18), lerp(22, BAND_W, p));

    // ekor kiri: ikut tertarik masuk lalu ikut lurus ke kiri
    const q = clamp((p - 0.1) / 0.9, 0, 1);
    const l0 = { x: lerp(CX - 5, CX, q), y: lerp(CY + 8, CY, q) };
    const l1 = { x: lerp(CX - 20 - sway * 2, CX - 70, q), y: lerp(CY + 52, CY, q) };
    const l2 = { x: lerp(CX - 32 - sway * 5, CX - 140, q), y: lerp(CY + 108, CY, q) };
    const l3 = { x: lerp(CX - 46 - sway * 9, CX - 210, q), y: lerp(CY + 150, CY, q) };
    shapeRibbon(tailL, bezPts(l0, l1, l2, l3, 18), lerp(22, BAND_W, q));

    // kelokan: sempat memanjang karena ditarik, lalu menciut hingga habis
    const c = clamp((p - 0.18) / 0.62, 0, 1);
    const stretch = 1 + 0.28 * Math.sin(clamp(p / 0.5, 0, 1) * Math.PI * 0.5) * (1 - c);
    const collapse = 1 - easeInOut(c);
    const lx = gLoopL, rx = gLoopR;
    lx.setAttribute("transform",
      `translate(${CX - 4 + 16 * c} ${CY - 2}) rotate(${lerp(14, 0, c) + sway * 0.6}) scale(${Math.max(0.001, collapse * (1 + 0.1 * (1 - c)))} ${Math.max(0.001, collapse * 0.9 + 0.1 * (1 - c))})`);
    rx.setAttribute("transform",
      `translate(${CX + 4 + 40 * c} ${CY - 2}) rotate(${lerp(-14, 0, c) - sway * 0.6}) scale(${Math.max(0.001, collapse * stretch)} ${Math.max(0.001, collapse * 0.9 + 0.1 * (1 - c))})`);
    const loopOp = 1 - clamp((c - 0.85) / 0.15, 0, 1);
    lx.style.opacity = loopOp; rx.style.opacity = loopOp;

    // simpul: mengendur lalu pipih menyatu ke pita
    const kk = easeInOut(k);
    const kw = 1 + 0.12 * Math.sin(k * Math.PI);          // sedikit membesar saat mengendur
    gKnot.setAttribute("transform",
      `translate(${CX + 14 * kk} ${CY}) rotate(${lerp(0, 8, kk)}) scale(${Math.max(0.001, kw * (1 - 0.55 * kk))} ${Math.max(0.001, 1 - 0.92 * kk)})`);
    gKnot.style.opacity = 1 - clamp((k - 0.55) / 0.45, 0, 1);
  }

  // pose awal (tersimpul)
  pose(0, 0, 0);

  // ---------- idle: ekor bergoyang halus sebelum diketuk ----------
  let started = false, idleRaf = 0, idleT0 = performance.now();
  function idle(now) {
    if (started) return;
    const s = Math.sin((now - idleT0) / 900) * 1.2;
    pose(0, 0, s);
    idleRaf = requestAnimationFrame(idle);
  }
  idleRaf = requestAnimationFrame(idle);

  // ---------- urutan animasi saat diketuk ----------
  // 0.00–0.95s  ekor kanan ditarik, kelokan menciut, simpul mengendur
  // 0.95–1.07s  tali sudah lurus (jeda singkat)
  // 1.07–1.45s  tali ditarik lepas ke kanan, undangan langsung terbuka
  const T_PULL = 0.95, T_HOLD = 0.12, T_SLIDE = 0.38;
  function start() {
    if (started) return;
    started = true;
    cancelAnimationFrame(idleRaf);
    const t0 = performance.now();

    function frame(now) {
      const t = (now - t0) / 1000;
      if (t < T_PULL) {
        const u = t / T_PULL;
        const p = clamp(easeInOutBack(u), -0.08, 1);
        const pp = Math.max(0, p);
        const k = clamp((u - 0.5) / 0.5, 0, 1);
        pose(pp, k, 0);
        // tarikan kecil ke arah kanan saat ditarik
        gRoot.setAttribute("transform", `translate(${(pp * 6).toFixed(2)} 0)`);
      } else if (t < T_PULL + T_HOLD) {
        pose(1, 1, 0);
        gRoot.setAttribute("transform", "translate(6 0)");
      } else if (t < T_PULL + T_HOLD + T_SLIDE) {
        const u = (t - T_PULL - T_HOLD) / T_SLIDE;
        const e = easeIn(u);
        gRoot.setAttribute("transform", `translate(${(6 + e * 520).toFixed(2)} ${(-e * 14).toFixed(2)}) rotate(${(-e * 2.5).toFixed(2)} ${CX} ${CY})`);
      } else {
        wrap.style.display = "none";
        const live = document.getElementById("ribbonBow");
        if (live) live.style.display = "none";
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function untie() { env.classList.add("ribbon-off"); start(); }
  env.addEventListener("click", untie);
  env.addEventListener("touchstart", untie, { passive: true });

  // jika class ribbon-off ditambahkan dari tempat lain (mis. fungsi buka undangan), animasi tetap jalan
  new MutationObserver(function () {
    if (env.classList.contains("ribbon-off")) start();
  }).observe(env, { attributes: true, attributeFilter: ["class"] });
})();

// ====== FAQ AKORDEON ======
document.querySelectorAll(".faq-q").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item.open").forEach(i => i.classList.remove("open"));
    if (!wasOpen) item.classList.add("open");
  });
});



