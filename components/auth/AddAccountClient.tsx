"use client";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

export default function AddAccountClient() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Operator");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name, password, role }),
    });
    const data = await response.json();
    setSaving(false);
    setMessage({ text: data.message || "Selesai.", error: !response.ok });
    if (response.ok) {
      setUsername("");
      setName("");
      setPassword("");
      setRole("Operator");
    }
  }

  return <div className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm"><div className="mb-6 flex items-start gap-3 border-b pb-5"><div className="rounded-xl bg-amber-50 p-3 text-amber-700"><UserPlus size={22} /></div><div><h2 className="text-lg font-bold">Tambah Akun</h2><p className="text-sm text-gray-500">Buat akun baru untuk pengguna aplikasi.</p></div></div><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Username</label><input value={username} onChange={(event) => setUsername(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" /></div><div><label className="mb-1 block text-sm font-medium">Nama</label><input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" /></div></div><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Password</label><input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" /></div><div><label className="mb-1 block text-sm font-medium">Role</label><select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-xl border px-3 py-2.5"><option>Administrator</option><option>Operator</option><option>Viewer</option></select></div></div>{message && <div className={`rounded-xl px-4 py-3 text-sm ${message.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</div>}<button disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><UserPlus size={17} /> {saving ? "Menyimpan..." : "Tambah Akun"}</button></form></div>;
}
