# Simulasi Mesin Abstrak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Indonesian web page where the Character Machine and Word Machine from Modul 9 run by pressing their real buttons, with a live tape, variables, counters, log, and highlighted C source.

**Architecture:** Pure reducers in `js/mesin.js` own both machine states. `js/kode.js` holds the C source as tagged blocks. `js/render.js` draws tape/variables/counters/log/code without machine logic. `js/app.js` owns UI state, validation, presets, tabs, and button wiring. No player, no precomputed steps, no build step.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node's built-in test runner. Font Patrick Hand (local TTF).

**Spec:** `docs/specs/2026-11-19-simulasi-mesin-abstrak.md`

## Global Constraints

- Two machines only: Mesin Karakter and Mesin Kata. No CRUD, makro, exercises, undo, autoplay, or playback.
- All visible text, explanations, and code comments are Indonesian.
- Runs from `file://` by opening `index.html`; no framework, bundler, CDN, or network request.
- Tape is 1–149 characters, spaces are significant, newlines rejected.
- EOP is exactly one visible non-whitespace character, must occur in the tape, and can be changed by the user.
- Tape 149 characters max; word length is not capped in the simulator.
- START always restarts: counters and log reset, position returns to 0.
- Operations execute only on button press. Reads do not move the machine.
- Reducers never mutate their input state.
- Code panel shows the C source from the spec with `EOP_SIMBOL`, never `main`.
- Same visual language as the reference repo: cream `#FEFDFB`, black lines, blue `#1D4ED8`, Patrick Hand.
- No horizontal page scroll at 360px; controls at least 44px tall.

## Review Focus

- **Tape that is only EOP or has EOP at index 0:** START must immediately mark the machine finished, and INC/ADV must be rejected. Tests live in Task 1 and Task 2.
- **Invalid EOP (space, multi-character, missing from tape):** Terapkan must show an error and leave the running machine unchanged. Validation tests in Task 1; UI path in Task 5.
- **Word tape with leading, trailing, or repeated spaces:** CW, `wlen`, and `idx` must match the spec. Tests in Task 2.
- **Advancing after EOP:** INC/ADV must be rejected and must not move or count. Tests in Task 1 and Task 2.
- **149-character tape and a word over 50 characters:** no lost characters, no truncation, tape scrolls instead of stretching the page. Max-tape test in Task 1, long-word test in Task 2, layout check in Task 5.

---

### Task 1: Validation and Character Machine

**Files:**
- Create: `js/mesin.js`
- Create: `test/mesin.test.js`
- Create: `.git` (initialize repository)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `Mesin.validasi(tape: string, eop: string) -> { error?: string }`
  - `Mesin.karakterAwal(tape: string, eop: string) -> CharState`
  - `Mesin.karakter(state: CharState, aksi: 'START' | 'INC' | 'ADV' | 'GETCC' | 'GETIDX' | 'EOP') -> { state: CharState, hasil?: string | number, keterangan: string, galat?: string }`
  - `CharState` fields: `tape, eop, idx, cc, started, selesai, langkah, hitInc, hitAdv, hitGet`

- [ ] **Step 1: Initialize the repository**

```bash
cd /home/beilua/PROJECTS/PROJECTS/ASPRAK/web-mesin-abstrak
git init -b main
```

- [ ] **Step 2: Write the failing tests**

Create `test/mesin.test.js`:

```js
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
```

- [ ] **Step 3: Run the tests and verify they fail**

Run: `node --test test/mesin.test.js`
Expected: FAIL with `Cannot find module '../js/mesin.js'`.

- [ ] **Step 4: Implement `js/mesin.js`**

Use the IIFE pattern so the same file works in a browser and in Node:

```js
(function (global) {
  'use strict';
  // ...
  global.Mesin = { validasi, karakterAwal, karakter };
})(typeof window !== 'undefined' ? window : globalThis);
```

Rules:
- `validasi` checks, in order: empty tape, newline in tape, length over 149, EOP length not 1, whitespace EOP, EOP missing from tape. Return `{ error: '...' }` with Indonesian messages containing `kosong`, `baris`, `149`, or `EOP` as required by the tests; return `{}` when valid.
- `karakterAwal` returns the initial `CharState` from the spec (`idx: -1`, `cc: null`, `started: false`, `selesai: false`, all counters 0).
- `karakter` implements the spec table. START builds a fresh state with counters reset and `langkah: 1`. INC/ADV increment `langkah` and their own counter. GETCC/GETIDX increment `hitGet`. Invalid actions return `{ state, keterangan: '<alasan>', galat: '<alasan>' }` without changing state.
- For ADV, compute how many spaces were skipped and include `(melewati N spasi)` in `keterangan` when N > 0.
- Always return a new state object; never assign into the input state.

- [ ] **Step 5: Run the tests and verify they pass**

Run: `node --test test/mesin.test.js`
Expected: PASS, all character and validation tests.

- [ ] **Step 6: Commit**

```bash
git add js/mesin.js test/mesin.test.js
git commit -m "feat: add character machine logic"
```

---

### Task 2: Word Machine

**Files:**
- Modify: `js/mesin.js`
- Modify: `test/mesin.test.js`

**Interfaces:**
- Consumes: `Mesin.validasi` from Task 1.
- Produces:
  - `Mesin.kataAwal(tape: string, eop: string) -> KataState`
  - `Mesin.kata(state: KataState, aksi: 'START' | 'INC' | 'RESET' | 'GETCW' | 'GETLEN' | 'EOP') -> { state: KataState, hasil?: string | number, keterangan: string, galat?: string }`
  - `KataState` fields: `tape, eop, idx, cw, wlen, started, selesai, langkah, hitInc, hitReset, hitKata, hitGet`

- [ ] **Step 1: Add failing tests for the word machine**

Append to `test/mesin.test.js`:

```js
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
  const len = Mesin.kata(s, 'GETLEN');
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
```

- [ ] **Step 2: Run the tests and verify the new ones fail**

Run: `node --test test/mesin.test.js`
Expected: FAIL with `Mesin.kataAwal is not a function`.

- [ ] **Step 3: Implement `kataAwal` and `kata` in `js/mesin.js`**

Rules:
- `kataAwal` returns the initial `KataState` (`idx: -1`, `cw: null`, `wlen: 0`, `started: false`, `selesai: false`, all counters 0).
- START and INC follow the spec exactly: skip spaces, copy characters until space or EOP, set `wlen`, leave `idx` on the delimiter, set `selesai = tape[idx] === eop`.
- START resets counters and sets `langkah: 1`; `hitKata` increments only when the loaded `cw` is non-empty.
- RESET sets `cw = ''`, `wlen = 0`, increments `hitReset` and `langkah`, leaves `idx` and `selesai` unchanged.
- GETCW/GETLEN increment `hitGet` and return `cw`/`wlen`; EOP returns `tape[idx] === eop ? 1 : 0` without incrementing anything.
- Invalid actions return a `galat` and the same state.
- Export `kataAwal` and `kata` on `global.Mesin`.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test test/mesin.test.js`
Expected: PASS, character and word tests.

- [ ] **Step 5: Commit**

```bash
git add js/mesin.js test/mesin.test.js
git commit -m "feat: add word machine logic"
```

---

### Task 3: C Source Data

**Files:**
- Create: `js/kode.js`
- Create: `test/kode.test.js`

**Interfaces:**
- Consumes: the C source exactly as written in the spec.
- Produces:
  - `Kode.karakter: Array<{ nama: string, blok: Array<{ op: string | null, eop?: boolean, baris: string[] }> }>`
  - `Kode.kata` with the same shape.
  - Operation ids: `start`, `inc`, `adv`, `getcc`, `getidx`, `eop`, `reset`, `getcw`, `getlen`.

- [ ] **Step 1: Write the failing test**

Create `test/kode.test.js`:

```js
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
```

- [ ] **Step 2: Run it and verify it fails**

Run: `node --test test/kode.test.js`
Expected: FAIL with `Cannot find module '../js/kode.js'`.

- [ ] **Step 3: Create `js/kode.js`**

Use the same IIFE pattern and attach `global.Kode`. Copy the C lines from the spec verbatim, splitting them into blocks by operation:

| Block `op` | Lines tagged |
| --- | --- |
| `start` | Prototype and body of `START` / `start` |
| `eop` | Prototype and body of `EOP` / `eop` |
| `inc` | Prototype and body of `INC` / `inc` |
| `adv` | Prototype and body of `ADV` |
| `getcc` | Prototype and body of `GETCC` |
| `getidx` | Prototype and body of `GETIdx` |
| `reset` | Prototype and body of `reset` |
| `getcw` | Prototype and body of `getcw` |
| `getlen` | Prototype and body of `getlen` |
| `null` | Includes, comments, extern declarations, global variables, blank lines |

Each machine has two files: `.h` and `.c`. The `.c` file contains one block:

```js
{ op: null, eop: true, baris: ["#define EOP_SIMBOL '.'"] }
```

No `main`. No code after the last function.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test test/kode.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/kode.js test/kode.test.js
git commit -m "feat: add C source data for code panel"
```

---

### Task 4: Page Shell and Styles

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `fonts/PatrickHand-Regular.ttf`

**Interfaces:**
- Consumes: nothing yet; no script tags in this task.
- Produces: the DOM ids and class names used by Task 5.

- [ ] **Step 1: Copy the local font**

```bash
mkdir -p fonts
cp /tmp/opencode/simulasi-sorting/fonts/PatrickHand-Regular.ttf fonts/
```

If the reference clone is missing, clone it first:

```bash
git clone --depth 1 https://github.com/ianorii/simulasi-sorting.git /tmp/opencode/simulasi-sorting
```

- [ ] **Step 2: Write `index.html` with these exact ids**

Use the reference's header, tab, card, and footer structure. Required ids:

- Tabs: `tab-karakter`, `tab-kata`
- Setup: `pita-input` (textarea, 2 rows, value `jend  ela.`), `pita-hitung` (output), `eop-input` (input, 1 character, value `.`), `preset-1`, `preset-2`, `preset-3`, `btn-terapkan`, `pesan-galat`
- Tape: `pita` (container), `status-pita`, `legenda`
- Buttons: `tombol-mesin` (empty container)
- Right column: `panel-var`, `panel-stat`, `penjelasan`, `log` (an `<ol>`)
- Code: `kartu-kode` (`<details>`), `kode` (container inside it)

Required structure:

```text
header.atas
nav.tablist
section.kartu (setup)
main.tata
  div.kolom-kiri
    section.kartu (pita)
    section.kartu (tombol)
  div.kolom-kanan
    section.kartu (variabel)
    section.kartu (penghitung)
    section.kartu (penjelasan)
    section.kartu (log)
details.kartu#kartu-kode
footer
```

Static copy:
- Title: `Simulasi Mesin Abstrak`.
- Subtitle: `Tekan tombol mesin, lihat pita, variabel, dan kodenya bergerak.`
- Setup card title: `Data`.
- Tape card title: `Pita`.
- Buttons card title: `Tombol Mesin`.
- Variables card title: `Variabel`.
- Counters card title: `Penghitung`.
- Explanation card title: `Penjelasan`.
- Log card title: `Log Operasi`.
- Code card summary: `Kode mesin (C)`.
- Initial explanation: `Tekan START untuk menyalakan mesin.`
- Initial tape status: `Belum START.`
- Tape placeholder: `Pita akan tampil di sini.`
- Footer: `Simulasi Mesin Abstrak · Dasar Pemrograman`.
- Preset labels: `Contoh modul: jend␣␣ela.`, `Contoh modul: i am nice.`, `Kalimat panjang`.
- `pesan-galat` starts with `hidden` and `role="alert"`.
- Put a one-line note inside the code card: `Simbol EOP memakai makro EOP_SIMBOL agar bisa diganti dari antarmuka.`
- No `<script>` tags yet.

- [ ] **Step 3: Write `css/style.css`**

Start from the reference's variables and component patterns:
- `@font-face` for `../fonts/PatrickHand-Regular.ttf`.
- `:root` with `--bg: #FEFDFB`, `--ink: #2B2A26`, `--muted: #6B665B`, `--field: #FFFFFF`, `--border: #2B2A26`, `--primer: #1D4ED8`, `--amber: #F59E0B`, `--merah: #C22E2E`, `--bar-neutral: #E4E2DD`, `--gap: 28px`.
- Body max-width 1280px, 18px Patrick Hand, line-height 1.5.
- Card, tab, button, stat grid, and footer styles follow the reference.

New styles:
- `.tata` is a two-column grid with `minmax(0, 1.6fr) minmax(0, 1fr)` so the tape can scroll without stretching the page.
- `.pita` is `display:flex; gap:4px; overflow-x:auto; padding:4px 0 8px;`.
- `.sel-pita` is a fixed-width cell (at least 34px, 52px tall) with a top index and bottom character, `flex: 0 0 auto`.
- `.sel-pita.aktif`: blue background and white text.
- `.sel-pita.eop`: amber bottom border or background.
- `.sel-pita.lewat`: reduced opacity.
- `.sel-pita.dalam-kata`: light blue background.
- `.sel-pita.setelah-eop`: strongly dimmed/dashed.
- `.sel-pita .spasi`: muted `␣`.
- `.tombol-mesin` is a three-column grid; each button is left-aligned with the operation name on one line and its hint below; minimum height 44px.
- `.var-baris`, `.var-nama`, `.var-nilai`, `.kosong` as in the reference.
- `.log` has no bullets, max-height 180px, `overflow:auto`; entries have a bottom border; the action name is bold.
- `.kartu-kode summary` is a clickable title; `.berkas-kode h3` is small; `.kode-teks` scrolls horizontally and uses a monospace stack; `.baris-kode` is a block with `white-space: pre`; `.baris-kode.aktif` uses an amber background and a left accent.
- `.pita-hitung.lewat` turns red.
- Under 900px: `.tata` becomes one column and `.tombol-mesin` becomes two columns.
- Focus-visible outlines are visible on tabs and buttons.

Do not hide page overflow as a workaround; fix the grid with `min-width: 0` and let only the tape scroll.

- [ ] **Step 4: Check the shell at desktop and mobile widths**

Run:

```bash
firefox --headless --new-instance --window-size=1280,900 \
  --screenshot /tmp/opencode/mesin-1280.png \
  "file:///home/beilua/PROJECTS/PROJECTS/ASPRAK/web-mesin-abstrak/index.html"

firefox --headless --new-instance --window-size=360,800 \
  --screenshot /tmp/opencode/mesin-360.png \
  "file:///home/beilua/PROJECTS/PROJECTS/ASPRAK/web-mesin-abstrak/index.html"
```

Read both screenshots. Expected: header, tabs, setup card, tape card, two-column layout at 1280px, one column at 360px, no horizontal page scroll, code card closed.

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css fonts/PatrickHand-Regular.ttf
git commit -m "feat: add page shell and tape styles"
```

---

### Task 5: Rendering and Machine Controls

**Files:**
- Create: `js/render.js`
- Create: `js/app.js`
- Modify: `index.html` (add script tags at the end of `<body>`)

**Interfaces:**
- Consumes: `Mesin` from Tasks 1–2, `Kode` from Task 3, and the DOM ids from Task 4.
- Produces:
  - `Render.pita(el, state, jenis)`
  - `Render.panelVar(el, baris)`
  - `Render.panelStat(el, baris)`
  - `Render.legenda(el, daftar)`
  - `Render.log(el, entri)`
  - `Render.kode(el, berkas, opAktif, eop)`

- [ ] **Step 1: Implement `js/render.js`**

Use the IIFE pattern and attach `global.Render`.

- `pita(el, state, jenis)`: clear the container; for each character, create a cell with the index, the character (` ` renders as `␣`), and classes `aktif`, `eop`, `lewat`, `dalam-kata`, `setelah-eop` as defined. Word band: when `jenis === 'kata'`, `state.started`, and `state.cw` is non-empty, add `dalam-kata` to indices `state.idx - state.wlen` through `state.idx - 1`. Mark cells after the first EOP with `setelah-eop`. Add an aria-label per cell. Show the placeholder text when the tape is empty.
- `panelVar(el, baris)` and `panelStat(el, baris)`: `baris` is an array of `[label, value]`; render `-` for `null`, `(kosong)` is passed in as the value for an empty CW by the app.
- `legenda(el, daftar)`: `daftar` is `[key, label]`; render a swatch and label.
- `log(el, entri)`: `entri` is `[action, text]`; render `<li><b>action</b> text</li>`. Empty log renders `Belum ada operasi.` as a muted list item.
- `kode(el, berkas, opAktif, eop)`: clear; for each file, create a section with the filename and a `<pre>` of line spans. A line whose block op equals `opAktif` gets `aktif`. If `blok.eop` is true, replace the literal `'.'` in the line with the current EOP, escaping `'` as `\'` and `\` as `\\` for C.

- [ ] **Step 2: Implement `js/app.js`**

Metadata:

```js
const MESIN = {
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
```

State:
- `aktif` is `'karakter'` or `'kata'`.
- Each machine owns `{ tape, eop, mesin, log, opAktif, penjelasan }`.
- Initial tapes: `jend  ela.` and `i am nice.`; initial EOP `.`; initial `penjelasan`: `Tekan START untuk menyalakan mesin.`
- Presets: `[['Contoh modul: jend␣␣ela.', 'jend  ela.'], ['Contoh modul: i am nice.', 'i am nice.'], ['Kalimat panjang', 'Tindakan sang kikan akan dikenakan hukuman.']]`.

Behavior:
- `tampilkan()` renders the active machine: tape, legend, variables, counters, log, code, explanation, tape status, and disabled buttons.
- Build machine buttons with `data-aksi` and update `disabled` by querying `#tombol-mesin [data-aksi]`, so rebuilding them on tab switch cannot leave stale references.
- Variables: karakter shows `idx`, `cc`, `EOP`, `Status`; kata shows `idx`, `CW`, `wlen`, `EOP`, `Status`. Before START, `idx`/`cc`/`cw`/`wlen` show `-`; empty CW after START shows `(kosong)`.
- Status: `Belum mulai`, `Berjalan`, or `EOP tercapai`.
- Counters: karakter `Langkah, INC, ADV, GET`; kata `Langkah, INC, RESET, Kata`.
- Tape status: for karakter, `idx N · CC 'x' · ...`; for kata, `idx N · CW "x" · panjang N · ...`.
- `jalankan(aksi)` calls the active reducer. On success, store the new state, set `opAktif = aksi.toLowerCase()`, and append `[aksi, keterangan]` to the log. On `START`, clear the log first. On failure, show the message in the explanation and do nothing.
- Disabled buttons: START always enabled. Before START, all other buttons disabled. At EOP, INC/ADV disabled (karakter) and INC disabled (kata); RESET stays enabled; reads and EOP stay enabled.
- `terapkan()` reads the exact textarea value and EOP, calls `Mesin.validasi`, and on error shows `#pesan-galat` without changing the running machine. On success, replace that machine's tape, EOP, initial state, empty log, and clear the highlighted op; hide the error.
- Tab switch updates the active machine, fills the tape/EOP fields from that machine's applied values, rebuilds the machine buttons, hides the error, and renders. Unapplied edits are discarded.
- Preset buttons fill the fields and call `terapkan()` immediately.
- The tape character counter updates on input and turns red above 149.
- Use `aria-live="polite"` on the explanation.
- Wire tabs, presets, Terapkan, machine buttons, and `DOMContentLoaded`.

- [ ] **Step 3: Add script tags and run the logic tests**

At the end of `<body>`, in this order:

```html
<script src="js/mesin.js"></script>
<script src="js/kode.js"></script>
<script src="js/render.js"></script>
<script src="js/app.js"></script>
```

Run: `node --test test/mesin.test.js test/kode.test.js`
Expected: PASS.

- [ ] **Step 4: Check the initial render**

```bash
firefox --headless --new-instance --window-size=1280,900 \
  --screenshot /tmp/opencode/mesin-jadi-1280.png \
  "file:///home/beilua/PROJECTS/PROJECTS/ASPRAK/web-mesin-abstrak/index.html"
```

Read the screenshot. Expected: tape cells for `jend  ela.` with indices, only START enabled, variables showing `-`, counters 0, log empty state, code card closed.

- [ ] **Step 5: Verify the manual flows**

In a browser at `index.html`, check:

1. **Karakter awal:** tab Karakter active, tape `jend  ela.`, START enabled, INC/ADV/GET/EOP disabled, `idx` `-`, `cc` `-`.
2. **START:** idx 0, CC `j`, cell 0 active, code START highlighted, Langkah 1.
3. **INC four times:** idx 4, CC space (`␣` cell active), INC 4, Langkah 5.
4. **START again:** counters reset, log only holds the new START, idx 0.
5. **ADV demo:** START, INC three times (idx 3 `d`), ADV → idx 6 `e`, ADV 1, explanation mentions 2 spaces skipped.
6. **EOP:** START, INC nine times → idx 9 `.`, EOP reached, INC/ADV disabled; GET CC shows `.`; GET IDX shows 9; EOP shows 1.
7. **Reads:** GET CC and GET IDX do not move the cell or increase Langkah; GET increments GET.
8. **Code panel:** open it; two files are visible; `int main` is absent; GET CC highlights only `GETCC`; EOP highlights only `EOP`; the define line shows the active symbol.
9. **Invalid EOP:** set EOP `!` while the tape still ends with `.`, press Terapkan → error appears, the current machine state does not change.
10. **Custom EOP:** tape `halo!`, EOP `!`, Terapkan, START, INC four times → idx 4 `!`, EOP reached; define line shows `#define EOP_SIMBOL '!'`.
11. **Quote EOP:** tape `halo'`, EOP `'`, Terapkan → no crash; code line escapes the quote; START reaches EOP.
12. **Kata awal:** switch tab; tape `i am nice.`; START → CW `i`, len 1, idx 1 (space cell active, word cell 0 in the word band).
13. **Kata INC:** INC → CW `am`, len 2, idx 4; INC → CW `nice`, len 4, idx 9 EOP; INC disabled.
14. **RESET:** at `nice`/idx 9, RESET → CW `(kosong)`, len 0, idx stays 9, RESET 1; GET CW returns empty, GET LEN 0.
15. **Kata spacing:** tape `   i   am.` → START skips leading spaces to `i`; INC skips three spaces to `am`; state matches the spec.
16. **Long tape:** paste 149 characters including EOP; counter shows 149/149; tape scrolls horizontally; the page itself does not scroll horizontally.
17. **Mobile:** at 360px, layout is one column, machine buttons are two columns, nothing overflows the page.
18. **Keyboard:** Tab reaches every enabled button, Enter activates it, focus is visible; explanation updates.

- [ ] **Step 6: Commit**

```bash
git add index.html js/render.js js/app.js
git commit -m "feat: wire machine controls and rendering"
```

---

### Task 6: Documentation and Final Acceptance

**Files:**
- Create: `README.md`
- Create: `docs/adr/0001-antarmuka-mesin-manual.md`
- Verify: `GLOSSARY.md`, `docs/specs/2026-11-19-simulasi-mesin-abstrak.md`

**Interfaces:**
- Consumes: the finished app.
- Produces: usage and design documentation.

- [ ] **Step 1: Write `README.md`**

Include:
- Title and one-paragraph description.
- How to run: open `index.html`, no server, no internet.
- Two machines and a table of their buttons.
- Tape/EOP rules: 1–149 characters, EOP single visible character and must exist, spaces matter, no newline.
- A short table of the machine semantics or a link to the spec.
- File map: `js/mesin.js`, `js/kode.js`, `js/render.js`, `js/app.js`, `css/style.css`, `test/`.
- Tests: `node --test test/mesin.test.js test/kode.test.js`.
- Design decisions: manual operations only, no undo/playback, START restarts, per-machine tape, code panel shows C without `main`, EOP uses `EOP_SIMBOL`.
- Limit: the simulator uses JS strings, so words over 50 characters are not truncated even though the displayed C uses `cw[51]`.
- Font and theme.

- [ ] **Step 2: Write the ADR**

Create `docs/adr/0001-antarmuka-mesin-manual.md`:

```md
# Antarmuka mesin manual tanpa undo

Status: accepted

Karena pengguna harus merasakan mesin abstrak yang sebenarnya, setiap kemajuan hanya terjadi saat tombol START, INC, ADV, atau RESET ditekan; tidak ada langkah yang dihitung di muka, tombol putar, scrub, atau undo. Konsekuensinya, kesalahan klik diperbaiki dengan START dan log hanya menjadi catatan, tetapi setiap tombol memetakan satu-satu ke operasi C yang ditampilkan dan state mesin tetap dapat diuji sebagai reducer murni.
```

- [ ] **Step 3: Run the complete test suite**

Run:

```bash
node --test test/mesin.test.js test/kode.test.js
```

Expected: PASS, with no skipped tests.

- [ ] **Step 4: Verify the app is fully local**

Run:

```bash
grep -R "http" index.html css js || true
```

Expected: no runtime URLs (a comment containing a URL is acceptable only if it is not loaded).

- [ ] **Step 5: Final browser check**

Open `index.html` from `file://`, repeat the Task 5 checklist, and confirm:
- No console errors.
- Both tabs render.
- The code panel highlights the executed function.
- Tape, variables, counters, log, and explanation stay in sync.
- 360px layout has no page-level horizontal scroll.

- [ ] **Step 6: Confirm the working tree is clean and commit**

```bash
git add README.md docs/adr/0001-antarmuka-mesin-manual.md
git commit -m "docs: add README and manual interface ADR"
git status --short
```

Expected: no output from `git status --short`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-11-19-simulasi-mesin-abstrak.md`. Please review the plan. Does it capture what you want?

Recommended execution: **Native** — one session implements all six tasks, because the tasks share tight interfaces (`Mesin`, `Render`, DOM ids) and the whole app is small enough to hold in one context. I can then run the logic tests and take headless screenshots; the final click-through needs your browser.

Confirm the plan and I will start with Task 1.
