import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { Ormas } from '@/models/Ormas';
import { logActivity } from '@/services/activity.service';
import crypto from 'crypto';

const clean = (v: any) =>
  String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim();

export async function POST(req: Request) {
  const user = await getSession();

  if (!hasRole(user, ['Administrator', 'Operator'])) {
    return NextResponse.json(
      {
        success: false,
        message: 'Anda tidak memiliki akses.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Semua baris dari file tetap diproses
    const rows = Array.isArray(body?.data) ? body.data : [];

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak ada data untuk diimpor.',
        },
        { status: 400 }
      );
    }

    if (rows.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Maksimal 5.000 baris per proses import.',
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const batchImportId = crypto.randomUUID();

    const documents = rows.map((raw: any, index: number) => {
      const d: any = {};

      // Normalisasi semua field
      Object.entries(raw || {}).forEach(([key, value]) => {
        d[key] = clean(value);
      });

      // Jumlah anggota
      let jumlahAnggota: number | null = null;

      if (
        d.jumlahAnggota !== undefined &&
        d.jumlahAnggota !== ''
      ) {
        const parsed = Number(
          String(d.jumlahAnggota).replace(/[^0-9-]/g, '')
        );

        jumlahAnggota = Number.isFinite(parsed)
          ? Math.floor(parsed)
          : null;
      }

      // SEMUA DATA DISIMPAN
      return {
        namaOrmas: d.namaOrmas || '',
        nomorSkt: d.nomorSkt || '',
        periode: d.periode || '',

        statusKepengurusan:
          d.statusKepengurusan || '',

        ketua: d.ketua || '',
        sekretaris: d.sekretaris || '',
        bendahara: d.bendahara || '',

        jumlahAnggota,

        alamat: d.alamat || '',
        nomorTelepon: d.nomorTelepon || '',

        bidangKegiatan:
          d.bidangKegiatan || '',

        detailKegiatan:
          d.detailKegiatan || '',

        tingkat: d.tingkat || '',

        provinsi:
          d.provinsi || '',

        kabupatenKota:
          d.kabupatenKota || '',

        // Data sistem
        userInput: user.username,
        userUpdate: user.username,

        statusData: 'Aktif',

        tanggalInput: new Date(),
        tanggalUpdate: new Date(),

        // Informasi import
        batchImportId,
        nomorBarisImport: index + 2,

        // Simpan data asli Excel
        dataAsliImport: raw,
      };
    });

    /*
     * SEMUA DATA DISIMPAN
     *
     * Tidak ada validasi yang membuang baris.
     * Data kosong tetap masuk.
     * Data tidak valid tetap masuk.
     * Data duplikat tetap masuk.
     */
    await Ormas.collection.insertMany(documents, {
      ordered: false,
    });

    // Log aktivitas
    await logActivity(
      user.username,
      'Import',
      '-',
      `Mengimpor ${documents.length} data Ormas. Batch: ${batchImportId}`
    );

    // Response sederhana
    return NextResponse.json(
      {
        success: true,
        batchImportId,
        total: documents.length,
        message: 'Import data berhasil.',
      },
      { status: 200 }
    );

  } catch (e: any) {
    console.error('IMPORT ORMAS ERROR:', e);

    return NextResponse.json(
      {
        success: false,
        message: e?.message || 'Import gagal.',
      },
      { status: 500 }
    );
  }
}