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
  const { data, error } = await supabaseClient
    .from("doa").select("*").order("created_at", { ascending: true });
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
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "doa" },
    () => loadTaman())
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

// ============================================================
// VIRTUAL PHOTOBOOTH
// - pilih jumlah frame: 1 / 3 / 4 / 5 / 6
// - isi tiap frame: kamera atau galeri (per-slot / sekaligus)
// - 10 gaya frame, tiap gaya elemennya berbeda
// PERBAIKAN: foto selalu cover-fit ke frame; polaroid foto ikut miring
// bersama kartu; kontras elemen & teks dinaikkan + scrim di belakang tulisan
// ============================================================
const photoCanvas = document.getElementById("photoCanvas");
const pctx = photoCanvas.getContext("2d");

const PB = { count: 4, style: "minimal", slots: [] };
let pbPending = -1;

// ---------- utilitas ----------
function roundedPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// cover-crop: foto SELALU memenuhi frame, pusat di tengah
function drawCover(c, img, x, y, w, h, r) {
  if (!img || !img.width) return;
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  c.save();
  if (r > 0) { roundedPath(c, x, y, w, h, r); c.clip(); }
  c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  c.restore();
}

function pbFlower(c, x, y, size, petal, core) {
  c.save(); c.translate(x, y);
  for (let i = 0; i < 6; i++) {
    c.save(); c.rotate(Math.PI / 3 * i);
    c.beginPath(); c.ellipse(0, -size * 0.62, size * 0.30, size * 0.60, 0, 0, Math.PI * 2);
    c.fillStyle = petal; c.fill(); c.restore();
  }
  c.beginPath(); c.arc(0, 0, size * 0.30, 0, Math.PI * 2);
  c.fillStyle = core; c.fill();
  c.restore();
}

function prand(seed) { const v = Math.sin(seed * 9301 + 49297) * 233280; return v - Math.floor(v); }

function spacedText(c, text, x, y, sp) {
  let cx = x;
  for (const ch of text) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + sp; }
}

// papan latar di belakang teks (scrim) supaya kontras & terfokus
function scrim(c, x, y, w, h, r, color, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = color;
  roundedPath(c, x, y, w, h, r);
  c.fill();
  c.restore();
}

// teks dengan scrim otomatis mengukur lebar
function textWithScrim(c, text, x, y, font, color, scolor, salpha, pad, sp) {
  c.save();
  c.font = font;
  const w = (sp ? c.measureText(text.split("").join(" ")).width : c.measureText(text).width) + pad * 2;
  const h = parseInt(font.match(/(\d+)px/)[1], 10) + pad * 1.6;
  scrim(c, x - w / 2, y - h + pad * 0.6, w, h, h / 2, scolor, salpha);
  c.fillStyle = color;
  c.textAlign = "center";
  if (sp) spacedText(c, text, x - (w - pad * 2) / 2, y, sp);
  else c.fillText(text, x, y);
  c.restore();
}

// ---------- layout ----------
function pbLayout(count) {
  const u = 600, g = 28, m = 44;
  const col = (i) => m + i * (u + g);
  const row = (i) => m + i * (u + g);
  switch (count) {
    case 1:
      return { W: m * 2 + u, H: m * 2 + u, cells: [{ x: m, y: m, w: u, h: u }] };
    case 3:
      return { W: m * 2 + u, H: m * 2 + u * 3 + g * 2,
        cells: [0, 1, 2].map(i => ({ x: m, y: row(i), w: u, h: u })) };
    case 4:
      return { W: m * 2 + u * 2 + g, H: m * 2 + u * 2 + g,
        cells: [[0,0],[1,0],[0,1],[1,1]].map(([cx, ry]) => ({ x: col(cx), y: row(ry), w: u, h: u })) };
    case 5:
      return { W: m * 2 + u * 2 + g, H: m * 2 + u * 3 + g * 2,
        cells: [
          { x: m, y: row(0), w: u * 2 + g, h: u },
          { x: col(0), y: row(1), w: u, h: u },
          { x: col(1), y: row(1), w: u, h: u },
          { x: col(0), y: row(2), w: u, h: u },
          { x: col(1), y: row(2), w: u, h: u }
        ] };
    case 6:
      return { W: m * 2 + u * 2 + g, H: m * 2 + u * 3 + g * 2,
        cells: [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]].map(([cx, ry]) => ({ x: col(cx), y: row(ry), w: u, h: u })) };
  }
}

// ---------- 10 GAYA FRAME ----------
const GOLD = ["#7a5c26", "#c9a45c", "#efd9a4", "#c9a45c", "#7a5c26"];
function goldGrad(c, x0, x1) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  GOLD.forEach((col, i) => g.addColorStop(i / (GOLD.length - 1), col));
  return g;
}

const PB_STYLES = [
  {
    id: "minimal", nama: "Minimal Gold", kat: "elegan", radius: 0,
    bg(c, W, H) { c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, W, H); },
    cell(c, cl) {
      c.strokeStyle = "rgba(122,94,48,0.9)"; c.lineWidth = 4;
      c.strokeRect(cl.x, cl.y, cl.w, cl.h);
      c.strokeStyle = "rgba(122,94,48,0.35)"; c.lineWidth = 1.5;
      c.strokeRect(cl.x + 12, cl.y + 12, cl.w - 24, cl.h - 24);
    },
    fg(c, W, H) {
      textWithScrim(c, "IRSYAADUL & REFALINA", W / 2, H - 16,
        '600 27px Montserrat, sans-serif', "#7A5E30", "#FFFFFF", 0.92, 18, 3);
    }
  },
  {
    id: "floral", nama: "Floral Rose", kat: "pernikahan", radius: 26,
    bg(c, W, H) { c.fillStyle = "#FDF2F3"; c.fillRect(0, 0, W, H); },
    cell(c, cl) {
      roundedPath(c, cl.x - 14, cl.y - 14, cl.w + 28, cl.h + 28, 34);
      c.strokeStyle = "#C05E78"; c.lineWidth = 6; c.stroke();
      roundedPath(c, cl.x - 4, cl.y - 4, cl.w + 8, cl.h + 8, 26);
      c.strokeStyle = "rgba(192,94,120,0.55)"; c.lineWidth = 2.5; c.stroke();
      pbFlower(c, cl.x + 6, cl.y + 8, 22, "#E58BA6", "#B8862E");
      pbFlower(c, cl.x + cl.w - 6, cl.y + cl.h - 8, 22, "#D46A8A", "#F5D7E0");
      pbFlower(c, cl.x + cl.w - 6, cl.y + 8, 16, "#F4B8C9", "#B8862E");
      pbFlower(c, cl.x + 6, cl.y + cl.h - 8, 16, "#F4B8C9", "#B8862E");
    },
    fg(c, W, H) {
      textWithScrim(c, "with love", W / 2, H - 18,
        'italic 700 44px "Cormorant Garamond", serif', "#963C54", "#FFFDFB", 0.92, 26, 0);
    }
  },
  {
    id: "goldfoil", nama: "Luxury Gold Foil", kat: "pernikahan", radius: 0,
    bg(c, W, H) {
      c.fillStyle = "#141109"; c.fillRect(0, 0, W, H);
      c.strokeStyle = goldGrad(c, 0, W); c.lineWidth = 7;
      c.strokeRect(18, 18, W - 36, H - 36);
      c.strokeStyle = "rgba(201,164,92,0.5)"; c.lineWidth = 1.5;
      c.strokeRect(36, 36, W - 72, H - 72);
    },
    cell(c, cl) {
      c.strokeStyle = goldGrad(c, cl.x, cl.x + cl.w);
      c.lineWidth = 10; c.strokeRect(cl.x - 14, cl.y - 14, cl.w + 28, cl.h + 28);
    },
    fg(c, W, H) {
      c.textAlign = "center";
      textWithScrim(c, "THE WEDDING OF", W / 2, 64,
        '400 30px Montserrat, sans-serif', "#F3DFAE", "#141109", 0.85, 16, 4);
      textWithScrim(c, "Irsyaadul & Refalina", W / 2, 128,
        'italic 700 62px "Cormorant Garamond", serif', "#F3DFAE", "#141109", 0.85, 20, 0);
      textWithScrim(c, "24 . 12 . 2026", W / 2, H - 30,
        '400 26px Montserrat, sans-serif', "#E3C078", "#141109", 0.85, 14, 4);
    }
  },
  {
    id: "polaroid", nama: "Polaroid", kat: "kekinian", radius: 0, full: true,
    bg(c, W, H) { c.fillStyle = "#E8E3D8"; c.fillRect(0, 0, W, H); },
    full(c, cl, i, slot) {
      const rot = (prand(i + 7) - 0.5) * 0.08;
      const bw = 26, bb = 116;
      c.save();
      c.translate(cl.x + cl.w / 2, cl.y + cl.h / 2);
      c.rotate(rot);
      // bayangan kartu
      c.fillStyle = "rgba(60,50,30,0.22)";
      c.fillRect(-cl.w / 2 - bw + 10, -cl.h / 2 - bw + 14, cl.w + bw * 2, cl.h + bw + bb);
      // kartu putih
      c.fillStyle = "#FFFFFF";
      c.fillRect(-cl.w / 2 - bw, -cl.h / 2 - bw, cl.w + bw * 2, cl.h + bw + bb);
      // FOTO ikut miring bersama kartu (auto-fit cover)
      if (slot) drawCover(c, slot.img, -cl.w / 2, -cl.h / 2, cl.w, cl.h, 0);
      else {
        c.fillStyle = "#EDE8DD";
        c.fillRect(-cl.w / 2, -cl.h / 2, cl.w, cl.h);
      }
      // caption tulisan tangan
      c.fillStyle = "#3F3B33";
      c.textAlign = "center";
      c.font = 'italic 700 46px "Cormorant Garamond", serif';
      c.fillText("24 . 12 . 2026", 0, cl.h / 2 + bb - 44);
      c.restore();
    },
    fg() {}
  },
  {
    id: "film", nama: "Vintage Film", kat: "kekinian", radius: 0,
    bg(c, W, H) {
      c.fillStyle = "#0D0D0D"; c.fillRect(0, 0, W, H);
      for (const yy of [12, H - 44]) {
        for (let x = 26; x < W - 26; x += 64) {
          c.fillStyle = "#F2EDDF";
          roundedPath(c, x, yy, 38, 28, 7); c.fill();
          c.fillStyle = "#0D0D0D";
          roundedPath(c, x + 7, yy + 7, 24, 14, 4); c.fill();
        }
      }
    },
    cell(c, cl) {
      c.strokeStyle = "#333333"; c.lineWidth = 2; c.strokeRect(cl.x, cl.y, cl.w, cl.h);
      scrim(c, cl.x + 10, cl.y + cl.h - 52, 190, 40, 6, "#000000", 0.55);
      c.fillStyle = "#FFB066";
      c.font = 'bold 26px "Courier New", monospace'; c.textAlign = "left";
      c.fillText("24 12 '26", cl.x + 20, cl.y + cl.h - 24);
    },
    fg(c, W) {
      textWithScrim(c, "KODAK 400 — WEDDING DAY", W / 2, 68,
        'bold 22px "Courier New", monospace', "#F2E7C4", "#0D0D0D", 0.85, 16, 0);
    }
  },
  {
    id: "magazine", nama: "Magazine Cover", kat: "kekinian", radius: 0,
    bg(c, W, H) { c.fillStyle = "#FDFCF9"; c.fillRect(0, 0, W, H); },
    cell(c, cl) {
      c.strokeStyle = "#1E1C19"; c.lineWidth = 4; c.strokeRect(cl.x, cl.y, cl.w, cl.h);
    },
    fg(c, W, H) {
      c.textAlign = "left"; c.fillStyle = "#16140F";
      c.font = '700 96px "Cormorant Garamond", serif';
      c.fillText("IR & FA", 42, 110);
      c.font = '600 25px Montserrat, sans-serif'; c.fillStyle = "#7A5E30";
      c.fillText("WEDDING  EDITION — VOL. 01", 46, 148);
      let bx = 44;
      c.fillStyle = "#16140F";
      while (bx < 250) {
        const w = 2 + prand(bx) * 7;
        c.fillRect(bx, H - 54, w, 36); bx += w + 2 + prand(bx + 1) * 5;
      }
      c.font = '500 22px Montserrat, sans-serif';
      c.fillText("24.12.2026", 264, H - 26);
    }
  },
  {
    id: "arch", nama: "Wedding Arch", kat: "pernikahan", radius: 20,
    bg(c, W, H) { c.fillStyle = "#FBF7EC"; c.fillRect(0, 0, W, H); },
    cell(c, cl) {
      c.strokeStyle = "rgba(122,94,48,0.75)"; c.lineWidth = 3;
      roundedPath(c, cl.x, cl.y, cl.w, cl.h, 20); c.stroke();
    },
    fg(c, W) {
      const cx = W / 2, top = 56;
      c.strokeStyle = "#B08D4F"; c.lineWidth = 6;
      c.beginPath(); c.arc(cx, top + 120, 96, Math.PI, 0); c.stroke();
      c.strokeStyle = "rgba(176,141,79,0.45)"; c.lineWidth = 2.5;
      c.beginPath(); c.arc(cx, top + 120, 110, Math.PI, 0); c.stroke();
      c.lineWidth = 5; c.strokeStyle = "#8A6A34";
      c.beginPath(); c.arc(cx - 19, top + 128, 17, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(cx + 19, top + 128, 17, 0, Math.PI * 2); c.stroke();
      pbFlower(c, cx - 96, top + 118, 16, "#E58BA6", "#B8862E");
      pbFlower(c, cx + 96, top + 118, 16, "#D46A8A", "#F5D7E0");
      pbFlower(c, cx, top + 24, 14, "#F4B8C9", "#B8862E");
      textWithScrim(c, "Happily Ever After", cx, top + 196,
        'italic 700 46px "Cormorant Garamond", serif', "#7A5320", "#FBF7EC", 0.9, 22, 0);
    }
  },
  {
    id: "korean", nama: "Korean Studio", kat: "kekinian", radius: 30,
    bg(c, W, H) {
      c.fillStyle = "#F6F1E6"; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(122,94,48,0.16)";
      for (let i = 0; i < 70; i++) {
        c.beginPath();
        c.arc(prand(i) * W, prand(i + 99) * H, 3.5, 0, Math.PI * 2);
        c.fill();
      }
    },
    cell(c, cl, i) {
      c.strokeStyle = "#FFFFFF"; c.lineWidth = 12;
      roundedPath(c, cl.x - 7, cl.y - 7, cl.w + 14, cl.h + 14, 34); c.stroke();
      c.strokeStyle = "#A34D63"; c.lineWidth = 4;
      c.beginPath(); c.arc(cl.x + 58, cl.y + 58, 32, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "#A34D63"; c.textAlign = "center";
      c.font = '700 24px Montserrat, sans-serif';
      c.fillText(i % 2 ? "REC" : "♡", cl.x + 58, cl.y + 67);
    },
    fg(c, W, H) {
      textWithScrim(c, "our best days", W / 2, H - 22,
        '400 32px Montserrat, sans-serif', "#5B5148", "#F6F1E6", 0.92, 24, 0);
    }
  },
  {
    id: "neon", nama: "Neon Party", kat: "gaya-gayaan", radius: 14,
    bg(c, W, H) {
      c.fillStyle = "#100C1C"; c.fillRect(0, 0, W, H);
      const cols = ["#FF6EC7", "#4EF0E0", "#FFD166", "#9D7BFF"];
      for (let i = 0; i < 100; i++) {
        c.fillStyle = cols[i % 4];
        c.globalAlpha = 0.55 + prand(i) * 0.45;
        c.beginPath();
        c.arc(prand(i * 3) * W, prand(i * 7) * H, 3 + prand(i) * 4.5, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
    },
    cell(c, cl, i) {
      c.strokeStyle = i % 2 ? "#FF6EC7" : "#4EF0E0";
      c.lineWidth = 7; c.shadowColor = c.strokeStyle; c.shadowBlur = 26;
      roundedPath(c, cl.x - 9, cl.y - 9, cl.w + 18, cl.h + 18, 18); c.stroke();
      c.shadowBlur = 0;
    },
    fg(c, W, H) {
      c.textAlign = "center";
      c.shadowColor = "#FF6EC7"; c.shadowBlur = 34;
      c.fillStyle = "#FFE3F2"; c.font = '800 66px Montserrat, sans-serif';
      c.fillText("PARTY MODE", W / 2, 94);
      c.shadowColor = "#4EF0E0";
      c.fillStyle = "#DAFFFB"; c.font = '400 36px Montserrat, sans-serif';
      c.fillText("ON : 24.12.26", W / 2, H - 38);
      c.shadowBlur = 0;
    }
  },
  {
    id: "retro", nama: "Retro 90s", kat: "gaya-gayaan", radius: 0,
    bg(c, W, H) {
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#F5BFCF"); g.addColorStop(0.5, "#F9D9B4"); g.addColorStop(1, "#BFE3D2");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) {
        const x = prand(i * 11) * W, y = prand(i * 17) * H;
        c.fillStyle = ["#D46584", "#D9A62E", "#5FA383"][i % 3];
        for (let p = 0; p < 5; p++) {
          c.beginPath();
          c.ellipse(x + 20 * Math.cos(p * 1.256), y + 20 * Math.sin(p * 1.256), 11, 11, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = "#FFFDF8";
        c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
      }
    },
    cell(c, cl) {
      c.fillStyle = "rgba(255,253,248,0.95)";
      c.fillRect(cl.x - 12, cl.y - 12, cl.w + 24, cl.h + 24);
      c.strokeStyle = "#C05E78"; c.lineWidth = 5; c.strokeRect(cl.x - 12, cl.y - 12, cl.w + 24, cl.h + 24);
    },
    fg(c, W, H) {
      textWithScrim(c, "X O   X O", W / 2, 86,
        '700 62px "Courier New", monospace', "#8E3E54", "#FFF6EC", 0.92, 24, 0);
      textWithScrim(c, "~ so in love ~", W / 2, H - 26,
        'italic 700 40px "Courier New", monospace', "#8E3E54", "#FFF6EC", 0.92, 20, 0);
    }
  }
];

// ---------- render ----------
function pbRender() {
  const st = PB_STYLES.find(s => s.id === PB.style);
  const L = pbLayout(PB.count);
  photoCanvas.width = L.W; photoCanvas.height = L.H;
  pctx.clearRect(0, 0, L.W, L.H);

  st.bg(pctx, L.W, L.H);
  L.cells.forEach((cl, i) => {
    if (st.full) {
      st.full(pctx, cl, i, PB.slots[i]);
    } else {
      st.cell(pctx, cl, i);
      if (PB.slots[i]) drawCover(pctx, PB.slots[i].img, cl.x, cl.y, cl.w, cl.h, st.radius || 0);
      else {
        pctx.fillStyle = "rgba(122,94,48,0.06)";
        pctx.fillRect(cl.x, cl.y, cl.w, cl.h);
        pctx.fillStyle = "rgba(122,94,48,0.35)";
        pctx.font = '200 120px Montserrat, sans-serif';
        pctx.textAlign = "center";
        pctx.fillText("+", cl.x + cl.w / 2, cl.y + cl.h / 2 + 42);
      }
    }
  });
  st.fg(pctx, L.W, L.H);

  const ada = PB.slots.some(s => s);
  document.getElementById("downloadBtn").hidden = !ada;
  document.getElementById("shareBtn").hidden = !ada;
}

function pbRenderPreview(st, mini, mw, mh) {
  const L = pbLayout(1);
  const scale = Math.min(mw / L.W, mh / L.H);
  mini.width = L.W * scale; mini.height = L.H * scale;
  const c = mini.getContext("2d");
  c.scale(scale, scale);
  st.bg(c, L.W, L.H);
  const cl = L.cells[0];
  if (st.full) st.full(c, cl, 0, null);
  else {
    st.cell(c, cl, 0);
    c.fillStyle = "#E4DECF";
    c.fillRect(cl.x, cl.y, cl.w, cl.h);
    c.fillStyle = "rgba(122,94,48,0.4)";
    c.font = '200 120px Montserrat, sans-serif'; c.textAlign = "center";
    c.fillText("+", cl.x + cl.w / 2, cl.y + cl.h / 2 + 40);
  }
  st.fg(c, L.W, L.H);
}

// ---------- UI ----------
function pbBuildStyles() {
  const wrap = document.getElementById("pbStyles");
  wrap.innerHTML = "";
  PB_STYLES.forEach(st => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pb-style" + (st.id === PB.style ? " on" : "");
    btn.dataset.style = st.id;
    const mini = document.createElement("canvas");
    mini.className = "pb-style-canvas";
    btn.appendChild(mini);
    const lbl = document.createElement("span");
    lbl.textContent = st.nama;
    btn.appendChild(lbl);
    pbRenderPreview(st, mini, 120, 150);
    btn.addEventListener("click", () => {
      PB.style = st.id;
      document.getElementById("pbStyleName").textContent = "— " + st.nama;
      wrap.querySelectorAll(".pb-style").forEach(b => b.classList.toggle("on", b.dataset.style === st.id));
      pbRender();
    });
    wrap.appendChild(btn);
  });
  document.getElementById("pbStyleName").textContent = "— " + PB_STYLES.find(s => s.id === PB.style).nama;
}

function pbBuildSlots() {
  const wrap = document.getElementById("pbSlots");
  wrap.innerHTML = "";
  for (let i = 0; i < PB.count; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pb-slot" + (PB.slots[i] ? " filled" : "");
    b.dataset.i = i;
    if (PB.slots[i]) {
      b.style.backgroundImage = `url(${PB.slots[i].url})`;
      b.innerHTML = `<span>Foto ${i + 1} — ganti</span>`;
    } else {
      b.innerHTML = `<span>+ Foto ${i + 1}</span>`;
    }
    b.addEventListener("click", () => {
      pbPending = i;
      const pick = document.getElementById("pbPick");
      pick.value = "";
      pick.click();
    });
    wrap.appendChild(b);
  }
}

function pbSetCount(n) {
  PB.count = n;
  PB.slots = PB.slots.slice(0, n);
  while (PB.slots.length < n) PB.slots.push(null);
  document.querySelectorAll("#pbCount button").forEach(b =>
    b.classList.toggle("on", parseInt(b.dataset.n) === n));
  pbBuildSlots();
  pbRender();
}

document.querySelectorAll("#pbCount button").forEach(b =>
  b.addEventListener("click", () => pbSetCount(parseInt(b.dataset.n))));

function pbLoadFile(file, index) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      PB.slots[index] = { img, url: ev.target.result };
      pbBuildSlots();
      pbRender();
      const next = PB.slots.findIndex((s, i) => i > index && !s);
      const firstEmpty = PB.slots.findIndex(s => !s);
      const lanjut = next !== -1 ? next : firstEmpty;
      if (lanjut !== -1) {
        pbPending = lanjut;
        setTimeout(() => document.getElementById("pbPick").click(), 250);
      }
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

document.getElementById("pbPick").addEventListener("change", (e) => {
  if (pbPending >= 0) pbLoadFile(e.target.files[0], pbPending);
});

document.getElementById("pbFillAll").addEventListener("click", () => {
  document.getElementById("pbPickMulti").value = "";
  document.getElementById("pbPickMulti").click();
});

document.getElementById("pbPickMulti").addEventListener("change", (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
  let idx = PB.slots.findIndex(s => !s);
  for (const f of files) {
    if (idx === -1 || idx >= PB.count) break;
    const cur = idx;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        PB.slots[cur] = { img, url: ev.target.result };
        pbBuildSlots();
        pbRender();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
    idx = PB.slots.findIndex((s, i) => i > cur && !s);
  }
});

while (PB.slots.length < PB.count) PB.slots.push(null);
pbBuildStyles();
pbBuildSlots();
pbRender();

// ---------- download & share ----------
document.getElementById("downloadBtn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = "photobooth-irsyaadul-refalina.png";
  a.href = photoCanvas.toDataURL("image/png");
  a.click();
});

document.getElementById("shareBtn").addEventListener("click", () => {
  photoCanvas.toBlob(async (blob) => {
    const file = new File([blob], "photobooth.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Wedding Photobooth" });
    } else {
      alert("Fitur share tidak didukung di browser ini. Silakan download lalu share manual.");
    }
  });
});

// ====== SIMPUL PITA DI COVER (bow) ======
(function () {
  const env = document.getElementById("luxuryEnvelope");
  if (!env || document.getElementById("ribbonBow")) return;

  env.insertAdjacentHTML("beforeend", `
    <div class="ribbon-bow" id="ribbonBow">
      <span class="bow-loop l"></span>
      <span class="bow-loop r"></span>
      <span class="bow-tail l"></span>
      <span class="bow-tail r"></span>
      <span class="bow-core"></span>
    </div>`);

  function untie() { env.classList.add("ribbon-off"); }
  env.addEventListener("click", untie);
  env.addEventListener("touchstart", untie, { passive: true });
})();

// ====== QR HARI-H ======
const checkinUrl = location.origin + location.pathname.replace("index.html","") + "checkin.html";
const qrImage = document.getElementById("qrImage");
if (qrImage) {
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkinUrl)}`;
}
