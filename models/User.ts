import { Schema, model, models, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['Administrator', 'Operator', 'Viewer'], required: true, index: true },
  status: { type: String, enum: ['Aktif', 'Tidak Aktif'], default: 'Aktif', index: true },
}, { timestamps: true });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: unknown };
export const User = models.User || model('User', userSchema);
