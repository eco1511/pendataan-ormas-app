import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { connectMongoDB } from '@/lib/mongodb';
import { Ormas } from '@/models/Ormas';

type RawRow = Record<string, unknown>;

const aliases: Record<string, string> = {
  id: 'legacyId',
  'nama ormas': 'namaOrmas',
  'nama organisasi kemasyarakatan': 'namaOrmas',
  'nomor skt': 'nomorSkt',
  'skt bh': 'nomorSkt',
  'nomor skt bh': 'nomorSkt',
  'nomor badan hukum': 'nomorSkt',
  periode: 'periode',
  'periode kepengurusan': 'periode',
  'status kepengurusan': 'statusKepengurusan',
  ketua: 'ketua',
  sekretaris: 'sekretaris',
  bendahara: 'bendahara',
  'jumlah anggota': 'jumlahAnggota',
  alamat: 'alamat',
  'alamat lengkap': 'alamat',
  'nomor telepon': 'nomorTelepon',
  telepon: 'nomorTelepon',
  'no telepon': 'nomorTelepon',
  'bidang kegiatan': 'bidangKegiatan',
  'detail kegiatan': 'detailKegiatan',
  tingkat: 'tingkat',
  provinsi: 'provinsi',
  'kabupaten kota': 'kabupatenKota',
  kabupaten: 'kabupatenKota',
  kota: 'kabupatenKota',
  'tanggal input': 'tanggalInput',
  'tanggal update': 'tanggalUpdate',
  'user input': 'userInput',
  'user update': 'userUpdate',
  'status data': 'statusData',
};

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\\/_.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function toDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = clean(value);
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function toNumber(value: unknown) {
  const raw = clean(value);
  if (!raw) return 0;
  const cleaned = raw.replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(/,/g, '').replace(/[^0-9-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function asOptionalEnum<T extends string>(value: unknown, allowed: readonly T[]) {
  const v = clean(value);
  return (allowed as readonly string[]).includes(v) ? v : '';
}

export async function migrateOrmasFile(filePath: string) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) throw new Error(`File tidak ditemukan: ${fullPath}`);

  await connectMongoDB();
  const workbook = XLSX.read(fs.readFileSync(fullPath), { type: 'buffer', cellDates: true });
  if (!workbook.SheetNames.length) throw new Error('Workbook tidak memiliki worksheet.');

  const sheetName = workbook.SheetNames.find((name) => normalizeHeader(name) === 'data ormas') ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '', raw: false, blankrows: true });
  if (!matrix.length) throw new Error('Worksheet DATA_ORMAS kosong.');

  const headerRow = matrix[0].map((h) => clean(h));
  const fieldMap: Record<string, number> = {};
  headerRow.forEach((header, index) => {
    const canonical = aliases[normalizeHeader(header)];
    if (canonical && fieldMap[canonical] === undefined) fieldMap[canonical] = index;
  });

  const get = (row: unknown[], field: string) => fieldMap[field] === undefined ? '' : row[fieldMap[field]] ?? '';

  const docs = matrix.slice(1).map((row, index) => {
    const rowNumber = index + 2;
    const namaOrmas = clean(get(row, 'namaOrmas'));
    const legacyId = clean(get(row, 'legacyId')) || `DATA_ORMAS:${sheetName}:${rowNumber}`;
    const statusKepengurusan = asOptionalEnum(get(row, 'statusKepengurusan'), ['Pusat', 'Cabang'] as const);
    const tingkat = asOptionalEnum(get(row, 'tingkat'), ['Nasional', 'Provinsi', 'Kabupaten/Kota'] as const);
    const statusData = clean(get(row, 'statusData')) === 'Deleted' ? 'Deleted' : 'Aktif';

    return {
      legacyId,
      namaOrmas,
      nomorSkt: clean(get(row, 'nomorSkt')),
      periode: clean(get(row, 'periode')),
      statusKepengurusan,
      ketua: clean(get(row, 'ketua')),
      sekretaris: clean(get(row, 'sekretaris')),
      bendahara: clean(get(row, 'bendahara')),
      jumlahAnggota: toNumber(get(row, 'jumlahAnggota')),
      alamat: clean(get(row, 'alamat')),
      nomorTelepon: clean(get(row, 'nomorTelepon')),
      bidangKegiatan: clean(get(row, 'bidangKegiatan')),
      detailKegiatan: clean(get(row, 'detailKegiatan')),
      tingkat,
      provinsi: clean(get(row, 'provinsi')),
      kabupatenKota: clean(get(row, 'kabupatenKota')),
      tanggalInput: toDate(get(row, 'tanggalInput')),
      tanggalUpdate: toDate(get(row, 'tanggalUpdate')),
      userInput: clean(get(row, 'userInput')),
      userUpdate: clean(get(row, 'userUpdate')),
      statusData,
      deletedAt: statusData === 'Deleted' ? new Date() : null,
    };
  }).filter((doc) => doc.namaOrmas !== '');

  if (!docs.length) return 0;

  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { legacyId: doc.legacyId },
      update: { $set: doc },
      upsert: true,
    },
  }));

  await Ormas.bulkWrite(ops, { ordered: false });
  return docs.length;
}
