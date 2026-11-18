import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { BidangKegiatan } from '@/models/BidangKegiatan';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectMongoDB();
    const records = await BidangKegiatan.find({}, { namaBidang: 1, _id: 0 })
      .sort({ urutan: 1 })
      .lean();
    return NextResponse.json({ success: true, data: records.map((record) => record.namaBidang) });
  } catch (error: any) {
    console.error('BIDANG_KEGIATAN_LOAD_ERROR', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memuat master bidang kegiatan.' },
      { status: 500 },
    );
  }
}
