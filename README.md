# Simulasi Mesin Abstrak

Situs statis berbahasa Indonesia untuk menjalankan **Mesin Karakter** dan **Mesin Kata** dari Modul 9. Pengguna menekan tombol mesin yang sebenarnya, pita bergerak sel demi sel atau kata demi kata, variabel dan penghitung berubah, lalu kode C yang bersesuaian ikut tersorot. Semua berjalan lokal di peramban tanpa server, build, atau jaringan.

## Cara menjalankan

Buka `index.html` langsung di peramban (protokol `file://`). Tidak perlu server, tidak perlu memasang apa pun, dan tidak ada permintaan jaringan. Font piksel Departure Mono sudah disertakan di folder `fonts/`.

## Dua mesin dan tombolnya

Pilih mesin lewat tab **Mesin Karakter** atau **Mesin Kata**. Setiap mesin menyimpan pita, EOP, dan kemajuannya sendiri; berpindah tab tidak menghapus kemajuan mesin lain.

**Mesin Karakter**

| Tombol | Kegunaan |
| --- | --- |
| START | Menaruh mesin di indeks 0 dan memuat CC pertama. Selalu boleh ditekan dan memulai ulang. |
| INC | Maju satu sel, termasuk bila sel berikutnya spasi. |
| ADV | Maju satu sel, lalu melewati semua spasi berikutnya. |
| GET CC | Menampilkan CC tanpa memindahkan mesin. |
| GET IDX | Menampilkan `idx` tanpa memindahkan mesin. |
| EOP | Menampilkan `1` bila CC adalah EOP, selain itu `0`. |

**Mesin Kata**

| Tombol | Kegunaan |
| --- | --- |
| START | Memuat kata pertama; selalu boleh ditekan dan memulai ulang. |
| INC | Pindah ke kata berikutnya. |
| RESET | Mengosongkan CW tanpa memindahkan posisi baca. |
| GET CW | Menampilkan CW tanpa memindahkan mesin. |
| GET LEN | Menampilkan panjang CW (`wlen`). |
| EOP | Menampilkan `1` bila sel yang ditunjuk adalah EOP, selain itu `0`. |

## Aturan pita dan EOP

- Pita berisi 1–149 karakter.
- Spasi adalah karakter biasa dan bermakna; spasi di awal, di tengah, dan berulang ikut dihitung.
- Pita tidak boleh berisi baris baru.
- EOP tepat satu karakter terlihat; spasi atau karakter putih lain tidak boleh.
- EOP wajib ada di dalam pita. Jika tidak, tombol **Terapkan** menampilkan galat dan mesin yang sedang berjalan tidak berubah.
- Karakter setelah EOP pertama diabaikan; mesin berhenti di EOP pertama.
- EOP dapat diganti (misalnya `.`, `!`, `;`, `#`).
- Perubahan kolom pita/EOP baru berlaku setelah **Terapkan**. Ketikan yang belum diterapkan hilang saat berpindah tab.

## Semantik mesin

| Aksi | Mesin Karakter | Mesin Kata |
| --- | --- | --- |
| START | `idx = 0`, `cc = pita[0]`, `langkah++` | `idx = 0`, muat kata pertama, `langkah++`, `hitKata++` bila kata tidak kosong |
| INC | `idx++`, `cc = pita[idx]`, `hitInc++`, `langkah++` | muat kata berikutnya, `hitInc++`, `langkah++`, `hitKata++` bila kata tidak kosong |
| ADV | `idx++` lalu lewati spasi, `hitAdv++`, `langkah++` | — |
| RESET | — | `cw = ''`, `wlen = 0`, `hitReset++`, `langkah++`, `idx` tetap |
| GET | `GET CC` / `GET IDX`, `hitGet++` | `GET CW` / `GET LEN`, `hitGet++` |
| EOP | `1` bila `cc === EOP` | `1` bila `pita[idx] === EOP` |

`selesai` berarti sel yang ditunjuk saat ini adalah EOP. Setelah START/INC pada mesin kata, `idx` menunjuk pembatas setelah kata (spasi atau EOP), bukan huruf terakhir. Tabel lengkap, state awal, dan penghitung ada di [`docs/specs/2026-11-19-simulasi-mesin-abstrak.md`](docs/specs/2026-11-19-simulasi-mesin-abstrak.md).

## Peta berkas

| Berkas | Isi |
| --- | --- |
| `index.html` | Kerangka halaman: tab, kartu data, pita, tombol, panel, dan panel kode. |
| `css/style.css` | Tema pixel art (palet NES, garis hitam tepis, font piksel), dan tata letak responsif. |
| `js/mesin.js` | Reducer murni kedua mesin dan validasi pita/EOP. |
| `js/kode.js` | Sumber C per operasi untuk panel kode. |
| `js/render.js` | Menggambar pita, variabel, penghitung, log, dan sorotan kode. |
| `js/app.js` | Menyambungkan tombol, tab, preset, dan state tiap mesin ke DOM. |
| `test/` | Pengujian reducer dan data kode memakai test runner bawaan Node. |
| `fonts/` | Departure Mono (font piksel lokal) untuk seluruh antarmuka. |

## Pengujian

```bash
node --test test/mesin.test.js test/kode.test.js
```

Tidak ada dependensi; perintah di atas memakai test runner bawaan Node.

## Keputusan desain

- **Operasi manual saja.** Mesin hanya bergerak saat START, INC, ADV, atau RESET ditekan. Tidak ada langkah yang dihitung di muka, tombol putar, scrub, atau animasi terjadwal.
- **Tanpa undo dan tanpa playback.** Kesalahan klik diperbaiki dengan START; log hanya catatan.
- **START selalu memulai ulang** dari indeks 0 dan mengosongkan penghitung, log, serta sorotan kode.
- **Pita per mesin.** Tiap mesin menyimpan pita, EOP, state, log, dan sorotannya sendiri.
- **Panel kode menampilkan C tanpa `main`**, karena tombol manual menggantikan `main`.
- **EOP memakai `EOP_SIMBOL`.** Satu-satunya perubahan dari modul: pengecekan EOP memakai makro agar simbol dapat diganti dari antarmuka; baris `#define` mengikuti EOP yang dipakai.

## Batasan

Simulator memakai string JavaScript, jadi kata lebih dari 50 karakter **tidak** terpotong walau kode C yang ditampilkan memakai `cw[51]`. Batas 50 karakter itu hanya berlaku pada kode C asli.

## Font dan tema

Seluruh antarmuka memakai font piksel lokal **Departure Mono** (`fonts/DepartureMono-Regular.otf`); Patrick Hand tidak lagi digunakan. Tema pixel art dengan palet NES terbatas: latar hitam `#000000`, kartu `#212121`, garis hitam tepis, aksen merah `#D00000`, hijau `#00CC00`, dan biru `#0000FF`. Sudut tajam dan bayangan tanpa blur (`image-rendering: pixelated`, `box-shadow` piksel) dipertahankan.
