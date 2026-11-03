# 📋 PANDUAN INSTALASI — Travelpedia

Aplikasi manajemen bisnis travel: **frontend di GitHub Pages** + **Google Apps Script sebagai REST API** (database Google Sheets, berkas di Google Drive, email lewat Gmail).

```
GitHub Pages (index.html, css/, js/)  ──fetch POST text/plain──►  Apps Script Web App (Kode.gs)
                                                                      │
                                                    Google Sheets · Google Drive · Gmail
```

Ada **3 bagian**: (A) Backend Apps Script → (B) isi `GAS_URL` → (C) GitHub Pages. Kerjakan berurutan.

---

## A. BACKEND — Google Apps Script

Berkas yang dipakai: **`Kode.gs`** dan **`appsscript.json`** (dikirim terpisah, *bukan* di dalam ZIP frontend).

1. Buka **https://script.google.com** → **Proyek baru**. Beri nama `Travelpedia API`.
2. Rename file `Code.gs` → `Kode`, hapus isinya, lalu **tempel seluruh isi `Kode.gs`**. Klik 💾 Simpan.
3. (Disarankan) Pasang manifest zona waktu:
   - ⚙️ **Setelan Proyek** → centang **"Tampilkan file manifes appsscript.json di editor"**.
   - Buka `appsscript.json` di editor → ganti isinya dengan isi `appsscript.json` yang diberikan → Simpan.
4. **Jalankan `setupAppEnvironment()` — HANYA SEKALI**
   - Dropdown fungsi (di sebelah tombol ▶ Jalankan) → pilih `setupAppEnvironment` → ▶ **Jalankan**.
   - Klik **Tinjau izin** → pilih akun Google → *Advanced / Lanjutan* → **Buka Travelpedia API (tidak aman)** → **Izinkan**. (Peringatan ini normal untuk skrip buatan sendiri.)
   - Buka **Log eksekusi**. Pastikan muncul ✅ dan **catat akun admin awal**:
     ```
     🔐 AKUN ADMIN AWAL
        Email     : email-google-anda@gmail.com
        Kata sandi: Tp-xxxxxxxx
     ```
   - Cek Google Drive: folder **📁 Travelpedia** berisi spreadsheet **🗃️ Database — Travelpedia** + subfolder Customer, Bukti Transfer, Trip, Karyawan, Invoice & Kuitansi (PDF), Slip Gaji (PDF), Backup.
   - ⚠️ **Jangan jalankan `setupAppEnvironment()` dua kali** (akan ditolak otomatis).
5. **(Opsional) Data contoh untuk uji coba:** jalankan `seedDemoData()` sekali. Ini membuat 5 trip, jadwal, customer, booking, supplier, karyawan, dan akun karyawan contoh:
   `siti.rahma@travelpedia.id` / `Karyawan123`. Lewati langkah ini untuk database produksi yang bersih.
6. **(Disarankan) Backup otomatis mingguan:** jalankan `installBackupTrigger()` sekali (Minggu 02:00 → folder Backup).
7. **Deploy sebagai Web App**
   - **Terapkan → Deployment baru** → ⚙️ pilih jenis **Aplikasi web**.
   - *Jalankan sebagai*: **Saya** · *Yang memiliki akses*: **Siapa saja**.
   - **Terapkan** → **salin URL** yang berakhiran **`/exec`**.
   - Tes cepat: buka URL itu di browser → harus muncul JSON `{"success":true,"data":{"app":"Travelpedia",...,"ready":true}}`.

> 🔒 "Siapa saja" hanya berarti URL bisa dipanggil. Semua data tetap dilindungi login + token sesi + pengecekan peran **di server**. ID spreadsheet, folder, rahasia sesi, dan pepper sandi tersimpan di **Script Properties**, tidak di kode/frontend.

### Memperbarui backend nanti (URL tetap sama)
Setelah mengedit `Kode.gs`: **Terapkan → Kelola deployment** → ✏️ Edit → *Versi*: **Versi baru** → **Terapkan**.
(Jangan pilih "Deployment baru" — itu membuat URL baru yang berbeda.)

---

## B. HUBUNGKAN FRONTEND KE BACKEND

Ekstrak `travelpedia-frontend.zip`. Hasilnya satu folder, misalnya:

```
travelpedia-frontend/        ← INI folder proyek (root repository GitHub)
├── index.html
├── README.md
├── PANDUAN-INSTALASI.md
├── css/
│   └── style.css
└── js/
    ├── config.js            ← EDIT FILE INI
    ├── icons.js
    ├── api.js
    ├── ui.js
    ├── app.js
    ├── pages-ops.js
    └── pages-admin.js
```

Buka **`js/config.js`** dengan Notepad / VS Code, ganti baris:

```js
GAS_URL: 'https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT_ANDA/exec',
```

dengan URL `/exec` dari langkah A.7. Simpan.

---

## C. DEPLOY KE GITHUB PAGES (lewat terminal)

> Gunakan terminal (`git push`), **jangan** "Add file → Upload files" di web GitHub — cara itu meratakan folder `css/` dan `js/` sehingga tampilan rusak (CSS/JS 404).

**C1. Install Git** — Windows: https://git-scm.com/download/win (pengaturan default). Cek: `git --version`

**C2. Akun GitHub** — daftar di https://github.com. Username Anda menjadi bagian URL: `username.github.io`.

**C3. Identitas Git (sekali saja per komputer)**
```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

**C4. Buat repository** — github.com → **+** → **New repository** → nama mis. `travelpedia` → **Public** → **jangan** centang README / .gitignore / license → **Create repository**.

**C5. Masuk ke folder yang BENAR & periksa isinya**

Folder kerjanya adalah **folder hasil ekstraksi ZIP yang langsung berisi `index.html`** (contoh di atas: `travelpedia-frontend`). Jangan naik satu level ke atas, jangan masuk ke `css/` atau `js/`.

Cara cepat di Windows: buka folder itu di File Explorer → klik address bar → ketik `powershell` → Enter.

```powershell
dir
```
Wajib terlihat: `index.html`, folder `css`, folder `js`. Kalau `index.html` tidak terlihat di daftar teratas, **berhenti** — Anda berada di folder yang salah.

**C6. Push pertama** (jalankan satu per satu dari folder di atas)
```bash
git init
git add .
git commit -m "Upload pertama Travelpedia"
git branch -M main
git remote add origin https://github.com/USERNAME/travelpedia.git
git push -u origin main
```
Saat diminta **Password**, tempel **Personal Access Token**, bukan sandi akun GitHub. Layar memang tidak menampilkan karakter apa pun saat menempel — itu normal, tekan Enter.

Membuat token: https://github.com/settings/tokens → **Generate new token (classic)** → centang **repo** → Generate → salin `ghp_...` (hanya tampil sekali).

**C7. Aktifkan Pages** — repo → **Settings** → **Pages** → Source **Deploy from a branch** → Branch **main** / **(root)** → **Save** → centang **Enforce HTTPS**. Tunggu 1–2 menit:
`https://USERNAME.github.io/travelpedia/`

**C8. Update berikutnya** (dari folder yang sama)
```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```
Tampilan masih versi lama? Tekan **Ctrl+Shift+R**.

---

## D. UJI COBA SETELAH ONLINE

1. Buka URL GitHub Pages → halaman login muncul.
2. Login dengan akun admin awal (A.4) → **segera ganti sandi** di menu *Profil & Akun*.
3. *Manajemen Pengguna* → buat akun karyawan. *Data Karyawan* → tambah karyawan & **tautkan ke akun login** (wajib agar karyawan bisa melihat slip gajinya).
4. *Pengaturan Sistem* → isi identitas perusahaan, rekening, penandatangan dokumen.
5. Alur uji utama: **Trip & Harga** (tambah trip + varian harga) → **Jadwal** (tambah batch) → **Customer** → **Booking Baru** (3 langkah, catat DP) → **Detail Booking** (catat pelunasan → status Lunas) → **Cetak Invoice** (unduh PDF/kirim email) → cek Google Sheets & folder Drive.
6. Uji hak akses: login sebagai karyawan → menu Administrasi tidak tampil; membuka `#/finance` langsung ditolak.
7. Chrome DevTools (F12) → tab **Console** & **Network** → pastikan tidak ada error CORS.

---

## E. TROUBLESHOOTING

| Gejala | Penyebab & solusi |
|---|---|
| "GAS_URL belum diisi di js/config.js" | Isi `GAS_URL` (bagian B), lalu `git add . && git commit -m "config" && git push` |
| "Tidak dapat terhubung ke server" | URL salah / bukan `/exec`, atau akses deployment bukan **Siapa saja** |
| "Server belum di-setup" | `setupAppEnvironment()` belum dijalankan / gagal di tengah — cek Log eksekusi |
| Perubahan `Kode.gs` tidak berpengaruh | Belum membuat **Versi baru** di *Kelola deployment* |
| "Sesi berakhir" terus-menerus | Normal setelah ganti sandi / logout. Lama sesi diatur di Pengaturan (`SESI_JAM`) |
| Lupa sandi admin | Di editor Apps Script, isi `EMAIL` dalam fungsi `resetAdminPassword()` lalu jalankan; sandi baru tampil di Log |
| Email tidak terkirim | Kuota Gmail harian habis (±100/hari akun biasa) — lihat sisa kuota di menu Pengaturan |
| Situs 404 | `index.html` tidak berada di root repo — lihat C5, push ulang dari folder yang benar |
| Halaman tanpa warna/tata letak | Folder `css/` & `js/` tidak ikut / rata di root — gunakan `git push`, bukan upload web |
| Data tidak sama dengan Sheets setelah diedit manual | Data master di-cache 10 menit. Sebaiknya ubah data lewat aplikasi |

---

## F. CATATAN TEKNIS

- **Hak akses (RBAC)** divalidasi di server untuk setiap aksi. Karyawan: lihat/tambah/ubah customer, booking, jadwal, pembayaran; lihat trip & supplier; slip gaji miliknya. Admin: semuanya + hapus, keuangan, payroll, pengguna, pengaturan, log.
- **Keamanan**: sandi di-hash (SHA-256 + salt + pepper), token sesi bertanda tangan HMAC dengan masa berlaku, batas 5× gagal login per 10 menit, injeksi rumus Sheets dinetralkan, berkas Drive privat (dibuka lewat server).
- **Konsistensi data**: LockService dipakai untuk kode booking, kuota kursi, pembayaran, dan payroll. Penghapusan memakai *soft delete* (kolom `deleted`).
- **Otomatisasi**: pembayaran customer → masuk Buku Kas (Pemasukan); payroll Final → Buku Kas (Pengeluaran Gaji); status bayar Belum Bayar → DP → Lunas dihitung otomatis.
- **Batas**: unggah berkas maks. 5 MB (foto dikompres otomatis di browser).
