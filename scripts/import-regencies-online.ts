import 'dotenv/config';
import { connectMongoDB, mongoose } from '@/lib/mongodb';
import { Province } from '@/models/Province';
import { Regency } from '@/models/Regency';

const SOURCE_URL = 'https://pangesturahmatn.github.io/api-wilayah-indonesia/api';

type SourceProvince = { id: string; name: string };
type SourceRegency = { id: string; name: string; provinceId: string };

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gagal mengambil ${url} (${response.status}).`);
  return response.json() as Promise<T>;
}

async function main() {
  await connectMongoDB();

  const [sourceProvinces, masterProvinces] = await Promise.all([
    fetchJson<SourceProvince[]>(`${SOURCE_URL}/provinces.json`),
    Province.find({}, { namaProvinsi: 1, _id: 0 }).lean(),
  ]);
  const provinceNames = new Map(
    masterProvinces.map((row: any) => [normalize(String(row.namaProvinsi)), String(row.namaProvinsi)]),
  );

  const regencies = (await Promise.all(
    sourceProvinces.map(async (province) => ({
      province,
      data: await fetchJson<SourceRegency[]>(`${SOURCE_URL}/regencies/${province.id}.json`),
    })),
  )).flatMap(({ province, data }) => data.map((regency) => ({ province, regency })));

  await Regency.bulkWrite(
    regencies.map(({ province, regency }) => {
      const provinceName = provinceNames.get(normalize(province.name)) || province.name;
      const name = regency.name.trim().replace(/\s+/g, ' ');
      return {
        updateOne: {
          filter: { provinsi: provinceName, namaKabupatenKota: name },
          update: {
            $set: {
              kode: regency.id,
              tipe: name.toLocaleLowerCase('id-ID').startsWith('kota') ? 'Kota' : 'Kabupaten',
            },
          },
          upsert: true,
        },
      };
    }),
    { ordered: false },
  );

  console.log(`Master Kabupaten/Kota selesai: ${regencies.length} baris.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});