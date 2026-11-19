# Antarmuka mesin manual tanpa undo

Status: accepted

Karena pengguna harus merasakan mesin abstrak yang sebenarnya, setiap kemajuan hanya terjadi saat tombol START, INC, ADV, atau RESET ditekan; tidak ada langkah yang dihitung di muka, tombol putar, scrub, atau undo. Konsekuensinya, kesalahan klik diperbaiki dengan START dan log hanya menjadi catatan, tetapi setiap tombol memetakan satu-satu ke operasi C yang ditampilkan dan state mesin tetap dapat diuji sebagai reducer murni.
