import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getLaporanBidang } from '@/services/ormas.service';
export async function GET(req:Request){const user=await getSession();if(!user)return NextResponse.json({success:false,message:'Unauthorized'},{status:401});const u=new URL(req.url);try{const r=await getLaporanBidang({page:Number(u.searchParams.get('page')||1),pageSize:Number(u.searchParams.get('pageSize')||20),provinsi:u.searchParams.get('provinsi')||'',kabupaten:u.searchParams.get('kabupaten')||''});return NextResponse.json({success:true,...r});}catch(e:any){return NextResponse.json({success:false,message:e?.message||'Gagal.'},{status:400});}}
