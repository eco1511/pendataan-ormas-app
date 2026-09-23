"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ormasSchema } from "@/lib/validations";
import { z } from "zod";
export type OrmasFormValues = z.infer<typeof ormasSchema>;
type OrmasFormInput = z.input<typeof ormasSchema>;
const bidang = [
  "Agama",
  "Pendidikan",
  "Sosial Kemanusiaan",
  "Lingkungan Hidup",
  "Kesehatan",
  "Profesi",
  "Sosial",
  "Budaya",
  "Lainnya",
];
export default function OrmasForm({
  initial,
  onSubmit,
  disabled = false,
}: {
  initial?: Partial<OrmasFormValues>;
  onSubmit: (v: OrmasFormValues) => Promise<void>;
  disabled?: boolean;
}) {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [kabs, setKabs] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrmasFormInput, any, OrmasFormValues>({
    resolver: zodResolver(ormasSchema),
    defaultValues: {
      namaOrmas: "",
      nomorSkt: "",
      periode: "",
      statusKepengurusan: "Pusat",
      ketua: "",
      sekretaris: "",
      bendahara: "",
      jumlahAnggota: 0,
      alamat: "",
      nomorTelepon: "",
      bidangKegiatan: "",
      detailKegiatan: "",
      tingkat: "Nasional",
      provinsi: "",
      kabupatenKota: "",
      ...initial,
    },
  });
  const prov = watch("provinsi");
  useEffect(() => {
    fetch("/api/provinsi")
      .then((r) => r.json())
      .then((d) => setProvinces(d.data || []));
  }, []);
  useEffect(() => {
    if (!prov) {
      setKabs([]);
      setValue("kabupatenKota", "");
      return;
    }
    fetch("/api/provinsi/" + encodeURIComponent(prov) + "/kabupaten")
      .then((r) => r.json())
      .then((d) => setKabs(d.data || []));
  }, [prov, setValue]);
  const input = (
    name: keyof OrmasFormValues,
    label: string,
    props: any = {},
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        {...register(name as any)}
        {...props}
        className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
      <Error name={name} />
    </div>
  );
  const select = (
    name: keyof OrmasFormValues,
    label: string,
    options: string[],
    props: any = {},
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        {...register(name as any)}
        {...props}
        className="w-full rounded-xl border bg-white px-3 py-2.5 outline-none focus:border-blue-600"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "Pilih"}
          </option>
        ))}
      </select>
      <Error name={name} />
    </div>
  );
  const Error = ({ name }: { name: keyof OrmasFormValues }) => (
    <>
      {errors[name] && (
        <p className="mt-1 text-xs text-red-600">
          {errors[name]?.message as string}
        </p>
      )}
    </>
  );
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {input("namaOrmas", "Nama Ormas *")}
        {input("nomorSkt", "Nomor SKT / Badan Hukum *")}
        {select("bidangKegiatan", "Bidang Kegiatan *", ["", ...bidang])}
        {input("detailKegiatan", "Detail Kegiatan")}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {select("statusKepengurusan", "Status Kepengurusan *", [
          "Pusat",
          "Cabang",
        ])}
        {input("periode", "Periode Kepengurusan")}
        {input("jumlahAnggota", "Jumlah Anggota", { type: "number", min: 0 })}
        {input("ketua", "Ketua *")}
        {input("sekretaris", "Sekretaris")}
        {input("bendahara", "Bendahara")}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {select("tingkat", "Tingkat *", [
          "Nasional",
          "Provinsi",
          "Kabupaten/Kota",
        ])}
        {select("provinsi", "Provinsi *", ["", ...provinces])}
        {select("kabupatenKota", "Kabupaten/Kota", ["", ...kabs], {
          disabled: !prov,
        })}
      </div>
      <div>
        {
          <label className="mb-1 block text-sm font-medium">
            Alamat Lengkap *
          </label>
        }
        <textarea
          {...register("alamat")}
          rows={3}
          className="w-full rounded-xl border px-3 py-2.5"
        />
        <Error name="alamat" />
      </div>
      {input("nomorTelepon", "Nomor Telepon / HP")}
      <div className="flex justify-end gap-2 border-t pt-4">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="rounded-xl bg-blue-800 px-5 py-2.5 font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
