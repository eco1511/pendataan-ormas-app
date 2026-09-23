"use client";
import { useEffect, useState } from "react";
import { Loader2, Save, ShieldCheck } from "lucide-react";

export default function AccountSettingsClient() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/auth/account")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setUsername(data.user.username);
          setRole(data.user.role);
          setName(data.user.name);
        } else setMessage({ text: data.message || "Gagal memuat akun.", error: true });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/auth/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, currentPassword, newPassword }),
    });
    const data = await response.json();
    setSaving(false);
    setMessage({ text: data.message || "Selesai.", error: !response.ok });
    if (response.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={17} /> Memuat akun...</div>;

  return (
    <div className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3 border-b pb-5">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><ShieldCheck size={22} /></div>
        <div><h2 className="text-lg font-bold">Pengaturan Akun</h2><p className="text-sm text-gray-500">Kelola nama tampilan dan password akun Anda.</p></div>
      </div>
      <form onSubmit={save} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium">Username</label><input value={username} disabled className="w-full rounded-xl border bg-gray-50 px-3 py-2.5 text-gray-500" /></div>
        <div><label className="mb-1 block text-sm font-medium">Role</label><input value={role} disabled className="w-full rounded-xl border bg-gray-50 px-3 py-2.5 text-gray-500" /></div>
        <div><label className="mb-1 block text-sm font-medium">Nama</label><input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" /></div>
        <div className="border-t pt-4"><p className="mb-3 text-sm font-semibold">Ganti password <span className="font-normal text-gray-400">(opsional)</span></p><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Password saat ini</label><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-xl border px-3 py-2.5" /></div><div><label className="mb-1 block text-sm font-medium">Password baru</label><input type="password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border px-3 py-2.5" /></div></div></div>
        {message && <div className={`rounded-xl px-4 py-3 text-sm ${message.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</div>}
        <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={17} /> {saving ? "Menyimpan..." : "Simpan Pengaturan"}</button>
      </form>
    </div>
  );
}
