(function (global) {
  'use strict';

  var PANJANG_MAKS = 149;

  // Memeriksa pita dan EOP sebelum mesin dijalankan.
  function validasi(tape, eop) {
    if (tape.length === 0) {
      return { error: 'Pita tidak boleh kosong.' };
    }
    if (/[\r\n]/.test(tape)) {
      return { error: 'Pita tidak boleh mengandung baris baru.' };
    }
    if (tape.length > PANJANG_MAKS) {
      return { error: 'Pita maksimal 149 karakter.' };
    }
    if (eop.length !== 1) {
      return { error: 'EOP harus tepat satu karakter.' };
    }
    if (/\s/.test(eop)) {
      return { error: 'EOP tidak boleh berupa karakter putih.' };
    }
    if (tape.indexOf(eop) === -1) {
      return { error: 'EOP harus ada di dalam pita.' };
    }
    return {};
  }

  // State awal karakter: mesin belum menunjuk sel mana pun.
  function karakterAwal(tape, eop) {
    return {
      tape: tape,
      eop: eop,
      idx: -1,
      cc: null,
      started: false,
      selesai: false,
      langkah: 0,
      hitInc: 0,
      hitAdv: 0,
      hitGet: 0
    };
  }

  // State baru dengan idx, cc, dan selesai mengikuti posisi yang diminta.
  function posisiBaru(state, idx) {
    var cc = state.tape[idx];
    return Object.assign({}, state, {
      idx: idx,
      cc: cc,
      selesai: cc === state.eop
    });
  }

  // Aksi tidak valid: state disalin utuh, tanpa perubahan.
  function tolak(state, alasan) {
    return { state: Object.assign({}, state), keterangan: alasan, galat: alasan };
  }

  function karakter(state, aksi) {
    if (aksi === 'START') {
      var baru = posisiBaru(
        Object.assign({}, state, {
          started: true,
          langkah: 1,
          hitInc: 0,
          hitAdv: 0,
          hitGet: 0
        }),
        0
      );
      return {
        state: baru,
        keterangan: 'START: mesin di indeks 0, CC = "' + baru.cc + '".'
      };
    }

    if (!state.started) {
      return tolak(state, 'Mesin belum dimulai. Tekan START terlebih dahulu.');
    }

    if (aksi === 'INC' || aksi === 'ADV') {
      if (state.selesai) {
        return tolak(state, 'Mesin sudah di EOP. Tekan START untuk mengulang.');
      }

      if (aksi === 'INC') {
        var maju = posisiBaru(state, state.idx + 1);
        maju.hitInc = state.hitInc + 1;
        maju.langkah = state.langkah + 1;
        return {
          state: maju,
          keterangan: 'INC: maju ke indeks ' + maju.idx + ', CC = "' + maju.cc + '".'
        };
      }

      // ADV maju satu sel lebih dulu, lalu melewati spasi berikutnya.
      var idx = state.idx + 1;
      var spasi = 0;
      while (state.tape[idx] === ' ') {
        spasi++;
        idx++;
      }
      var lompat = posisiBaru(state, idx);
      lompat.hitAdv = state.hitAdv + 1;
      lompat.langkah = state.langkah + 1;
      return {
        state: lompat,
        keterangan:
          'ADV: maju ke indeks ' + lompat.idx + ', CC = "' + lompat.cc + '"' +
          (spasi > 0 ? ' (melewati ' + spasi + ' spasi)' : '') + '.'
      };
    }

    if (aksi === 'GETCC' || aksi === 'GETIDX') {
      var baca = Object.assign({}, state);
      baca.hitGet = state.hitGet + 1;
      var hasil = aksi === 'GETCC' ? state.cc : state.idx;
      return {
        state: baca,
        hasil: hasil,
        keterangan: aksi === 'GETCC'
          ? 'GET CC: CC = "' + hasil + '".'
          : 'GET IDX: idx = ' + hasil + '.'
      };
    }

    if (aksi === 'EOP') {
      var diEop = state.cc === state.eop ? 1 : 0;
      return {
        state: Object.assign({}, state),
        hasil: diEop,
        keterangan: 'EOP: ' + (diEop === 1 ? 'CC adalah EOP.' : 'CC bukan EOP.')
      };
    }

    return tolak(state, 'Aksi tidak dikenal.');
  }

  // State awal kata: belum ada kata yang dimuat.
  function kataAwal(tape, eop) {
    return {
      tape: tape,
      eop: eop,
      idx: -1,
      cw: null,
      wlen: 0,
      started: false,
      selesai: false,
      langkah: 0,
      hitInc: 0,
      hitReset: 0,
      hitKata: 0,
      hitGet: 0
    };
  }

  // Memuat satu kata mulai dari sel tertentu; idx berhenti di pembatas.
  function muatKata(state, mulai) {
    var idx = mulai;
    while (state.tape[idx] === ' ') {
      idx++;
    }
    var awal = idx;
    while (idx < state.tape.length && state.tape[idx] !== ' ' && state.tape[idx] !== state.eop) {
      idx++;
    }
    var cw = state.tape.slice(awal, idx);
    return {
      idx: idx,
      cw: cw,
      wlen: cw.length,
      selesai: state.tape[idx] === state.eop
    };
  }

  function kata(state, aksi) {
    if (aksi === 'START') {
      var isi = muatKata(state, 0);
      return {
        state: Object.assign({}, state, isi, {
          started: true,
          langkah: 1,
          hitInc: 0,
          hitReset: 0,
          hitKata: isi.cw.length > 0 ? 1 : 0,
          hitGet: 0
        }),
        keterangan: 'START: CW = "' + isi.cw + '", idx = ' + isi.idx + '.'
      };
    }

    if (!state.started) {
      return tolak(state, 'Mesin belum dimulai. Tekan START terlebih dahulu.');
    }

    if (aksi === 'INC') {
      if (state.selesai) {
        return tolak(state, 'Mesin sudah di EOP. Tekan START untuk mengulang.');
      }

      var lanjut = muatKata(state, state.idx + 1);
      return {
        state: Object.assign({}, state, lanjut, {
          hitInc: state.hitInc + 1,
          hitKata: state.hitKata + (lanjut.cw.length > 0 ? 1 : 0),
          langkah: state.langkah + 1
        }),
        keterangan: 'INC: CW = "' + lanjut.cw + '", idx = ' + lanjut.idx + '.'
      };
    }

    if (aksi === 'RESET') {
      return {
        state: Object.assign({}, state, {
          cw: '',
          wlen: 0,
          hitReset: state.hitReset + 1,
          langkah: state.langkah + 1
        }),
        keterangan: 'RESET: CW dikosongkan.'
      };
    }

    if (aksi === 'GETCW' || aksi === 'GETLEN') {
      var baca = Object.assign({}, state);
      baca.hitGet = state.hitGet + 1;
      var hasil = aksi === 'GETCW' ? state.cw : state.wlen;
      return {
        state: baca,
        hasil: hasil,
        keterangan: aksi === 'GETCW'
          ? 'GET CW: CW = "' + hasil + '".'
          : 'GET LEN: wlen = ' + hasil + '.'
      };
    }

    if (aksi === 'EOP') {
      var diEop = state.tape[state.idx] === state.eop ? 1 : 0;
      return {
        state: Object.assign({}, state),
        hasil: diEop,
        keterangan: 'EOP: ' + (diEop === 1 ? 'sel adalah EOP.' : 'sel bukan EOP.')
      };
    }

    return tolak(state, 'Aksi tidak dikenal.');
  }

  global.Mesin = {
    validasi: validasi,
    karakterAwal: karakterAwal,
    karakter: karakter,
    kataAwal: kataAwal,
    kata: kata
  };
})(typeof window !== 'undefined' ? window : globalThis);
