const c = document.getElementById("c");
const ctx = c.getContext("2d");
const W = c.width, H = c.height;
const GROUND = H - 50;

let state = "ready"; // ready | play | over
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

function drawCouple(x, y) {
  // Pangeran menggendong putri (princess carry)
  // Badan pangeran
  ctx.fillStyle = "#2a2a5a"; // jas
  ctx.fillRect(x + 10, y - 40, 20, 40);
  // kepala pangeran
  ctx.beginPath(); ctx.arc(x + 20, y - 48, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#f0c8a0"; ctx.fill();
  // mahkota kecil
  ctx.fillStyle = "#d4af37";
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 54); ctx.lineTo(x + 20, y - 60);
  ctx.lineTo(x + 26, y - 54); ctx.closePath(); ctx.fill();
  // Putri digendong (horizontal di depan)
  ctx.fillStyle = "#fff"; // gaun
  ctx.fillRect(x + 28, y - 30, 34, 14);
  // kepala putri
  ctx.beginPath(); ctx.arc(x + 58, y - 34, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#f5d0b5"; ctx.fill();
  // rambut
  ctx.fillStyle = "#3a2a1a";
  ctx.beginPath(); ctx.arc(x + 58, y - 36, 8, Math.PI, Math.PI * 2); ctx.fill();
  // tangan pangeran menopang
  ctx.strokeStyle = "#2a2a5a"; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 20, y - 30); ctx.lineTo(x + 36, y - 26);
  ctx.stroke();
}

function drawObstacle(o) {
  if (o.type === "ring") {
    ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(o.x + 15, o.y - 20, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#7ec4f0";
    ctx.beginPath(); ctx.arc(o.x + 15, o.y - 32, 4, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === "cake") {
    ctx.fillStyle = "#f5c6d8";
    ctx.fillRect(o.x, o.y - 30, 26, 30);
    ctx.fillStyle = "#fff";
    ctx.fillRect(o.x, o.y - 34, 26, 6);
  } else if (o.type === "bouquet") {
    ctx.font = "32px serif"; ctx.fillText("💐", o.x, o.y);
  } else {
    ctx.font = "32px serif"; ctx.fillText("🥂", o.x, o.y);
  }
}

function loop() {
  ctx.clearRect(0, 0, W, H);

  // ground
  ctx.strokeStyle = "#c8a89a"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND + 4); ctx.lineTo(W, GROUND + 4); ctx.stroke();

  if (state === "ready") {
    ctx.fillStyle = "#a04a68"; ctx.font = "bold 22px serif"; ctx.textAlign = "center";
    ctx.fillText("Tap untuk mulai 💕", W / 2, H / 2);
    drawCouple(player.x, player.y);
  } else if (state === "play") {
    frame++;

    // physics
    player.vy += 0.7;
    player.y += player.vy;
    if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.jump = false; }

    // spawn
    if (frame % Math.max(60, 120 - score / 5) === 0) spawnObstacle();

    // update obstacles
    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x > -60);

    // collision
    for (const o of obstacles) {
      if (o.x < player.x + 65 && o.x + o.w > player.x + 10 &&
          player.y > GROUND - 35) {
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

    ctx.fillStyle = "#a04a68"; ctx.font = "bold 18px monospace"; ctx.textAlign = "left";
    ctx.fillText("Skor: " + score, 20, 30);
    ctx.fillText("Hi: " + highScore, 20, 55);
  } else if (state === "over") {
    ctx.fillStyle = "#a04a68"; ctx.font = "bold 26px serif"; ctx.textAlign = "center";
    ctx.fillText("Game Over 💔", W / 2, H / 2 - 30);
    ctx.font = "18px serif";
    ctx.fillText("Skor: " + score + " | Hi: " + highScore, W / 2, H / 2 + 10);
    ctx.fillText("Tap untuk coba lagi", W / 2, H / 2 + 45);
    drawCouple(player.x, player.y);
  }

  requestAnimationFrame(loop);
}

// input
c.addEventListener("click", jump);
c.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); });
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
});

loop();
