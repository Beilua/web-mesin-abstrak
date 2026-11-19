# Simulasi Mesin Abstrak

Konteks pembelajaran Mesin Abstrak dari Modul 9: mesin yang membaca pita karakter atau pita kata melalui tombol yang terbatas.

## Language

**Mesin abstrak**:
Model komputasi teoretis yang hanya dapat diakses melalui operasi yang disediakan, tanpa menyentuh state internal secara langsung.
_Avoid_: simulator, emulator

**Pita**:
Deretan karakter yang dibaca mesin, termasuk spasi, dengan posisi dihitung mulai 0 dan diakhiri satu sel EOP.
_Avoid_: tape, string, input

**Sel**:
Satu posisi pada pita yang berisi satu karakter.
_Avoid_: kotak, indeks

**CC (Current Character)**:
Karakter pada sel yang sedang ditunjuk mesin karakter.
_Avoid_: current char, karakter aktif

**CW (Current Word)**:
Kata yang sedang dipegang mesin kata.
_Avoid_: current word, kata aktif

**Kata**:
Rangkaian karakter non-spasi yang dibatasi spasi atau EOP.

**EOP (End of Process)**:
Sel penanda akhir pita; mesin berhenti ketika sel yang ditunjuk berisi simbol EOP.
_Avoid_: EOF, akhir string

**Mesin karakter**:
Mesin yang membaca pita satu karakter per langkah.

**Mesin kata**:
Mesin yang membaca pita satu kata per langkah.

**START**:
Operasi yang menaruh mesin di awal pita; pada mesin kata sekaligus memuat kata pertama.

**INC**:
Operasi maju; pada mesin karakter maju satu sel, pada mesin kata pindah ke kata berikutnya.
_Avoid_: next

**ADV**:
Operasi mesin karakter yang maju satu sel lalu melewati semua spasi berikutnya.

**RESET**:
Operasi mesin kata yang mengosongkan CW tanpa memindahkan posisi baca.

**GET CC**:
Operasi baca yang mengembalikan CC tanpa memindahkan mesin.

**GET CW**:
Operasi baca yang mengembalikan CW tanpa memindahkan mesin.

**GET LEN**:
Operasi baca yang mengembalikan panjang CW.

**Langkah**:
Satu tekanan tombol yang mengubah state mesin, yaitu START, INC, ADV, atau RESET.
_Avoid_: step, iterasi

**Operasi baca**:
Tekanan tombol yang hanya menampilkan nilai, yaitu GET CC, GET CW, GET LEN, dan EOP, tanpa memindahkan mesin.
