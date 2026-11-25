import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { BidangKegiatan } from '@/models/BidangKegiatan';
import { BIDANG_KEGIATAN } from '@/lib/ormas-master-data';

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
    const databaseValues = records
      .map((record) => String(record.namaBidang || '').trim())
      .filter(Boolean);
    const data = [...new Set([...BIDANG_KEGIATAN, ...databaseValues])];
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('BIDANG_KEGIATAN_LOAD_ERROR', error);
    return NextResponse.json(
      { success: true, data: [...BIDANG_KEGIATAN] },
    );
  }
}
