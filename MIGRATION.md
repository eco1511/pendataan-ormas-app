# Migrasi Google Apps Script → Next.js + Mongoose + MongoDB

Source truth berasal dari kode Apps Script/HTML yang diberikan.

| Lama | Baru |
|---|---|
| Google Sheets | MongoDB |
| SpreadsheetApp | Mongoose |
| `google.script.run` | Next.js Route Handlers |
| HTML/Vanilla JS | React/Next.js |
| Chart.js | Recharts |
| Leaflet | React Leaflet |
| SheetJS | SheetJS |

## Collection
- `users`
- `ormas`
- `provinces`
- `regencies`
- `activitylogs`

## Business logic
Struktur field DATA_ORMAS dipertahankan: identitas Ormas, kepengurusan, kontak, bidang, tingkat, wilayah, metadata input/update, dan status soft delete.

Pagination, search, filter, dashboard aggregation, laporan bidang, rekap wilayah, import validation, export, authentication, authorization, dan activity logging dipindahkan ke service/API Next.js dengan Mongoose.
