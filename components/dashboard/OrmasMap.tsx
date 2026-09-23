"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { PROVINCE_COORDS, formatNumber } from "@/lib/utils";
export default function OrmasMap({
  wilayah,
}: {
  wilayah: Record<string, { total: number }>;
}) {
  const entries = Object.entries(wilayah);
  const maxTotal = Math.max(
    ...entries.map(([, value]) => Number(value.total || 0)),
    1,
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[-2.5, 118]}
        zoom={4.5}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {entries.map(([p, v]) => {
          const c = PROVINCE_COORDS[p];
          if (!c) return null;
          const n = Number(v.total || 0);
          const intensity = Math.sqrt(n / maxTotal);
          const fillColor =
            intensity > 0.7
              ? "#f97316"
              : intensity > 0.35
                ? "#0f766e"
                : "#2563eb";
          return (
            <CircleMarker
              key={p}
              center={c}
              radius={Math.max(7, Math.min(24, 7 + Math.sqrt(n) * 0.8))}
              pathOptions={{
                color: "#ffffff",
                fillColor,
                fillOpacity: 0.86,
                weight: 2,
              }}
            >
              <Tooltip className="font-medium">
                {p}: {formatNumber(n)} Ormas
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="pointer-events-none absolute left-4 top-4 z-[400] w-52 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-lg backdrop-blur-sm">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
          Intensitas sebaran
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
          <span className="h-3 w-3 rounded-full bg-blue-600" /> Rendah
          <span className="h-3 w-3 rounded-full bg-teal-700" /> Sedang
          <span className="h-3 w-3 rounded-full bg-orange-500" /> Tinggi
        </div>
        <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-500">
          {entries.length} provinsi terpetakan
        </div>
      </div>
    </div>
  );
}
