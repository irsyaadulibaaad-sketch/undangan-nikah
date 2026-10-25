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
      "<div><span>🎉</span><small>Selamat!</small></div>";
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
    // simpan doa
    await supabaseClient.from("doa").insert({
      nama, pesan, sumber: "rsvp",
      bunga: ["mawar","tulip","matahari","sakura","lily"][Math.floor(Math.random()*5)]
    });
  }

  const { error } = await supabaseClient.from("rsvp").insert(payload);
  if (error) { msg.textContent = "Gagal kirim: " + error.message; return; }

  msg.textContent = hadir
    ? "Terima kasih! Kami tunggu kehadiranmu 💐"
    : "Terima kasih doanya, bunga telah tumbuh 🌸";
  e.target.reset();
  hadirFields.hidden = true;
  doaFields.hidden = true;
  loadSisaKuota();
  loadTaman();
});

// ====== TAMAN DOA ======
const BUNGA_EMOJI = { mawar:"🌹", tulip:"🌷", matahari:"🌻", sakura:"🌸", lily:"🌺" };

async function loadTaman() {
  const { data, error } = await supabaseClient
    .from("doa").select("*").order("created_at", { ascending: true });
  if (error) return;
  const garden = document.getElementById("garden");
  garden.innerHTML = "";
  data.forEach((d, i) => {
    const el = document.createElement("button");
    el.className = "bunga";
    el.style.animationDelay = `${(i % 10) * 0.08}s`;
    el.innerHTML = `<span>${BUNGA_EMOJI[d.bunga] || "🌸"}</span>`;
    el.title = d.nama;
    el.addEventListener("click", () =>
      showPopup(`<b>${d.nama}</b><br>${d.pesan}`));
    garden.appendChild(el);
  });
  if (!data.length) garden.innerHTML = "<p class='empty'>Jadilah yang pertama menanam doa 🌱</p>";
}
loadTaman();

// popup sederhana
function showPopup(html) {
  let p = document.getElementById("popup");
  if (!p) {
    p = document.createElement("div");
    p.id = "popup";
    p.className = "popup";
    p.onclick = () => p.remove();
    document.body.appendChild(p);
  }
  p.innerHTML = html + "<small>(klik untuk tutup)</small>";
}
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

  // gambar foto cover
  const r = Math.max(W / currentImage.width, H / currentImage.height);
  const dw = currentImage.width * r, dh = currentImage.height * r;
  ctx.drawImage(currentImage, (W - dw) / 2, (H - dh) / 2, dw, dh);

  const tpl = document.querySelector('input[name="tpl"]:checked').value;
  drawTemplate(tpl, W, H);

  document.getElementById("downloadBtn").hidden = false;
  document.getElementById("shareBtn").hidden = false;
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
    ctx.font = "40px serif";
    ["🌸","🌷","🌹","🌺"].forEach((f,i)=>{
      ctx.fillText(f, 30 + i*(W-60)/3, 55);
    });
    ctx.fillStyle = "rgba(255,255,255,.7)";
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
window.addEventListener("load", () => {
  if (document.getElementById("qrCanvas")) {
    QRCode.toCanvas(document.getElementById("qrCanvas"), checkinUrl, { width: 200 }, function (error) {
      if (error) console.error("Gagal membuat QR:", error);
    });
  }
});
