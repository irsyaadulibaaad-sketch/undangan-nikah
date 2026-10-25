const c = document.getElementById("c");
const ctx = c.getContext("2d");
const W = c.width, H = c.height;
const GROUND = H - 50;

let state = "ready"; 
let score = 0, speed = 5, obstacles = [], frame = 0;
let player = { x: 80, y: GROUND, vy: 0, w: 70, h: 60, jump: false };

const hi = () => parseInt(localStorage.getItem("dinoHi") || 0);
let highScore = hi();

function spawnObstacle() {
  const types = ["ring","cake","bouquet","glass"];
  const type = types[Math.floor(Math.random() * types.length)];
  obstacles.push({ x: W, y: GROUND, w: 30, h: 40, type });
}

function jump() {
  if (state === "ready") { state = "play"; }
  if (state === "over") { reset(); state = "play"; return; }
  if (!player.jump) { player.vy = -13; player.jump = true; }
}

function reset() {
  obstacles = []; score = 0; speed = 5; frame = 0;
  player.y = GROUND; player.vy = 0; player.jump = false;
}

// FUNGSI GAMBAR KARAKTER 2D (PANGERAN & PUTRI)
function drawCouple(x, y) {
  // Pangeran (Badan)
  ctx.fillStyle = "#1A231B"; 
  ctx.fillRect(x + 10, y - 40, 22, 40);
  
  // Pangeran (Kepala)
  ctx.beginPath(); 
  ctx.arc(x + 21, y - 48, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#F4E8D1"; 
  ctx.fill();
  
  // Pangeran (Mahkota Emas)
  ctx.fillStyle = "#C5A059"; 
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 54); ctx.lineTo(x + 21, y - 62);
  ctx.lineTo(x + 28, y - 54); ctx.closePath(); ctx.fill();

  // Putri (Gaun)
  ctx.fillStyle = "#FFFFFF"; 
  ctx.fillRect(x + 28, y - 35, 38, 18);
  
  // Putri (Kepala)
  ctx.beginPath(); 
  ctx.arc(x + 62, y - 38, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#F4E8D1";
  ctx.fill();
  
  // Putri (Rambut)
  ctx.fillStyle = "#2C2A28"; 
  ctx.beginPath(); 
  ctx.arc(x + 62, y - 40, 8, Math.PI, Math.PI * 2); 
  ctx.fill();
  
  // Tangan Pangeran menopang Putri
  ctx.strokeStyle = "#1A231B"; 
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 21, y - 30); 
  ctx.lineTo(x + 38, y - 25);
  ctx.stroke();
}

// FUNGSI GAMBAR RINTANGAN
function drawObstacle(o) {
  if (o.type === "ring") {
    ctx.strokeStyle = "#C5A059"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(o.x + 15, o.y - 20, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#F4E8D1"; 
    ctx.beginPath(); ctx.arc(o.x + 15, o.y - 32, 4, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === "cake") {
    ctx.fillStyle = "#F4E8D1"; 
    ctx.fillRect(o.x, o.y - 30, 26, 30);
    ctx.fillStyle = "#C5A059"; 
    ctx.fillRect(o.x, o.y - 34, 26, 6);
  } else if (o.type === "bouquet") {
    ctx.fillStyle = "#8A9A7B"; 
    ctx.beginPath(); ctx.arc(o.x + 15, o.y - 20, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(o.x + 10, o.y - 25, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.x + 20, o.y - 15, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = "#C5A059"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(o.x + 10, o.y - 30); ctx.lineTo(o.x + 15, o.y - 10); ctx.lineTo(o.x + 20, o.y - 30); ctx.stroke();
    ctx.fillStyle = "#F4E8D1"; ctx.fillRect(o.x + 13, o.y - 10, 4, 10);
  }
}

function loop() {
  ctx.clearRect(0, 0, W, H);

  // Garis Tanah
  ctx.strokeStyle = "#C8A89A"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND + 4); ctx.lineTo(W, GROUND + 4); ctx.stroke();

  if (state === "ready") {
    // HAPUS EMOJI & GANTI TEKS
    ctx.fillStyle = "#9E7A3E"; ctx.font = "bold 20px 'Montserrat', sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Tap untuk Mulai", W / 2, H / 2);
    drawCouple(player.x, player.y);
  } else if (state === "play") {
    frame++;
    player.vy += 0.7;
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
    drawCouple(player.x, player.y);

    // SKOR TANPA EMOJI
    ctx.fillStyle = "#9E7A3E"; ctx.font = "bold 14px 'Montserrat', sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillText("High: " + highScore, 20, 50);
  } else if (state === "over") {
    ctx.fillStyle = "#9E7A3E"; ctx.font = "bold 24px 'Cormorant Garamond', serif"; ctx.textAlign = "center";
    ctx.fillText("Game Over", W / 2, H / 2 - 30);
    ctx.font = "14px 'Montserrat', sans-serif";
    ctx.fillText("Score: " + score + " | High: " + highScore, W / 2, H / 2 + 10);
    ctx.fillText("Tap untuk coba lagi", W / 2, H / 2 + 45);
    drawCouple(player.x, player.y);
  }

  requestAnimationFrame(loop);
}

c.addEventListener("click", jump);
c.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); });
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
});

loop();
