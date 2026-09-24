"use client";
import { useEffect, useState } from "react";
import { Loader2, UserPlus, Users } from "lucide-react";

type User = {
  username: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function AddAccountClient() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Operator");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function loadUsers() {
    setLoadingUsers(true);
    setUsersError("");
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal memuat daftar pengguna.");
      setUsers(data.users || []);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Gagal memuat daftar pengguna.");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

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
      loadUsers();
    }
  }

  return <div className="space-y-6"><div className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm"><div className="mb-6 flex items-start gap-3 border-b pb-5"><div className="rounded-xl bg-amber-50 p-3 text-amber-700"><UserPlus size={22} /></div><div><h2 className="text-lg font-bold">Tambah Akun</h2><p className="text-sm text-gray-500">Buat akun baru untuk pengguna aplikasi.</p></div></div><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Username</label><input value={username} onChange={(event) => setUsername(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" /></div><div><label className="mb-1 block text-sm font-medium">Nama</label><input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" /></div></div><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Password</label><input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" /></div><div><label className="mb-1 block text-sm font-medium">Role</label><select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-xl border px-3 py-2.5"><option>Administrator</option><option>Operator</option><option>Viewer</option></select></div></div>{message && <div className={`rounded-xl px-4 py-3 text-sm ${message.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</div>}<button disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><UserPlus size={17} /> {saving ? "Menyimpan..." : "Tambah Akun"}</button></form></div><section className="rounded-2xl bg-white p-6 shadow-sm"><div className="mb-5 flex items-start gap-3 border-b pb-5"><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Users size={22} /></div><div><h2 className="text-lg font-bold">Daftar Semua Pengguna</h2><p className="text-sm text-gray-500">Administrator, Operator, dan Viewer.</p></div></div>{loadingUsers ? <div className="flex items-center gap-2 py-6 text-sm text-gray-500"><Loader2 className="animate-spin" size={17} /> Memuat daftar pengguna...</div> : usersError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{usersError}</p> : users.length === 0 ? <p className="py-6 text-sm text-gray-500">Belum ada pengguna.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-gray-500"><th className="px-3 py-3 font-semibold">Nama</th><th className="px-3 py-3 font-semibold">Username</th><th className="px-3 py-3 font-semibold">Level</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Dibuat</th></tr></thead><tbody>{users.map((user) => <tr key={user.username} className="border-b last:border-0"><td className="px-3 py-3 font-medium text-gray-800">{user.name}</td><td className="px-3 py-3 text-gray-600">{user.username}</td><td className="px-3 py-3">{user.role}</td><td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{user.status}</span></td><td className="px-3 py-3 text-gray-600">{new Date(user.createdAt).toLocaleDateString("id-ID")}</td></tr>)}</tbody></table></div>}</section></div>;
}
