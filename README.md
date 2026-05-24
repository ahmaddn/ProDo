# ProDo - Manajemen Tugas & Kegiatan

Aplikasi produktivitas statis siap produksi menggunakan Vanilla JavaScript dan Tailwind CSS. ProDo membantu Anda mengelola tugas, target, dan kegiatan dalam satu antarmuka modern — lengkap dengan dashboard analitik, papan Kanban, kalender terpadu, dan sistem autentikasi multi-pengguna lokal.

## Fitur Utama

### Autentikasi
- **Login & Registrasi**: Setiap pengguna memiliki data terpisah yang disimpan di LocalStorage browser.
- **Sesi per Pengguna**: Tugas, target, kegiatan, dan pengaturan disimpan per akun.

### Dashboard
- **Statistik Ringkas**: Total tugas, tugas selesai, tugas terlewat, dan streak produktivitas.
- **Visualisasi Chart.js**: Diagram donat status tugas, grafik batang prioritas, dan breakdown per kategori.
- **Progress Target**: Ringkasan semua target beserta progress bar-nya.
- **Tugas Mendatang**: Daftar 6 tugas terdekat berdasarkan jatuh tempo.

### Manajemen Tugas (Kanban)
- **Papan Kanban 3 Kolom**: *Belum Dimulai*, *Fokus / Hari Ini*, dan *Selesai*.
- **CRUD Lengkap**: Tambah, edit, hapus, dan tandai selesai.
- **Prioritas & Kategori**: Prioritas (rendah/sedang/tinggi) dan kategori warna-warni (Pekerjaan, Pribadi, Kesehatan).
- **Jatuh Tempo & Target Terkait**: Setiap tugas bisa memiliki deadline dan dikaitkan ke target.
- **Filter & Pencarian**: Filter (semua, aktif, selesai, hari ini, prioritas tinggi) dan pencarian real-time.
- **Drag & Drop**: Atur urutan tugas antar kolom dengan Sortable.js.
- **Progress Harian**: Progress bar dan pesan motivasi dinamis untuk tugas hari ini.

### Target Tracking
- **Tipe Target**: Harian, mingguan, atau jangka panjang.
- **Progress Otomatis**: Progress target tersinkronisasi otomatis berdasarkan tugas terkait yang diselesaikan.
- **Deadline Opsional**: Tampil di sidebar dan kalender.

### Kalender Kegiatan
- **FullCalendar Terintegrasi**: Tampilan bulan, minggu, dan agenda.
- **Tiga Jenis Event**: Tugas (biru), target/deadline (pink), dan kegiatan (teal).
- **Manajemen Kegiatan**: Tambah, edit, dan hapus kegiatan dengan rentang tanggal.

### Motivasi & Pengingat
- **Streak**: Hitung hari beruntun produktif saat menyelesaikan tugas.
- **Nagging Banner**: Banner peringatan otomatis untuk tugas yang melewati batas waktu.
- **Notifikasi Telegram**: Pengingat tugas terlewat via bot Telegram (opsional, dengan fitur uji coba).

### Pengaturan Data
- **Export & Import JSON**: Cadangkan dan pulihkan semua data.
- **Hapus Semua Data**: Reset data pengguna aktif.

## Teknologi

| Kategori | Library |
|---|---|
| Styling | Tailwind CSS (CDN), Custom CSS |
| Icons | Lucide Icons (CDN) |
| Tanggal | Day.js + plugin relativeTime (CDN) |
| Drag & Drop | Sortable.js (CDN) |
| Grafik | Chart.js 4 (CDN) |
| Kalender | FullCalendar 6 (CDN) |
| Runtime | Vanilla JavaScript (ES6+), HTML5 |

## Cara Menjalankan

Karena ini adalah aplikasi statis murni tanpa build step, cukup buka `index.html` di browser modern (Chrome, Firefox, Safari, Edge).

1. Clone atau unduh repositori ini.
2. Buka folder proyek.
3. Klik ganda pada `index.html` atau drag-and-drop file tersebut ke browser Anda.
4. Daftar akun baru, lalu masuk untuk mulai menggunakan aplikasi.

> **Catatan**: Untuk notifikasi Telegram, buat bot via [@BotFather](https://t.me/BotFather), dapatkan Chat ID, lalu isi di menu **Pengaturan** (ikon gear di navbar).

## Struktur Direktori

```
todolist_NajmyPages/
├── index.html          # Halaman utama & layout aplikasi
├── assets/
│   └── logo.png        # Logo ProDo
├── css/
│   └── style.css       # Custom styling, animasi, dan transisi halaman
└── js/
    ├── app.js          # Inisialisasi, auth, navigasi halaman, event listeners
    ├── storage.js      # LocalStorage, autentikasi, CRUD data, export/import
    ├── ui.js           # Rendering DOM (tugas Kanban, kategori, target, toast)
    ├── dashboard.js    # Dashboard statistik & grafik Chart.js
    ├── calendar.js     # Integrasi FullCalendar & manajemen kegiatan
    └── notifications.js # Integrasi Telegram Bot API
```

## Halaman Aplikasi

| Halaman | Deskripsi |
|---|---|
| **Dashboard** | Ringkasan statistik, grafik, progress target, dan tugas mendatang |
| **Tugas** | Papan Kanban, sidebar target, filter kategori, progress harian |
| **Kalender** | Jadwal visual tugas, target, dan kegiatan |
