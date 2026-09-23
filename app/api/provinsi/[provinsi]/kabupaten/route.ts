import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { Regency } from '@/models/Regency';

export async function GET(_req:Request,{params}:{params:Promise<{provinsi:string}>}){
  const user=await getSession(); if(!user)return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  try{
    const {provinsi}=await params;
    await connectMongoDB();
    const rows=await Regency.find({provinsi:decodeURIComponent(provinsi)},{namaKabupatenKota:1,_id:0}).sort({namaKabupatenKota:1}).lean();
    return NextResponse.json({success:true,data:rows.map((x:any)=>x.namaKabupatenKota)});
  }catch(e:any){return NextResponse.json({success:false,message:e?.message||'Gagal.'},{status:500});}
}
