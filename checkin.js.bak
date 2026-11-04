const form = document.getElementById("checkinForm");
const checkinContainer = document.querySelector(".checkin-container");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("ciMsg");
  const nama = document.getElementById("ciNama").value.trim();
  const pax = parseInt(document.getElementById("ciPax").value) || 1;
  const doa = document.getElementById("ciDoa").value.trim();
  
  msg.textContent = "Memproses...";

  // 1. Cek Sisa Kuota KHUSUS Registrasi Lapangan (Maksimal 150)
  const { data: hadirData } = await supabaseClient.from("checkin").select("jumlah_pax");
  const totalHadirAktual = hadirData ? hadirData.reduce((sum, item) => sum + item.jumlah_pax, 0) : 0;
  const sisaKuotaCheckin = 150 - totalHadirAktual;

  if (pax > sisaKuotaCheckin) {
    msg.textContent = `Maaf, sisa kuota registrasi lapangan hanya ${sisaKuotaCheckin} pax.`;
    return;
  }

  // 2. Masukkan data ke tabel CHECKIN
  const { error: insertError } = await supabaseClient.from("checkin").insert({
    nama: nama,
    jumlah_pax: pax
  });

  if (insertError) {
    msg.textContent = "Gagal mendaftar: " + insertError.message;
    return;
  }

  // 3. Simpan doa jika diisi
  if (doa) {
    await supabaseClient.from("doa").insert({
      nama: nama, 
      pesan: doa, 
      sumber: "checkin",
      bunga: ["mawar","tulip","matahari","sakura","lily"][Math.floor(Math.random()*5)]
    });
  }

  // 4. Tampilkan Layar Sukses (Sembunyikan Form)
  form.style.display = "none";
  
  // Buat elemen HTML untuk layar sukses
  const successHTML = `
    <div style="text-align: center; animation: fadeIn 0.5s ease;">
      <div style="font-size: 4rem; margin-bottom: 10px;">🎉</div>
      <h2 style="font-family: var(--font-serif); font-size: 2rem; color: #8A9A7B; margin-bottom: 15px;">Registrasi Berhasil!</h2>
      <p style="font-size: 1.1rem; margin-bottom: 5px;">Terima kasih atas kehadiran</p>
      <p style="font-size: 1.5rem; font-weight: 600; color: var(--gold-dark); margin-bottom: 5px;">${nama}</p>
      <p style="font-size: 1rem; color: var(--text-muted); margin-bottom: 30px;">(${pax} Pax)</p>
      
      <div style="background: var(--bg-cream); border: 1px dashed var(--gold-mid); padding: 15px; border-radius: 8px; margin-bottom: 30px;">
        <p style="font-size: 0.85rem; color: var(--text-main); font-weight: 500;">Silakan tunjukkan layar ini ke panitia untuk menerima souvenir.</p>
      </div>

      <a href="photobooth.html" class="btn-primary" style="text-decoration: none; display: block; width: 100%; box-sizing: border-box; background: var(--gold-dark); color: white; padding: 16px; border-radius: 6px; font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; font-size: 0.85rem;">
        📸 Ikut & Menangkan Doorprize Hingga Rp 1.000.000!
      </a>
      
      <p style="font-size: 0.75rem; color: #888; margin-top: 20px;">Upload foto terbaik Anda di halaman Photobooth.</p>
    </div>
  `;

  // Masukkan HTML sukses ke dalam container
  const successDiv = document.createElement("div");
  successDiv.innerHTML = successHTML;
  checkinContainer.appendChild(successDiv);
});
