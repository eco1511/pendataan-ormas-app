import { Schema, model, models, type InferSchemaType } from 'mongoose';

const bidangKegiatanSchema = new Schema({
  namaBidang: { type: String, required: true, unique: true, trim: true },
  urutan: { type: Number, required: true, index: true },
}, { timestamps: true, versionKey: false });

export type BidangKegiatanDocument = InferSchemaType<typeof bidangKegiatanSchema> & { _id: unknown };
export const BidangKegiatan = models.BidangKegiatan || model('BidangKegiatan', bidangKegiatanSchema);
