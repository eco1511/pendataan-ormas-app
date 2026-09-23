import { Schema, model, models, type InferSchemaType } from 'mongoose';

const regencySchema = new Schema({
  namaKabupatenKota: { type: String, required: true, trim: true },
  provinsi: { type: String, required: true, trim: true, index: true },
  kode: { type: String, default: '' },
  tipe: { type: String, enum: ['Kabupaten', 'Kota', ''], default: '' },
}, { timestamps: true, versionKey: false });

regencySchema.index({ provinsi: 1, namaKabupatenKota: 1 }, { unique: true });

export type RegencyDocument = InferSchemaType<typeof regencySchema> & { _id: unknown };
export const Regency = models.Regency || model('Regency', regencySchema);
