import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { Ormas } from '@/models/Ormas';
import { PROVINCES } from '@/lib/utils';
import { logActivity } from '@/services/activity.service';

const REQUIRED=['namaOrmas','nomorSkt','bidangKegiatan','statusKepengurusan','ketua','tingkat','alamat'];
const clean=(v:any)=>String(v??'').replace(/\s+/g,' ').trim();
const key=(nama:string,skt:string)=>`${clean(nama).toLowerCase()}|${clean(skt).toLowerCase()}`;

export async function POST(req:Request){
  const user=await getSession(); if(!hasRole(user,['Administrator','Operator']))return NextResponse.json({success:false,message:'Anda tidak memiliki akses.'},{status:403});
  try{
    const body=await req.json(); const rows=Array.isArray(body?.data)?body.data:[];
    if(!rows.length)return NextResponse.json({success:false,message:'Tidak ada data untuk diimpor.'},{status:400});
    if(rows.length>5000)return NextResponse.json({success:false,message:'Maksimal 5.000 baris per proses import.'},{status:400});
    await connectMongoDB();
    const existingRows=await Ormas.find({statusData:{$ne:'Deleted'}},{namaOrmas:1,nomorSkt:1,_id:0}).lean();
    const existingKeys=new Set(existingRows.map((x:any)=>key(x.namaOrmas,x.nomorSkt)));
    const inFile=new Set<string>(); const errors:any[]=[]; const valid:any[]=[];
    for(let i=0;i<rows.length;i++){
      const raw=rows[i]||{}; const d:any={}; Object.entries(raw).forEach(([k,v])=>d[k]=clean(v)); const e:string[]=[];
      for(const f of REQUIRED) if(!d[f]) e.push(f+' wajib diisi');
      if(d.statusKepengurusan&&!['Pusat','Cabang'].includes(d.statusKepengurusan))e.push('Status Kepengurusan harus Pusat atau Cabang');
      if(d.tingkat&&!['Nasional','Provinsi','Kabupaten/Kota'].includes(d.tingkat))e.push('Tingkat tidak valid');
      if(d.provinsi&&!PROVINCES.some(p=>p.toLowerCase()===d.provinsi.toLowerCase()))e.push('Provinsi tidak ditemukan pada master');
      if(d.jumlahAnggota!==undefined&&d.jumlahAnggota!==''){const n=Number(String(d.jumlahAnggota).replace(/[^0-9-]/g,''));if(!Number.isFinite(n)||n<0)e.push('Jumlah Anggota harus berupa angka');else d.jumlahAnggota=Math.floor(n);}else d.jumlahAnggota=0;
      const k=key(d.namaOrmas,d.nomorSkt); if(!e.length&&inFile.has(k))e.push('Duplikat dengan baris lain pada file import'); if(!e.length&&existingKeys.has(k))e.push('Nama Ormas + Nomor SKT sudah terdaftar');
      if(e.length){errors.push({row:i+2,message:e.join('; ')});continue;} inFile.add(k);
      valid.push({namaOrmas:d.namaOrmas,nomorSkt:d.nomorSkt,periode:d.periode||'',statusKepengurusan:d.statusKepengurusan,ketua:d.ketua,sekretaris:d.sekretaris||'',bendahara:d.bendahara||'',jumlahAnggota:d.jumlahAnggota,alamat:d.alamat,nomorTelepon:d.nomorTelepon||'',bidangKegiatan:d.bidangKegiatan,detailKegiatan:d.detailKegiatan||'',tingkat:d.tingkat,provinsi:d.provinsi||'',kabupatenKota:d.kabupatenKota||'',userInput:user.username,userUpdate:user.username,statusData:'Aktif',tanggalInput:new Date(),tanggalUpdate:new Date()});
    }
    if(valid.length) await Ormas.insertMany(valid,{ordered:false});
    await logActivity(user.username,'Import','-',`Mengimpor ${valid.length} data ormas; ${errors.length} baris dilewati`);
    return NextResponse.json({success:valid.length>0,count:valid.length,skipped:errors.length,errors:errors.slice(0,100),message:`${valid.length} data berhasil diimpor.${errors.length?` ${errors.length} baris dilewati karena tidak valid.`:''}`},{status:valid.length?200:400});
  }catch(e:any){return NextResponse.json({success:false,message:e?.message||'Import gagal.'},{status:500});}
}
