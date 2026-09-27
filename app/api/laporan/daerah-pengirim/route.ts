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
  pengirim: string;
};

function clean(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeProvinceName(value: unknown) {
  return clean(value)
    .toLocaleLowerCase('id-ID')
    .replace(/^daerah istimewa yogyakarta$/, 'di yogyakarta')
    .replace(/^daerah khusus ibukota jakarta$/, 'dki jakarta');
}
function normalizeRegencyName(value: unknown) {
  return clean(value)
    .toLocaleLowerCase('id-ID')
    .replace(/^kab(?:upaten)?\.?\s+/, 'kabupaten ')
    .replace(/^kota\.?\s+/, 'kota ')
    .replace(/\badministrasi\b\s*/g, '');
}
function parseTimestamp(value: unknown) {
  const raw = clean(value);
  const serial = Number(raw);
  if (raw && Number.isFinite(serial) && serial >= 20000) {
    return new Date((serial - 25569) * 86400000);
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  const first = Number(match[1]);
  const second = Number(match[2]);
  const day = first > 12 ? first : second;
  const month = first > 12 ? second : first;
  return new Date(Date.UTC(
    Number(match[3]),
    month - 1,
    day,
    Number(match[4] || 0),
    Number(match[5] || 0),
    Number(match[6] || 0),
  ));
}

function formatTimestamp(value: unknown) {
  const raw = clean(value);
  const date = parseTimestamp(raw);
  if (!date) return raw;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date).replace(' pukul ', ' ');
}

function getTimestampOrder(value: unknown) {
  const parsed = parseTimestamp(value);
  return parsed ? parsed.getTime() : 0;
}

function parseDateFilter(value: string, endOfDay = false) {
  const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
}
function normalizeLevel(value: string) {
  const level = clean(value).toLowerCase();
  if (level.includes('kabupaten') || level.includes('kota')) return 'Kabupaten/Kota';
  if (level.includes('provinsi')) return 'Provinsi';
  return clean(value) || 'Tidak diketahui';
}

function getSender(row: Record<string, unknown>) {
  return clean(row['Nama Pengirim'] ?? row['Nama pengirim'] ?? row['Pengirim'] ?? row['Nama']);
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
      pengirim: getSender(row),
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
          existing.pengirim = row.pengirim;
        }
      } else grouped.set(key, { ...row, jumlahKiriman: 1 });
    }

    const url = new URL(req.url);
    const search = clean(url.searchParams.get('search')).toLowerCase();
    const tingkat = clean(url.searchParams.get('tingkat'));
    const provinsi = clean(url.searchParams.get('provinsi'));
    const tanggalMulai = parseDateFilter(clean(url.searchParams.get('tanggalMulai')));
    const tanggalSelesai = parseDateFilter(clean(url.searchParams.get('tanggalSelesai')), true);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
    const filtered = [...grouped.values()].filter((row) => {
      const matchesSearch = !search || [row.provinsi, row.kabupatenKota, row.tingkat].join(' ').toLowerCase().includes(search);
      return matchesSearch && (!tingkat || row.tingkat === tingkat) && (!provinsi || row.provinsi === provinsi);
    }).sort((a, b) => b.timestampOrder - a.timestampOrder
      || b.jumlahKiriman - a.jumlahKiriman
      || a.provinsi.localeCompare(b.provinsi)
      || a.kabupatenKota.localeCompare(b.kabupatenKota));
    const filteredByDate = filtered.filter((row) => (
      (!tanggalMulai || row.timestampOrder >= tanggalMulai)
      && (!tanggalSelesai || row.timestampOrder <= tanggalSelesai)
    ));
    await connectMongoDB();
    const [provinceRows, regencyRows] = await Promise.all([
      Province.find({}, { namaProvinsi: 1, _id: 0 }).lean(),
      Regency.find({}, { provinsi: 1, namaKabupatenKota: 1, _id: 0 }).lean(),
    ]);
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
    const masterKabupatenByProvinsi = new Map<string, string[]>();
    for (const row of regencyRows) {
      const province = clean((row as any).provinsi);
      const regency = clean((row as any).namaKabupatenKota);
      if (!province || !regency) continue;
      const provinceKey = normalizeProvinceName(province);
      const current = masterKabupatenByProvinsi.get(provinceKey) || [];
      current.push(regency);
      masterKabupatenByProvinsi.set(provinceKey, current);
    }
    const perProvinsi = [...provinceMap.values()].map((row) => {
      const sent = new Set([...row.kabupatenKota].map(normalizeRegencyName));
      const kabupatenKotaBelumMengirim = (masterKabupatenByProvinsi.get(normalizeProvinceName(row.provinsi)) || [])
        .filter((name) => !sent.has(normalizeRegencyName(name)))
        .sort((a, b) => a.localeCompare(b, 'id-ID'));
      return {
        ...row,
        kabupatenKota: [...row.kabupatenKota].sort(),
        kabupatenKotaBelumMengirim,
      };
    }).sort((a, b) => a.provinsi.localeCompare(b.provinsi));
    const totalPages = Math.max(1, Math.ceil(filteredByDate.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const notifications = [...submissions]
      .sort((a, b) => b.timestampOrder - a.timestampOrder)
      .slice(0, 10)
      .map((row, index) => ({
        id: `${row.timestampOrder}-${row.provinsi}-${row.kabupatenKota}-${row.pengirim}-${index}`,
        timestamp: row.timestamp,
        tingkat: row.tingkat,
        provinsi: row.provinsi,
        kabupatenKota: row.kabupatenKota,
        pengirim: row.pengirim || 'Tidak diketahui',
      }));

    return NextResponse.json({
      success: true,
      data: filteredByDate.slice(start, start + pageSize),
      total: filteredByDate.length,
      totalPages,
      page: currentPage,
      pageSize,
      totalKiriman: submissions.length,
      totalDaerah: grouped.size,
      totalProvinsi: new Set(submissions.filter((row) => row.tingkat === 'Provinsi').map((row) => row.provinsi)).size,
      totalKabupatenKota: new Set(submissions.filter((row) => row.tingkat === 'Kabupaten/Kota').map((row) => `${row.provinsi}|${row.kabupatenKota}`)).size,
      totalGabungan: new Set(submissions.filter((row) => row.tingkat === 'Provinsi').map((row) => `provinsi|${row.provinsi}`)).size
        + new Set(submissions.filter((row) => row.tingkat === 'Kabupaten/Kota').map((row) => `kabupaten|${row.provinsi}|${row.kabupatenKota}`)).size,
      notifications,
      perProvinsi,
      provinces: masterProvinces,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Gagal memuat daerah pengirim data.' }, { status: 502 });
  }
}
