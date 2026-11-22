(function () {
  'use strict';

  var MESIN = {
    karakter: {
      nama: 'Mesin Karakter',
      aksi: [
        ['START', 'Mulai dari indeks 0'],
        ['INC', 'Maju satu sel, termasuk spasi'],
        ['ADV', 'Maju lalu lewati spasi'],
        ['GETCC', 'Ambil karakter aktif (CC)'],
        ['GETIDX', 'Ambil posisi baca (idx)'],
        ['EOP', 'Cek akhir pita']
      ],
      legenda: [['aktif', 'Sel aktif'], ['eop', 'EOP'], ['lewat', 'Sudah dilewati']]
    },
    kata: {
      nama: 'Mesin Kata',
      aksi: [
        ['START', 'Muat kata pertama'],
        ['INC', 'Pindah ke kata berikutnya'],
        ['RESET', 'Kosongkan CW'],
        ['GETCW', 'Ambil kata aktif (CW)'],
        ['GETLEN', 'Ambil panjang CW'],
        ['EOP', 'Cek akhir pita']
      ],
      legenda: [['aktif', 'Sel aktif'], ['eop', 'EOP'], ['lewat', 'Sudah dilewati'], ['kata', 'Kata aktif']]
    }
  };

  var PRESET = [
    ['Contoh modul: jend␣␣ela.', 'jend  ela.'],
    ['Contoh modul: i am nice.', 'i am nice.'],
    ['Kalimat panjang', 'Tindakan sang kikan akan dikenakan hukuman.']
  ];

  var PENJELASAN_AWAL = 'Tekan START untuk menyalakan mesin.';

  // Tiap mesin menyimpan pita, EOP, state reducer, log, dan sorotan kodenya.
  var state = {
    karakter: {
      tape: 'lap  top.',
      eop: '.',
      mesin: Mesin.karakterAwal('lap  top.', '.'),
      log: [],
      opAktif: null,
      penjelasan: PENJELASAN_AWAL
    },
    kata: {
      tape: 'i see you.',
      eop: '.',
      mesin: Mesin.kataAwal('i see you.', '.'),
      log: [],
      opAktif: null,
      penjelasan: PENJELASAN_AWAL
    }
  };

  var aktif = 'karakter';
  var el = {};

  function statusMesin(s) {
    if (!s.started) return 'Belum mulai';
    if (s.selesai) return 'EOP tercapai';
    return 'Berjalan';
  }

  function teksCc(cc) {
    return cc === ' ' ? '␣' : cc;
  }

  function teksCw(cw) {
    return cw === '' ? '(kosong)' : cw;
  }

  function statusPita(s) {
    if (!s.started) return 'Belum START.';
    var akhir = s.selesai ? 'EOP tercapai' : 'belum EOP';
    if (aktif === 'karakter') {
      return 'idx ' + s.idx + " · CC '" + teksCc(s.cc) + "' · " + akhir;
    }
    return 'idx ' + s.idx + ' · CW "' + teksCw(s.cw) + '" · panjang ' + s.wlen + ' · ' + akhir;
  }

  function barisVar(s) {
    if (aktif === 'karakter') {
      return [
        ['idx', s.started ? s.idx : null],
        ['cc', s.started ? teksCc(s.cc) : null],
        ['EOP', state.karakter.eop],
        ['Status', statusMesin(s)]
      ];
    }
    return [
      ['idx', s.started ? s.idx : null],
      ['CW', s.started ? teksCw(s.cw) : null],
      ['wlen', s.started ? s.wlen : null],
      ['EOP', state.kata.eop],
      ['Status', statusMesin(s)]
    ];
  }

  function barisStat(s) {
    if (aktif === 'karakter') {
      return [
        ['Langkah', s.langkah],
        ['INC', s.hitInc],
        ['ADV', s.hitAdv],
        ['GET', s.hitGet]
      ];
    }
    return [
      ['Langkah', s.langkah],
      ['INC', s.hitInc],
      ['RESET', s.hitReset],
      ['Kata', s.hitKata]
    ];
  }

  // Tombol yang tidak valid dinonaktifkan; START selalu hidup.
  function boleh(aksi, s) {
    if (aksi === 'START') return true;
    if (!s.started) return false;
    if (s.selesai) {
      if (aktif === 'karakter' && (aksi === 'INC' || aksi === 'ADV')) return false;
      if (aktif === 'kata' && aksi === 'INC') return false;
    }
    return true;
  }

  function perbaruiTombol(s) {
    var tombol = document.querySelectorAll('#tombol-mesin [data-aksi]');
    Array.prototype.forEach.call(tombol, function (b) {
      b.disabled = !boleh(b.getAttribute('data-aksi'), s);
    });
  }

  function tampilkan() {
    var m = state[aktif];
    var s = m.mesin;
    Render.pita(el.pita, s, aktif);
    Render.panelVar(el.panelVar, barisVar(s));
    Render.kode(el.kode, Kode[aktif], m.opAktif, m.eop);
    el.penjelasan.textContent = m.penjelasan;
    perbaruiTombol(s);
  }

  function labelAksi(aksi) {
    if (aksi === 'GETCC') return 'GET CC';
    if (aksi === 'GETIDX') return 'GET IDX';
    if (aksi === 'GETCW') return 'GET CW';
    if (aksi === 'GETLEN') return 'GET LEN';
    return aksi;
  }

  function bangunTombol() {
    el.tombolMesin.textContent = '';
    MESIN[aktif].aksi.forEach(function (item) {
      var aksi = item[0];
      var tombol = document.createElement('button');
      tombol.type = 'button';
      tombol.className = 'btn';
      tombol.setAttribute('data-aksi', aksi);

      var nama = document.createElement('span');
      nama.textContent = labelAksi(aksi);

      tombol.appendChild(nama);
      tombol.addEventListener('click', function () {
        jalankan(aksi);
      });
      el.tombolMesin.appendChild(tombol);
    });
  }

  function jalankan(aksi) {
    var m = state[aktif];
    var reducer = aktif === 'karakter' ? Mesin.karakter : Mesin.kata;
    var hasil = reducer(m.mesin, aksi);

    if (hasil.galat) {
      m.penjelasan = hasil.keterangan;
      tampilkan();
      return;
    }

    if (aksi === 'START') {
      m.log = [];
    }
    m.mesin = hasil.state;
    m.opAktif = aksi.toLowerCase();
    m.penjelasan = hasil.keterangan;
    m.log.push([aksi, hasil.keterangan]);
    tampilkan();
  }

  function hitungPita() {
    var n = el.pitaInput.value.length;
    el.pitaHitung.textContent = n + '/149';
    el.pitaHitung.classList.toggle('lewat', n > 149);
  }

  function isiKolom() {
    el.pitaInput.value = state[aktif].tape;
    el.eopInput.value = state[aktif].eop;
    hitungPita();
  }

  function terapkan() {
    var tape = el.pitaInput.value;
    var eop = el.eopInput.value;
    var cek = Mesin.validasi(tape, eop);

    if (cek.error) {
      el.pesanGalat.textContent = cek.error;
      el.pesanGalat.hidden = false;
      return;
    }

    el.pesanGalat.hidden = true;
    var m = state[aktif];
    m.tape = tape;
    m.eop = eop;
    m.mesin = aktif === 'karakter' ? Mesin.karakterAwal(tape, eop) : Mesin.kataAwal(tape, eop);
    m.log = [];
    m.opAktif = null;
    m.penjelasan = PENJELASAN_AWAL;
    hitungPita();
    if (el.dialog && el.dialog.open) el.dialog.close();
    tampilkan();
  }

  function pilihTab(nama) {
    aktif = nama;
    el.tabKarakter.classList.toggle('aktif', aktif === 'karakter');
    el.tabKata.classList.toggle('aktif', aktif === 'kata');
    el.tabKarakter.setAttribute('aria-selected', String(aktif === 'karakter'));
    el.tabKata.setAttribute('aria-selected', String(aktif === 'kata'));
    el.pesanGalat.hidden = true;
    isiKolom();
    bangunTombol();
    tampilkan();
  }

  function bukaEditor() {
    var m = state[aktif];
    el.pitaInput.value = m.tape;
    el.eopInput.value = m.eop;
    el.pesanGalat.hidden = true;
    hitungPita();
    if (typeof el.dialog.showModal === 'function') {
      el.dialog.showModal();
    } else {
      el.dialog.setAttribute('open', '');
    }
  }

  function mulai() {
    el.pita = document.getElementById('pita');
    el.tombolMesin = document.getElementById('tombol-mesin');
    el.panelVar = document.getElementById('panel-var');
    el.penjelasan = document.getElementById('penjelasan');
    el.kode = document.getElementById('kode');
    el.dialog = document.getElementById('dialog-pita');
    el.pitaInput = document.getElementById('pita-input');
    el.pitaHitung = document.getElementById('pita-hitung');
    el.eopInput = document.getElementById('eop-input');
    el.pesanGalat = document.getElementById('pesan-galat');
    el.tabKarakter = document.getElementById('tab-karakter');
    el.tabKata = document.getElementById('tab-kata');
    el.btnBatal = document.getElementById('btn-batal');

    el.tabKarakter.addEventListener('click', function () {
      pilihTab('karakter');
    });
    el.tabKata.addEventListener('click', function () {
      pilihTab('kata');
    });

    el.pita.addEventListener('click', bukaEditor);
    el.pita.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        bukaEditor();
      }
    });

    document.getElementById('btn-terapkan').addEventListener('click', terapkan);
    el.btnBatal.addEventListener('click', function () {
      if (el.dialog.open) el.dialog.close();
    });
    el.pitaInput.addEventListener('input', hitungPita);

    isiKolom();
    bangunTombol();
    tampilkan();
  }

  document.addEventListener('DOMContentLoaded', mulai);
})();
