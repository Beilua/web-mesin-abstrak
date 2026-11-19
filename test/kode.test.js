'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/kode.js');
const Kode = globalThis.Kode;

function opYangAda(berkas) {
  const hasil = new Set();
  berkas.forEach((file) => file.blok.forEach((blok) => {
    if (blok.op) hasil.add(blok.op);
  }));
  return [...hasil].sort();
}

function adaBarisEop(berkas) {
  return berkas.some((file) => file.blok.some((blok) => blok.eop === true));
}

test('kode karakter memuat semua operasi', () => {
  assert.deepEqual(opYangAda(Kode.karakter), ['adv', 'eop', 'getcc', 'getidx', 'inc', 'start']);
});

test('kode kata memuat semua operasi', () => {
  assert.deepEqual(opYangAda(Kode.kata), ['eop', 'getcw', 'getlen', 'inc', 'reset', 'start']);
});

test('setiap berkas punya nama dan baris', () => {
  [...Kode.karakter, ...Kode.kata].forEach((file) => {
    assert.ok(file.nama);
    assert.ok(file.blok.length > 0);
    file.blok.forEach((blok) => assert.ok(blok.baris.length > 0));
  });
});

test('kedua mesin punya baris EOP_SIMBOL yang dapat diganti', () => {
  assert.equal(adaBarisEop(Kode.karakter), true);
  assert.equal(adaBarisEop(Kode.kata), true);
});

test('kode kata memakai EOP_SIMBOL, bukan titik literal', () => {
  const teks = JSON.stringify(Kode.kata);
  assert.match(teks, /EOP_SIMBOL/);
  assert.ok(!teks.includes("== '.'"));
});

test('main tidak ditampilkan', () => {
  assert.ok(!JSON.stringify(Kode).includes('int main'));
});
