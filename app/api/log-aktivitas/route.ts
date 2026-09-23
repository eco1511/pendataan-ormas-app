import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';

export async function GET(req:Request){
  const user=await getSession(); if(!user||user.role!=='Administrator')return NextResponse.json({success:false,message:'Akses khusus Administrator.'},{status:403});
  try{
    await connectMongoDB();
    const u=new URL(req.url);
    const page=Math.max(1,Number(u.searchParams.get('page')||1)), pageSize=20, search=(u.searchParams.get('search')||'').trim();
    const filter:any={};
    if(search){const rx=new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');filter.$or=[{username:rx},{aktivitas:rx},{keterangan:rx}];}
    const [total,docs]=await Promise.all([ActivityLog.countDocuments(filter),ActivityLog.find(filter).sort({waktu:-1,_id:-1}).skip((page-1)*pageSize).limit(pageSize).lean()]);
    const rows=docs.map((x:any)=>({id:String(x._id),username:x.username,aktivitas:x.aktivitas,idData:x.idData,waktu:x.waktu,keterangan:x.keterangan}));
    return NextResponse.json({success:true,data:rows,total,page,pageSize,totalPages:Math.ceil(total/pageSize)});
  }catch(e:any){return NextResponse.json({success:false,message:e?.message||'Gagal.'},{status:500});}
}
