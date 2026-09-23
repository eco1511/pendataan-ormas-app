import { Schema, model, models, type InferSchemaType } from 'mongoose';

const provinceSchema = new Schema({
  namaProvinsi: { type: String, required: true, unique: true, trim: true, index: true },
  kode: { type: String, default: '' },
}, { timestamps: true, versionKey: false });

export type ProvinceDocument = InferSchemaType<typeof provinceSchema> & { _id: unknown };
export const Province = models.Province || model('Province', provinceSchema);
