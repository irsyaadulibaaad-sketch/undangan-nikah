const c = document.getElementById("c");
const ctx = c.getContext("2d");
const W = c.width, H = c.height;
const GROUND = H - 50;

let state = "ready"; 
let score = 0, speed = 5, obstacles = [], frame = 0;
let player = { x: 80, y: GROUND, w: 70, h: 60, jump: false, vy: 0 };

const hi = () => parseInt(localStorage.getItem("dinoHi") || 0);
let highScore = hi();

// --- MEMBUAT GAMBAR KARAKTER DENGAN SVG (SANGAT DETAIL & ESTETIK) ---
const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100" height="100">
  <!-- Gaun Putri (Menjuntai ke belakang) -->
  <path d="M110,120 Q150,180 130,190 Q100,190 90,160 Z" fill="#F9F7F2" opacity="0.8"/>
  <path d="M105,115 Q140,170 120,180 Q95,180 85,150 Z" fill="#FFFFFF"/>
  
  <!-- Badan Putri (Gaun Atas) -->
  <path d="M95,95 C110,90 120,100 120,115 L90,115 Z" fill="#FFFFFF"/>
  
  <!-- Lengan Putri (Memeluk Pangeran) -->
  <path d="M100,100 Q80,100 75,110" stroke="#F4E8D1" stroke-width="4" fill="none" stroke-linecap="round"/>

  <!-- Kepala Putri -->
  <circle cx="105" cy="80" r="12" fill="#F4E8D1"/>
  <!-- Rambut Putri -->
  <path d="M105,68 C120,68 120,85 115,90 Q110,75 105,75 Q100,75 95,90 C90,85 90,68 105,68 Z" fill="#2C2A28"/>
  <!-- Mahkota Bunga Putri -->
  <circle cx="105" cy="68" r="3" fill="#C5A059"/>
  <circle cx="100" cy="70" r="2" fill="#F9F7F2"/>
  <circle cx="110" cy="70" r="2" fill="#F9F7F2"/>

  <!-- Badan Pangeran (Jas) -->
  <path d="M50,110 L80,110 L80,160 L50,160 Z" fill="#1A231B"/>
  <!-- Kaki Pangeran -->
  <path d="M55,160 L55,185 M75,160 L75,185" stroke="#1A231B" stroke-width="8" stroke-linecap="round"/>
  
  <!-- Lengan Pangeran Menggendong -->
  <path d="M80,110 Q95,115 100,115" stroke="#1A231B" stroke-width="6" fill="none" stroke-linecap="round"/>

  <!-- Kepala Pangeran -->
  <circle cx="65" cy="90" r="14" fill="#F4E8D1"/>
  <!-- Rambut/Mahkota Pangeran -->
  <path d="M65,76 L65,70 L71,75 L75,70 L75,80 Z" fill="#C5A059"/>
  <path d="M51,90 C51,80 65,75 65,75 C65,75 79,80 79,90 Z" fill="#2C2A28"/>
</svg>
`;

const coupleImg = new Image();
const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
const url = URL.createObjectURL(svgBlob);
coupleImg.src = url;

function spawnObstacle() {
  const types = ["ring","cake","bouquet","glass"];
  const type = types[Math.floor(Math.random() * types.length)];
  obstacles.push({ x: W, y: GROUND, w: 30, h: 40, type });
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
  ctx.strokeStyle = "rgba(200, 168, 154, 0.5)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND + 4); ctx.lineTo(W, GROUND + 4); ctx.stroke();

  if (state === "ready") {
    ctx.fillStyle = "#9E7A3E"; ctx.font = "bold 20px 'Montserrat', sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Tap untuk Mulai", W / 2, H / 2);
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
    
    // GAMBAR KARAKTER SVG
    if(coupleImg.complete) {
        // Menggambar di posisi x, y dengan ukuran 80x80
        ctx.drawImage(coupleImg, player.x - 10, player.y - 70, 80, 80);
    }

    ctx.fillStyle = "#9E7A3E"; ctx.font = "bold 14px 'Montserrat', sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillText("High: " + highScore, 20, 50);
  } else if (state === "over") {
    ctx.fillStyle = "#9E7A3E"; ctx.font = "bold 24px 'Cormorant Garamond', serif"; ctx.textAlign = "center";
    ctx.fillText("Game Over", W / 2, H / 2 - 30);
    ctx.font = "14px 'Montserrat', sans-serif";
    ctx.fillText("Score: " + score + " | High: " + highScore, W / 2, H / 2 + 10);
    ctx.fillText("Tap untuk coba lagi", W / 2, H / 2 + 45);
    
    if(coupleImg.complete) {
        ctx.drawImage(coupleImg, player.x - 10, player.y - 70, 80, 80);
    }
  }

  requestAnimationFrame(loop);
}

c.addEventListener("click", jump);
c.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); });
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
});

// Pastikan gambar dimuat dulu sebelum loop dimulai
coupleImg.onload = () => {
    loop();
};
