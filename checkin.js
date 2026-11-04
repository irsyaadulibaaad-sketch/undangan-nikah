const form = document.getElementById("checkinForm");

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

  // 2. Masukkan data ke tabel CHECKIN (bukan RSVP lagi)
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

  msg.style.color = "#8A9A7B";
  msg.innerHTML = `🎉 Berhasil! <b>${nama}</b> (${pax} pax) telah terdaftar.`;
  form.reset();
  
  setTimeout(() => location.href = "index.html#taman", 2000);
});
