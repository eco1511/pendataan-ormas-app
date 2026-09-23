import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDashboardStats } from '@/services/ormas.service';
export async function GET(){ const user=await getSession(); if(!user)return NextResponse.json({success:false,message:'Unauthorized'},{status:401}); try{return NextResponse.json({success:true,...await getDashboardStats()});}catch(e:any){return NextResponse.json({success:false,message:e?.message||'Gagal memuat dashboard.'},{status:500});}}
