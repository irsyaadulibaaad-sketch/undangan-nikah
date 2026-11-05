// ============================================================
// LEADERBOARD MINI GAME (dipakai dino.html & jump.html)
// - Papan peringkat Top 10 dari semua tamu (tabel Supabase "game_scores")
// - Jika Supabase tidak bisa dijangkau, skor disimpan & ditampilkan lokal
// - Tidak mengubah kode game: hanya membaca status game lewat Leaderboard.init
// ============================================================
(function () {
  "use strict";

  var NAME_KEY = "lb_name";
  var cfg = null;
  var els = {};
  var st = { open: false, pending: null, mine: null, wasOver: false, timer: null, busy: false, offline: false };

  // ---------- Util ----------
  function remoteClient() {
    try { return (typeof supabaseClient !== "undefined" && supabaseClient) ? supabaseClient : null; }
    catch (e) { return null; }
  }
  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]);
  }
  function cleanName(s) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, 20); }
  function dedupe(rows) {
    var seen = {}, out = [];
    rows.forEach(function (r) {
      var k = String(r.nama).trim().toLowerCase();
      if (!seen[k]) { seen[k] = 1; out.push({ nama: r.nama, skor: r.skor }); }
    });
    return out;
  }
  function localKey() { return "lb_local_" + cfg.game; }
  function localRows() {
    try {
      var a = JSON.parse(localStorage.getItem(localKey()) || "[]");
      a.sort(function (x, y) { return y.skor - x.skor; });
      return dedupe(a);
    } catch (e) { return []; }
  }
  function saveLocal(nama, skor) {
    try {
      var a = JSON.parse(localStorage.getItem(localKey()) || "[]");
      a.push({ nama: nama, skor: skor });
      a.sort(function (x, y) { return y.skor - x.skor; });
      localStorage.setItem(localKey(), JSON.stringify(a.slice(0, 100)));
    } catch (e) {}
  }

  // ---------- Data ----------
  function loadScores() {
    var c = remoteClient();
    if (!c) return Promise.resolve({ rows: localRows(), online: false });
    var q = c.from("game_scores").select("nama,skor")
      .eq("game", cfg.game)
      .order("skor", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(100);
    return withTimeout(q, 7000).then(function (res) {
      if (res.error) throw res.error;
      return { rows: dedupe(res.data || []), online: true };
    }).catch(function () {
      return { rows: localRows(), online: false };
    });
  }

  function saveScore(nama, skor) {
    saveLocal(nama, skor);
    var c = remoteClient();
    if (!c) return Promise.resolve(false);
    return withTimeout(c.from("game_scores").insert({ game: cfg.game, nama: nama, skor: skor }), 7000)
      .then(function (res) { return !res.error; })
      .catch(function () { return false; });
  }

  // ---------- Tampilan ----------
  function injectCSS() {
    var s = document.createElement("style");
    s.textContent =
      ".lb-btn{position:fixed;top:8px;right:8px;z-index:60;background:rgba(255,252,245,.94);color:#9E7A3E;border:1px solid #C5A059;border-radius:16px;padding:6px 11px;font:600 10px/1 'Montserrat',sans-serif;letter-spacing:.5px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.12);-webkit-tap-highlight-color:transparent}" +
      ".lb-overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(40,30,15,.5);padding:8px;box-sizing:border-box}" +
      ".lb-panel{width:100%;max-width:340px;max-height:100%;display:flex;flex-direction:column;background:#FFFCF5;border:1px solid rgba(158,122,62,.7);border-radius:12px;padding:10px 12px;box-sizing:border-box;font-family:'Montserrat',sans-serif;color:#6B5E45;outline:none;box-shadow:0 10px 30px rgba(0,0,0,.25)}" +
      ".lb-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex:none}" +
      ".lb-title{font:italic 700 22px/1.1 'Cormorant Garamond',Georgia,serif;color:#8A6A2E;margin:0}" +
      ".lb-sub{font-size:10px;color:#9E7A3E;letter-spacing:.5px;margin-top:2px}" +
      ".lb-x{flex:none;width:28px;height:28px;border:0;background:transparent;color:#9E7A3E;font-size:20px;line-height:1;cursor:pointer;border-radius:14px}" +
      ".lb-submit{flex:none;margin-top:8px;padding:8px;border-radius:8px;background:#F8F0DE;font-size:12px}" +
      ".lb-submit b{color:#8A6A2E}" +
      ".lb-row{display:flex;gap:6px;margin-top:6px}" +
      ".lb-input{flex:1;min-width:0;font:16px 'Montserrat',sans-serif;padding:6px 8px;border:1px solid #C5A059;border-radius:6px;background:#FFF;color:#4A3B22;outline:none}" +
      ".lb-input.err{border-color:#d9534f}" +
      ".lb-save,.lb-primary{border:0;border-radius:6px;background:#9E7A3E;color:#FFF;font:600 12px 'Montserrat',sans-serif;padding:8px 14px;cursor:pointer}" +
      ".lb-save:disabled{opacity:.6}" +
      ".lb-list{list-style:none;margin:8px 0 0;padding:0;overflow-y:auto;flex:1 1 auto;min-height:60px;-webkit-overflow-scrolling:touch}" +
      ".lb-item{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:6px;font-size:12px}" +
      ".lb-item+.lb-item{margin-top:2px}" +
      ".lb-item.mine{background:#F4E8D1;font-weight:600}" +
      ".lb-rank{flex:none;width:20px;height:20px;border-radius:10px;background:#EFE6D3;color:#6B5E45;text-align:center;font-size:11px;line-height:20px;font-weight:600}" +
      ".lb-item.r1 .lb-rank{background:#E3B94E;color:#fff}.lb-item.r2 .lb-rank{background:#A9B0B8;color:#fff}.lb-item.r3 .lb-rank{background:#C48A5A;color:#fff}" +
      ".lb-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".lb-score{flex:none;color:#8A6A2E;font-weight:600}" +
      ".lb-note{flex:none;margin-top:6px;font-size:10px;color:#9E7A3E;min-height:12px}" +
      ".lb-foot{flex:none;margin-top:8px;display:flex;justify-content:center}" +
      ".lb-empty{padding:14px 6px;text-align:center;font-size:12px;color:#9E7A3E}";
    document.head.appendChild(s);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function build() {
    injectCSS();

    els.btn = el("button", "lb-btn", "\uD83C\uDFC6 Peringkat");
    els.btn.type = "button";

    els.overlay = el("div", "lb-overlay");
    els.panel = el("div", "lb-panel");
    els.panel.tabIndex = -1;

    var head = el("div", "lb-head");
    var hl = el("div");
    hl.appendChild(el("h2", "lb-title", "Papan Peringkat"));
    hl.appendChild(el("div", "lb-sub", cfg.title));
    els.x = el("button", "lb-x", "\u00D7");
    els.x.type = "button";
    els.x.setAttribute("aria-label", "Tutup");
    head.appendChild(hl); head.appendChild(els.x);

    els.submitBox = el("div", "lb-submit");
    els.submitText = el("div");
    els.submitForm = el("div", "lb-row");
    els.input = el("input", "lb-input");
    els.input.type = "text";
    els.input.maxLength = 20;
    els.input.placeholder = "Nama kamu";
    els.input.setAttribute("autocomplete", "nickname");
    els.save = el("button", "lb-save", "Simpan");
    els.save.type = "button";
    els.submitForm.appendChild(els.input); els.submitForm.appendChild(els.save);
    els.submitBox.appendChild(els.submitText); els.submitBox.appendChild(els.submitForm);

    els.list = el("ol", "lb-list");
    els.note = el("div", "lb-note");
    els.foot = el("div", "lb-foot");
    els.primary = el("button", "lb-primary", "Lanjutkan");
    els.primary.type = "button";
    els.foot.appendChild(els.primary);

    els.panel.appendChild(head);
    els.panel.appendChild(els.submitBox);
    els.panel.appendChild(els.list);
    els.panel.appendChild(els.note);
    els.panel.appendChild(els.foot);
    els.overlay.appendChild(els.panel);

    document.body.appendChild(els.btn);
    document.body.appendChild(els.overlay);

    // Tombol keyboard di dalam panel tidak boleh sampai ke kontrol game (spasi = lompat, dll)
    ["keydown", "keyup", "keypress"].forEach(function (t) {
      els.overlay.addEventListener(t, function (e) { e.stopPropagation(); });
      els.btn.addEventListener(t, function (e) { e.stopPropagation(); });
    });

    els.btn.addEventListener("click", function (e) { e.stopPropagation(); openPanel(); });
    els.x.addEventListener("click", function () { closePanel(false); });
    els.primary.addEventListener("click", function () { closePanel(true); });
    els.save.addEventListener("click", submit);
    els.input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    els.input.addEventListener("input", function () { els.input.classList.remove("err"); });
    els.overlay.addEventListener("click", function (e) { if (e.target === els.overlay) closePanel(false); });
  }

  function renderList(rows, online) {
    els.list.innerHTML = "";
    if (!rows.length) {
      els.list.appendChild(el("li", "lb-empty", "Belum ada skor. Jadilah yang pertama!"));
    }
    var marked = false;
    rows.slice(0, 10).forEach(function (r, i) {
      var cls = "lb-item" + (i < 3 ? " r" + (i + 1) : "");
      if (!marked && st.mine && r.nama === st.mine.nama && r.skor === st.mine.skor) { cls += " mine"; marked = true; }
      var li = el("li", cls);
      li.appendChild(el("span", "lb-rank", String(i + 1)));
      li.appendChild(el("span", "lb-name", r.nama));
      li.appendChild(el("span", "lb-score", String(r.skor)));
      els.list.appendChild(li);
    });
    var note = online ? "Top 10 dari semua tamu" : "Offline \u2014 menampilkan skor di perangkat ini";
    if (st.mine) {
      var key = st.mine.nama.toLowerCase();
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i].nama).toLowerCase() === key) { note = "Peringkat kamu: #" + (i + 1) + " \u2022 " + note; break; }
      }
    }
    els.note.textContent = note;
  }

  function refresh() {
    els.note.textContent = "Memuat peringkat\u2026";
    // Jika skor gagal terkirim, tampilkan daftar lokal supaya skor kamu tetap terlihat
    var p = st.offline ? Promise.resolve({ rows: localRows(), online: false }) : loadScores();
    return p.then(function (res) {
      if (st.open) renderList(res.rows, res.online);
    });
  }

  function setupSubmit() {
    var p = st.pending;
    if (!p) { els.submitBox.style.display = "none"; return; }
    els.submitBox.style.display = "block";
    if (p.saved) {
      els.submitText.innerHTML = "";
      els.submitText.appendChild(document.createTextNode("Skor "));
      els.submitText.appendChild(el("b", "", String(p.score)));
      els.submitText.appendChild(document.createTextNode(" tersimpan \u2713"));
      els.submitForm.style.display = "none";
    } else {
      els.submitText.innerHTML = "";
      els.submitText.appendChild(document.createTextNode("Skor kamu: "));
      els.submitText.appendChild(el("b", "", String(p.score)));
      els.submitForm.style.display = "flex";
      if (!els.input.value) {
        try { els.input.value = localStorage.getItem(NAME_KEY) || ""; } catch (e) {}
      }
      els.save.disabled = false;
      els.save.textContent = "Simpan";
    }
  }

  function submit() {
    var p = st.pending;
    if (!p || p.saved || st.busy) return;
    var name = cleanName(els.input.value);
    if (!name) { els.input.classList.add("err"); els.input.focus(); return; }
    st.busy = true;
    els.save.disabled = true;
    els.save.textContent = "Menyimpan\u2026";
    try { localStorage.setItem(NAME_KEY, name); } catch (e) {}
    saveScore(name, p.score).then(function (ok) {
      st.busy = false;
      st.offline = !ok;
      p.saved = true;
      st.mine = { nama: name, skor: p.score };
      setupSubmit();
      return refresh();
    });
  }

  // ---------- Buka / tutup ----------
  function openPanel() {
    if (st.open) return;
    st.open = true;
    var over = !!cfg.isOver();
    if (!over && cfg.setPaused) cfg.setPaused(true);
    els.overlay.style.display = "flex";
    els.primary.textContent = over ? "Main Lagi" : "Lanjutkan";
    setupSubmit();
    refresh();
    try { els.panel.focus(); } catch (e) {}
  }

  function closePanel(restart) {
    if (!st.open) return;
    st.open = false;
    els.overlay.style.display = "none";
    if (restart && cfg.isOver()) cfg.restart();
    if (cfg.setPaused) cfg.setPaused(false);
  }

  // ---------- Pantau game over ----------
  function onGameOver() {
    var s = Math.floor(Number(cfg.getScore()) || 0);
    st.pending = s > 0 ? { score: s, saved: false } : null;
    st.mine = null;
    st.offline = false;
    if (st.open) { closePanel(false); }
    openPanel();
  }

  function tick() {
    var over = !!cfg.isOver();
    if (over && !st.wasOver) {
      st.wasOver = true;
      clearTimeout(st.timer);
      st.timer = setTimeout(onGameOver, 800);   // beri jeda agar tidak tertutup ketukan terakhir
    } else if (!over && st.wasOver) {
      st.wasOver = false;
      clearTimeout(st.timer);
      st.pending = null;
      st.mine = null;
    }
    requestAnimationFrame(tick);
  }

  window.Leaderboard = {
    init: function (config) {
      cfg = config;
      build();
      requestAnimationFrame(tick);
    }
  };
})();
