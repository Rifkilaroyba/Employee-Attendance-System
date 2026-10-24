# UI Monitoring Karyawan KCW

Antarmuka Next.js dan TypeScript untuk Sistem Informasi Monitoring Karyawan Outsourcing PT Karunia Cipta Wasantara, mengikuti PRD dan preview desain yang disepakati.

## Menjalankan

```bash
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan terminal. Pemeriksaan tipe menggunakan `npm run typecheck`; build produksi menggunakan `npm run build`.

## Cakupan tahap ini

- Halaman masuk dan akses demo Admin, PIC, dan Karyawan.
- Panel login dua warna dengan navigasi publik Login dan Daftar Akun, serta simulasi lupa kata sandi.
- Tema terang/gelap dengan preferensi tersimpan di browser.
- Dashboard, karyawan, perusahaan klien, penempatan, jadwal, konfigurasi, monitoring, koreksi, laporan, dan pengaturan.
- PIC hanya meninjau data perusahaan contohnya dan memberikan keputusan koreksi dengan catatan.
- Karyawan langsung ke scanner, dengan konteks penempatan dan shift otomatis.
- Simulasi hasil scan QR, termasuk kegagalan, scan berulang, dan shift lintas tengah malam.
- Form koreksi karyawan dan pembaruan status lintas tampilan peran dalam sesi yang sama.
- Ekspor laporan data contoh dalam format CSV.

Masuk menggunakan `admin@example.com`, `pic@example.com`, atau `andi@example.com` dengan sandi demo `demo12345` untuk membuka peran masing-masing. Akun lain dan sandi yang salah ditolak. Pergantian area hanya tersedia bagi Admin; PIC dan Karyawan tetap pada area akunnya. Logout menghapus peran sesi. Pendaftaran dan pemulihan kata sandi hanya simulasi UI; tidak membuat akun atau mengirim email.

Jalankan `npm run test:access` untuk memeriksa pencocokan akun dan matriks akses area. Admin dapat melihat area PIC, tetapi keputusan koreksi tetap khusus akun PIC sesuai PRD.

Ini tahap UI dengan data contoh di memori. Pergantian tema bertahan setelah refresh; perubahan data demo direset setelah refresh. Tidak ada autentikasi sungguhan, database, akses kamera/GPS, atau pencatatan absensi nyata. Pembatasan peran dalam demo merupakan perilaku antarmuka, bukan pengamanan server.

Integrasi backend, MySQL, validasi QR/geofencing, otorisasi server, ekspor Excel, dan pengujian perangkat aktual dilakukan pada tahap berikutnya.
