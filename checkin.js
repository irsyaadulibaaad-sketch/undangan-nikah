const form = document.getElementById("checkinForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("ciMsg");
  const nama = document.getElementById("ciNama").value.trim();
  const pax = parseInt(document.getElementById("ciPax").value) || 1;
  const doa = document.getElementById("ciDoa").value.trim();
  
  msg.textContent = "Memproses...";

  // 1. Cek Sisa Kuota sebelum mendaftar
  const { data: kuotaData } = await supabaseClient.from("total_pax").select("terpakai").single();
  const sisa = 150 - (kuotaData?.terpakai || 0);

  if (pax > sisa) {
    msg.textContent = `Maaf, sisa kuota kursi hanya ${sisa} pax.`;
    return;
  }

  // 2. Masukkan data kehadiran AKTUAL ke database RSVP
  // Kita isi hadir=true dan checked_in=true agar masuk hitungan
  const { error: insertError } = await supabaseClient.from("rsvp").insert({
    nama: nama,
    hadir: true,
    jumlah_pax: pax,
    kategori: "registrasi_lokasi", // Penanda kalau ini tamu aktual
    checked_in: true
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

  msg.style.color = "#8A9A7B"; // Warna hijau sukses
  msg.innerHTML = `🎉 Berhasil! <b>${nama}</b> (${pax} pax) telah terdaftar.`;
  form.reset();
  
  // Arahkan ke undangan setelah 2 detik
  setTimeout(() => location.href = "index.html#taman", 2000);
});
