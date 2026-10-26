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
// ============================================================
const photoCanvas = document.getElementById("photoCanvas");
const pctx = photoCanvas.getContext("2d");

const PB = { count: 4, style: "minimal", slots: [] }; // slots[i] = {img, url} | null
let pbPending = -1;

// ---------- utilitas gambar ----------
function roundedPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawCover(c, img, x, y, w, h, r) {
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

// pseudo-acak deterministik (supaya confetti/dots stabil antar-render)
function prand(seed) { const v = Math.sin(seed * 9301 + 49297) * 233280; return v - Math.floor(v); }

function spacedText(c, text, x, y, sp) {
  let cx = x;
  for (const ch of text) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + sp; }
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
const GOLD = ["#8a6a34", "#c9a45c", "#e8cf9a", "#c9a45c", "#8a6a34"];
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
      c.strokeStyle = "rgba(158,122,62,0.75)"; c.lineWidth = 3;
      c.strokeRect(cl.x, cl.y, cl.w, cl.h);
      c.strokeStyle = "rgba(158,122,62,0.3)"; c.lineWidth = 1;
      c.strokeRect(cl.x + 10, cl.y + 10, cl.w - 20, cl.h - 20);
    },
    fg(c, W, H) {
      c.fillStyle = "#9E7A3E"; c.textAlign = "center";
      c.font = '500 26px Montserrat, sans-serif';
      spacedText(c, "I R S Y A A D U L   &   R E F A L I N A", W / 2, H - 14, 2);
    }
  },
  {
    id: "floral", nama: "Floral Rose", kat: "pernikahan", radius: 26,
    bg(c, W, H) { c.fillStyle = "#FDF4F4"; c.fillRect(0, 0, W, H); },
    cell(c, cl) {
      roundedPath(c, cl.x - 14, cl.y - 14, cl.w + 28, cl.h + 28, 34);
      c.strokeStyle = "#D98CA0"; c.lineWidth = 5; c.stroke();
      roundedPath(c, cl.x - 4, cl.y - 4, cl.w + 8, cl.h + 8, 26);
      c.strokeStyle = "rgba(217,140,160,0.45)"; c.lineWidth = 2; c.stroke();
      pbFlower(c, cl.x + 4, cl.y + 6, 20, "#F4B8C9", "#E3B94E");
      pbFlower(c, cl.x + cl.w - 4, cl.y + cl.h - 6, 20, "#E58BA6", "#FDE9EE");
    },
    fg(c, W, H) {
      c.fillStyle = "#B56576"; c.textAlign = "center";
      c.font = 'italic 600 40px "Cormorant Garamond", serif';
      c.fillText("with love", W / 2, H - 20);
    }
  },
  {
    id: "goldfoil", nama: "Luxury Gold Foil", kat: "pernikahan", radius: 0,
    bg(c, W, H) {
      c.fillStyle = "#181510"; c.fillRect(0, 0, W, H);
      const g = goldGrad(c, 0, W);
      c.strokeStyle = g; c.lineWidth = 6; c.strokeRect(18, 18, W - 36, H - 36);
      c.strokeStyle = "rgba(201,164,92,0.4)"; c.lineWidth = 1;
      c.strokeRect(34, 34, W - 68, H - 68);
    },
    cell(c, cl) {
      const g = goldGrad(c, cl.x, cl.x + cl.w);
      c.strokeStyle = g; c.lineWidth = 8; c.strokeRect(cl.x - 12, cl.y - 12, cl.w + 24, cl.h + 24);
    },
    fg(c, W, H) {
      c.textAlign = "center"; c.fillStyle = "#E8CF9A";
      c.font = '300 30px Montserrat, sans-serif';
      spacedText(c, "T H E   W E D D I N G   O F", W / 2, 66, 3);
      c.font = 'italic 600 64px "Cormorant Garamond", serif';
      c.fillText("Irsyaadul & Refalina", W / 2, 128);
      c.fillStyle = "#C9A45C"; c.font = '300 26px Montserrat, sans-serif';
      spacedText(c, "2 4 . 1 2 . 2 0 2 6", W / 2, H - 34, 4);
    }
  },
  {
    id: "polaroid", nama: "Polaroid", kat: "kekinian", radius: 0, card: true,
    bg(c, W, H) { c.fillStyle = "#EAE5DB"; c.fillRect(0, 0, W, H); },
    cell(c, cl, i) {
      const rot = (prand(i + 7) - 0.5) * 0.07;
      const bw = 26, bb = 110;
      c.save();
      c.translate(cl.x + cl.w / 2, cl.y + cl.h / 2);
      c.rotate(rot);
      c.fillStyle = "rgba(60,50,30,0.18)";
      c.fillRect(-cl.w / 2 - bw + 8, -cl.h / 2 - bw + 12, cl.w + bw * 2, cl.h + bw + bb);
      c.fillStyle = "#FFFFFF";
      c.fillRect(-cl.w / 2 - bw, -cl.h / 2 - bw, cl.w + bw * 2, cl.h + bw + bb);
      c.restore();
      c.save();
      c.translate(cl.x + cl.w / 2, cl.y + cl.h / 2);
      c.rotate(rot);
      c.fillStyle = "#5B5648"; c.textAlign = "center";
      c.font = 'italic 44px "Cormorant Garamond", serif';
      c.fillText("24 . 12 . 2026", 0, cl.h / 2 + bb - 42);
      c.restore();
    },
    fg() {}
  },
  {
    id: "film", nama: "Vintage Film", kat: "kekinian", radius: 0,
    bg(c, W, H) {
      c.fillStyle = "#101010"; c.fillRect(0, 0, W, H);
      // lubang film atas & bawah
      for (const yy of [12, H - 42]) {
        for (let x = 26; x < W - 26; x += 64) {
          c.fillStyle = "#F2EDDF";
          roundedPath(c, x, yy, 36, 26, 7); c.fill();
          c.fillStyle = "#101010";
          roundedPath(c, x + 6, yy + 6, 24, 14, 4); c.fill();
        }
      }
    },
    cell(c, cl) {
      c.strokeStyle = "#2A2A2A"; c.lineWidth = 2; c.strokeRect(cl.x, cl.y, cl.w, cl.h);
      c.fillStyle = "rgba(242,130,40,0.9)";
      c.font = '24px "Courier New", monospace'; c.textAlign = "left";
      c.fillText("24 12 '26", cl.x + 18, cl.y + cl.h - 18);
    },
    fg(c, W) {
      c.fillStyle = "#8A857D"; c.textAlign = "center";
      c.font = '18px "Courier New", monospace';
      c.fillText("KODAK 400 — WEDDING DAY", W / 2, 66);
    }
  },
  {
    id: "magazine", nama: "Magazine Cover", kat: "kekinian", radius: 0,
    bg(c, W, H) { c.fillStyle = "#FDFCF9"; c.fillRect(0, 0, W, H); },
    cell(c, cl) {
      c.strokeStyle = "#1E1C19"; c.lineWidth = 3; c.strokeRect(cl.x, cl.y, cl.w, cl.h);
    },
    fg(c, W, H) {
      c.textAlign = "left"; c.fillStyle = "#1E1C19";
      c.font = '700 92px "Cormorant Garamond", serif';
      c.fillText("IR & FA", 44, 108);
      c.font = '500 24px Montserrat, sans-serif'; c.fillStyle = "#9E7A3E";
      c.fillText("WEDDING  EDITION — VOL. 01", 46, 144);
      // barcode
      let bx = 44;
      c.fillStyle = "#1E1C19";
      while (bx < 250) {
        const w = 2 + prand(bx) * 7;
        c.fillRect(bx, H - 52, w, 34); bx += w + 2 + prand(bx + 1) * 5;
      }
      c.font = '300 20px Montserrat, sans-serif';
      c.fillText("24.12.2026", 260, H - 26);
    }
  },
  {
    id: "arch", nama: "Wedding Arch", kat: "pernikahan", radius: 20,
    bg(c, W, H) { c.fillStyle = "#FBF7EE"; c.fillRect(0, 0, W, H); },
    cell(c, cl) {
      c.strokeStyle = "rgba(158,122,62,0.6)"; c.lineWidth = 2;
      roundedPath(c, cl.x, cl.y, cl.w, cl.h, 20); c.stroke();
    },
    fg(c, W) {
      const cx = W / 2, top = 58;
      // lengkung pelaminan
      c.strokeStyle = "#C9A45C"; c.lineWidth = 5;
      c.beginPath(); c.arc(cx, top + 120, 96, Math.PI, 0); c.stroke();
      c.strokeStyle = "rgba(201,164,92,0.4)"; c.lineWidth = 2;
      c.beginPath(); c.arc(cx, top + 120, 108, Math.PI, 0); c.stroke();
      // dua cincin
      c.lineWidth = 4;
      c.beginPath(); c.arc(cx - 18, top + 128, 16, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(cx + 18, top + 128, 16, 0, Math.PI * 2); c.stroke();
      // bunga di ujung lengkung
      pbFlower(c, cx - 96, top + 118, 14, "#F4B8C9", "#E3B94E");
      pbFlower(c, cx + 96, top + 118, 14, "#E58BA6", "#FDE9EE");
      c.fillStyle = "#9E7A3E"; c.textAlign = "center";
      c.font = 'italic 600 42px "Cormorant Garamond", serif';
      c.fillText("Happily Ever After", cx, top + 190);
    }
  },
  {
    id: "korean", nama: "Korean Studio", kat: "kekinian", radius: 30,
    bg(c, W, H) {
      c.fillStyle = "#F6F1E8"; c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(158,122,62,0.25)";
      for (let i = 0; i < 70; i++) {
        c.beginPath();
        c.arc(prand(i) * W, prand(i + 99) * H, 3, 0, Math.PI * 2);
        c.fill();
      }
    },
    cell(c, cl, i) {
      c.strokeStyle = "#FFFFFF"; c.lineWidth = 10;
      roundedPath(c, cl.x - 6, cl.y - 6, cl.w + 12, cl.h + 12, 34); c.stroke();
      // stempel kecil
      c.strokeStyle = "#B56576"; c.lineWidth = 3;
      c.beginPath(); c.arc(cl.x + 56, cl.y + 56, 30, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "#B56576"; c.textAlign = "center";
      c.font = '700 22px Montserrat, sans-serif';
      c.fillText(i % 2 ? "REC" : "♡", cl.x + 56, cl.y + 64);
    },
    fg(c, W, H) {
      c.fillStyle = "#7A756C"; c.textAlign = "center";
      c.font = '300 30px Montserrat, sans-serif';
      c.fillText("our best days", W / 2, H - 22);
    }
  },
  {
    id: "neon", nama: "Neon Party", kat: "gaya-gayaan", radius: 14,
    bg(c, W, H) {
      c.fillStyle = "#14101E"; c.fillRect(0, 0, W, H);
      // confetti
      const cols = ["#FF6EC7", "#4EF0E0", "#FFD166", "#9D7BFF"];
      for (let i = 0; i < 90; i++) {
        c.fillStyle = cols[i % 4];
        c.globalAlpha = 0.5 + prand(i) * 0.5;
        c.beginPath();
        c.arc(prand(i * 3) * W, prand(i * 7) * H, 3 + prand(i) * 4, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
    },
    cell(c, cl, i) {
      c.strokeStyle = i % 2 ? "#FF6EC7" : "#4EF0E0";
      c.lineWidth = 6; c.shadowColor = c.strokeStyle; c.shadowBlur = 24;
      roundedPath(c, cl.x - 8, cl.y - 8, cl.w + 16, cl.h + 16, 18); c.stroke();
      c.shadowBlur = 0;
    },
    fg(c, W, H) {
      c.textAlign = "center";
      c.shadowColor = "#FF6EC7"; c.shadowBlur = 30;
      c.fillStyle = "#FFD6EE"; c.font = '700 64px Montserrat, sans-serif';
      c.fillText("PARTY MODE", W / 2, 92);
      c.shadowColor = "#4EF0E0";
      c.fillStyle = "#D8FFFB"; c.font = '300 34px Montserrat, sans-serif';
      c.fillText("ON : 24.12.26", W / 2, H - 40);
      c.shadowBlur = 0;
    }
  },
  {
    id: "retro", nama: "Retro 90s", kat: "gaya-gayaan", radius: 0,
    bg(c, W, H) {
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#F7C6D3"); g.addColorStop(0.5, "#F9D9B8"); g.addColorStop(1, "#C6E5D8");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // bunga & bintang funky
      for (let i = 0; i < 8; i++) {
        const x = prand(i * 11) * W, y = prand(i * 17) * H;
        c.fillStyle = ["#E58BA6", "#E3B94E", "#7FBFA3"][i % 3];
        for (let p = 0; p < 5; p++) {
          c.beginPath();
          c.ellipse(x + 18 * Math.cos(p * 1.256), y + 18 * Math.sin(p * 1.256), 10, 10, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = "#FFFDF8";
        c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.fill();
      }
    },
    cell(c, cl) {
      c.fillStyle = "rgba(255,253,248,0.9)";
      c.fillRect(cl.x - 12, cl.y - 12, cl.w + 24, cl.h + 24);
      c.strokeStyle = "#E58BA6"; c.lineWidth = 4; c.strokeRect(cl.x - 12, cl.y - 12, cl.w + 24, cl.h + 24);
    },
    fg(c, W, H) {
      c.textAlign = "center"; c.fillStyle = "#B56576";
      c.font = '700 60px "Courier New", monospace';
      c.fillText("X O   X O", W / 2, 84);
      c.font = 'italic 40px "Courier New", monospace';
      c.fillText("~ so in love ~", W / 2, H - 30);
    }
  }
];

// ---------- render utama ----------
function pbRender() {
  const st = PB_STYLES.find(s => s.id === PB.style);
  const L = pbLayout(PB.count);
  photoCanvas.width = L.W; photoCanvas.height = L.H;
  pctx.clearRect(0, 0, L.W, L.H);

  st.bg(pctx, L.W, L.H);
  L.cells.forEach((cl, i) => {
    if (st.card) {
      // polaroid: kartu dulu, lalu foto, lalu tulisan
      st.cell(pctx, cl, i);
      if (PB.slots[i]) drawCover(pctx, PB.slots[i].img, cl.x, cl.y, cl.w, cl.h, 0);
    } else {
      st.cell(pctx, cl, i);
      if (PB.slots[i]) drawCover(pctx, PB.slots[i].img, cl.x, cl.y, cl.w, cl.h, st.radius || 0);
    }
  });
  st.fg(pctx, L.W, L.H);

  const ada = PB.slots.some(s => s);
  document.getElementById("downloadBtn").hidden = !ada;
  document.getElementById("shareBtn").hidden = !ada;
}

// pratinjau kecil tiap gaya
function pbRenderPreview(st, mini, mw, mh) {
  const L = pbLayout(1);
  const scale = Math.min(mw / L.W, mh / L.H);
  mini.width = L.W * scale; mini.height = L.H * scale;
  const c = mini.getContext("2d");
  c.scale(scale, scale);
  st.bg(c, L.W, L.H);
  const cl = L.cells[0];
  st.cell(c, cl, 0);
  c.fillStyle = "#E8E2D5";
  c.fillRect(cl.x, cl.y, cl.w, cl.h);
  c.fillStyle = "rgba(120,100,60,0.5)";
  c.font = '200 120px Montserrat, sans-serif'; c.textAlign = "center";
  c.fillText("+", cl.x + cl.w / 2, cl.y + cl.h / 2 + 40);
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
      // lanjut otomatis ke slot kosong berikutnya
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

// init
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
