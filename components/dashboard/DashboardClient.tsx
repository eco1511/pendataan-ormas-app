"use client";
import { useEffect, useState } from "react";
import { Users, Building2, GitBranch, RefreshCw } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import dynamic from "next/dynamic";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatNumber } from "@/lib/utils";
const OrmasMap = dynamic(() => import("./OrmasMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center text-gray-400">
      Memuat peta...
    </div>
  ),
});
export default function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/dashboard/stats");
      const d = await r.json();
      if (d.success) setData(d);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const chart = Object.entries(data?.provinsi || {}).map(
    ([provinsi, jumlah]) => ({ provinsi, jumlah }),
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard label="Total Ormas" value={data?.total || 0} icon={Users} />
        <StatCard
          label="Ormas Pusat"
          value={data?.pusat || 0}
          icon={Building2}
        />
        <StatCard
          label="Ormas Cabang"
          value={data?.cabang || 0}
          icon={GitBranch}
        />
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-5 font-bold">Sebaran Ormas per Provinsi</h2>
        <div className="h-[430px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chart}
              margin={{ top: 10, right: 10, left: 0, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="provinsi"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={90}
              />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v) => formatNumber(Number(v))} />
              <Bar dataKey="jumlah" name="Jumlah Ormas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold">Peta Sebaran Ormas</h2>
        <div className="h-[420px] overflow-hidden rounded-xl border">
          <OrmasMap wilayah={data?.wilayah || {}} />
        </div>
      </div>
    </div>
  );
}
