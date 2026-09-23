import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';
import { connectMongoDB } from '@/lib/mongodb';
import { User } from '@/models/User';

function clean(value: unknown) {
  return String(value ?? '').trim();
}

export async function migrateUsersFile(filePath: string) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) throw new Error(`File tidak ditemukan: ${fullPath}`);

  await connectMongoDB();
  const workbook = XLSX.read(fs.readFileSync(fullPath), { type: 'buffer', raw: false });
  const sheetName = workbook.SheetNames.find((name) => name.trim().toLowerCase() === 'users');
  if (!sheetName) return 0;

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });
  let count = 0;
  for (const row of rows) {
    const username = clean(row.Username);
    const password = clean(row.Password);
    if (!username || !password) continue;

    const existing = await User.findOne({ username }).lean();
    const passwordHash = existing && await bcrypt.compare(password, existing.passwordHash)
      ? existing.passwordHash
      : await bcrypt.hash(password, 12);
    await User.findOneAndUpdate(
      { username },
      {
        username,
        passwordHash,
        name: clean(row.Nama) || username,
        role: clean(row.Role) || 'Viewer',
        status: clean(row.Status) === 'Tidak Aktif' ? 'Tidak Aktif' : 'Aktif',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    count += 1;
  }

  return count;
}