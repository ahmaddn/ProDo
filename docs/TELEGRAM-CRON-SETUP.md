# Pengingat Telegram 24/7 (GitHub Actions — Gratis)

Panduan ini mengaktifkan pengingat otomatis **tanpa membuka web** dan **tanpa Cloud Functions berbayar**.

Pola pengingat (sama seperti di aplikasi):

| | H-3 | H-1 | Hari H | Terlewat |
|---|:---:|:---:|:------:|:--------:|
| Tugas | ✓ | ✓ | ✓ | ✓ |
| Kegiatan | ✓ | ✓ | ✓ | — |

Jadwal: workflow berjalan **setiap jam** (zona waktu penghitungan: **Asia/Jakarta**).

---

## Langkah 1 — Service Account Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/) → pilih proyek ProDo Anda.
2. **Project settings** (ikon gear) → tab **Service accounts**.
3. Klik **Generate new private key** → unduh file JSON.
4. **Simpan file ini rahasia** — jangan di-upload ke repo publik.

---

## Langkah 2 — Secret di GitHub

1. Buka repo GitHub ProDo → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: **seluruh isi** file JSON (copy-paste dari `{` sampai `}`).
3. Simpan.

---

## Langkah 3 — Push kode workflow

Pastikan di repo ada:

- `scripts/telegram-reminders.mjs`
- `scripts/package.json`
- `scripts/package-lock.json`
- `.github/workflows/telegram-reminders.yml`

Lalu push ke branch `main` / `master`.

---

## Langkah 4 — Aktifkan Actions

1. Repo GitHub → tab **Actions**.
2. Jika diminta, klik **I understand my workflows, enable them**.
3. Di sidebar pilih workflow **Telegram reminders**.
4. Klik **Run workflow** → **Run workflow** (tes manual).

Cek log hijau: harus ada baris `Users found: …` dan `sent task:…` jika ada tugas yang memenuhi syarat.

---

## Langkah 5 — Telegram di aplikasi

Di ProDo (menu Pengaturan), isi **Bot Token** dan **Chat ID** lalu simpan.  
Data ini disimpan di Firestore `users/{uid}/meta/settings` — script Actions membacanya dari sana.

---

## Troubleshooting

| Masalah | Solusi |
|--------|--------|
| Workflow tidak jalan | Actions harus enabled; repo publik atau kuota Actions tersedia |
| `FIREBASE_SERVICE_ACCOUNT tidak diset` | Secret belum dibuat atau nama salah |
| `Users found: 0` | Belum ada tugas/kegiatan di Firestore, atau belum login & simpan data |
| Tidak ada pesan Telegram | Token/Chat ID kosong di Pengaturan, atau hari ini bukan H-3/H-1/H |
| Permission denied | Service account perlu akses Firestore (default dari Firebase Admin SDK biasanya cukup) |

---

## Catatan

- Repo **publik**: Actions gratis dengan kuota yang cukup untuk cron per jam.
- Repo **privat**: tetap bisa, perhatikan kuota menit Actions GitHub.
- Pengingat di **browser** (saat app terbuka) tetap berjalan; log `notificationLog` dipakai bersama agar tidak double pesan di hari yang sama.
