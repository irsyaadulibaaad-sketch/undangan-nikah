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

// ====== FAQ AKORDEON ======
document.querySelectorAll(".faq-q").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item.open").forEach(i => i.classList.remove("open"));
    if (!wasOpen) item.classList.add("open");
  });
});
