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
document.getElementById("gmap").src =
  `https://www.google.com/maps?q=${GMAP_QUERY}&output=embed`;
document.getElementById("gmapLink").href =
  `https://www.google.com/maps/search/?api=1&query=${GMAP_QUERY}`;
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
  const { data, error } = await supabaseClient
    .from("total_pax").select("terpakai").single();
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
    // simpan doa (jenis bunga acak untuk variasi taman)
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
    gsap.fromTo(prayerCard,
      { opacity: 0, y: 46, scale: 0.92, rotateX: 8 },
      { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.65, ease: "back.out(1.6)" });
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

// ====== TAMAN DOA (BUNGA CSS MURNI: BATANG + DAUN + 6 KELOPAK + PUSAT) ======
const BUNGA_TYPES = ["mawar", "tulip", "matahari", "sakura", "lily"];

// Posisi deterministik berdasarkan id supaya bunga tidak "lompat" saat realtime refresh
function flowerPosition(seed) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return {
    x: 4 + (h % 840) / 10,          // 4% .. 88%
    h: 58 + (h % 30),               // tinggi batang 58..87px
    scale: 0.8 + ((h >> 4) % 40) / 100, // 0.8 .. 1.2
    swayDelay: (h % 40) / 10        // jeda goyang 0..4s
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

  // Klik bunga -> popup elegan berisi nama & pesan
  wrapper.addEventListener("click", () => openPrayerModal(d.nama, d.pesan));

  return wrapper;
}

async function loadTaman() {
  const { data, error } = await supabaseClient
    .from("doa").select("*").order("created_at", { ascending: true });
  if (error) return;

  const container = document.getElementById("flowerContainer");
  container.innerHTML = ""; // Bersihkan taman

  if (data && data.length > 0) {
    data.forEach((d, index) => {
      const flower = buildFlower(d);
      // Bunga baru (realtime) tumbuh paling akhir dengan jeda dramatis
      flower.style.animationDelay = Math.min(index * 0.08, 2) + "s, " +
        (flowerPosition(d.id).swayDelay + Math.min(index * 0.08, 2)) + "s";
      container.appendChild(flower);
    });
  }
}
loadTaman();

// realtime taman
supabaseClient.channel("doa-rt")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "doa" },
    () => loadTaman())
  .subscribe();

// ====== PHOTOBOOTH ======
const photoInput = document.getElementById("photoInput");
const canvas = document.getElementById("photoCanvas");
const ctx = canvas.getContext("2d");
let currentImage = null;

photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => { currentImage = img; drawPhoto(); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});
document.querySelectorAll('input[name="tpl"]').forEach(r =>
  r.addEventListener("change", drawPhoto));

function drawPhoto() {
  if (!currentImage) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const r = Math.max(W / currentImage.width, H / currentImage.height);
  const dw = currentImage.width * r, dh = currentImage.height * r;
  ctx.drawImage(currentImage, (W - dw) / 2, (H - dh) / 2, dw, dh);

  const tpl = document.querySelector('input[name="tpl"]:checked').value;
  drawTemplate(tpl, W, H);

  document.getElementById("downloadBtn").hidden = false;
  document.getElementById("shareBtn").hidden = false;
}

// Bunga vektor di-draw manual di canvas (tanpa emoji)
function drawCanvasFlower(c, x, y, size, petalColor, centerColor) {
  c.save();
  c.translate(x, y);
  for (let i = 0; i < 6; i++) {
    c.save();
    c.rotate((Math.PI / 3) * i);
    c.beginPath();
    c.ellipse(0, -size * 0.62, size * 0.30, size * 0.60, 0, 0, Math.PI * 2);
    c.fillStyle = petalColor;
    c.fill();
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, size * 0.30, 0, Math.PI * 2);
  c.fillStyle = centerColor;
  c.fill();
  c.restore();
}

function drawTemplate(tpl, W, H) {
  if (tpl === "classic") {
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 24;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(0, H - 110, W, 110);
    ctx.fillStyle = "#fff"; ctx.font = "bold 26px serif"; ctx.textAlign = "center";
    ctx.fillText("Irsyaadul & Refalina", W / 2, H - 60);
    ctx.font = "16px serif";
    ctx.fillText("24 . 12 . 2026", W / 2, H - 30);
  } else if (tpl === "floral") {
    ctx.strokeStyle = "#e8a0b8"; ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, W - 18, H - 18);
    // Rangkaian bunga vektor di sudut-sudut (bukan emoji)
    drawCanvasFlower(ctx, 52, 62, 26, "#F4B8C9", "#E3B94E");
    drawCanvasFlower(ctx, W - 52, 62, 26, "#E58BA6", "#FDE9EE");
    drawCanvasFlower(ctx, 52, H - 150, 26, "#CE8BD6", "#E3B94E");
    drawCanvasFlower(ctx, W - 52, H - 150, 26, "#F4B8C9", "#E3B94E");
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.fillRect(0, H - 90, W, 90);
    ctx.fillStyle = "#a04a68"; ctx.font = "bold 24px serif"; ctx.textAlign = "center";
    ctx.fillText("Irsyaadul & Refalina", W / 2, H - 45);
  } else if (tpl === "gold") {
    ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(0, 0, W, 90);
    ctx.fillStyle = "#d4af37"; ctx.font = "bold 26px serif"; ctx.textAlign = "center";
    ctx.fillText("WEDDING OF", W / 2, 40);
    ctx.font = "bold 22px serif";
    ctx.fillText("Irsyaadul & Refalina", W / 2, 72);
  }
}

document.getElementById("downloadBtn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = "photobooth-wedding.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
});

document.getElementById("shareBtn").addEventListener("click", async () => {
  canvas.toBlob(async (blob) => {
    const file = new File([blob], "wedding.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Wedding Photobooth" });
    } else {
      alert("Fitur share tidak didukung di browser ini. Silakan download lalu share manual.");
    }
  });
});

// ====== QR HARI-H ======
const checkinUrl = location.origin + location.pathname.replace("index.html","") + "checkin.html";
const qrImage = document.getElementById("qrImage");
if (qrImage) {
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkinUrl)}`;
}

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
// ====== TALI PENGIKAT COVER (simpul terurai saat di-tap) ======
(function () {
  const env = document.getElementById("luxuryEnvelope");
  if (!env || document.getElementById("envTie")) return;

  env.insertAdjacentHTML("beforeend", `
    <div class="env-tie" id="envTie">
      <div class="tie-strap tie-h"></div>
      <div class="tie-strap tie-v"></div>
      <div class="tie-knot">
        <span class="knot-loop left"></span>
        <span class="knot-loop right"></span>
        <span class="knot-tail left"></span>
        <span class="knot-tail right"></span>
      </div>
    </div>`);

  function untie() {
    const tie = document.getElementById("envTie");
    if (tie) tie.classList.add("untied");
  }
  env.addEventListener("click", untie);
  env.addEventListener("touchstart", untie, { passive: true });
})();
