import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { connectMongoDB, mongoose } from '@/lib/mongodb';
import { Regency } from '@/models/Regency';
function norm(v:any){return String(v??'').trim().replace(/\s+/g,' ');}
function canon(v:any){return norm(v).toLowerCase().replace(/[\/_.-]+/g,' ').replace(/\s+/g,' ')}
const aliases:Record<string,string>={'provinsi':'provinsi','kabupaten kota':'namaKabupatenKota','kabupaten':'namaKabupatenKota','kota':'namaKabupatenKota','kode':'kode','tipe':'tipe'};
async function main(){
  const file=process.argv[2]; if(!file)throw new Error('Gunakan: npm run import-wilayah -- ./KABUPATEN_KOTA.xlsx');
  const full=path.resolve(file); if(!fs.existsSync(full))throw new Error('File tidak ditemukan: '+full);
  await connectMongoDB(); const wb=XLSX.read(fs.readFileSync(full),{type:'buffer'}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json<any>(ws,{defval:''}); if(!rows.length)throw new Error('File wilayah kosong.');
  const mapped=rows.map((r:any)=>{const o:any={};Object.entries(r).forEach(([k,v])=>{const c=aliases[canon(k)];if(c)o[c]=norm(v)});return o}).filter((r:any)=>r.provinsi&&r.namaKabupatenKota);
  await Regency.bulkWrite(mapped.map((r:any)=>({updateOne:{filter:{provinsi:r.provinsi,namaKabupatenKota:r.namaKabupatenKota},update:{$set:{kode:r.kode||'',tipe:r.tipe||''}},upsert:true}})),{ordered:false});
  console.log(`Master wilayah selesai: ${mapped.length} baris.`); await mongoose.disconnect();
}
main().catch(e=>{console.error(e);process.exit(1)});
