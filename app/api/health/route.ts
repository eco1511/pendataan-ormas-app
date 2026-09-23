import { NextResponse } from 'next/server';
import { connectMongoDB, mongoose } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
  try {
    await connectMongoDB();
    const users = await User.countDocuments();
    return NextResponse.json({
      success: true,
      mongodb: {
        connected: mongoose.connection.readyState === 1,
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      },
      users,
      authSecretConfigured: Boolean(process.env.AUTH_SECRET || process.env.NODE_ENV !== 'production'),
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      message: e?.message || 'MongoDB tidak dapat dihubungi.',
      hint: 'Pastikan MongoDB Server berjalan dan MONGODB_URI benar.',
    }, { status: 500 });
  }
}
