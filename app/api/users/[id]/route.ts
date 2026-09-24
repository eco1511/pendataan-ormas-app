import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession, hasRole } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { logActivity } from '@/services/activity.service';

async function requireAdministrator() {
  const session = await getSession();
  if (!hasRole(session, ['Administrator'])) return null;
  return session;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdministrator();
  if (!session) return NextResponse.json({ success: false, message: 'Hanya Administrator yang dapat melihat akun.' }, { status: 403 });

  try {
    await connectMongoDB();
    const { id } = await params;
    const user = await User.findById(id, { username: 1, name: 1, role: 1, status: 1, createdAt: 1 }).lean<any>();
    if (!user) return NextResponse.json({ success: false, message: 'Akun tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ success: true, user: { ...user, id: String(user._id) } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Gagal memuat akun.' }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdministrator();
  if (!session) return NextResponse.json({ success: false, message: 'Hanya Administrator yang dapat mengubah akun.' }, { status: 403 });

  try {
    const body = await req.json();
    const name = String(body?.name ?? '').replace(/\s+/g, ' ').trim();
    const role = String(body?.role ?? 'Viewer');
    const status = String(body?.status ?? 'Aktif');
    const password = String(body?.password ?? '');
    if (!name) return NextResponse.json({ success: false, message: 'Nama wajib diisi.' }, { status: 400 });
    if (!['Administrator', 'Operator', 'Viewer'].includes(role)) return NextResponse.json({ success: false, message: 'Role tidak valid.' }, { status: 400 });
    if (!['Aktif', 'Tidak Aktif'].includes(status)) return NextResponse.json({ success: false, message: 'Status tidak valid.' }, { status: 400 });
    if (password && password.length < 6) return NextResponse.json({ success: false, message: 'Password minimal 6 karakter.' }, { status: 400 });

    await connectMongoDB();
    const { id } = await params;
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ success: false, message: 'Akun tidak ditemukan.' }, { status: 404 });
    user.name = name;
    user.role = role as typeof user.role;
    user.status = status as typeof user.status;
    if (password) user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    await logActivity(session.username, 'Update Akun', user.username, `Memperbarui akun ${role}`);
    return NextResponse.json({ success: true, message: 'Akun berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Gagal memperbarui akun.' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdministrator();
  if (!session) return NextResponse.json({ success: false, message: 'Hanya Administrator yang dapat menghapus akun.' }, { status: 403 });

  try {
    await connectMongoDB();
    const { id } = await params;
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ success: false, message: 'Akun tidak ditemukan.' }, { status: 404 });
    if (user.username === session.username) return NextResponse.json({ success: false, message: 'Akun yang sedang digunakan tidak dapat dihapus.' }, { status: 400 });
    await user.deleteOne();
    await logActivity(session.username, 'Hapus Akun', user.username, 'Menghapus akun pengguna');
    return NextResponse.json({ success: true, message: 'Akun berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Gagal menghapus akun.' }, { status: 400 });
  }
}
