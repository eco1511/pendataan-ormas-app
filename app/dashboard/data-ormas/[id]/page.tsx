import { requireSession } from '@/lib/auth';
import { getOrmas } from '@/services/ormas.service';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3 } from 'lucide-react';

export default async function DetailPage({params}:{params:Promise<{id:string}>}){
  await requireSession();
  const {id}=await params;
  const d=await getOrmas(id);
  if(!d)notFound();
  const items=[
    ['Nama Ormas',d.namaOrmas],['Nomor SKT/BH',d.nomorSkt],['Bidang Kegiatan',d.bidangKegiatan],['Detail Kegiatan',d.detailKegiatan],
    ['Tingkat',d.tingkat],['Status Kepengurusan',d.statusKepengurusan],['Ketua',d.ketua],['Sekretaris',d.sekretaris],['Bendahara',d.bendahara],
    ['Jumlah Anggota',d.jumlahAnggota],['Provinsi',d.provinsi],['Kabupaten/Kota',d.kabupatenKota],['Alamat',d.alamat],['Telepon',d.nomorTelepon],
    ['Periode',d.periode],['Tanggal Input',new Date(d.tanggalInput).toLocaleString('id-ID')],['Tanggal Update',new Date(d.tanggalUpdate).toLocaleString('id-ID')],
    ['User Input',d.userInput],['User Update',d.userUpdate],['Status Data',d.statusData]
  ];
  return <div className="space-y-5"><div className="flex items-center justify-between"><Link href="/dashboard/data-ormas" className="flex items-center gap-2 text-sm text-blue-700"><ArrowLeft size={17}/>Kembali</Link><Link href={'/dashboard/data-ormas?edit='+d._id} className="flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2 text-sm font-semibold text-white"><Edit3 size={16}/>Edit</Link></div><div className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="text-xl font-bold">Detail Informasi Ormas</h1><div className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">{items.map(([k,v])=><div key={k} className="border-b pb-3"><div className="text-xs text-gray-500">{k}</div><div className="mt-1 font-medium">{String(v||'-')}</div></div>)}</div></div></div>
}
