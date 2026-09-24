import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, hasRole } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { logActivity } from '@/services/activity.service';

export async function GET() {
  const session = await getSession();
  if (!hasRole(session, ['Administrator'])) {
    return NextResponse.json({ success: false, message: 'Hanya Administrator yang dapat melihat daftar akun.' }, { status: 403 });
  }

  try {
    await connectMongoDB();
    const users = await User.find(
      {},
      { username: 1, name: 1, role: 1, status: 1, createdAt: 1, _id: 0 },
    ).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Gagal memuat daftar akun.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!hasRole(session, ['Administrator'])) {
    return NextResponse.json({ success: false, message: 'Hanya Administrator yang dapat menambah akun.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const username = String(body?.username ?? '').trim();
    const name = String(body?.name ?? '').replace(/\s+/g, ' ').trim();
    const password = String(body?.password ?? '');
    const role = String(body?.role ?? 'Viewer');
    if (!username || !name || !password) return NextResponse.json({ success: false, message: 'Username, nama, dan password wajib diisi.' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ success: false, message: 'Password minimal 6 karakter.' }, { status: 400 });
    if (!['Administrator', 'Operator', 'Viewer'].includes(role)) return NextResponse.json({ success: false, message: 'Role tidak valid.' }, { status: 400 });

    await connectMongoDB();
    const duplicate = await User.exists({ username });
    if (duplicate) return NextResponse.json({ success: false, message: 'Username sudah digunakan.' }, { status: 409 });
    await User.create({ username, name, role, status: 'Aktif', passwordHash: await bcrypt.hash(password, 12) });
    await logActivity(session.username, 'Tambah Akun', username, `Membuat akun ${role}`);
    return NextResponse.json({ success: true, message: 'Akun berhasil ditambahkan.' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Gagal menambah akun.' }, { status: 400 });
  }
}
