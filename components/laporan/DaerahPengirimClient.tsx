"use client";
import { useEffect, useState } from "react";
import { MapPinned, RefreshCw, Search } from "lucide-react";

export default function DaerahPengirimClient() {
  const [data, setData] = useState<any>({
    data: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(page = 1) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      search,
      tingkat,
      provinsi,
    });
    const response = await fetch("/api/laporan/daerah-pengirim?" + params);
    const result = await response.json();
    if (result.success) setData(result);
    else setError(result.message || "Gagal memuat data.");
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => load(1), 250);
    return () => clearTimeout(timer);
  }, [search, tingkat, provinsi]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Summary label="Jumlah Total" value={data.totalKabupatenKota || 0} />
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari provinsi atau kabupaten/kota..."
              className="w-full rounded-xl border py-2.5 pl-10 pr-3"
            />
          </div>
          <select
            value={tingkat}
            onChange={(event) => setTingkat(event.target.value)}
            className="rounded-xl border px-3 py-2.5"
          >
            <option value="">Semua Tingkat</option>
            <option value="Provinsi">Provinsi</option>
            <option value="Kabupaten/Kota">Kabupaten/Kota</option>
          </select>
          <select
            value={provinsi}
            onChange={(event) => setProvinsi(event.target.value)}
            className="rounded-xl border px-3 py-2.5"
          >
            <option value="">Semua Provinsi</option>
            {(data.provinces || []).map((item: string) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            onClick={() => load(data.page || 1)}
            className="rounded-xl border bg-white px-3 py-2.5"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-bold">Penyajian Data per Provinsi</h2>
          <p className="text-xs text-gray-500">Ringkasan daerah yang sudah mengirimkan data.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-5 py-3 text-left">No</th><th className="px-5 py-3 text-left">Provinsi</th><th className="px-5 py-3 text-left">Kabupaten/Kota</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={3} className="py-8 text-center text-gray-400">Memuat data...</td></tr> : (data.perProvinsi || []).length ? data.perProvinsi.map((row: any, index: number) => <tr key={row.provinsi} className="border-t align-top"><td className="px-5 py-3">{index + 1}</td><td className="px-5 py-3 font-medium">{row.provinsi}</td><td className="px-5 py-3 text-gray-600">{row.kabupatenKota?.length ? row.kabupatenKota.join(', ') : '-'}</td></tr>) : <tr><td colSpan={3} className="py-8 text-center text-gray-400">Belum ada data per provinsi.</td></tr>}</tbody>
          </table>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
            <MapPinned size={20} />
          </div>
          <div>
            <h2 className="font-bold">Daerah yang Sudah Mengirimkan Data</h2>
            <p className="text-xs text-gray-500">
              Sumber: spreadsheet pengiriman data
            </p>
          </div>
        </div>
        {error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left">No</th>
                  <th className="px-5 py-3 text-left">Tingkat Wilayah</th>
                  <th className="px-5 py-3 text-left">Provinsi</th>
                  <th className="px-5 py-3 text-left">Kabupaten/Kota</th>
                  <th className="px-5 py-3 text-left">Kiriman Terbaru</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      Memuat data...
                    </td>
                  </tr>
                ) : data.data.length ? (
                  data.data.map((row: any, index: number) => (
                    <tr
                      key={`${row.tingkat}-${row.provinsi}-${row.kabupatenKota}`}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-5 py-3">
                        {(data.page - 1) * data.pageSize + index + 1}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                          {row.tingkat}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {row.provinsi || "-"}
                      </td>
                      <td className="px-5 py-3">{row.kabupatenKota || "-"}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {row.timestamp || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      Belum ada data pengiriman.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-between border-t px-5 py-3 text-sm">
          <button
            disabled={data.page <= 1}
            onClick={() => load(data.page - 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span>
            Hal {data.page}/{data.totalPages}
          </span>
          <button
            disabled={data.page >= data.totalPages}
            onClick={() => load(data.page + 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">
        {Number(value).toLocaleString("id-ID")}
      </div>
    </div>
  );
}
