import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSession } from '@/lib/auth';
import { PROVINCES } from '@/lib/utils';
import { connectMongoDB } from '@/lib/mongodb';
import { Province } from '@/models/Province';
import { Regency } from '@/models/Regency';

const SOURCE_URL = 'https://docs.google.com/spreadsheets/d/1RtZcy4otGtGzCU2koDneehrX4gshu_HUzbhT5dddZNM/export?format=csv&gid=0';

type Submission = {
  timestamp: string;
  timestampOrder: number;
  tingkat: string;
  provinsi: string;
  kabupatenKota: string;
};

function clean(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function formatTimestamp(value: unknown) {
  const raw = clean(value);
  const serial = Number(raw);
  if (!raw || !Number.isFinite(serial) || serial < 20000) return raw;
  const date = new Date((serial - 25569) * 86400000);
  if (Number.isNaN(date.getTime())) return raw;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function getTimestampOrder(value: unknown) {
  const raw = clean(value);
  const serial = Number(raw);
  if (Number.isFinite(serial) && serial >= 20000) return serial;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed / 86400000 : 0;
}

function normalizeLevel(value: string) {
  const level = clean(value).toLowerCase();
  if (level.includes('kabupaten') || level.includes('kota')) return 'Kabupaten/Kota';
  if (level.includes('provinsi')) return 'Provinsi';
  return clean(value) || 'Tidak diketahui';
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const response = await fetch(SOURCE_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Gagal mengambil spreadsheet (${response.status}).`);
    const csv = await response.text();
    const workbook = XLSX.read(csv, { type: 'string', raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const submissions: Submission[] = rows.map((row) => ({
      timestamp: formatTimestamp(row.Timestamp),
      timestampOrder: getTimestampOrder(row.Timestamp),
      tingkat: normalizeLevel(clean(row['Tingkat Wilayah'])),
      provinsi: clean(row.Provinsi),
      kabupatenKota: clean(row['Kabupaten/Kota']),
    })).filter((row) => row.provinsi || row.kabupatenKota);

    const grouped = new Map<string, Submission & { jumlahKiriman: number }>();
    for (const row of submissions) {
      const key = [row.tingkat, row.provinsi, row.kabupatenKota].join('|');
      const existing = grouped.get(key);
      if (existing) {
        existing.jumlahKiriman += 1;
        if (row.timestampOrder > existing.timestampOrder) {
          existing.timestamp = row.timestamp;
          existing.timestampOrder = row.timestampOrder;
        }
      } else grouped.set(key, { ...row, jumlahKiriman: 1 });
    }

    const url = new URL(req.url);
    const search = clean(url.searchParams.get('search')).toLowerCase();
    const tingkat = clean(url.searchParams.get('tingkat'));
    const provinsi = clean(url.searchParams.get('provinsi'));
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
    const filtered = [...grouped.values()].filter((row) => {
      const matchesSearch = !search || [row.provinsi, row.kabupatenKota, row.tingkat].join(' ').toLowerCase().includes(search);
      return matchesSearch && (!tingkat || row.tingkat === tingkat) && (!provinsi || row.provinsi === provinsi);
    }).sort((a, b) => b.timestampOrder - a.timestampOrder
      || b.jumlahKiriman - a.jumlahKiriman
      || a.provinsi.localeCompare(b.provinsi)
      || a.kabupatenKota.localeCompare(b.kabupatenKota));
    await connectMongoDB();
    const provinceRows = await Province.find({}, { namaProvinsi: 1, _id: 0 }).lean();
    const masterProvinces = [...new Set([
      ...PROVINCES,
      ...provinceRows.map((row: any) => clean(row.namaProvinsi)),
    ].filter(Boolean))];
    const provinceNames = provinsi
      ? [provinsi]
      : [...new Set([...masterProvinces, ...filtered.map((row) => row.provinsi)])].filter(Boolean);
    const provinceMap = new Map<string, { provinsi: string; jumlahProvinsi: number; jumlahKabupatenKota: number; kabupatenKota: Set<string> }>(
      provinceNames.map((name) => [name, { provinsi: name, jumlahProvinsi: 0, jumlahKabupatenKota: 0, kabupatenKota: new Set<string>() }]),
    );
    for (const row of filtered) {
      const summary = provinceMap.get(row.provinsi) || { provinsi: row.provinsi, jumlahProvinsi: 0, jumlahKabupatenKota: 0, kabupatenKota: new Set<string>() };
      if (row.tingkat === 'Provinsi') summary.jumlahProvinsi = 1;
      if (row.tingkat === 'Kabupaten/Kota' && row.kabupatenKota) {
        summary.kabupatenKota.add(row.kabupatenKota);
        summary.jumlahKabupatenKota = summary.kabupatenKota.size;
      }
      provinceMap.set(row.provinsi, summary);
    }
    const perProvinsi = [...provinceMap.values()].map((row) => ({ ...row, kabupatenKota: [...row.kabupatenKota].sort() })).sort((a, b) => a.provinsi.localeCompare(b.provinsi));
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;

    return NextResponse.json({
      success: true,
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      totalPages,
      page: currentPage,
      pageSize,
      totalKiriman: submissions.length,
      totalDaerah: grouped.size,
      totalProvinsi: new Set(submissions.filter((row) => row.tingkat === 'Provinsi').map((row) => row.provinsi)).size,
      totalKabupatenKota: new Set(submissions.filter((row) => row.tingkat === 'Kabupaten/Kota').map((row) => `${row.provinsi}|${row.kabupatenKota}`)).size,
      totalGabungan: new Set(submissions.filter((row) => row.tingkat === 'Provinsi').map((row) => `provinsi|${row.provinsi}`)).size
        + new Set(submissions.filter((row) => row.tingkat === 'Kabupaten/Kota').map((row) => `kabupaten|${row.provinsi}|${row.kabupatenKota}`)).size,
      perProvinsi,
      provinces: masterProvinces,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Gagal memuat daerah pengirim data.' }, { status: 502 });
  }
}
