import { NextResponse } from 'next/server';
import { getRequestSession, SESSION_COOKIE } from '@/lib/auth';
import { logActivity } from '@/services/activity.service';
import type { NextRequest } from 'next/server';
export async function POST(req:NextRequest){
  try { const s=await getRequestSession(req); if(s) await logActivity(s.username,'Logout','-','User keluar dari aplikasi'); } catch {}
  const res=NextResponse.json({success:true,message:'Berhasil logout.'});
  res.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
  return res;
}
