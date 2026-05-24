# ProDo - Manajemen Tugas & Kegiatan

Aplikasi produktivitas berbasis web untuk mengelola tugas, target, dan kegiatan dalam satu antarmuka modern. Data akun tersimpan di cloud sehingga dapat diakses dari berbagai perangkat setelah login.

## Fitur Utama

### Autentikasi & Akun
- **Login & registrasi** dengan email dan password.
- **Data per pengguna** — setiap akun memiliki tugas, target, kategori, dan kegiatan sendiri.
- **Sinkronisasi** — perubahan data mengikuti akun yang sedang masuk.

### Dashboard
- **Statistik ringkas** — total tugas, tugas selesai, tugas terlewat, dan streak produktivitas.
- **Visualisasi grafik** — diagram donat status tugas, grafik batang prioritas, dan breakdown per kategori.
- **Progress target** — ringkasan semua target beserta progress bar.
- **Ringkasan kegiatan** — statistik kegiatan dan daftar kegiatan mendatang.

### Manajemen Tugas (Kanban)
- **Papan Kanban 3 kolom** — *Belum Dimulai*, *Fokus / Hari Ini*, dan *Selesai*.
- **CRUD lengkap** — tambah, edit, hapus, dan tandai selesai.
- **Prioritas & kategori** — prioritas (rendah / sedang / tinggi) dan kategori dengan warna preset atau pilihan warna manual.
- **Jatuh tempo & target terkait** — setiap tugas dapat memiliki deadline dan dikaitkan ke target.
- **Filter & pencarian** — filter status/prioritas dan pencarian judul tugas.
- **Drag & drop** — pindahkan tugas antar kolom; posisi kolom tersimpan.

### Target Tracking
- **Tipe target** — harian, mingguan, atau jangka panjang.
- **Progress otomatis** — progress target dihitung dari tugas terkait yang sudah selesai.
- **Deadline opsional** — ditampilkan di sidebar dan kalender.

### Kalender Kegiatan
- **Tampilan kalender** — mode bulan, minggu, dan agenda.
- **Tiga jenis event** — tugas (jatuh tempo), target (deadline), dan kegiatan.
- **Manajemen kegiatan** — tambah, edit, dan hapus kegiatan dengan rentang tanggal.

### Motivasi & Pengingat
- **Streak** — menghitung hari beruntun saat menyelesaikan tugas.
- **Nagging banner** — peringatan untuk tugas yang sudah melewati batas waktu.
- **Notifikasi Telegram** — pengingat opsional melalui bot Telegram (diatur dari menu Pengaturan).

### Pengaturan Data
- **Export & import JSON** — cadangkan atau pulihkan seluruh data akun.
- **Hapus semua data** — reset data pengguna yang sedang aktif.

## Halaman Aplikasi

| Halaman | Deskripsi |
|---|---|
| **Dashboard** | Ringkasan statistik, grafik, progress target, dan kegiatan |
| **Tugas** | Papan Kanban, sidebar target, filter kategori, progress harian |
| **Kalender** | Jadwal visual tugas, target, dan kegiatan |

## Teknologi

| Kategori | Library |
|---|---|
| Styling | Tailwind CSS, Custom CSS |
| Ikon | Lucide Icons |
| Tanggal | Day.js |
| Drag & drop | Sortable.js |
| Grafik | Chart.js |
| Kalender | FullCalendar |
| Runtime | HTML5, Vanilla JavaScript |

## Cara Menggunakan

1. Buka aplikasi di browser (lokal atau hosting statis).
2. **Daftar** akun baru atau **masuk** jika sudah punya akun.
3. Gunakan tab **Dashboard**, **Tugas**, dan **Kalender** untuk mengelola aktivitas.
4. Menu **Pengaturan** (ikon gear) untuk export/import data dan notifikasi Telegram.

## Struktur Proyek

```
todolist_NajmyPages/
├── index.html          # Halaman utama
├── assets/             # Logo & aset
├── css/style.css       # Gaya kustom
└── js/
    ├── app.js          # Navigasi & event utama
    ├── storage.js      # Penyimpanan data
    ├── ui.js           # Tampilan antarmuka
    ├── dashboard.js    # Dashboard & grafik
    ├── calendar.js     # Kalender
    └── notifications.js
```
