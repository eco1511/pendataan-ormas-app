import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectMongoDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { createSession, SESSION_COOKIE, type SessionUser } from '@/lib/auth';
import { logActivity } from '@/services/activity.service';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const cleanUsername = String(username || '').trim();
    if (!cleanUsername || !password) return NextResponse.json({success:false,message:'Username dan password wajib diisi.'},{status:400});
    await connectMongoDB();
    const user = await User.findOne({ username: cleanUsername, status: 'Aktif' }).lean<any>();
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) return NextResponse.json({success:false,message:'Username atau password salah / tidak aktif.'},{status:401});
    const sessionUser:SessionUser = {id:String(user._id), username:user.username, name:user.name, role:user.role};
    const token = await createSession(sessionUser);
    const res = NextResponse.json({success:true,user:sessionUser});
    res.cookies.set(SESSION_COOKIE, token, {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*8});
    await logActivity(user.username,'Login','-','User berhasil login');
    return res;
  } catch(e:any) {
    console.error('LOGIN_ERROR', e);
    const message = String(e?.message || 'Login gagal.');
    const friendly = message.includes('ECONNREFUSED') || message.includes('MongooseServerSelectionError')
      ? 'MongoDB tidak dapat dihubungi. Pastikan MongoDB Server berjalan di 127.0.0.1:27017.'
      : message;
    return NextResponse.json({success:false,message:friendly},{status:500});
  }
}
