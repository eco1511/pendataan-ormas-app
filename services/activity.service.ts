import { connectMongoDB } from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';

export async function logActivity(username: string, aktivitas: string, idData = '-', keterangan = '') {
  await connectMongoDB();
  await ActivityLog.create({ username, aktivitas, idData, keterangan });
}
