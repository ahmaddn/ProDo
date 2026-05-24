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
6. **Rules** → tempel isi file `firestore.rules` di root proyek:

```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

7. Deploy rules dari Firebase Console atau CLI (`firebase deploy --only firestore:rules`).

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

> **Keamanan**: Jangan commit `js/firebase-config.js` (sudah ada di `.gitignore`). API key Firebase untuk web app boleh dipakai di client; lindungi data dengan Firestore Security Rules.

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
