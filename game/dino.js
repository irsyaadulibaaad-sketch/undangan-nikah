// ============================================================
// THE JOURNEY — Pangeran menggendong Putri (Canvas 2D murni)
// - Responsif: canvas memenuhi iframe penuh, tanpa ruang kosong
// - Rintangan kontras: outline gelap + bayangan tanah
// Logika game (skor, kecepatan, rintangan, high score) identik.
// ============================================================
const c = document.getElementById("c");
const ctx = c.getContext("2d");

// Ruang virtual permainan (semua logika memakai koordinat ini)
const W = 800, H = 300;
const GROUND = H - 50;

// Skala letterbox agar memenuhi layar berapapun ukurannya
let scale = 1, offX = 0, offY = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  c.style.width = w + "px";
  c.style.height = h + "px";
  scale = Math.min(c.width / W, c.height / H);
  offX = (c.width - W * scale) / 2;
  offY = (c.height - H * scale) / 2;
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
resize();

let state = "ready";
let score = 0, speed = 5, obstacles = [], frame = 0;
let player = { x: 80, y: GROUND, w: 70, h: 60, jump: false, vy: 0 };

const hi = () => parseInt(localStorage.getItem("dinoHi") || 0);
let highScore = hi();

// ---------- PALET WARNA ----------
const COL = {
  skin: "#F4E3C8",
  skinShade: "#E8CFA8",
  hair: "#3B2F26",
  princeCoat: "#1A231B",
  princeCoatHi: "#2A3A2D",
  gold: "#9E7A3E",
  goldBright: "#C5A059",
  goldLight: "#F4E8D1",
  dress: "#FFFFFF",
  dressShade: "#E4D8EC",
  blush: "#D4808C",
  outline: "#4A3B22"
};

// ---------- BACKGROUND ----------
const clouds = [
  { x: 100, y: 46, s: 1.0, v: 0.25 },
  { x: 400, y: 26, s: 0.7, v: 0.18 },
  { x: 680, y: 60, s: 1.2, v: 0.3 }
];
const bushes = [
  { x: 60, s: 1.0 }, { x: 300, s: 0.8 }, { x: 540, s: 1.15 }, { x: 760, s: 0.9 }
];

function drawCloud(x, y, s) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.arc(18, -6, 20, 0, Math.PI * 2);
  ctx.arc(40, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBush(x, s) {
  ctx.save();
  ctx.translate(x, GROUND + 6); ctx.scale(s, s);
  ctx.fillStyle = "#7A8C6A";
  ctx.beginPath();
  ctx.arc(0, 0, 14, Math.PI, 0);
  ctx.arc(20, 0, 18, Math.PI, 0);
  ctx.arc(44, 0, 13, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#5F7052";
  ctx.beginPath();
  ctx.arc(10, 2, 4, 0, Math.PI * 2);
  ctx.arc(32, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// bayangan tanah untuk rintangan (agar tidak terlihat seperti stiker)
function obstacleShadow(cx, w) {
  ctx.fillStyle = "rgba(74,59,34,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, GROUND + 6, w, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================
// KARAKTER: PANGERAN MENGGENDONG PUTRI
// ============================================================
function drawCouple(x, y, runFrame, airborne) {
  const t = runFrame;
  const bob = airborne ? -4 : Math.abs(Math.sin(t)) * 2.5;
  const capeWave = Math.sin(t * 0.7) * 6;

  ctx.save();
  ctx.translate(x, y + bob);

  ctx.fillStyle = "rgba(74,59,34,0.18)";
  ctx.beginPath();
  ctx.ellipse(2, 2 - bob, airborne ? 26 : 34, airborne ? 5 : 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kaki pangeran (berlari dua fase)
  ctx.strokeStyle = COL.princeCoat;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -34);
  ctx.lineTo(-4 + Math.sin(t + Math.PI) * 16, -34 + Math.max(0, Math.cos(t + Math.PI)) * 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -34);
  ctx.lineTo(4 + Math.sin(t) * 16, -34 + Math.max(0, Math.cos(t)) * 22);
  ctx.stroke();
  ctx.fillStyle = COL.gold;
  ctx.beginPath();
  ctx.ellipse(-4 + Math.sin(t + Math.PI) * 16, -13 + Math.max(0, Math.cos(t + Math.PI)) * 22, 6, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(4 + Math.sin(t) * 16, -13 + Math.max(0, Math.cos(t)) * 22, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jas
  ctx.fillStyle = COL.princeCoat;
  ctx.beginPath();
  ctx.moveTo(-14, -34);
  ctx.lineTo(-16, -78);
  ctx.quadraticCurveTo(0, -86, 14, -78);
  ctx.lineTo(13, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COL.princeCoatHi;
  ctx.beginPath();
  ctx.moveTo(-14, -34);
  ctx.lineTo(-15, -70);
  ctx.quadraticCurveTo(-8, -76, -2, -76);
  ctx.lineTo(-4, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COL.goldLight;
  ctx.beginPath();
  ctx.moveTo(-5, -80); ctx.lineTo(5, -80); ctx.lineTo(0, -64); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COL.goldBright;
  ctx.beginPath();
  ctx.arc(0, -58, 3, 0, Math.PI * 2);
  ctx.fill();

  // Lengan menggendong
  ctx.strokeStyle = COL.princeCoat;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(8, -72);
  ctx.quadraticCurveTo(22, -66, 30, -56);
  ctx.stroke();
  ctx.fillStyle = COL.skin;
  ctx.beginPath();
  ctx.arc(31, -55, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Kepala pangeran
  ctx.fillStyle = COL.skin;
  ctx.beginPath();
  ctx.arc(-2, -96, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.hair;
  ctx.beginPath();
  ctx.arc(-2, -99, 13, Math.PI * 0.95, Math.PI * 2.02);
  ctx.quadraticCurveTo(9, -92, 11, -96);
  ctx.lineTo(11, -104);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COL.gold;
  ctx.beginPath();
  ctx.moveTo(-9, -108); ctx.lineTo(-9, -114); ctx.lineTo(-5, -110);
  ctx.lineTo(-2, -116); ctx.lineTo(1, -110); ctx.lineTo(5, -114);
  ctx.lineTo(5, -108); ctx.closePath();
  ctx.fill();
  const blink = (t % 120) < 6;
  ctx.strokeStyle = "#2C2A28";
  ctx.lineWidth = 1.6;
  if (blink) {
    ctx.beginPath(); ctx.moveTo(4, -96); ctx.lineTo(9, -96); ctx.stroke();
  } else {
    ctx.fillStyle = "#2C2A28";
    ctx.beginPath(); ctx.arc(7, -96, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(6, -91, 3, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = COL.blush;
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(2, -92, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // PUTRI
  ctx.save();
  ctx.translate(26, -66);

  ctx.fillStyle = COL.dressShade;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-18 - capeWave, 8, -26 - capeWave, 22 + Math.sin(t) * 2);
  ctx.quadraticCurveTo(-10, 18, 0, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COL.dress;
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.quadraticCurveTo(0, -6, 7, -2);
  ctx.lineTo(12, 16);
  ctx.quadraticCurveTo(0, 22, -12, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COL.goldBright;
  ctx.fillRect(-9, 8, 19, 3);

  ctx.strokeStyle = COL.skin;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.quadraticCurveTo(-14, -10, -20, -16);
  ctx.stroke();

  ctx.fillStyle = COL.skin;
  ctx.beginPath();
  ctx.arc(0, -16, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.hair;
  ctx.beginPath();
  ctx.arc(0, -19, 10, Math.PI * 0.9, Math.PI * 2.05);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8, -26, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COL.goldBright;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.45;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 7, -27 + Math.sin(a) * 4, 2.2, 3.6, a + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#FDE9EE";
  ctx.beginPath(); ctx.arc(0, -27, 2, 0, Math.PI * 2); ctx.fill();

  if (blink) {
    ctx.strokeStyle = "#2C2A28"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(2, -16); ctx.lineTo(6, -16); ctx.stroke();
  } else {
    ctx.fillStyle = "#2C2A28";
    ctx.beginPath(); ctx.arc(4.5, -16, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(5, -16.6, 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = "#2C2A28"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(4, -12, 2.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.fillStyle = COL.blush; ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.arc(1, -12, 2, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Buket bunga
  ctx.strokeStyle = "#5C7A33"; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(9, 4); ctx.lineTo(14, -2); ctx.stroke();
  ctx.fillStyle = "#D46A8A";
  ctx.beginPath(); ctx.arc(15, -4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#F4B8C9";
  ctx.beginPath(); ctx.arc(12.5, -5.5, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(17, -6, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#E3B94E";
  ctx.beginPath(); ctx.arc(15, -4.5, 1.4, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
  ctx.restore();
}

// ============================================================
// RINTANGAN — kontras tinggi + outline + bayangan tanah
// ============================================================
function spawnObstacle() {
  const types = ["ring","cake","bouquet","glass"];
  const type = types[Math.floor(Math.random() * types.length)];
  obstacles.push({ x: W, y: GROUND, w: 30, h: 40, type });
}

function drawObstacle(o) {
  ctx.save();
  ctx.lineJoin = "round";

  if (o.type === "ring") {
    obstacleShadow(o.x + 15, 16);
    // cincin emas dengan outline coklat
    const g = ctx.createLinearGradient(o.x, o.y - 40, o.x + 30, o.y);
    g.addColorStop(0, "#E8CE93"); g.addColorStop(0.5, "#C5A059"); g.addColorStop(1, "#8A6A2E");
    ctx.strokeStyle = COL.outline; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(o.x + 15, o.y - 18, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = g; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(o.x + 15, o.y - 18, 13, 0, Math.PI * 2); ctx.stroke();
    // berlian biru mudah terlihat
    ctx.fillStyle = "#BFE0EE";
    ctx.strokeStyle = COL.outline; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(o.x + 15, o.y - 37); ctx.lineTo(o.x + 21, o.y - 31);
    ctx.lineTo(o.x + 15, o.y - 25); ctx.lineTo(o.x + 9, o.y - 31);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(o.x + 13, o.y - 32, 1.4, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === "cake") {
    obstacleShadow(o.x + 13, 15);
    ctx.strokeStyle = COL.outline; ctx.lineWidth = 2.5;
    // tingkat bawah
    ctx.fillStyle = "#F4E8D1";
    ctx.beginPath(); ctx.rect(o.x + 2, o.y - 18, 22, 18); ctx.fill(); ctx.stroke();
    // tingkat atas
    ctx.fillStyle = "#FBF6EA";
    ctx.beginPath(); ctx.rect(o.x + 6, o.y - 28, 14, 10); ctx.fill(); ctx.stroke();
    // pita emas
    ctx.fillStyle = COL.gold;
    ctx.fillRect(o.x + 2, o.y - 20, 22, 3);
    ctx.fillRect(o.x + 6, o.y - 30, 14, 3);
    // lilin merah muda dengan nyala
    ctx.strokeStyle = "#D46A8A"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(o.x + 13, o.y - 30); ctx.lineTo(o.x + 13, o.y - 36); ctx.stroke();
    ctx.fillStyle = "#E8862E";
    ctx.beginPath(); ctx.arc(o.x + 13, o.y - 38, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#F9D976";
    ctx.beginPath(); ctx.arc(o.x + 13, o.y - 38, 1.3, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === "bouquet") {
    obstacleShadow(o.x + 15, 14);
    // kertas buket
    ctx.fillStyle = "#4E6628";
    ctx.strokeStyle = COL.outline; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(o.x + 11, o.y - 8); ctx.lineTo(o.x + 19, o.y - 8); ctx.lineTo(o.x + 15, o.y + 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // bunga-bunga dengan outline
    const petals = [
      { x: o.x + 9, y: o.y - 16, r: 6.5, c: "#D46A8A" },
      { x: o.x + 19, y: o.y - 14, r: 6.5, c: "#E58BA6" },
      { x: o.x + 14, y: o.y - 22, r: 6.5, c: "#CE8BD6" }
    ];
    petals.forEach(p => {
      ctx.fillStyle = p.c;
      ctx.strokeStyle = COL.outline; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = "#E3B94E";
    ctx.beginPath(); ctx.arc(o.x + 14, o.y - 17, 3.2, 0, Math.PI * 2); ctx.fill();
    // daun
    ctx.fillStyle = "#5C7A33";
    ctx.beginPath(); ctx.ellipse(o.x + 7, o.y - 8, 4, 2.4, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(o.x + 22, o.y - 8, 4, 2.4, 0.6, 0, Math.PI * 2); ctx.fill();
  } else {
    obstacleShadow(o.x + 15, 14);
    // sepasang gelas dengan outline tebal
    ctx.strokeStyle = COL.outline; ctx.lineWidth = 4.5;
    for (const dx of [8, 20]) {
      ctx.beginPath();
      ctx.moveTo(o.x + dx - 4, o.y - 34);
      ctx.quadraticCurveTo(o.x + dx - 6, o.y - 18, o.x + dx, o.y - 14);
      ctx.quadraticCurveTo(o.x + dx + 6, o.y - 18, o.x + dx + 4, o.y - 34);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x + dx, o.y - 14); ctx.lineTo(o.x + dx, o.y - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x + dx - 4, o.y - 4); ctx.lineTo(o.x + dx + 4, o.y - 4); ctx.stroke();
    }
    ctx.strokeStyle = COL.gold; ctx.lineWidth = 2;
    for (const dx of [8, 20]) {
      ctx.beginPath();
      ctx.moveTo(o.x + dx - 4, o.y - 34);
      ctx.quadraticCurveTo(o.x + dx - 6, o.y - 18, o.x + dx, o.y - 14);
      ctx.quadraticCurveTo(o.x + dx + 6, o.y - 18, o.x + dx + 4, o.y - 34);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x + dx, o.y - 14); ctx.lineTo(o.x + dx, o.y - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x + dx - 4, o.y - 4); ctx.lineTo(o.x + dx + 4, o.y - 4); ctx.stroke();
    }
    // isi minuman
    ctx.fillStyle = "#F4C542";
    ctx.beginPath();
    ctx.moveTo(o.x + 4, o.y - 27); ctx.lineTo(o.x + 12, o.y - 27);
    ctx.lineTo(o.x + 10, o.y - 16); ctx.quadraticCurveTo(o.x + 8, o.y - 15, o.x + 6, o.y - 16);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(o.x + 16, o.y - 27); ctx.lineTo(o.x + 24, o.y - 27);
    ctx.lineTo(o.x + 22, o.y - 16); ctx.quadraticCurveTo(o.x + 20, o.y - 15, o.x + 18, o.y - 16);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// ============================================================
// GAME LOOP
// ============================================================
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#F7EFDF");
  sky.addColorStop(0.7, "#F1E5CE");
  sky.addColorStop(1, "#E9D9BC");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  clouds.forEach(cl => {
    cl.x -= cl.v;
    if (cl.x < -80) cl.x = W + 80;
    drawCloud(cl.x, cl.y, cl.s);
  });

  ctx.strokeStyle = "rgba(122, 92, 40, 0.65)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, GROUND + 4); ctx.lineTo(W, GROUND + 4); ctx.stroke();
  ctx.strokeStyle = "rgba(122, 92, 40, 0.28)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, GROUND + 11); ctx.lineTo(W, GROUND + 11); ctx.stroke();

  // tanah di bawah garis agar tidak kosong
  ctx.fillStyle = "#E3D3B4";
  ctx.fillRect(0, GROUND + 5, W, H - GROUND - 5);

  bushes.forEach(b => {
    b.x -= speed * 0.28;
    if (b.x < -70) b.x = W + 70;
    drawBush(b.x, b.s);
  });
}

function loop() {
  // reset transform, bersihkan seluruh kanvas (termasuk area letterbox)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#F3EADB";
  ctx.fillRect(0, 0, c.width, c.height);

  // terapkan skala letterbox untuk semua penggambaran game
  ctx.setTransform(scale, 0, 0, scale, offX, offY);

  ctx.clearRect(0, 0, W, H);
  drawBackground();

  if (state === "ready") {
    drawCouple(player.x, player.y, frame * 0.08, false);
    ctx.fillStyle = "#8A6A2E";
    ctx.font = "italic 700 26px 'Cormorant Garamond', serif";
    ctx.textAlign = "center";
    ctx.fillText("Tap untuk Mulai", W / 2, H / 2 - 10);
    ctx.font = "500 12px 'Montserrat', sans-serif";
    ctx.fillStyle = "rgba(90,80,60,0.9)";
    ctx.fillText("Bantu sang pangeran mengantar putri ke pelaminan", W / 2, H / 2 + 18);
  } else if (state === "play") {
    frame++;
    player.vy += 0.8;
    player.y += player.vy;
    if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.jump = false; }

    if (frame % Math.max(60, 120 - score / 5) === 0) spawnObstacle();

    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x > -60);

    for (const o of obstacles) {
      if (o.x < player.x + 65 && o.x + o.w > player.x + 10 && player.y > GROUND - 35) {
        state = "over";
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("dinoHi", highScore);
        }
      }
    }

    score++;
    speed = 5 + Math.floor(score / 200);

    obstacles.forEach(drawObstacle);
    drawCouple(player.x + 14, player.y, frame * 0.22, player.jump);

    ctx.fillStyle = "#8A6A2E";
    ctx.font = "600 13px 'Montserrat', sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillStyle = "rgba(90,80,60,0.85)";
    ctx.fillText("High: " + highScore, 20, 50);
  } else if (state === "over") {
    obstacles.forEach(drawObstacle);
    drawCouple(player.x + 14, player.y, frame * 0.22, false);

    ctx.fillStyle = "rgba(255,252,245,0.92)";
    ctx.fillRect(W / 2 - 160, H / 2 - 70, 320, 140);
    ctx.strokeStyle = "rgba(158,122,62,0.7)"; ctx.lineWidth = 1.5;
    ctx.strokeRect(W / 2 - 152, H / 2 - 62, 304, 124);

    ctx.fillStyle = "#8A6A2E";
    ctx.font = "italic 700 28px 'Cormorant Garamond', serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", W / 2, H / 2 - 28);
    ctx.font = "500 13px 'Montserrat', sans-serif";
    ctx.fillStyle = "#6B5E45";
    ctx.fillText("Score: " + score + "  |  High: " + highScore, W / 2, H / 2 + 4);
    ctx.fillStyle = "#9E7A3E";
    ctx.fillText("Tap untuk coba lagi", W / 2, H / 2 + 32);
  }

  requestAnimationFrame(loop);
}

function jump() {
  if (state === "ready") { state = "play"; }
  if (state === "over") { reset(); state = "play"; return; }
  if (!player.jump) { player.vy = -14; player.jump = true; }
}

function reset() {
  obstacles = []; score = 0; speed = 5; frame = 0;
  player.y = GROUND; player.vy = 0; player.jump = false;
}

c.addEventListener("click", jump);
c.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); }, { passive: false });
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
});

loop();
