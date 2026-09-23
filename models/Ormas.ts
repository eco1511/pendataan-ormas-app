import { Schema, model, models, type InferSchemaType } from 'mongoose';

const ormasSchema = new Schema({
  legacyId: { type: String, trim: true, index: true, sparse: true },
  namaOrmas: { type: String, required: true, trim: true, index: true },
  nomorSkt: { type: String, default: '', trim: true, index: true },
  periode: { type: String, default: '' },
  statusKepengurusan: { type: String, enum: ['Pusat', 'Cabang', ''], default: '', index: true },
  ketua: { type: String, default: '', trim: true, index: true },
  sekretaris: { type: String, default: '' },
  bendahara: { type: String, default: '' },
  jumlahAnggota: { type: Number, min: 0, default: 0 },
  alamat: { type: String, default: '' },
  nomorTelepon: { type: String, default: '' },
  bidangKegiatan: { type: String, default: '', trim: true, index: true },
  detailKegiatan: { type: String, default: '' },
  tingkat: { type: String, enum: ['Nasional', 'Provinsi', 'Kabupaten/Kota', ''], default: '', index: true },
  provinsi: { type: String, default: '', trim: true, index: true },
  kabupatenKota: { type: String, default: '', trim: true, index: true },
  tanggalInput: { type: Date, default: Date.now },
  tanggalUpdate: { type: Date, default: Date.now },
  userInput: { type: String, default: '' },
  userUpdate: { type: String, default: '' },
  statusData: { type: String, enum: ['Aktif', 'Deleted'], default: 'Aktif', index: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

ormasSchema.index({ namaOrmas: 1, nomorSkt: 1 });
ormasSchema.index({ provinsi: 1, kabupatenKota: 1, statusData: 1 });
ormasSchema.index({ statusData: 1, tanggalUpdate: -1 });

export type OrmasDocument = InferSchemaType<typeof ormasSchema> & { _id: unknown };
export const Ormas = models.Ormas || model('Ormas', ormasSchema);
