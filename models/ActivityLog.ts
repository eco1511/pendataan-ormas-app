import { Schema, model, models, type InferSchemaType } from 'mongoose';

const activityLogSchema = new Schema({
  username: { type: String, required: true, index: true },
  aktivitas: { type: String, required: true, index: true },
  idData: { type: String, default: '-' },
  waktu: { type: Date, default: Date.now, index: true },
  keterangan: { type: String, default: '' },
}, { versionKey: false });

activityLogSchema.index({ waktu: -1 });

export type ActivityLogDocument = InferSchemaType<typeof activityLogSchema> & { _id: unknown };
export const ActivityLog = models.ActivityLog || model('ActivityLog', activityLogSchema);
