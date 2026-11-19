# Spesifikasi: Simulasi Mesin Abstrak

Tanggal: 2026-11-19
Status: disetujui, siap diimplementasikan

## Tujuan

Situs statis berbahasa Indonesia yang membuat **Mesin Karakter** dan **Mesin Kata** dari Modul 9 dapat dijalankan langsung: pengguna menekan tombol mesin yang sebenarnya, pita bergerak sel demi sel, variabel berubah, dan kode C yang bersesuaian ikut tersorot.

## Ruang Lingkup

Hanya dua mesin:

1. **Mesin Karakter** — START, INC, ADV, GET CC, GET IDX, EOP.
2. **Mesin Kata** — START, RESET, INC, GET CW, GET LEN, EOP.

Tidak termasuk: mesin struct/CRUD, makro/const, mode latihan, penyimpanan riwayat, undo, autoplay, atau animasi terjadwal.

## Prinsip Interaksi

- Mesin bergerak **hanya** saat tombol ditekan. Tidak ada daftar langkah yang dihitung di muka dan tidak ada tombol Putar/Jeda/Mundur/Scrub.
- **START** selalu boleh ditekan dan memulai ulang dari indeks 0: penghitung, log, dan sorotan kode dikosongkan.
- Operasi baca (GET CC, GET IDX, GET CW, GET LEN, EOP) menampilkan hasil tanpa memindahkan posisi.
- Tombol yang tidak valid dinonaktifkan. Reducer tetap menolak aksi tidak valid (jaga-jaga terhadap klik ganda atau pemanggilan langsung).
- Log operasi bersifat catatan saja. Setiap START memulai log baru.
- Tidak ada undo. Kesalahan klik diperbaiki dengan START.

## Pita dan EOP

- Pita adalah teks 1–149 karakter. Spasi adalah karakter biasa dan bermakna.
- Pita tidak boleh berisi baris baru.
- EOP adalah tepat satu karakter terlihat; spasi/karakter putih tidak boleh.
- EOP wajib muncul di pita. Jika tidak, Terapkan menampilkan galat dan mesin yang sedang berjalan tidak berubah.
- Karakter setelah EOP pertama diabaikan; mesin berhenti di EOP pertama.
- EOP dapat diganti pengguna (misalnya `.`, `!`, `;`, `#`).
- Tiap mesin menyimpan pita, EOP, dan state-nya sendiri. Berpindah tab tidak menghapus kemajuan mesin lain.
- Perubahan kolom pita/EOP baru berlaku setelah **Terapkan**. Berpindah tab memuat nilai yang sudah diterapkan; ketikan yang belum diterapkan hilang.
- Contoh awal: karakter `jend  ela.` (dua spasi, seperti gambar modul), kata `i am nice.`.
- Tiga preset mengisi kolom dan langsung menerapkan: `jend  ela.`, `i am nice.`, dan satu kalimat panjang.

## State dan Semantik

State awal (sebelum START): `idx = -1`, `cc = null` (karakter) atau `cw = null` (kata), `started = false`, `selesai = false`, semua penghitung 0.

`selesai` berarti sel yang ditunjuk saat ini adalah EOP.

### Mesin Karakter

| Aksi | Syarat | Efek |
| --- | --- | --- |
| START | selalu | `idx = 0`; `cc = pita[0]`; `started = true`; `langkah++`; `selesai = cc === EOP` |
| INC | started dan belum selesai | `idx++`; `cc = pita[idx]`; `hitInc++`; `langkah++`; `selesai` diperbarui |
| ADV | started dan belum selesai | `idx++`; `cc = pita[idx]`; selama `cc === ' '` maju terus; `hitAdv++`; `langkah++`; `selesai` diperbarui |
| GET CC | started | hasil `cc`; `hitGet++` |
| GET IDX | started | hasil `idx`; `hitGet++` |
| EOP | started | hasil `1` jika `cc === EOP`, selain itu `0` |

ADV selalu maju satu sel lebih dulu, baru melewati spasi berikutnya. Jika mulai dari `d` pada indeks 3, hasilnya `e` pada indeks 6.

### Mesin Kata

| Aksi | Syarat | Efek |
| --- | --- | --- |
| START | selalu | `idx = 0`; `wlen = 0`; `cw = ''`; lewati spasi; salin karakter sampai spasi/EOP; `started = true`; `langkah++`; `hitKata++` jika `cw` tidak kosong; `selesai` diperbarui |
| INC | started dan belum selesai | `wlen = 0`; `cw = ''`; lewati spasi; salin kata berikutnya sampai spasi/EOP; `hitInc++`; `langkah++`; `hitKata++` jika `cw` tidak kosong; `selesai` diperbarui |
| RESET | started | `cw = ''`; `wlen = 0`; `hitReset++`; `langkah++`; `idx` tidak berubah |
| GET CW | started | hasil `cw`; `hitGet++` |
| GET LEN | started | hasil `wlen`; `hitGet++` |
| EOP | started | hasil `1` jika `pita[idx] === EOP`, selain itu `0` |

Setelah START/INC, `idx` menunjuk pembatas setelah kata (spasi atau EOP), bukan huruf terakhir. Ini disengaja dan harus terlihat di pita.

Jika INC dijalankan ketika hanya tersisa spasi lalu EOP, CW menjadi kosong, `wlen = 0`, dan `selesai = true`.

### Penghitung

- Karakter: Langkah, INC, ADV, GET.
- Kata: Langkah, INC, RESET, Kata.
- Langkah = START/INC/ADV (karakter) atau START/INC/RESET (kata).
- GET = GET CC/GET IDX (karakter) atau GET CW/GET LEN (kata).
- Kata = jumlah kata tidak kosong yang pernah dimuat.
- EOP tidak menambah penghitung; ia hanya membaca.

## Tampilan

- Tab: **Mesin Karakter** dan **Mesin Kata**.
- Kartu Data: textarea pita (2 baris), penghitung karakter `n/149`, input EOP (1 karakter), tiga tombol preset, tombol **Terapkan**, pesan galat.
- Pita: deret sel dengan indeks di atas dan karakter di bawah. Spasi digambar `␣`. Kelas visual: sel aktif, EOP, sudah dilewati, dan (mesin kata) kata aktif. Pita panjang menggulir horizontal tanpa membuat halaman menggulir horizontal.
- Tombol mesin: nama operasi + keterangan singkat, minimum 44px, dinonaktifkan sesuai state.
- Panel kanan: Variabel (`idx`, `cc`/`cw`, `wlen`, EOP, status), Penghitung, Penjelasan aksi terakhir (aria-live), dan Log operasi.
- Baris status di bawah pita merangkum posisi: karakter (`idx`, CC, status EOP) atau kata (`idx`, CW, panjang, status EOP).
- Kartu **Kode mesin (C)** selebar penuh di bawah, tertutup secara bawaan. Menampilkan `mesinkarakter.h/.c` atau `mesinkata.h/.c`, tanpa `main`. Fungsi yang baru dijalankan disorot; baris `#define EOP_SIMBOL` mengikuti EOP yang dipakai.
- Tata letak dua kolom di atas 900px, satu kolom di bawahnya. Tidak ada gulir horizontal halaman pada lebar 360px.
- Gaya mengikuti repo referensi: latar krem `#FEFDFB`, garis hitam, aksen biru `#1D4ED8`, font Patrick Hand lokal.

## Kode C yang Ditampilkan

Satu-satunya perubahan dari modul: pengecekan EOP memakai makro `EOP_SIMBOL` agar simbol dapat diganti dari antarmuka. `main` tidak ditampilkan karena tombol manual menggantikannya.

### `mesinkarakter.h`

```c
#include <string.h>

// variabel global
extern int idx;
extern char cc;

// mulai dan akhir
void START(char pita[]);
int EOP();

// memajukan pita
void INC(char pita[]);
void ADV(char pita[]);

// mengambil atribut
char GETCC();
int GETIdx();
```

### `mesinkarakter.c`

```c
#include "mesinkarakter.h"

// Simbol EOP dapat diganti dari antarmuka.
#define EOP_SIMBOL '.'

int idx;
char cc;

void START(char pita[]){
    idx = 0;
    cc = pita[idx];
}

int EOP(){
    if(cc == EOP_SIMBOL){
        return 1;
    }
    else{
        return 0;
    }
}

void INC(char pita[]){
    idx++;
    cc = pita[idx];
}

void ADV(char pita[]){
    idx++;
    cc = pita[idx];

    while((cc == ' ') && (EOP() == 0)){
        idx++;
        cc = pita[idx];
    }
}

char GETCC(){
    return cc;
}

int GETIdx(){
    return idx;
}
```

### `mesinkata.h`

```c
#include <stdio.h>
#include <string.h>

extern int idx;
extern int wlen;
extern char cw[51];

void start(char pita[]);
void reset();
void inc(char pita[]);
int eop(char pita[]);
char* getcw();
int getlen();
```

### `mesinkata.c`

```c
#include "mesinkata.h"

// Simbol EOP dapat diganti dari antarmuka.
#define EOP_SIMBOL '.'

int idx;
int wlen;
char cw[51];

void start(char pita[]){
    idx = 0;
    wlen = 0;

    while (pita[idx] == ' '){
        idx++;
    }

    while ((pita[idx] != ' ') && (eop(pita) == 0)){
        cw[wlen] = pita[idx];
        wlen++;
        idx++;
    }
    cw[wlen] = '\0';
}

void reset(){
    wlen = 0;
    cw[wlen] = '\0';
}

int eop(char pita[]){
    if(pita[idx] == EOP_SIMBOL){
        return 1;
    }
    else{
        return 0;
    }
}

void inc(char pita[]){
    wlen = 0;

    while (pita[idx] == ' '){
        idx++;
    }

    while ((pita[idx] != ' ') && (eop(pita) == 0)){
        cw[wlen] = pita[idx];
        wlen++;
        idx++;
    }
    cw[wlen] = '\0';
}

char* getcw(){
    return cw;
}

int getlen(){
    return wlen;
}
```

## Batasan Teknis

- HTML/CSS/JS murni. Tanpa framework, build, CDN, atau jaringan.
- Harus berjalan dari `file://` dengan membuka `index.html`.
- Font Patrick Hand lokal (SIL OFL) disalin dari repo referensi.
- Tidak ada dependensi runtime. Pengujian memakai test runner bawaan Node.
- Semua teks, penjelasan, dan komentar kode berbahasa Indonesia.

## Catatan Implementasi

- Reducer mesin murni: menerima state, mengembalikan state baru; state masukan tidak diubah.
- Simulator memakai string JavaScript, jadi kata lebih dari 50 karakter tidak terpotong walau kode C memakai `cw[51]`.
- `idx` boleh melewati 9; tampilan indeks memakai lebar sel yang tetap dan pita menggulir.
- Karakter `'` atau `\` sebagai EOP harus di-escape saat ditampilkan di baris `#define`.

## Kriteria Terima

1. `node --test test/mesin.test.js test/kode.test.js` lulus.
2. Semua alur manual pada rencana implementasi berperilaku sesuai tabel semantik.
3. Tidak ada galat konsol saat halaman dibuka dan saat tombol ditekan.
4. Pita 149 karakter, pita hanya EOP, spasi pembuka/berulang, dan kata panjang tidak merusak tampilan atau state.
5. Tampilan tetap terbaca pada lebar 360px tanpa gulir horizontal halaman.
