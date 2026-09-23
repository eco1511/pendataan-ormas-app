import { connectMongoDB } from '@/lib/mongodb';
import { Ormas } from '@/models/Ormas';

const JUMLAH_PROVINSI_INDONESIA = 38;
const JUMLAH_KABUPATEN_KOTA_INDONESIA = 514;

export type OrmasInput = {
  namaOrmas: string; nomorSkt: string; periode?: string; statusKepengurusan: 'Pusat'|'Cabang'; ketua: string; sekretaris?: string;
  bendahara?: string; jumlahAnggota?: number; alamat: string; nomorTelepon?: string; bidangKegiatan: string; detailKegiatan?: string;
  tingkat: 'Nasional'|'Provinsi'|'Kabupaten/Kota'; provinsi: string; kabupatenKota?: string;
};

function mapDoc(doc: any) {
  const x = doc.toObject ? doc.toObject() : doc;
  const id = String(x._id);
  return {
    _id: id,
    ID: x.legacyId || id,
    legacyId: x.legacyId || null,
    namaOrmas: x.namaOrmas,
    nomorSkt: x.nomorSkt,
    periode: x.periode,
    statusKepengurusan: x.statusKepengurusan,
    ketua: x.ketua,
    sekretaris: x.sekretaris,
    bendahara: x.bendahara,
    jumlahAnggota: x.jumlahAnggota,
    alamat: x.alamat,
    nomorTelepon: x.nomorTelepon,
    bidangKegiatan: x.bidangKegiatan,
    detailKegiatan: x.detailKegiatan,
    tingkat: x.tingkat,
    provinsi: x.provinsi,
    kabupatenKota: x.kabupatenKota,
    tanggalInput: x.tanggalInput,
    tanggalUpdate: x.tanggalUpdate,
    userInput: x.userInput,
    userUpdate: x.userUpdate,
    statusData: x.statusData,
    deletedAt: x.deletedAt,
  };
}

function buildFilter(params: Record<string, string | undefined>) {
  const filter: Record<string, any> = { statusData: { $ne: 'Deleted' } };
  const { search, provinsi, kabupaten, tingkat, status, bidang } = params;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { namaOrmas: rx }, { nomorSkt: rx }, { ketua: rx }, { provinsi: rx }, { kabupatenKota: rx },
    ];
  }
  if (provinsi) filter.provinsi = provinsi;
  if (kabupaten) filter.kabupatenKota = kabupaten;
  if (tingkat) filter.tingkat = tingkat;
  if (status) filter.statusKepengurusan = status;
  if (bidang) filter.bidangKegiatan = bidang;
  return filter;
}

export async function listOrmas(params: {page?:number; pageSize?:number; search?:string; provinsi?:string; kabupaten?:string; tingkat?:string; status?:string; bidang?:string}) {
  await connectMongoDB();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(params.pageSize) || 20));
  const filter = buildFilter(params as unknown as Record<string, string | undefined>);
  const [total, docs] = await Promise.all([
    Ormas.countDocuments(filter),
    Ormas.find(filter).sort({ tanggalUpdate: -1, createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean<any>(),
  ]);
  return { data: docs.map(mapDoc), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getOrmas(id: string) {
  await connectMongoDB();
  let doc: any = null;
  if (/^[a-f\d]{24}$/i.test(id)) {
    doc = await Ormas.findOne({ _id: id, statusData: { $ne: 'Deleted' } }).lean<any>();
  } else {
    doc = await Ormas.findOne({ legacyId: id, statusData: { $ne: 'Deleted' } }).lean<any>();
  }
  return doc ? mapDoc(doc) : null;
}

export async function createOrmas(input: OrmasInput, username: string) {
  await connectMongoDB();
  const now = new Date();
  const doc = await Ormas.create({ ...input, jumlahAnggota: Number(input.jumlahAnggota || 0), tanggalInput: now, tanggalUpdate: now, userInput: username, userUpdate: username, statusData: 'Aktif' });
  return mapDoc(doc);
}

export async function updateOrmas(id: string, input: OrmasInput, username: string) {
  await connectMongoDB();
  const query: any = /^[a-f\d]{24}$/i.test(id) ? { _id: id, statusData: { $ne: 'Deleted' } } : { legacyId: id, statusData: { $ne: 'Deleted' } };
  const doc = await Ormas.findOneAndUpdate(query, { ...input, jumlahAnggota: Number(input.jumlahAnggota || 0), tanggalUpdate: new Date(), userUpdate: username }, { new: true }).lean<any>();
  return doc ? mapDoc(doc) : null;
}

export async function softDeleteOrmas(id: string, username: string) {
  await connectMongoDB();
  const query: any = /^[a-f\d]{24}$/i.test(id) ? { _id: id, statusData: { $ne: 'Deleted' } } : { legacyId: id, statusData: { $ne: 'Deleted' } };
  const doc = await Ormas.findOneAndUpdate(query, { statusData: 'Deleted', deletedAt: new Date(), tanggalUpdate: new Date(), userUpdate: username }, { new: true }).lean<any>();
  return doc ? { id: String(doc._id), legacyId: doc.legacyId || null } : null;
}

export async function exportOrmas(params: Record<string, string>) {
  await connectMongoDB();
  const docs = await Ormas.find(buildFilter(params)).sort({ tanggalUpdate: -1 }).lean<any>();
  return docs.map(mapDoc);
}

export async function getDashboardStats() {
  await connectMongoDB();
  const filter = { statusData: { $ne: 'Deleted' } };
  const [summary] = await Ormas.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: 1 }, pusat: { $sum: { $cond: [{ $eq: ['$statusKepengurusan', 'Pusat'] }, 1, 0] } }, cabang: { $sum: { $cond: [{ $eq: ['$statusKepengurusan', 'Cabang'] }, 1, 0] } }, nasional: { $sum: { $cond: [{ $eq: ['$tingkat', 'Nasional'] }, 1, 0] } } } }]);
  const [byProvinsi, byBidang, byTingkat, byWilayah] = await Promise.all([
    Ormas.aggregate([{ $match: { ...filter, provinsi: { $ne: '' } } }, { $group: { _id: '$provinsi', jumlah: { $sum: 1 } } }, { $sort: { jumlah: -1 } }]),
    Ormas.aggregate([{ $match: { ...filter, bidangKegiatan: { $ne: '' } } }, { $group: { _id: '$bidangKegiatan', jumlah: { $sum: 1 } } }, { $sort: { jumlah: -1 } }]),
    Ormas.aggregate([{ $match: filter }, { $group: { _id: '$tingkat', jumlah: { $sum: 1 } } }, { $sort: { jumlah: -1 } }]),
    Ormas.aggregate([{ $match: { ...filter, provinsi: { $ne: '' } } }, { $group: { _id: { provinsi: '$provinsi', kabupatenKota: '$kabupatenKota' }, jumlah: { $sum: 1 } } }]),
  ]);
  const provinsi: Record<string, number> = {}; byProvinsi.forEach((x: any) => { provinsi[x._id] = x.jumlah; });
  const bidang: Record<string, number> = {}; byBidang.forEach((x: any) => { bidang[x._id] = x.jumlah; });
  const tingkat: Record<string, number> = {}; byTingkat.forEach((x: any) => { tingkat[x._id] = x.jumlah; });
  const wilayah: Record<string, { total:number; kabupaten:Record<string,number> }> = {};
  byWilayah.forEach((x: any) => { const p = x._id.provinsi; const k = x._id.kabupatenKota; wilayah[p] ??= { total: 0, kabupaten: {} }; wilayah[p].total += x.jumlah; if (k) wilayah[p].kabupaten[k] = (wilayah[p].kabupaten[k] || 0) + x.jumlah; });
  return { total: summary?.total || 0, pusat: summary?.pusat || 0, cabang: summary?.cabang || 0, nasional: summary?.nasional || 0, provinsi, bidang, tingkat, wilayah };
}

export async function getBidangStats(provinsi = '', kabupaten = '') {
  await connectMongoDB();
  const filter: any = { statusData: { $ne: 'Deleted' }, bidangKegiatan: { $ne: '' } };
  if (provinsi) filter.provinsi = provinsi;
  if (kabupaten) filter.kabupatenKota = kabupaten;
  const rows = await Ormas.find(filter, { bidangKegiatan: 1, _id: 0 }).lean();
  const counts = new Map<string, number>();
  for (const row of rows) {
    const bidangDalamOrmas = new Set(
      String(row.bidangKegiatan)
        .split(/[,;|\n]+/)
        .map((bidang) => bidang.trim())
        .filter(Boolean),
    );
    for (const bidang of bidangDalamOrmas) counts.set(bidang, (counts.get(bidang) || 0) + 1);
  }
  const stats = [...counts.entries()]
    .map(([bidang, jumlah]) => ({ bidang, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
  const total = stats.reduce((sum, item) => sum + item.jumlah, 0);
  return stats.map((item) => ({ ...item, persentase: total ? Number((item.jumlah / total * 100).toFixed(2)) : 0 }));
}

export async function getLaporanBidang(params: {page?:number;pageSize?:number;provinsi?:string;kabupaten?:string}) {
  const stats = await getBidangStats(params.provinsi || '', params.kabupaten || '');
  const page = await listOrmas({ page: params.page, pageSize: params.pageSize, provinsi: params.provinsi, kabupaten: params.kabupaten });
  await connectMongoDB();
  const base: any = { statusData: { $ne: 'Deleted' } };
  if (params.provinsi) base.provinsi = params.provinsi;
  if (params.kabupaten) base.kabupatenKota = params.kabupaten;
  const [p, k] = await Promise.all([
    Ormas.distinct('provinsi', { ...base, tingkat: 'Provinsi', provinsi: { ...(base.provinsi ? { $eq: base.provinsi } : {}), $ne: '' } }),
    Ormas.distinct('kabupatenKota', { ...base, tingkat: 'Kabupaten/Kota', kabupatenKota: { ...(base.kabupatenKota ? { $eq: base.kabupatenKota } : {}), $ne: '' } }),
  ]);
  return {
    ...page,
    stats,
    totalProvinsi: p.length,
    totalKabupaten: k.length,
    jumlahProvinsiIndonesia: JUMLAH_PROVINSI_INDONESIA,
    jumlahKabupatenKotaIndonesia: JUMLAH_KABUPATEN_KOTA_INDONESIA,
    persentaseProvinsi: Number((p.length / JUMLAH_PROVINSI_INDONESIA * 100).toFixed(2)),
    persentaseKabupaten: Number((k.length / JUMLAH_KABUPATEN_KOTA_INDONESIA * 100).toFixed(2)),
  };
}

export async function getWilayahRecap() {
  const stats = await getDashboardStats();
  return Object.entries(stats.wilayah).map(([provinsi, v]) => ({ provinsi, total: v.total, kabupaten: Object.entries(v.kabupaten).map(([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => Number(b.jumlah) - Number(a.jumlah)) })).sort((a, b) => b.total - a.total);
}
