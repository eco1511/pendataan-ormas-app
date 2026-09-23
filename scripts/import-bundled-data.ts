import 'dotenv/config';
import path from 'node:path';
import { mongoose } from '@/lib/mongodb';
import { migrateOrmasFile } from '@/lib/migrate-ormas';
import { migrateUsersFile } from '@/lib/migrate-users';

async function main() {
  const file = path.join(process.cwd(), 'data', 'DATA_ORMAS.xlsx');
  const users = await migrateUsersFile(file);
  const count = await migrateOrmasFile(file);
  console.log(`Data bundled selesai: ${count.toLocaleString('id-ID')} data Ormas, ${users.toLocaleString('id-ID')} user.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
