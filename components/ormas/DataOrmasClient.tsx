"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Download,
  Search,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  FileSpreadsheet,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import OrmasForm, { type OrmasFormValues } from "./OrmasForm";
import Toast from "@/components/ui/Toast";
const REQUIRED = [
  "Nama Ormas",
  "Nomor SKT",
  "Bidang Kegiatan",
  "Status Kepengurusan",
  "Ketua",
  "Tingkat",
  "Alamat",
];
const HEADERS = [
  "Nama Ormas",
  "Nomor SKT",
  "Periode",
  "Status Kepengurusan",
  "Ketua",
  "Sekretaris",
  "Bendahara",
  "Jumlah Anggota",
  "Alamat",
  "Nomor Telepon",
  "Bidang Kegiatan",
  "Detail Kegiatan",
  "Tingkat",
  "Provinsi",
  "Kabupaten/Kota",
];
function canon(h: string) {
  return h
    .toLowerCase()
    .trim()
    .replace(/[\/_.-]+/g, " ")
    .replace(/\s+/g, " ");
}
const aliases: Record<string, string> = {
  "nama ormas": "Nama Ormas",
  "nama organisasi kemasyarakatan": "Nama Ormas",
  "nomor skt": "Nomor SKT",
  "skt bh": "Nomor SKT",
  "nomor badan hukum": "Nomor SKT",
  periode: "Periode",
  "periode kepengurusan": "Periode",
  "status kepengurusan": "Status Kepengurusan",
  ketua: "Ketua",
  sekretaris: "Sekretaris",
  bendahara: "Bendahara",
  "jumlah anggota": "Jumlah Anggota",
  alamat: "Alamat",
  "alamat lengkap": "Alamat",
  "nomor telepon": "Nomor Telepon",
  telepon: "Nomor Telepon",
  "no telepon": "Nomor Telepon",
  "bidang kegiatan": "Bidang Kegiatan",
  "detail kegiatan": "Detail Kegiatan",
  tingkat: "Tingkat",
  provinsi: "Provinsi",
  "kabupaten kota": "Kabupaten/Kota",
  kabupaten: "Kabupaten/Kota",
  kota: "Kabupaten/Kota",
};
export default function DataOrmasClient() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [prov, setProv] = useState("");
  const [kab, setKab] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [status, setStatus] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [kabs, setKabs] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    fetch("/api/provinsi")
      .then((r) => r.json())
      .then((d) => setProvinces(d.data || []));
  }, []);
  useEffect(() => {
    if (!prov) {
      setKabs([]);
      setKab("");
      return;
    }
    fetch("/api/provinsi/" + encodeURIComponent(prov) + "/kabupaten")
      .then((r) => r.json())
      .then((d) => setKabs(d.data || []));
  }, [prov]);
  const canEdit = user?.role === "Administrator" || user?.role === "Operator";
  const canDelete = user?.role === "Administrator";
  async function load(page = 1) {
    setLoading(true);
    const p = new URLSearchParams({
      page: String(page),
      pageSize: String(pagination.pageSize || 20),
      search: query,
      provinsi: prov,
      kabupaten: kab,
      tingkat,
      status,
    });
    const r = await fetch("/api/ormas?" + p);
    const d = await r.json();
    if (d.success) {
      setRows(d.data || []);
      setPagination(d);
    } else
      setToast({ message: d.message || "Gagal memuat data.", type: "error" });
    setLoading(false);
  }
  useEffect(() => {
    const t = setTimeout(() => load(1), 350);
    return () => clearTimeout(t);
  }, [query, prov, kab, tingkat, status, pagination.pageSize]);
  async function save(v: OrmasFormValues) {
    const url = editing ? "/api/ormas/" + editing._id : "/api/ormas";
    const r = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    const d = await r.json();
    if (!r.ok || !d.success) {
      setToast({ message: d.message || "Gagal menyimpan.", type: "error" });
      return;
    }
    setToast({ message: d.message });
    setModal(false);
    setEditing(null);
    load(1);
  }
  async function del(id: string) {
    if (!confirm("Hapus data Ormas ini?")) return;
    const r = await fetch("/api/ormas/" + id, { method: "DELETE" });
    const d = await r.json();
    setToast({
      message: d.message || "Selesai",
      type: r.ok ? "success" : "error",
    });
    if (r.ok) load(pagination.page);
  }
  function openEdit(d: any) {
    setEditing(d);
    setModal(true);
  }
  async function importFile(file: File) {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      throw new Error("Pilih file Excel atau CSV (.xlsx, .xls, .csv).");
    }
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheetName =
      wb.SheetNames.find((name) => canon(name) === "data ormas") ||
      wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<any[]>(ws, {
      header: 1,
      defval: "",
    });
    if (matrix.length < 2) throw new Error("File tidak memiliki data.");
    const heads = matrix[0].map((h: any) => String(h ?? "").trim());
    const map: Record<string, number> = {};
    heads.forEach((h: string, i: number) => {
      const c = aliases[canon(h)];
      if (c && !map[c]) map[c] = i;
    });
    const missing = REQUIRED.filter((x) => map[x] === undefined);
    if (missing.length)
      throw new Error("Kolom belum lengkap: " + missing.join(", "));
    const data = matrix
      .slice(1)
      .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
      .slice(0, 5000)
      .map((row) => {
        const o: any = {};
        HEADERS.forEach(
          (h) => (o[camel(h)] = String(row[map[h] ?? -1] ?? "").trim()),
        );
        return o;
      });
    if (!data.length) throw new Error("File tidak memiliki data untuk diimpor.");
    setImportRows(data);
  }
  async function handleFile(file?: File) {
    if (!file) return;
    try {
      await importFile(file);
    } catch (err: any) {
      setImportRows([]);
      setToast({ message: err.message || "File tidak dapat dibaca.", type: "error" });
    }
  }
  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }
  function camel(h: string) {
    const m: Record<string, string> = {
      "Nama Ormas": "namaOrmas",
      "Nomor SKT": "nomorSkt",
      Periode: "periode",
      "Status Kepengurusan": "statusKepengurusan",
      Ketua: "ketua",
      Sekretaris: "sekretaris",
      Bendahara: "bendahara",
      "Jumlah Anggota": "jumlahAnggota",
      Alamat: "alamat",
      "Nomor Telepon": "nomorTelepon",
      "Bidang Kegiatan": "bidangKegiatan",
      "Detail Kegiatan": "detailKegiatan",
      Tingkat: "tingkat",
      Provinsi: "provinsi",
      "Kabupaten/Kota": "kabupatenKota",
    };
    return m[h];
  }
  async function processImport() {
    const r = await fetch("/api/ormas/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: importRows }),
    });
    const d = await r.json();
    setToast({
      message: d.message || "Import selesai",
      type: r.ok ? "success" : "error",
    });
    if (r.ok) {
      setImportOpen(false);
      setImportRows([]);
      load(1);
    }
  }
  function downloadTemplate() {
    const sample = [
      {
        [HEADERS[0]]: "Contoh Ormas",
        [HEADERS[1]]: "SKT-001",
        [HEADERS[2]]: "2026-2030",
        [HEADERS[3]]: "Pusat",
        [HEADERS[4]]: "Budi Santoso",
        [HEADERS[5]]: "Siti Aminah",
        [HEADERS[6]]: "Andi Wijaya",
        [HEADERS[7]]: 120,
        [HEADERS[8]]: "Jl. Contoh No.1",
        [HEADERS[9]]: "081234567890",
        [HEADERS[10]]: "Sosial",
        [HEADERS[11]]: "Pemberdayaan",
        [HEADERS[12]]: "Nasional",
        [HEADERS[13]]: "DKI Jakarta",
        [HEADERS[14]]: "Kota Jakarta Timur",
      },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(sample, { header: HEADERS }),
      "Format Import",
    );
    XLSX.writeFile(wb, "Template_Import_Data_Ormas.xlsx");
  }
  const start = pagination.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const end = Math.min(start + rows.length - 1, pagination.total);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border py-2.5 pl-10 pr-3"
              placeholder="Cari nama Ormas, SKT, ketua, wilayah..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <button
                onClick={() => {
                  setEditing(null);
                  setModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Tambah
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Upload size={16} />
                Import
              </button>
            )}
            <button
              onClick={() =>
                window.open(
                  "/api/ormas/export?" +
                    new URLSearchParams({
                      search: query,
                      provinsi: prov,
                      kabupaten: kab,
                      tingkat,
                      status,
                      format: "xlsx",
                    }),
                  "_blank",
                )
              }
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Download size={16} />
              Excel
            </button>
            <button
              onClick={() =>
                window.open(
                  "/api/ormas/export?" +
                    new URLSearchParams({
                      search: query,
                      provinsi: prov,
                      kabupaten: kab,
                      tingkat,
                      status,
                      format: "csv",
                    }),
                  "_blank",
                )
              }
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={() => load(pagination.page)}
              className="rounded-xl border bg-white px-3 py-2.5"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-4">
          <select
            value={prov}
            onChange={(e) => setProv(e.target.value)}
            className="rounded-xl border px-3 py-2.5"
          >
            <option value="">Semua Provinsi</option>
            {provinces.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            value={kab}
            onChange={(e) => setKab(e.target.value)}
            disabled={!prov}
            className="rounded-xl border px-3 py-2.5"
          >
            <option value="">Semua Kab/Kota</option>
            {kabs.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <select
            value={tingkat}
            onChange={(e) => setTingkat(e.target.value)}
            className="rounded-xl border px-3 py-2.5"
          >
            <option value="">Semua Tingkat</option>
            <option>Nasional</option>
            <option>Provinsi</option>
            <option>Kabupaten/Kota</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border px-3 py-2.5"
          >
            <option value="">Semua Status</option>
            <option>Pusat</option>
            <option>Cabang</option>
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "No",
                  "Nama Ormas",
                  "SKT/BH",
                  "Wilayah",
                  "Bidang",
                  "Status",
                  "Aksi",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Memuat...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                rows.map((d, i) => (
                  <tr key={d._id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-3">{start + i}</td>
                    <td className="px-5 py-3 font-medium">{d.namaOrmas}</td>
                    <td className="px-5 py-3">{d.nomorSkt}</td>
                    <td className="px-5 py-3 text-xs">
                      {d.provinsi}
                      <br />
                      <span className="text-gray-500">
                        {d.kabupatenKota || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3">{d.bidangKegiatan || "-"}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        {d.statusKepengurusan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={"/dashboard/data-ormas/" + d._id}
                          className="text-blue-700"
                        >
                          <Eye size={17} />
                        </Link>
                        {canEdit && (
                          <button
                            onClick={() => openEdit(d)}
                            className="text-amber-600"
                          >
                            <Edit3 size={17} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => del(d._id)}
                            className="text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t bg-gray-50 px-5 py-3 text-sm md:flex-row md:items-center md:justify-between">
          <span>
            {start}-{end} dari {pagination.total} data
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => load(pagination.page - 1)}
              className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40"
            >
              ‹
            </button>
            <span>
              Hal {pagination.page}/{pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => load(pagination.page + 1)}
              className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editing ? "Edit Data Ormas" : "Tambah Data Ormas"}
              </h2>
              <button onClick={() => setModal(false)}>
                <X />
              </button>
            </div>
            <OrmasForm
              initial={
                editing
                  ? {
                      namaOrmas: editing.namaOrmas,
                      nomorSkt: editing.nomorSkt,
                      periode: editing.periode,
                      statusKepengurusan: editing.statusKepengurusan,
                      ketua: editing.ketua,
                      sekretaris: editing.sekretaris,
                      bendahara: editing.bendahara,
                      jumlahAnggota: editing.jumlahAnggota,
                      alamat: editing.alamat,
                      nomorTelepon: editing.nomorTelepon,
                      bidangKegiatan: editing.bidangKegiatan,
                      detailKegiatan: editing.detailKegiatan,
                      tingkat: editing.tingkat,
                      provinsi: editing.provinsi,
                      kabupatenKota: editing.kabupatenKota,
                    }
                  : undefined
              }
              onSubmit={save}
            />
          </div>
        </div>
      )}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Import Data Excel / CSV</h2>
                <p className="text-sm text-gray-500">
                  Maksimal 5.000 baris per proses.
                </p>
              </div>
              <button onClick={() => setImportOpen(false)}>
                <X />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <button
                onClick={downloadTemplate}
                className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Download Template Excel
              </button>
              <label
                htmlFor="import-file"
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm font-semibold transition ${
                  isDraggingFile
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-100"
                }`}
              >
                <Upload size={20} />
                <span>Tarik dan lepas file di sini</span>
                <span className="font-normal text-amber-800">
                  atau klik untuk memilih file Excel / CSV
                </span>
              </label>
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => void handleFile(event.target.files?.[0])}
                className="hidden"
              />
              {importRows.length > 0 && (
                <>
                  <div className="rounded-xl bg-blue-50 p-3 text-sm">
                    {importRows.length} baris siap diimpor.
                  </div>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Nama Ormas",
                            "Nomor SKT",
                            "Ketua",
                            "Bidang Kegiatan",
                            "Tingkat",
                            "Provinsi",
                            "Kabupaten/Kota",
                          ].map((h) => (
                            <th key={h} className="px-3 py-2 text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-t">
                            {[
                              "namaOrmas",
                              "nomorSkt",
                              "ketua",
                              "bidangKegiatan",
                              "tingkat",
                              "provinsi",
                              "kabupatenKota",
                            ].map((k) => (
                              <td key={k} className="px-3 py-2">
                                {r[k]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setImportOpen(false)}
                      className="rounded-xl border px-4 py-2"
                    >
                      Batal
                    </button>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={processImport}
                  disabled={!importRows.length}
                  className="rounded-xl bg-amber-500 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Proses Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
