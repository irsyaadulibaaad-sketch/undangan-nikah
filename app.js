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

// ====== SIMPUL PITA DI COVER (bow) — pita satin realistis: ditarik, simpul lepas, tali lurus terlepas ======
(function () {
  const env = document.getElementById("luxuryEnvelope");
  if (!env || document.getElementById("ribbonBow")) return;

  // ---------- konstanta ----------
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const EW = env.offsetWidth || 340, EH = env.offsetHeight || 460; // ukuran amplop sebenarnya (HP = 300 x 420)
  const CW = EW + 380, CH = EH + 140;             // ukuran kanvas (px CSS), lebih besar dari amplop agar pita bisa keluar
  const OX = (CW - EW) / 2, OY = (CH - EH) / 2;   // posisi amplop di dalam kanvas
  const KX = EW / 2, KY = EH / 2;                 // pusat simpul = tengah amplop
  const W = 24;                                   // lebar pita
  const REACH = 250;                              // panjang tali lurus ke kiri/kanan dari simpul

  // durasi (detik)
  const T_PULL = 1.15;   // tarik + simpul terbuka
  const T_HOLD = 0.18;   // tali lurus menegang
  const T_REL = 0.95;    // tali ditarik lepas
  const FEED_MAX = 900;  // total panjang tali yang ditarik keluar
  const FEED_POW = 1.6;
  const FEED_READY = EW / 2 + REACH + 10; // tali sudah lepas dari amplop saat ini
  const T_READY = T_PULL + T_HOLD + T_REL * Math.pow(FEED_READY / FEED_MAX, 1 / FEED_POW);
  window.ribbonUntieDuration = T_READY;           // dibaca oleh fungsi buka undangan (index.html)

  // ---------- util ----------
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function bez(p, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x,
      y: u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y
    };
  }

  // palet satin merah (gelap -> kilau)
  const PAL = [[0, 58, 4, 12], [.3, 128, 10, 24], [.55, 196, 24, 40], [.8, 240, 70, 80], [1, 255, 170, 172]];
  function pal(l) {
    l = clamp(l, 0, 1);
    for (let i = 1; i < PAL.length; i++) {
      if (l <= PAL[i][0]) {
        const a = PAL[i - 1], b = PAL[i], f = (l - a[0]) / (b[0] - a[0]);
        return "rgb(" + Math.round(lerp(a[1], b[1], f)) + "," + Math.round(lerp(a[2], b[2], f)) + "," + Math.round(lerp(a[3], b[3], f)) + ")";
      }
    }
    return "rgb(255,170,172)";
  }

  // ---------- kanvas ----------
  const wrap = document.createElement("div");
  wrap.className = "ribbon-bow";
  wrap.id = "ribbonBow";
  wrap.style.width = CW + "px";
  wrap.style.height = CH + "px";
  wrap.style.left = -OX + "px";
  wrap.style.top = -OY + "px";
  const cv = document.createElement("canvas");
  cv.className = "ribbon-canvas";
  cv.style.width = CW + "px";
  cv.style.height = CH + "px";
  cv.width = Math.round(CW * DPR);
  cv.height = Math.round(CH * DPR);
  wrap.appendChild(cv);
  env.appendChild(wrap);
  const ctx = cv.getContext("2d");
  if (!ctx) { wrap.style.display = "none"; window.ribbonUntieDuration = 0.6; return; }

  // ---------- satu helai pita satin ----------
  // pts: titik tengah; o.w(i): lebar; o.tw(i): faktor putaran 0..1; o.nS/o.nE: ujung bentuk V; o.sh: kekuatan bayangan
  function strip(pts, o) {
    const n = pts.length;
    const nx = [], ny = [], ang = [], tx = [], ty = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      tx[i] = dx / len; ty[i] = dy / len; nx[i] = -ty[i]; ny[i] = tx[i];
      ang[i] = Math.atan2(ty[i], tx[i]);
    }
    const wv = [], L = [], R = [], lum = [];
    for (let i = 0; i < n; i++) {
      const tw = o.tw ? o.tw(i) : 1;
      wv[i] = (o.w ? o.w(i) : W) * (0.55 + 0.45 * tw);
      const h = wv[i] / 2;
      L[i] = { x: pts[i].x + nx[i] * h, y: pts[i].y + ny[i] * h };
      R[i] = { x: pts[i].x - nx[i] * h, y: pts[i].y - ny[i] * h };
      const g = Math.cos(2 * ang[i] - 1.0) - Math.cos(-1.0);
      lum[i] = 0.56 + 0.15 * g + 0.30 * (tw - 1) + 0.03 * Math.sin((pts[i].x + pts[i].y * 0.5) * 0.05);
    }
    const nd = i => wv[i] * 0.55;
    const notchE = o.nE ? { x: pts[n - 1].x - tx[n - 1] * nd(n - 1), y: pts[n - 1].y - ty[n - 1] * nd(n - 1) } : null;
    const notchS = o.nS ? { x: pts[0].x + tx[0] * nd(0), y: pts[0].y + ty[0] * nd(0) } : null;

    // 1) siluet + bayangan jatuh ke kertas
    ctx.beginPath();
    ctx.moveTo(L[0].x, L[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i].x, L[i].y);
    if (notchE) ctx.lineTo(notchE.x, notchE.y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
    if (notchS) ctx.lineTo(notchS.x, notchS.y);
    ctx.closePath();
    const sh = o.sh == null ? 0.38 : o.sh;
    if (sh > 0.01) {
      ctx.save();
      ctx.shadowColor = "rgba(40,20,8," + sh + ")";
      ctx.shadowBlur = 9 * DPR; ctx.shadowOffsetY = 7 * DPR; ctx.shadowOffsetX = 2 * DPR;
      ctx.fillStyle = "#6a0812"; ctx.fill();
      ctx.restore();
    } else { ctx.fillStyle = "#6a0812"; ctx.fill(); }

    // 2) potongan kain berwarna menurut cahaya
    for (let i = 0; i < n - 1; i++) {
      const col = pal((lum[i] + lum[i + 1]) / 2);
      ctx.beginPath();
      ctx.moveTo(L[i].x, L[i].y); ctx.lineTo(L[i + 1].x, L[i + 1].y);
      if (notchE && i === n - 2) ctx.lineTo(notchE.x, notchE.y);
      ctx.lineTo(R[i + 1].x, R[i + 1].y); ctx.lineTo(R[i].x, R[i].y);
      if (notchS && i === 0) ctx.lineTo(notchS.x, notchS.y);
      ctx.closePath();
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.fill(); ctx.stroke();
    }

    // 3) gradasi melintang lebar pita (efek satin)
    // sisi terang selalu menghadap sumber cahaya (kiri-atas), apa pun arah pita
    const sg = nx.map((v, i) => clamp(2.5 * (v * -0.45 + ny[i] * -0.89), -1, 1));
    const off = f => pts.map((p, i) => ({ x: p.x + nx[i] * f * wv[i] * sg[i], y: p.y + ny[i] * f * wv[i] * sg[i] }));
    const offSym = f => pts.map((p, i) => ({ x: p.x + nx[i] * f * wv[i], y: p.y + ny[i] * f * wv[i] }));
    const poly = (arr, color, lw) => {
      ctx.beginPath(); ctx.moveTo(arr[0].x, arr[0].y);
      for (let i = 1; i < arr.length; i++) ctx.lineTo(arr[i].x, arr[i].y);
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.lineCap = "butt"; ctx.stroke();
    };
    const wm = wv.reduce((a, b) => a + b, 0) / n;
    poly(off(-0.34), "rgba(60,0,10,0.30)", wm * 0.30);        // sisi teduh
    poly(off(0.30), "rgba(255,120,125,0.20)", wm * 0.26);      // sisi terang
    // kilau memanjang, kuat-lemahnya mengikuti cahaya
    const hl = off(0.12);
    for (let i = 0; i < n - 1; i++) {
      const a = clamp((lum[i] + lum[i + 1]) / 2 * 0.9, 0, 0.7);
      ctx.beginPath(); ctx.moveTo(hl[i].x, hl[i].y); ctx.lineTo(hl[i + 1].x, hl[i + 1].y);
      ctx.strokeStyle = "rgba(255,222,222," + a.toFixed(3) + ")"; ctx.lineWidth = wm * 0.11; ctx.lineCap = "round"; ctx.stroke();
    }
    // 4) tepi pita (selvedge) + jahitan tipis
    poly(L, "rgba(45,0,8,0.55)", 1);
    poly(R, "rgba(45,0,8,0.55)", 1);
    poly(offSym(0.41), "rgba(255,170,170,0.20)", 0.8);
    poly(offSym(-0.41), "rgba(255,170,170,0.20)", 0.8);
  }

  // ---------- geometri ----------
  const HANG = {
    R: [{ x: 4, y: 6 }, { x: 16, y: 50 }, { x: 34, y: 92 }, { x: 52, y: 140 }],
    L: [{ x: -4, y: 6 }, { x: -20, y: 48 }, { x: -42, y: 86 }, { x: -62, y: 132 }]
  };
  const NT = 30;

  // ekor pita: menjuntai -> ditarik lurus; ujung bergerak lebih dulu, bagian dekat simpul menyusul (seperti tali sungguhan)
  function tailPts(side, u, t, sway) {
    const pts = [], d = 0.5;
    const key = side > 0 ? HANG.R : HANG.L;
    for (let i = 0; i < NT; i++) {
      const s = i / (NT - 1);
      const H = bez(key, s);
      H.x += sway * s * 3;
      const e = ease(clamp((u - d * (1 - s)) / (1 - d), 0, 1));
      let x = lerp(H.x, side * REACH * s, e);
      let y = lerp(H.y, 0, e);
      y += 17 * Math.sin(Math.PI * e) * Math.sin(Math.PI * s * 1.5);                 // gelombang saat dihentak
      if (side > 0 && t < 0.22) { x -= 9 * Math.sin(clamp(t / 0.22, 0, 1) * Math.PI) * s * s; y -= 4 * Math.sin(clamp(t / 0.22, 0, 1) * Math.PI) * s * s; } // aba-aba tarik
      pts.push({ x: KX + x, y: KY + y });
    }
    return pts;
  }

  // kelokan (loop) pita: kurva tertutup dari simpul
  const LA = [{ x: 8, y: -2 }, { x: 28, y: -52 }, { x: 88, y: -66 }, { x: 100, y: -30 }];
  const LB = [{ x: 100, y: -30 }, { x: 112, y: 6 }, { x: 56, y: 24 }, { x: 8, y: 5 }];
  const NL = 18;
  function loopPts(side, c, sway) {
    const lam = 1 - ease(c);
    if (lam < 0.03) return null;
    const stretch = side > 0 ? 0.32 * Math.sin(Math.PI * c) : 0.12 * Math.sin(Math.PI * c);
    const sx = lam * (1 + stretch), sy = lam * (1 - 0.18 * Math.sin(Math.PI * c));
    const rot = side * (-0.2 * (1 - c)) + sway * 0.012 * side;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const pts = [];
    for (let i = 0; i < NL * 2 - 1; i++) {
      const p = i < NL ? bez(LA, i / (NL - 1)) : bez(LB, (i - NL + 1) / (NL - 1));
      const x = p.x * sx * side, y = p.y * sy;
      pts.push({ x: KX + x * cr - y * sr, y: KY + x * sr + y * cr });
    }
    return pts;
  }

  // simpul
  function drawKnot(x, y, sx, sy, rot, hole, alpha) {
    if (alpha < 0.02 || sx < 0.03 || sy < 0.03) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy);
    const w = 36, h = 31, r = 11;
    const rr = () => {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + r, -h / 2); ctx.lineTo(w / 2 - r, -h / 2); ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      ctx.lineTo(w / 2, h / 2 - r); ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      ctx.lineTo(-w / 2 + r, h / 2); ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      ctx.lineTo(-w / 2, -h / 2 + r); ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); ctx.closePath();
    };
    rr();
    ctx.save();
    ctx.shadowColor = "rgba(40,20,8,0.4)"; ctx.shadowBlur = 8 * DPR; ctx.shadowOffsetY = 6 * DPR;
    ctx.fillStyle = "#6a0812"; ctx.fill();
    ctx.restore();
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, "#ff6168"); g.addColorStop(0.35, "#d11f33"); g.addColorStop(0.7, "#a10f21"); g.addColorStop(1, "#5a0610");
    rr(); ctx.fillStyle = g; ctx.fill();
    ctx.save(); rr(); ctx.clip();
    // lipatan kain di simpul
    ctx.strokeStyle = "rgba(60,0,10,0.45)"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    for (let k = -1; k <= 1; k += 2) {
      ctx.beginPath(); ctx.moveTo(k * 6, -h / 2); ctx.quadraticCurveTo(k * 11, 0, k * 6, h / 2); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,190,190,0.45)"; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 5, -h / 2 + 5); ctx.quadraticCurveTo(0, -h / 2 + 1, w / 2 - 5, -h / 2 + 5); ctx.stroke();
    if (hole > 0.02) {                                  // simpul mengendur: lubang terlihat
      ctx.globalAlpha = alpha * hole;
      const hg = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
      hg.addColorStop(0, "#2a0307"); hg.addColorStop(1, "#6a0812");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, 1, 11, 8.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  // ---------- jalur tarik lepas ----------
  const FX = EW + 100, FR = 80, ARC = Math.PI * FR / 2;
  function feedPt(sg) {
    if (sg <= FX) return { x: sg, y: KY };
    const d = sg - FX;
    if (d <= ARC) { const th = d / FR; return { x: FX + FR * Math.sin(th), y: KY + FR * (1 - Math.cos(th)) }; }
    return { x: FX + FR, y: KY + FR + (d - ARC) };
  }
  function strapPts(D) {
    const a = KX - REACH, b = KX + REACH, N = 76, pts = [];
    for (let i = 0; i < N; i++) pts.push(feedPt(lerp(a, b, i / (N - 1)) + D));
    return pts;
  }

  // ---------- gambar satu frame ----------
  function draw(mode, t, sway) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(DPR, 0, 0, DPR, OX * DPR, OY * DPR);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, -OY, CW - OX, CH); ctx.clip();   // sisi kiri: pita menembus ke belakang amplop

    let wrapA = 1;
    if (mode === "release") {
      const tau = clamp((t - T_PULL - T_HOLD) / T_REL, 0, 1);
      strip(strapPts(FEED_MAX * Math.pow(tau, FEED_POW)), { nS: true, nE: true, sh: 0.38, ph: 0 });
      wrapA = 0;
    } else {
      const u = mode === "pull" ? clamp((t - 0.12) / (T_PULL - 0.12), 0, 1) : 0;
      const uHold = mode === "hold" ? 1 : u;
      const uR = uHold, uL = clamp((uHold - 0.18) / 0.82, 0, 1);
      wrapA = 1 - clamp((uHold - 0.25) / 0.35, 0, 1);

      // tali yang membungkus amplop (sisi kanan menembus ke belakang di tepi amplop)
      ctx.save();
      ctx.beginPath(); ctx.rect(0, -OY, EW + 6, CH); ctx.clip();
      strip(straightBand(), { nS: true, nE: true, sh: 0.38 });
      ctx.restore();

      // getar halus saat tali menegang
      const vib = mode === "hold" ? 2.2 * Math.sin(t * 38) * Math.exp(-(t - T_PULL) * 9) : 0;
      const tL = tailPts(-1, uL, t, sway), tR = tailPts(1, uR, t, sway);
      if (vib) { for (let i = 0; i < NT; i++) { const s = i / (NT - 1); tL[i].y += vib * Math.sin(Math.PI * s); tR[i].y += vib * Math.sin(Math.PI * s); } }
      const shL = 0.38 * (1 - clamp((uL - 0.7) / 0.3, 0, 1)), shR = 0.38 * (1 - clamp((uR - 0.7) / 0.3, 0, 1));
      strip(tL, { nE: true, sh: shL, ph: 1.3 });
      strip(tR, { nE: true, sh: shR, ph: 2.1 });

      // kelokan menciut saat tali ditarik
      const cR = clamp((uHold - 0.08) / 0.55, 0, 1), cL = clamp((uHold - 0.3) / 0.55, 0, 1);
      const lpL = loopPts(-1, cL, sway), lpR = loopPts(1, cR, sway);
      const tw = n => i => Math.cos(1.0 * Math.sin(Math.PI * i / (n - 1)));
      if (lpL) strip(lpL, { tw: tw(lpL.length), sh: 0.34, ph: 3.2 });
      if (lpR) strip(lpR, { tw: tw(lpR.length), sh: 0.34, ph: 4.0 });

      // simpul mengendur, berlubang, lalu mengempis jadi tali lurus
      const k = clamp((uHold - 0.35) / 0.65, 0, 1);
      const grow = Math.sin(clamp(k / 0.55, 0, 1) * Math.PI / 2);
      const collapse = ease(clamp((k - 0.5) / 0.5, 0, 1));
      const kx = 1 + 0.28 * grow - 0.95 * collapse, ky = 1 + 0.22 * grow - 0.97 * collapse;
      drawKnot(KX + 10 * collapse, KY, kx, ky, 0.14 * grow * (1 - collapse), clamp(grow * 1.2, 0, 1) * (1 - collapse), 1 - clamp((collapse - 0.7) / 0.3, 0, 1));
    }

    // lengkung tepi amplop: pita menggelap saat membungkus ke belakang
    ctx.globalCompositeOperation = "source-atop";
    let g = ctx.createLinearGradient(0, 0, 26, 0);
    g.addColorStop(0, "rgba(25,0,5,0.62)"); g.addColorStop(1, "rgba(25,0,5,0)");
    ctx.fillStyle = g; ctx.fillRect(0, KY - 40, 26, 80);
    if (wrapA > 0.01) {
      g = ctx.createLinearGradient(EW - 20, 0, EW + 6, 0);
      g.addColorStop(0, "rgba(25,0,5,0)"); g.addColorStop(1, "rgba(25,0,5," + (0.6 * wrapA).toFixed(3) + ")");
      ctx.fillStyle = g; ctx.fillRect(EW - 20, KY - 40, 26, 80);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }
  function straightBand() {
    const pts = [], N = 40;
    for (let i = 0; i < N; i++) pts.push({ x: lerp(KX - REACH, KX + REACH, i / (N - 1)), y: KY });
    return pts;
  }

  // ---------- idle: ekor bergoyang halus sebelum diketuk ----------
  let started = false, idleRaf = 0, idleT0 = performance.now(), idleFrame = 0;
  function idle(now) {
    if (started) return;
    if ((idleFrame++ & 1) === 0) draw("idle", 0, Math.sin((now - idleT0) / 900) * 1.2);
    idleRaf = requestAnimationFrame(idle);
  }
  draw("idle", 0, 0);
  idleRaf = requestAnimationFrame(idle);

  // ---------- urutan saat diketuk ----------
  // 0 – 1.15s   ekor kanan ditarik, kelokan menciut, simpul mengendur lalu terbuka jadi tali lurus
  // 1.15 – 1.33 tali lurus menegang
  // 1.33 – 2.28 tali ditarik lepas ke kanan (lepas dari amplop di ±1.95s), baru undangan terbuka
  function start() {
    if (started) return;
    started = true;
    cancelAnimationFrame(idleRaf);
    const hint = env.querySelector(".tap-hint");
    if (hint) { hint.style.animation = "none"; hint.style.transition = "opacity .4s"; hint.style.opacity = "0"; }
    const t0 = performance.now();
    (function frame() {
      const t = (performance.now() - t0) / 1000;
      if (t < T_PULL) draw("pull", t, 0);
      else if (t < T_PULL + T_HOLD) draw("hold", t, 0);
      else if (t < T_PULL + T_HOLD + T_REL) draw("release", t, 0);
      else { wrap.style.display = "none"; return; }
      requestAnimationFrame(frame);
    })();
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



