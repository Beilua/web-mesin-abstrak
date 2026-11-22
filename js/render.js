(function (global) {
  'use strict';

  // Mengosongkan wadah sebelum isinya digambar ulang.
  function kosongkan(el) {
    el.textContent = '';
  }

  // Sel pita: indeks di atas, karakter di bawah. Spasi tampil sebagai ␣.
  function selPita(i, karakter, state, jenis) {
    var sel = document.createElement('div');
    sel.className = 'sel-pita';

    var indeks = document.createElement('span');
    indeks.textContent = String(i);
    var isi = document.createElement('span');
    isi.textContent = karakter === ' ' ? '␣' : karakter;
    if (karakter === ' ') {
      isi.className = 'spasi';
    }

    var mulai = state.started ? state.idx : -1;
    var dalamKata =
      jenis === 'kata' &&
      state.started &&
      state.cw &&
      i >= state.idx - state.wlen &&
      i <= state.idx - 1;
    var eopPertama = state.tape.indexOf(state.eop);

    if (state.started && i === mulai) {
      sel.classList.add('aktif');
    }
    if (i === eopPertama) {
      sel.classList.add('eop');
    }
    if (state.started && i < mulai && !dalamKata) {
      sel.classList.add('lewat');
    }
    if (dalamKata) {
      sel.classList.add('dalam-kata');
    }
    if (eopPertama !== -1 && i > eopPertama) {
      sel.classList.add('setelah-eop');
    }

    sel.setAttribute(
      'aria-label',
      'Indeks ' + i + ', karakter ' + (karakter === ' ' ? 'spasi' : karakter)
    );
    sel.appendChild(indeks);
    sel.appendChild(isi);
    return sel;
  }

  function pita(el, state, jenis) {
    kosongkan(el);
    if (!state.tape) {
      var kosong = document.createElement('p');
      kosong.className = 'kosong';
      kosong.textContent = 'Pita akan tampil di sini.';
      el.appendChild(kosong);
      return;
    }
    for (var i = 0; i < state.tape.length; i++) {
      el.appendChild(selPita(i, state.tape[i], state, jenis));
    }
  }

  function panelVar(el, baris) {
    kosongkan(el);
    baris.forEach(function (item) {
      var wadah = document.createElement('div');
      wadah.className = 'var-baris';
      if (item[1] === null) {
        wadah.classList.add('kosong');
      }
      var nama = document.createElement('span');
      nama.className = 'var-nama';
      nama.textContent = item[0] + ' = ';
      var nilai = document.createElement('span');
      nilai.className = 'var-nilai';
      nilai.textContent = item[1] === null ? '-' : String(item[1]);
      wadah.appendChild(nama);
      wadah.appendChild(nilai);
      el.appendChild(wadah);
    });
  }

  function panelStat(el, baris) {
    kosongkan(el);
    baris.forEach(function (item) {
      var kotak = document.createElement('div');
      kotak.className = 'stat';
      var label = document.createElement('span');
      label.className = 'stat-label';
      label.textContent = item[0];
      var angka = document.createElement('b');
      angka.textContent = item[1] === null ? '-' : String(item[1]);
      kotak.appendChild(label);
      kotak.appendChild(angka);
      el.appendChild(kotak);
    });
  }

  function legenda(el, daftar) {
    kosongkan(el);
    daftar.forEach(function (item) {
      var wadah = document.createElement('span');
      wadah.className = 'legenda-item';
      var swatch = document.createElement('span');
      swatch.className = 'swatch ' + item[0];
      var label = document.createElement('span');
      label.textContent = item[1];
      wadah.appendChild(swatch);
      wadah.appendChild(label);
      el.appendChild(wadah);
    });
  }

  function log(el, entri) {
    kosongkan(el);
    if (!entri || entri.length === 0) {
      var kosong = document.createElement('li');
      kosong.className = 'kosong';
      kosong.textContent = 'Belum ada operasi.';
      el.appendChild(kosong);
      return;
    }
    entri.forEach(function (item) {
      var baris = document.createElement('li');
      var aksi = document.createElement('b');
      aksi.textContent = item[0];
      baris.appendChild(aksi);
      // Buang awalan "<AKSI>: " agar label tebal tidak muncul dua kali.
      var teks = item[1].replace(/^[A-Z]+(?: [A-Z]+)*: /, '');
      baris.appendChild(document.createTextNode(' ' + teks));
      el.appendChild(baris);
    });
  }

  // Escape karakter agar tetap sah di dalam literal char C.
  function escapeC(nilai) {
    return nilai.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  // Sorotan sintaks sederhana untuk cuplikan C.
  function sorotSintaks(parent, teks) {
    var re = /(\/\/.*)|(#\w+(?:[^\n]*)?)|('(?:\\.|[^'])*')|("(?:\\.|[^"])*")|\b(\d+)\b|\b(void|int|char|if|else|while|return|extern)\b/g;
    var last = 0;
    var m;
    while ((m = re.exec(teks)) !== null) {
      if (m.index > last) {
        parent.appendChild(document.createTextNode(teks.slice(last, m.index)));
      }
      var cls = '';
      if (m[1]) cls = 'tok-kom';
      else if (m[2]) cls = 'tok-pp';
      else if (m[3] || m[4]) cls = 'tok-str';
      else if (m[5]) cls = 'tok-num';
      else if (m[6]) cls = 'tok-kw';
      var s = document.createElement('span');
      s.className = cls;
      s.textContent = m[0];
      parent.appendChild(s);
      last = m.index + m[0].length;
    }
    if (last < teks.length) {
      parent.appendChild(document.createTextNode(teks.slice(last)));
    }
    if (teks === ' ') {
      // pastikan satu spasi tetap tampil
    }
  }

  function kode(el, berkas, opAktif, eop) {
    kosongkan(el);
    berkas.forEach(function (file) {
      var bagian = document.createElement('section');
      bagian.className = 'berkas-kode';

      var judul = document.createElement('h3');
      judul.textContent = file.nama;

      var teks = document.createElement('pre');
      teks.className = 'kode-teks';

      var wadah = document.createElement('div');
      wadah.className = 'kode-wadah';

      var blokTampil = opAktif
        ? file.blok.filter(function (blok) { return blok.op === opAktif; })
        : file.blok.filter(function (blok) { return blok.op === null; });
      if (blokTampil.length === 0) return;
      blokTampil.forEach(function (blok) {
        blok.baris.forEach(function (baris) {
          var isi = baris;
          // Baris #define diperbarui di tempat agar baris kosong sesudahnya tetap ada.
          if (blok.eop) {
            // Fungsi pengganti agar `$` pada EOP tidak ditafsirkan sebagai pola replace.
            isi = baris.replace("'.'", function () { return "'" + escapeC(eop) + "'"; });
          }
          var span = document.createElement('span');
          span.className = 'baris-kode';
          if (blok.op && blok.op === opAktif) {
            span.classList.add('aktif');
          }
          var teksBaris = isi === '' ? ' ' : isi;
          sorotSintaks(span, teksBaris);
          wadah.appendChild(span);
        });
      });

      teks.appendChild(wadah);
      bagian.appendChild(judul);
      bagian.appendChild(teks);
      el.appendChild(bagian);
    });
  }

  global.Render = {
    pita: pita,
    panelVar: panelVar,
    panelStat: panelStat,
    legenda: legenda,
    log: log,
    kode: kode
  };
})(typeof window !== 'undefined' ? window : globalThis);
