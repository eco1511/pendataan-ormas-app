import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { connectMongoDB, mongoose } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Province } from '@/models/Province';
import { PROVINCES } from '@/lib/utils';
import { migrateOrmasFile } from '@/lib/migrate-ormas';
import { migrateUsersFile } from '@/lib/migrate-users';

async function main() {
  await connectMongoDB();

  const users = [
    ['admin', 'admin123', 'Administrator Utama', 'Administrator'],
    ['operator', 'operator123', 'Operator Data', 'Operator'],
    ['viewer', 'viewer123', 'Pimpinan', 'Viewer'],
  ] as const;

  for (const [username, password, name, role] of users) {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate(
      { username },
      { username, passwordHash, name, role, status: 'Aktif' },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  await Province.bulkWrite(PROVINCES.map((namaProvinsi) => ({
    updateOne: {
      filter: { namaProvinsi },
      update: { $setOnInsert: { namaProvinsi } },
      upsert: true,
    },
  })));

  const bundledFile = path.join(process.cwd(), 'data', 'DATA_ORMAS.xlsx');
  let imported = 0;
  let importedUsers = 0;
  if (fs.existsSync(bundledFile)) {
    importedUsers = await migrateUsersFile(bundledFile);
    imported = await migrateOrmasFile(bundledFile);
  }

  console.log('Setup selesai.');
  console.log('Login: admin/admin123 | operator/operator123 | viewer/viewer123');
  console.log(`MongoDB: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
  console.log(`Users diimpor dari data/DATA_ORMAS.xlsx: ${importedUsers.toLocaleString('id-ID')}`);
  console.log(`Total users: ${await User.countDocuments()}`);
  console.log(`Data Ormas dari data/DATA_ORMAS.xlsx: ${imported.toLocaleString('id-ID')}`);
  console.log(`Total data Ormas di database: ${await (await import('@/models/Ormas')).Ormas.countDocuments({ statusData: { $ne: 'Deleted' } })}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
