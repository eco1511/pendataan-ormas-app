import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectMongoDB, mongoose } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Province } from '@/models/Province';
import { BidangKegiatan } from '@/models/BidangKegiatan';
import { PROVINCES } from '@/lib/utils';
import { BIDANG_KEGIATAN } from '@/lib/ormas-master-data';

async function main(){
  await connectMongoDB();
  const users=[
    ['admin','admin123','Administrator Utama','Administrator'],
    ['operator','operator123','Operator Data','Operator'],
    ['viewer','viewer123','Pimpinan','Viewer'],
  ] as const;
  for(const [username,password,name,role] of users){
    const passwordHash=await bcrypt.hash(password,12);
    await User.findOneAndUpdate({username},{username,passwordHash,name,role,status:'Aktif'},{upsert:true,new:true,setDefaultsOnInsert:true});
  }
  await Province.bulkWrite(PROVINCES.map(namaProvinsi=>({updateOne:{filter:{namaProvinsi},update:{$setOnInsert:{namaProvinsi}},upsert:true}})));
  await BidangKegiatan.bulkWrite(BIDANG_KEGIATAN.map((namaBidang,urutan)=>({updateOne:{filter:{namaBidang},update:{$set:{urutan},$setOnInsert:{namaBidang}},upsert:true}})));
  console.log(`Seed selesai. 3 user development + ${PROVINCES.length} provinsi siap.`);
  console.log('Development login: admin/admin123, operator/operator123, viewer/viewer123');
  await mongoose.disconnect();
}
main().catch(e=>{console.error(e);process.exit(1)});
