import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, createSession, SESSION_COOKIE, type SessionUser } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { logActivity } from '@/services/activity.service';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  await connectMongoDB();
  const user = await User.findById(session.id, { username: 1, name: 1, role: 1, status: 1, _id: 0 }).lean();
  if (!user) return NextResponse.json({ success: false, message: 'Akun tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ success: true, user });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const name = String(body?.name ?? '').replace(/\s+/g, ' ').trim();
    const currentPassword = String(body?.currentPassword ?? '');
    const newPassword = String(body?.newPassword ?? '');
    if (!name) return NextResponse.json({ success: false, message: 'Nama wajib diisi.' }, { status: 400 });
    if (newPassword && newPassword.length < 6) return NextResponse.json({ success: false, message: 'Password baru minimal 6 karakter.' }, { status: 400 });

    await connectMongoDB();
    const user = await User.findById(session.id);
    if (!user) return NextResponse.json({ success: false, message: 'Akun tidak ditemukan.' }, { status: 404 });
    if (newPassword && !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ success: false, message: 'Password saat ini salah.' }, { status: 400 });
    }

    user.name = name;
    if (newPassword) user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    await logActivity(user.username, 'Update Akun', user.username, 'Memperbarui pengaturan akun');

    const nextSession: SessionUser = { id: String(user._id), username: user.username, name: user.name, role: user.role };
    const response = NextResponse.json({ success: true, user: nextSession, message: 'Pengaturan akun berhasil disimpan.' });
    response.cookies.set(SESSION_COOKIE, await createSession(nextSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Gagal memperbarui akun.' }, { status: 400 });
  }
}
