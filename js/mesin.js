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

  global.Mesin = { validasi: validasi, karakterAwal: karakterAwal, karakter: karakter };
})(typeof window !== 'undefined' ? window : globalThis);
