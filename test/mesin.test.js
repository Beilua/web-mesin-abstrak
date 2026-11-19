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
