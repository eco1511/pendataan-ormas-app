"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarDays, MapPinned, RefreshCw, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Region = { total: number; kabupaten: Record<string, number> };
type Stats = { total: number; tingkat: Record<string, number>; wilayah: Record<string, Region>; lastUpdated: string | null };
const numberFormat = new Intl.NumberFormat("id-ID");
const formatNumber = (value: number) => numberFormat.format(value);

function formatDate(value: string | null) {
  if (!value) return "Belum tersedia";
  return `${new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value))} WIB`;
}

function NumberCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3 text-slate-500"><span className="rounded-xl bg-blue-50 p-2 text-blue-700"><Icon size={19} /></span><span className="text-sm font-medium">{label}</span></div><div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</div><div className="mt-1 text-sm text-slate-500">{detail}</div></div>;
}

export default function RekapOrmasClient() {
  const [data, setData] = useState<Stats | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/dashboard/stats", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Gagal memuat rekap data Ormas.");
      setData(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal memuat rekap data Ormas."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();
    const interval = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(interval);
  }, []);
  const regions = Object.entries(data?.wilayah || {}).sort(([, first], [, second]) => second.total - first.total);
  const provinceCount = regions.length;
  const districtCount = regions.reduce((sum, [, region]) => sum + Object.keys(region.kabupaten).length, 0);
  const provinceOrmas = data?.tingkat?.Provinsi || 0;
  const districtOrmas = data?.tingkat?.["Kabupaten/Kota"] || 0;
  return <div className="mx-auto max-w-7xl space-y-6">
    <section className="overflow-hidden rounded-2xl bg-blue-950 p-6 text-white shadow-sm md:p-8"><div className="flex flex-wrap items-start justify-between gap-6"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100"><CalendarDays size={14} /> Data sistem</div><h1 className="max-w-2xl text-2xl font-bold md:text-3xl">Rekap Data Organisasi Kemasyarakatan di Daerah</h1><p className="mt-2 text-blue-200">Data mengikuti Ormas aktif yang tersimpan di sistem.</p></div><div className="rounded-xl border border-blue-800 bg-blue-900/70 px-4 py-3 text-sm text-blue-100">Pembaruan terakhir<br /><strong className="text-white">{formatDate(currentTime.toISOString())}</strong></div></div></section>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="flex justify-end"><button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Perbarui data</button></div>
    <div className="grid gap-4 md:grid-cols-3"><NumberCard icon={Users} label="Total Ormas" value={loading ? "..." : formatNumber(data?.total || 0)} detail="Data aktif di sistem" /><NumberCard icon={MapPinned} label="Total daerah" value={loading ? "..." : formatNumber(provinceCount + districtOrmas)} detail={`${provinceCount} provinsi dan ${districtOrmas} kabupaten/kota`} /><NumberCard icon={Building2} label="Cakupan input" value={loading ? "..." : `${formatNumber(provinceCount)} + ${formatNumber(districtOrmas)}`} detail="Jumlah provinsi dan kabupaten/kota yang diinput" /></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-5"><div><p className="text-sm font-semibold text-blue-700">Data Ormas</p><h2 className="mt-1 text-xl font-bold text-slate-900">Rekap daerah berdasarkan sistem</h2><p className="mt-1 text-sm text-slate-500">Daftar wilayah dihitung dari data Ormas aktif.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Live dari database</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{regions.map(([province, region]) => <div key={province} className="rounded-xl border border-slate-200 p-3"><div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-slate-800"><span>{province}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{Object.keys(region.kabupaten).length} daerah</span></div><div className="mb-2 text-xs text-blue-700">{formatNumber(region.total)} Ormas</div><ul className="space-y-1 text-xs leading-5 text-slate-600">{Object.entries(region.kabupaten).sort(([, first], [, second]) => second - first).map(([area, count]) => <li key={area} className="flex justify-between gap-2"><span>{area || "Wilayah provinsi"}</span><span className="font-semibold">{formatNumber(count)}</span></li>)}</ul></div>)}{!loading && !regions.length && <div className="col-span-full py-10 text-center text-sm text-slate-400">Belum ada data wilayah.</div>}</div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="mb-5"><p className="text-sm font-semibold text-blue-700">Rekapitulasi data Ormas</p><h2 className="mt-1 text-xl font-bold text-slate-900">{loading ? "Memuat data..." : `${formatNumber(data?.total || 0)} Ormas yang sudah diinput`}</h2></div><div className="grid gap-4 md:grid-cols-2">{[["Provinsi", provinceOrmas], ["Kabupaten/Kota", districtOrmas]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><div className="text-sm text-slate-500">{label}</div><div className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(Number(value))}</div></div>)}</div></section>
  </div>;
}