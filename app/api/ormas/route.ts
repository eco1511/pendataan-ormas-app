import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { listOrmas, createOrmas } from '@/services/ormas.service';
import { logActivity } from '@/services/activity.service';
import { ormasSchema, querySchema } from '@/lib/validations';

export async function GET(req:Request){
  const user=await getSession(); if(!user) return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  try { const u=new URL(req.url); const parsed=querySchema.parse(Object.fromEntries(u.searchParams)); const r=await listOrmas(parsed); return NextResponse.json({success:true,...r}); }
  catch(e:any){ return NextResponse.json({success:false,message:e?.message||'Gagal mengambil data.'},{status:400}); }
}
export async function POST(req:Request){
  const user=await getSession(); if(!hasRole(user,['Administrator','Operator'])) return NextResponse.json({success:false,message:'Anda tidak memiliki akses.'},{status:403});
  try { const input=ormasSchema.parse(await req.json()); const doc=await createOrmas(input,user.username); await logActivity(user.username,'Tambah',String(doc._id),'Menambahkan data ormas baru'); return NextResponse.json({success:true,data:doc,message:'Data berhasil ditambahkan.'},{status:201}); }
  catch(e:any){return NextResponse.json({success:false,message:e?.issues?.[0]?.message||e?.message||'Gagal menyimpan data.'},{status:400});}
}
