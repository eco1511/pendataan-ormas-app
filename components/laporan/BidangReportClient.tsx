"use client";
import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
export default function BidangReportClient() {
  const [provinsi, setProvinsi] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [kabs, setKabs] = useState<string[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/provinsi")
      .then((r) => r.json())
      .then((d) => setProvinces(d.data || []));
  }, []);
  useEffect(() => {
    if (!provinsi) {
      setKabs([]);
      setKabupaten("");
      return;
    }
    fetch("/api/provinsi/" + encodeURIComponent(provinsi) + "/kabupaten")
      .then((r) => r.json())
      .then((d) => setKabs(d.data || []));
  }, [provinsi]);
  const load = async (p = 1) => {
    setLoading(true);
    const q = new URLSearchParams({
      page: String(p),
      pageSize: "20",
      provinsi,
      kabupaten,
    });
    const r = await fetch("/api/laporan/bidang?" + q);
    const d = await r.json();
    if (d.success) setData(d);
    setLoading(false);
  };
  useEffect(() => {
    load(1);
  }, [provinsi, kabupaten]);
  function exp(fmt: string) {
    window.open(
      "/api/ormas/export?" +
        new URLSearchParams({ provinsi, kabupaten, format: fmt }),
      "_blank",
    );
  }
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={provinsi}
            onChange={(e) => setProvinsi(e.target.value)}
            className="rounded-xl border px-3 py-2.5"
          >
            <option value="">Semua Provinsi</option>
            {provinces.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            value={kabupaten}
            onChange={(e) => setKabupaten(e.target.value)}
            disabled={!provinsi}
            className="rounded-xl border px-3 py-2.5"
          >
            <option value="">Semua Kabupaten/Kota</option>
            {kabs.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Summary label="Total Ormas" value={data?.total || 0} />
        <Summary
          label="Provinsi Terdeteksi"
          value={data?.totalProvinsi || 0}
          detail={`${data?.jumlahProvinsiIndonesia || 38} | ${Number(data?.persentaseProvinsi || 0).toFixed(2)}%`}
        />
        <Summary
          label="Kabupaten/Kota Terdeteksi"
          value={data?.totalKabupaten || 0}
          detail={`${data?.jumlahKabupatenKotaIndonesia || 514} | ${Number(data?.persentaseKabupaten || 0).toFixed(2)}%`}
        />
        <Summary label="Bidang Kegiatan" value={(data?.stats || []).length} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Summary
          label="Total Keseluruhan"
          value={(data?.totalProvinsi || 0) + (data?.totalKabupaten || 0)}
          detail={`${Number((((data?.totalProvinsi || 0) + (data?.totalKabupaten || 0)) / ((data?.jumlahProvinsiIndonesia || 38) + (data?.jumlahKabupatenKotaIndonesia || 514)) * 100) || 0).toFixed(2)}%`}
        />
      </div>
      <div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Daftar Bidang Kegiatan</h2>
            <button onClick={() => load(data?.page || 1)}>
              <RefreshCw size={17} />
            </button>
          </div>
          <div className="max-h-[360px] space-y-2 overflow-y-auto">
            {(data?.stats || []).map((x: any, i: number) => (
              <div
                key={x.bidang}
                className="flex items-center justify-between rounded-xl border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <span>{x.bidang}</span>
                </div>
                <div className="text-right">
                  <b>{Number(x.jumlah).toLocaleString("id-ID")}</b>
                  <div className="text-xs text-gray-500">
                    {Number(x.persentase || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
            {!data?.stats?.length && <Empty />}
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <b>Data Ormas</b>
          <div className="flex gap-2">
            <button
              onClick={() => exp("xlsx")}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              <Download size={14} />
              Excel
            </button>
            <button
              onClick={() => exp("csv")}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white"
            >
              <Download size={14} />
              CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">No</th>
                <th className="px-4 py-3 text-left">Nama Ormas</th>
                <th className="px-4 py-3 text-left">Bidang</th>
                <th className="px-4 py-3 text-left">Kab/Kota</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    Memuat...
                  </td>
                </tr>
              ) : (
                (data?.data || []).map((d: any, i: number) => (
                  <tr key={d._id} className="border-t">
                    <td className="px-4 py-3">
                      {(data.page - 1) * data.pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">{d.namaOrmas}</td>
                    <td className="px-4 py-3">{d.bidangKegiatan || "-"}</td>
                    <td className="px-4 py-3">{d.kabupatenKota || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t px-4 py-3 text-sm">
          <button
            disabled={(data?.page || 1) <= 1}
            onClick={() => load((data?.page || 1) - 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            ‹
          </button>
          <span>
            Hal {data?.page || 1}/{data?.totalPages || 1}
          </span>
          <button
            disabled={(data?.page || 1) >= (data?.totalPages || 0)}
            onClick={() => load((data?.page || 1) + 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
function Summary({
  label,
  value,
  suffix = "",
  detail,
}: {
  label: string;
  value: number;
  suffix?: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">
        {Number(value).toLocaleString("id-ID")} {suffix}
      </div>
      {detail && <div className="mt-1 text-xs text-gray-500">{detail}</div>}
    </div>
  );
}
function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      Tidak ada data.
    </div>
  );
}
