# ProDo - Manajemen Tugas & Kegiatan

Aplikasi produktivitas statis siap produksi menggunakan Vanilla JavaScript dan Tailwind CSS. ProDo membantu Anda mengelola tugas, target, dan kegiatan dalam satu antarmuka modern — lengkap dengan dashboard analitik, papan Kanban, kalender terpadu, dan sinkronisasi data via **Firebase** (Auth + Firestore).

## Fitur Utama

### Autentikasi (Firebase)
- **Login & Registrasi** dengan email dan password (Firebase Authentication).
- **Data per akun** tersimpan di Cloud Firestore — sinkron antar perangkat/browser.
- **Migrasi otomatis** dari data LocalStorage lama saat login pertama kali.

### Dashboard
- **Statistik Ringkas**: Total tugas, tugas selesai, tugas terlewat, dan streak produktivitas.
- **Visualisasi Chart.js**: Diagram donat status tugas, grafik batang prioritas, dan breakdown per kategori.
- **Progress Target**: Ringkasan semua target beserta progress bar-nya.
- **Ringkasan Kegiatan**: Statistik kegiatan + daftar kegiatan mendatang.

### Manajemen Tugas (Kanban)
- **Papan Kanban 3 Kolom**: *Belum Dimulai*, *Fokus / Hari Ini*, dan *Selesai*.
- **CRUD Lengkap**: Tambah, edit, hapus, dan tandai selesai.
- **Prioritas & Kategori**: Prioritas (rendah/sedang/tinggi) dan kategori warna-warni (preset + color wheel).
- **Jatuh Tempo & Target Terkait**: Setiap tugas bisa memiliki deadline dan dikaitkan ke target.
- **Filter & Pencarian**: Filter dan pencarian real-time.
- **Drag & Drop**: Atur tugas antar kolom dengan Sortable.js (posisi kolom tersimpan).

### Target Tracking
- **Tipe Target**: Harian, mingguan, atau jangka panjang.
- **Progress Otomatis**: Progress target tersinkronisasi dari tugas terkait.
- **Deadline Opsional**: Tampil di sidebar dan kalender.

### Kalender Kegiatan
- **FullCalendar Terintegrasi**: Tampilan bulan, minggu, dan agenda.
- **Tiga Jenis Event**: Tugas, target/deadline, dan kegiatan.
- **Manajemen Kegiatan**: Tambah, edit, dan hapus kegiatan dengan rentang tanggal.

### Motivasi & Pengingat
- **Streak**: Hitung hari beruntun produktif.
- **Nagging Banner**: Peringatan tugas terlewat.
- **Notifikasi Telegram**: Opsional via bot Telegram.

### Pengaturan Data
- **Export & Import JSON**: Cadangkan dan pulihkan data dari Firestore.
- **Hapus Semua Data**: Reset data pengguna aktif di cloud.

## Teknologi

| Kategori | Library / Layanan |
|---|---|
| Styling | Tailwind CSS (CDN), Custom CSS |
| Icons | Lucide Icons (CDN) |
| Tanggal | Day.js (CDN) |
| Drag & Drop | Sortable.js (CDN) |
| Grafik | Chart.js 4 (CDN) |
| Kalender | FullCalendar 6 (CDN) |
| Backend | Firebase Auth + Cloud Firestore |
| Runtime | Vanilla JavaScript (ES6+), HTML5 |

## Setup Firebase

1. Buat proyek di [Firebase Console](https://console.firebase.google.com/).
2. Tambahkan **Web App** → salin konfigurasi SDK.
3. Salin `js/firebase-config.example.js` menjadi `js/firebase-config.js` dan isi nilai `FIREBASE_CONFIG`.
4. **Authentication** → Sign-in method → aktifkan **Email/Password**.
5. **Firestore Database** → buat database (mode production atau test).
6. **Firestore Rules** (wajib — tanpa ini muncul error *Missing or insufficient permissions*):
   - Buka [Firestore Rules](https://console.firebase.google.com/project/my-portofolio-43930/firestore/rules) (ganti `my-portofolio-43930` dengan `projectId` Anda).
   - Hapus rules lama, salin **seluruh isi** file `firestore.rules` dari proyek ini.
   - Klik **Publish**.
7. **Authentication → Settings → Authorized domains** → tambahkan:
   - `localhost`, `127.0.0.1` (development lokal)
   - **`your-username.github.io`** (wajib untuk GitHub Pages)
   - Custom domain jika dipakai

### Struktur data Firestore

```
users/{uid}/tasks/{taskId}
users/{uid}/targets/{targetId}
users/{uid}/categories/{categoryId}
users/{uid}/activities/{activityId}
users/{uid}/meta/stats
users/{uid}/meta/settings
```

## Cara Menjalankan

1. Clone atau unduh repositori ini.
2. Selesaikan **Setup Firebase** di atas.
3. Buka `index.html` di browser modern (Chrome, Firefox, Safari, Edge) — idealnya via server lokal (Laragon, Live Server, dll.).
4. Daftar dengan **email** dan password, lalu masuk.

> **Catatan Telegram**: Buat bot via [@BotFather](https://t.me/BotFather), dapatkan Chat ID, lalu isi di menu **Pengaturan** (ikon gear).

## Deploy ke GitHub Pages

Error **"Firebase belum dikonfigurasi"** di GitHub Pages hampir selalu karena `js/firebase-config.js` **tidak ikut ter-upload** (file di-ignore Git).

### Cara A — Commit config (paling mudah)

1. Pastikan `js/firebase-config.js` sudah berisi config proyek Firebase Anda (bukan placeholder `YOUR_`).
2. **Jangan** ignore file ini di `.gitignore` (sudah diperbaiki di repo).
3. Push ke GitHub:
   ```bash
   git add js/firebase-config.js .nojekyll index.html
   git commit -m "Add Firebase config for GitHub Pages"
   git push
   ```
4. Di repo GitHub: **Settings → Pages** → Source: **GitHub Actions** atau branch `main` / folder root.
5. Di Firebase Console → **Authentication → Authorized domains** → tambahkan `your-username.github.io`.
6. Buka situs: `https://your-username.github.io/nama-repo/` (pakai URL dengan nama repo).

> API key Firebase untuk web app **memang dipakai di browser** (bukan rahasia). Keamanan data mengandalkan **Firestore Security Rules**, bukan menyembunyikan config.

### Cara B — GitHub Secrets (opsional)

Pakai workflow `.github/workflows/deploy-pages.yml` dan isi Secrets di repo: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`. Aktifkan Pages dari **GitHub Actions**.

## Struktur Direktori

```
todolist_NajmyPages/
├── index.html
├── firestore.rules
├── assets/logo.png
├── css/style.css
└── js/
    ├── firebase-config.example.js
    ├── firebase-config.js      # (gitignored) konfigurasi Anda
    ├── storage.js              # Firebase Auth + Firestore + cache
    ├── app.js
    ├── ui.js
    ├── dashboard.js
    ├── calendar.js
    └── notifications.js
```

## Halaman Aplikasi

| Halaman | Deskripsi |
|---|---|
| **Dashboard** | Ringkasan statistik, grafik, progress target, kegiatan |
| **Tugas** | Papan Kanban, sidebar target, filter kategori |
| **Kalender** | Jadwal visual tugas, target, dan kegiatan |
