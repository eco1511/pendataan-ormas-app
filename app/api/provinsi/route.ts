import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { Province } from '@/models/Province';
import { PROVINCES } from '@/lib/utils';

export async function GET(){
  const user=await getSession(); if(!user)return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  try{
    await connectMongoDB();
    const rows=await Province.find({}, {namaProvinsi:1,_id:0}).sort({namaProvinsi:1}).lean();
    const data=rows.length?rows.map((x:any)=>x.namaProvinsi):PROVINCES;
    return NextResponse.json({success:true,data});
  }catch(e:any){return NextResponse.json({success:true,data:PROVINCES});}
}
