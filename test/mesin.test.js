'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/mesin.js');
const Mesin = globalThis.Mesin;

const PITA = 'jend  ela.';

function charAwal(tape = PITA, eop = '.') {
  return Mesin.karakterAwal(tape, eop);
}

function charStart(tape = PITA, eop = '.') {
  return Mesin.karakter(charAwal(tape, eop), 'START').state;
}

function majuChar(state, aksi, n) {
  for (let i = 0; i < n; i++) state = Mesin.karakter(state, aksi).state;
  return state;
}

test('validasi menolak pita kosong', () => {
  assert.match(Mesin.validasi('', '.').error, /kosong/i);
});

test('validasi menolak pita lebih dari 149 karakter', () => {
  assert.match(Mesin.validasi('a'.repeat(149) + '.', '.').error, /149/);
});

test('validasi menolak baris baru', () => {
  assert.match(Mesin.validasi('a\nb.', '.').error, /baris/i);
});

test('validasi menolak EOP kosong atau lebih dari satu karakter', () => {
  assert.match(Mesin.validasi('abc.', '').error, /EOP/);
  assert.match(Mesin.validasi('abc.', '..').error, /EOP/);
});

test('validasi menolak EOP berupa karakter putih', () => {
  assert.match(Mesin.validasi('abc.', ' ').error, /EOP/);
  assert.match(Mesin.validasi('abc.', '\t').error, /EOP/);
});

test('validasi menolak EOP yang tidak ada di pita', () => {
  assert.match(Mesin.validasi('jendela', '.').error, /EOP/);
});

test('validasi menerima pita modul', () => {
  assert.deepEqual(Mesin.validasi(PITA, '.'), {});
});

test('validasi menerima pita tepat 149 karakter', () => {
  assert.deepEqual(Mesin.validasi('a'.repeat(148) + '.', '.'), {});
});

test('START menaruh mesin di indeks 0', () => {
  const r = Mesin.karakter(charAwal(), 'START');
  assert.equal(r.state.idx, 0);
  assert.equal(r.state.cc, 'j');
  assert.equal(r.state.started, true);
  assert.equal(r.state.selesai, false);
  assert.equal(r.state.langkah, 1);
});

test('INC maju satu sel termasuk ke spasi', () => {
  let s = charStart();
  s = majuChar(s, 'INC', 4);
  assert.equal(s.idx, 4);
  assert.equal(s.cc, ' ');
  assert.equal(s.hitInc, 4);
  assert.equal(s.langkah, 5);
});

test('ADV melewati dua spasi dan berhenti di e', () => {
  let s = charStart();
  s = majuChar(s, 'INC', 3);
  const r = Mesin.karakter(s, 'ADV');
  assert.equal(r.state.idx, 6);
  assert.equal(r.state.cc, 'e');
  assert.equal(r.state.hitAdv, 1);
  assert.match(r.keterangan, /2 spasi/);
});

test('ADV berhenti di EOP', () => {
  let s = charStart();
  s = majuChar(s, 'INC', 8);
  const r = Mesin.karakter(s, 'ADV');
  assert.equal(r.state.idx, 9);
  assert.equal(r.state.cc, '.');
  assert.equal(r.state.selesai, true);
});

test('INC dan ADV ditolak setelah EOP', () => {
  const s = majuChar(charStart(), 'INC', 9);
  assert.equal(s.selesai, true);
  const inc = Mesin.karakter(s, 'INC');
  const adv = Mesin.karakter(s, 'ADV');
  assert.ok(inc.galat);
  assert.ok(adv.galat);
  assert.deepEqual(inc.state, s);
  assert.deepEqual(adv.state, s);
});

test('GET CC mengembalikan karakter tanpa memindah mesin', () => {
  const r = Mesin.karakter(charStart(), 'GETCC');
  assert.equal(r.hasil, 'j');
  assert.equal(r.state.idx, 0);
  assert.equal(r.state.cc, 'j');
  assert.equal(r.state.hitGet, 1);
});

test('GET IDX mengembalikan posisi tanpa memindah mesin', () => {
  const s = majuChar(charStart(), 'INC', 3);
  const r = Mesin.karakter(s, 'GETIDX');
  assert.equal(r.hasil, 3);
  assert.equal(r.state.idx, 3);
  assert.equal(r.state.hitGet, 1);
});

test('EOP menjawab 0 di tengah dan 1 di akhir', () => {
  assert.equal(Mesin.karakter(charStart(), 'EOP').hasil, 0);
  const akhir = majuChar(charStart(), 'INC', 9);
  assert.equal(Mesin.karakter(akhir, 'EOP').hasil, 1);
});

test('START mengulang dari awal dan menolkan penghitung', () => {
  let s = majuChar(charStart(), 'INC', 3);
  s = Mesin.karakter(s, 'GETCC').state;
  const r = Mesin.karakter(s, 'START');
  assert.equal(r.state.idx, 0);
  assert.equal(r.state.langkah, 1);
  assert.equal(r.state.hitInc, 0);
  assert.equal(r.state.hitGet, 0);
});

test('EOP di indeks 0 langsung selesai', () => {
  const r = Mesin.karakter(charAwal('.', '.'), 'START');
  assert.equal(r.state.idx, 0);
  assert.equal(r.state.cc, '.');
  assert.equal(r.state.selesai, true);
  assert.ok(Mesin.karakter(r.state, 'INC').galat);
});

test('mesin karakter berhenti di EOP pertama', () => {
  const s = majuChar(charStart('abc.def.', '.'), 'INC', 3);
  assert.equal(s.cc, '.');
  assert.equal(s.selesai, true);
  assert.ok(Mesin.karakter(s, 'INC').galat);
});

test('aksi selain START ditolak sebelum START', () => {
  const s = charAwal();
  assert.ok(Mesin.karakter(s, 'INC').galat);
  assert.ok(Mesin.karakter(s, 'ADV').galat);
  assert.ok(Mesin.karakter(s, 'GETCC').galat);
  assert.ok(Mesin.karakter(s, 'GETIDX').galat);
  assert.ok(Mesin.karakter(s, 'EOP').galat);
});

test('reducer karakter tidak mengubah state masukan', () => {
  const s = charAwal();
  const salinan = JSON.parse(JSON.stringify(s));
  Mesin.karakter(s, 'START');
  assert.deepEqual(s, salinan);
});

const PITA_KATA = 'i am nice.';

function kataAwal(tape = PITA_KATA, eop = '.') {
  return Mesin.kataAwal(tape, eop);
}

function kataStart(tape = PITA_KATA, eop = '.') {
  return Mesin.kata(kataAwal(tape, eop), 'START').state;
}

function majuKata(state, aksi, n) {
  for (let i = 0; i < n; i++) state = Mesin.kata(state, aksi).state;
  return state;
}

test('START memuat kata pertama dan berhenti di spasi', () => {
  const s = kataStart();
  assert.equal(s.cw, 'i');
  assert.equal(s.wlen, 1);
  assert.equal(s.idx, 1);
  assert.equal(s.selesai, false);
  assert.equal(s.hitKata, 1);
  assert.equal(s.langkah, 1);
});

test('INC memuat kata berikutnya', () => {
  const r = Mesin.kata(kataStart(), 'INC');
  assert.equal(r.state.cw, 'am');
  assert.equal(r.state.wlen, 2);
  assert.equal(r.state.idx, 4);
  assert.equal(r.state.hitInc, 1);
});

test('INC sampai kata terakhir lalu EOP', () => {
  const s = majuKata(kataStart(), 'INC', 2);
  assert.equal(s.cw, 'nice');
  assert.equal(s.wlen, 4);
  assert.equal(s.idx, 9);
  assert.equal(s.selesai, true);
  assert.equal(s.hitKata, 3);
});

test('INC ditolak setelah EOP', () => {
  const s = majuKata(kataStart(), 'INC', 2);
  const r = Mesin.kata(s, 'INC');
  assert.ok(r.galat);
  assert.deepEqual(r.state, s);
});

test('RESET mengosongkan CW tanpa memindah idx', () => {
  const s = majuKata(kataStart(), 'INC', 1);
  const r = Mesin.kata(s, 'RESET');
  assert.equal(r.state.cw, '');
  assert.equal(r.state.wlen, 0);
  assert.equal(r.state.idx, 4);
  assert.equal(r.state.hitReset, 1);
  assert.equal(r.state.langkah, 3);
});

test('START melewati spasi pembuka', () => {
  const s = kataStart('   i am.');
  assert.equal(s.cw, 'i');
  assert.equal(s.wlen, 1);
  assert.equal(s.idx, 4);
});

test('INC melewati beberapa spasi', () => {
  const s = kataStart('i   am.');
  assert.equal(s.idx, 1);
  const r = Mesin.kata(s, 'INC');
  assert.equal(r.state.cw, 'am');
  assert.equal(r.state.wlen, 2);
  assert.equal(r.state.idx, 6);
  assert.equal(r.state.selesai, true);
});

test('pita hanya EOP menghasilkan CW kosong', () => {
  const s = kataStart('.');
  assert.equal(s.cw, '');
  assert.equal(s.wlen, 0);
  assert.equal(s.selesai, true);
  assert.equal(s.hitKata, 0);
});

test('mesin kata berhenti di EOP pertama', () => {
  const s = kataStart('ab.cd.');
  assert.equal(s.cw, 'ab');
  assert.equal(s.wlen, 2);
  assert.equal(s.idx, 2);
  assert.equal(s.selesai, true);
});

test('GET CW dan GET LEN membaca tanpa memindah mesin', () => {
  const s = majuKata(kataStart(), 'INC', 1);
  const cw = Mesin.kata(s, 'GETCW');
  const len = Mesin.kata(cw.state, 'GETLEN');
  assert.equal(cw.hasil, 'am');
  assert.equal(len.hasil, 2);
  assert.equal(cw.state.idx, 4);
  assert.equal(len.state.idx, 4);
  assert.equal(len.state.hitGet, 2);
});

test('EOP memeriksa sel idx, bukan kata', () => {
  const s = kataStart();
  assert.equal(Mesin.kata(s, 'EOP').hasil, 0);
  const akhir = majuKata(s, 'INC', 2);
  assert.equal(Mesin.kata(akhir, 'EOP').hasil, 1);
});

test('kata lebih dari 50 karakter tidak dipotong', () => {
  const panjang = 'a'.repeat(60);
  const s = kataStart(panjang + '.');
  assert.equal(s.wlen, 60);
  assert.equal(s.cw, panjang);
});

test('aksi kata ditolak sebelum START', () => {
  const s = kataAwal();
  assert.ok(Mesin.kata(s, 'INC').galat);
  assert.ok(Mesin.kata(s, 'RESET').galat);
  assert.ok(Mesin.kata(s, 'GETCW').galat);
  assert.ok(Mesin.kata(s, 'GETLEN').galat);
  assert.ok(Mesin.kata(s, 'EOP').galat);
});

test('reducer kata tidak mengubah state masukan', () => {
  const s = kataAwal();
  const salinan = JSON.parse(JSON.stringify(s));
  Mesin.kata(s, 'START');
  assert.deepEqual(s, salinan);
});
