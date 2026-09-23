# Sistem Pendataan Ormas — Next.js + Mongoose + MongoDB

Migrasi aplikasi Google Apps Script/Google Sheets menjadi web app Next.js dengan **MongoDB sebagai database utama** dan **Mongoose sebagai ODM**.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Mongoose + MongoDB
- JWT session dengan `jose`
- bcryptjs
- Recharts
- React Leaflet
- SheetJS

## Menjalankan MongoDB Windows
Pastikan MongoDB Community Server berjalan sebagai Windows Service, atau jalankan:

```bash
docker compose up -d
```

Connection string default:

```text
mongodb://127.0.0.1:27017/ormas_db
```

MongoDB Compass dapat digunakan untuk melihat database di `localhost:27017`.

## Konfigurasi
Salin `.env.example` menjadi `.env.local` dan sesuaikan:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/ormas_db
AUTH_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET
NEXT_PUBLIC_APP_NAME=Pendataan Ormas
```

## Install & run

```bash
npm install
npm run seed
npm run dev
```

Buka `http://localhost:3000/login`.

Development login:
- `admin / admin123`
- `operator / operator123`
- `viewer / viewer123`

## Data DATA_ORMAS

Project sudah menyertakan `data/DATA_ORMAS.xlsx` sebagai data migrasi. Jalankan `npm run setup` untuk membuat akun, master provinsi, dan memasukkan data tersebut ke collection `ormas`. Proses memakai `legacyId` berbasis sheet/baris sehingga menjalankan setup ulang tidak menggandakan data yang sama.

Untuk file DATA_ORMAS lain, gunakan:

```bash
npm run migrate-data -- ./DATA_ORMAS.xlsx
npm run import-wilayah -- ./KABUPATEN_KOTA.xlsx
```

Atau hanya data bundled:

```bash
npm run import-bundled-data
```

## Cek koneksi

```bash
npm run db:check
```

## Collection MongoDB
- `users`
- `ormas`
- `provinces`
- `regencies`
- `activitylogs`

## Fitur
- Login multi-role
- Dashboard
- Data Ormas
- CRUD dan soft delete
- Search/filter/pagination server-side
- Import Excel/CSV
- Export Excel/CSV
- Laporan Bidang Kegiatan
- Rekap Wilayah
- Peta persebaran
- Log Aktivitas

## Troubleshooting Login Windows

1. Pastikan MongoDB Server berjalan, bukan hanya MongoDB Compass.
2. Test koneksi:

```bash
npm run db:check
```

3. Siapkan akun development dan master provinsi:

```bash
npm run setup
```

4. Jalankan aplikasi:

```bash
npm run dev
```

5. Cek kesehatan aplikasi/database melalui:

```text
http://localhost:3000/api/health
```

Jika `success: true`, MongoDB terhubung. Field `users` harus bernilai minimal `3` setelah `npm run setup`.

Akun development:
- admin / admin123
- operator / operator123
- viewer / viewer123

Pada development, aplikasi memiliki fallback `AUTH_SECRET` agar login tidak gagal hanya karena `.env.local` belum dibuat. Untuk production, tetap wajib mengisi `AUTH_SECRET` sendiri.
