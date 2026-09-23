import { z } from 'zod';

export const ormasSchema = z.object({
  namaOrmas: z.string().trim().min(1, 'Nama Ormas wajib diisi.'),
  nomorSkt: z.string().trim().min(1, 'Nomor SKT/BH wajib diisi.'),
  periode: z.string().trim().optional().default(''),
  statusKepengurusan: z.enum(['Pusat', 'Cabang']),
  ketua: z.string().trim().min(1, 'Ketua wajib diisi.'),
  sekretaris: z.string().trim().optional().default(''),
  bendahara: z.string().trim().optional().default(''),
  jumlahAnggota: z.coerce.number().int().min(0).default(0),
  alamat: z.string().trim().min(1, 'Alamat wajib diisi.'),
  nomorTelepon: z.string().trim().optional().default(''),
  bidangKegiatan: z.string().trim().min(1, 'Bidang Kegiatan wajib diisi.'),
  detailKegiatan: z.string().trim().optional().default(''),
  tingkat: z.enum(['Nasional', 'Provinsi', 'Kabupaten/Kota']),
  provinsi: z.string().trim().min(1, 'Provinsi wajib diisi.'),
  kabupatenKota: z.string().trim().optional().default(''),
});

export const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(20),
  search: z.string().trim().optional().default(''),
  provinsi: z.string().trim().optional().default(''),
  kabupaten: z.string().trim().optional().default(''),
  tingkat: z.string().trim().optional().default(''),
  status: z.string().trim().optional().default(''),
  bidang: z.string().trim().optional().default(''),
});
