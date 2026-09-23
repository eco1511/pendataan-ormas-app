import 'dotenv/config';
import { mongoose } from '@/lib/mongodb';
import { migrateOrmasFile } from '@/lib/migrate-ormas';

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Gunakan: npm run migrate-data -- ./DATA_ORMAS.xlsx');
  const count = await migrateOrmasFile(file);
  console.log(`Migrasi selesai: ${count.toLocaleString('id-ID')} data Ormas.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
