const form = document.getElementById("checkinForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("ciMsg");
  const info = document.getElementById("ciInfo");
  const nama = document.getElementById("ciNama").value.trim();
  const doa = document.getElementById("ciDoa").value.trim();
  msg.textContent = "Memproses...";

  // cari RSVP dengan nama tsb yang hadir
  const { data: rows, error } = await supabaseClient
    .from("rsvp").select("*")
    .ilike("nama", nama).eq("hadir", true);

  if (error) { msg.textContent = "Error: " + error.message; return; }

  if (!rows || rows.length === 0) {
    msg.textContent = "Nama tidak ditemukan di daftar hadir. Hubungi panitia.";
    return;
  }

  const tamu = rows[0];

  if (tamu.checked_in) {
    info.innerHTML = `✅ <b>${tamu.nama}</b> sudah check-in sebelumnya (${tamu.jumlah_pax} pax).`;
    msg.textContent = "";
    return;
  }

  // tandai checked-in
  await supabaseClient.from("rsvp").update({ checked_in: true }).eq("id", tamu.id);

  // simpan doa → taman bunga tumbuh
  await supabaseClient.from("doa").insert({
    nama: tamu.nama, pesan: doa, sumber: "checkin",
    bunga: ["mawar","tulip","matahari","sakura","lily"][Math.floor(Math.random()*5)]
  });

  info.innerHTML = `🎉 Selamat datang <b>${tamu.nama}</b> (${tamu.jumlah_pax} pax).<br>Doamu sudah menumbuhkan bunga di taman 🌸`;
  msg.textContent = "Mengalihkan ke undangan...";
  setTimeout(() => location.href = "index.html#taman", 1800);
});
