// =========================================
// MESIN TAMAN VIRTUAL 2D (CANVAS)
// =========================================
const canvas = document.getElementById('gardenCanvas');
const ctx = canvas.getContext('2d');
const CW = canvas.width;
const CH = canvas.height;

// Gambar SVG untuk Bunga (Agar terlihat 2D Cantik)
const flowerSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="40" height="40">
  <path d="M25,50 Q25,35 25,25" stroke="#4A5D23" stroke-width="2" fill="none"/>
  <circle cx="25" cy="20" r="8" fill="#FFB6C1"/>
  <circle cx="25" cy="10" r="5" fill="#FF69B4"/>
  <circle cx="35" cy="20" r="5" fill="#FF69B4"/>
  <circle cx="15" cy="20" r="5" fill="#FF69B4"/>
  <circle cx="25" cy="30" r="5" fill="#FF69B4"/>
  <circle cx="25" cy="20" r="4" fill="#FFD700"/>
</svg>
`;
const flowerImg = new Image();
const flowerBlob = new Blob([flowerSVG], {type: 'image/svg+xml;charset=utf-8'});
flowerImg.src = URL.createObjectURL(flowerBlob);

// State Taman
let flowers = []; // Array untuk menyimpan posisi bunga
let birds = [];
let particles = []; // Untuk air mancur

// Fungsi Inisialisasi Taman
function initGarden() {
    flowers = [];
    birds = [];
    particles = [];
    
    // Buat beberapa burung di langit
    for(let i=0; i<5; i++) {
        birds.push({
            x: Math.random() * CW,
            y: 50 + Math.random() * 100,
            speed: 1 + Math.random() * 2,
            wingState: Math.random() * Math.PI
        });
    }
}

// Gambar Tanah
function drawGround() {
    // Langit (Gradasi Senja)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CH);
    skyGrad.addColorStop(0, '#FFDAB9'); // Peach
    skyGrad.addColorStop(0.5, '#F9F7F2'); // Cream
    skyGrad.addColorStop(1, '#E8E2D6'); 
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CW, CH);

    // Matahari terbenam (Bulatan Emas)
    ctx.beginPath();
    ctx.arc(CW/2, CH-100, 80, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(197, 160, 89, 0.2)';
    ctx.fill();

    // Tanah
    ctx.fillStyle = '#8A9A7B'; // Sage Green
    ctx.beginPath();
    ctx.moveTo(0, CH - 80);
    ctx.quadraticCurveTo(CW/2, CH - 120, CW, CH - 80);
    ctx.lineTo(CW, CH);
    ctx.lineTo(0, CH);
    ctx.fill();
    
    // Rumput lebih gelap di bawah
    ctx.fillStyle = '#6B7A5D';
    ctx.beginPath();
    ctx.moveTo(0, CH - 60);
    ctx.quadraticCurveTo(CW/2, CH - 100, CW, CH - 60);
    ctx.lineTo(CW, CH);
    ctx.lineTo(0, CH);
    ctx.fill();
}

// Gambar Air Mancur (Fountain)
function drawFountain(time) {
    const fx = CW / 2;
    const fy = CH - 90;

    // Kolam Air Mancur
    ctx.fillStyle = '#D3D3D3';
    ctx.beginPath();
    ctx.ellipse(fx, fy, 100, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#B0C4DE'; // Air
    ctx.beginPath();
    ctx.ellipse(fx, fy, 90, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiang Air Mancur
    ctx.fillStyle = '#A9A9A9';
    ctx.fillRect(fx - 15, fy - 60, 30, 60);
    ctx.beginPath();
    ctx.ellipse(fx, fy - 60, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Semburan Air (Partikel)
    if (Math.random() < 0.5) { // Spawn partikel air
        particles.push({
            x: fx + (Math.random() - 0.5) * 20,
            y: fy - 60,
            vx: (Math.random() - 0.5) * 4,
            vy: -5 - Math.random() * 5,
            life: 1
        });
    }

    // Update dan gambar partikel air
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravitasi
        p.life -= 0.02;

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.fillStyle = `rgba(173, 216, 230, ${p.life})`; // Light Blue
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Gambar Burung
function drawBirds(time) {
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    birds.forEach(b => {
        b.x += b.speed;
        if (b.x > CW + 20) b.x = -20;
        
        b.wingState += 0.1;
        let wingY = Math.sin(b.wingState) * 5;

        ctx.beginPath();
        ctx.moveTo(b.x - 10, b.y + wingY);
        ctx.quadraticCurveTo(b.x - 5, b.y - 5, b.x, b.y);
        ctx.quadraticCurveTo(b.x + 5, b.y - 5, b.x + 10, b.y + wingY);
        ctx.stroke();
    });
}

// Animasi Utama Taman
function animateGarden() {
    drawGround();
    drawBirds();
    drawFountain();

    // Gambar Bunga (jika ada)
    if (flowerImg.complete) {
        flowers.forEach(f => {
            // Animasi tumbuh (scale up)
            if (f.scale < 1) f.scale += 0.02;
            
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.scale(f.scale, f.scale);
            ctx.drawImage(flowerImg, -20, -40, 40, 40); // Ukuran bunga 40x40
            ctx.restore();
        });
    }

    requestAnimationFrame(animateGarden);
}

// =========================================
// LOGIKA DATABASE: AMBIL BUNGA DARI SUPABASE
// =========================================
async function loadGardenData() {
    // Sembunyikan loading
    const loadingEl = document.getElementById('gardenLoading');
    if(loadingEl) loadingEl.style.display = 'none';

    initGarden();

    const { data, error } = await supabaseClient
        .from("doa").select("*").order("created_at", { ascending: true });
    
    if (error) { console.error(error); return; }

    // Jika ada doa, tanam bunga di pinggir tanah
    if (data && data.length > 0) {
        data.forEach((d, index) => {
            // Bagi rata posisi x di pinggir kiri dan kanan
            let xPos;
            if (index % 2 === 0) {
                // Kiri
                xPos = 50 + Math.random() * (CW/2 - 150);
            } else {
                // Kanan
                xPos = CW/2 + 100 + Math.random() * (CW/2 - 150);
            }
            
            // Posisi Y agar terlihat seperti tumbuh dari tanah
            let yPos = CH - 60 + Math.random() * 30; 

            flowers.push({
                x: xPos,
                y: yPos,
                scale: 0 // Mulai dari 0 untuk animasi tumbuh
            });
        });
    }

    // Mulai animasi
    animateGarden();
}

// Mulai saat halaman dimuat
window.addEventListener('load', loadGardenData);

// Realtime update jika ada doa baru
supabaseClient.channel("doa-rt")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "doa" },
    () => {
        // Jika ada doa baru, reload data taman
        flowers = []; // Reset
        loadGardenData();
    })
  .subscribe();
