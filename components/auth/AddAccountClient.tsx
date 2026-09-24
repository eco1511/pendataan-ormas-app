"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2, Pencil, Trash2, UserPlus, Users, X } from "lucide-react";

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
};

const roles = ["Administrator", "Operator", "Viewer"];
const statuses = ["Aktif", "Tidak Aktif"];

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("Viewer");
  const [editStatus, setEditStatus] = useState("Aktif");
  const [editPassword, setEditPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  function startEdit(user: User) {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditPassword("");
  }

  async function updateUser(event: React.FormEvent) {
    event.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    const response = await fetch(`/api/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        role: editRole,
        status: editStatus,
        password: editPassword,
      }),
    });
    const data = await response.json();
    setActionLoading(false);
    setMessage({ text: data.message || "Selesai.", error: !response.ok });
    if (response.ok) {
      setEditingUser(null);
      loadUsers();
    }
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Hapus akun ${user.username}?`)) return;
    setActionLoading(true);
    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = await response.json();
    setActionLoading(false);
    setMessage({ text: data.message || "Selesai.", error: !response.ok });
    if (response.ok) loadUsers();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3 border-b pb-5">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Tambah Akun</h2>
            <p className="text-sm text-gray-500">Buat akun baru untuk pengguna aplikasi.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Username</label>
              <input value={username} onChange={(event) => setUsername(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nama</label>
              <input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-xl border px-3 py-2.5">
                {roles.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          {message && <div className={`rounded-xl px-4 py-3 text-sm ${message.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</div>}
          <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            <UserPlus size={17} /> {saving ? "Menyimpan..." : "Tambah Akun"}
          </button>
        </form>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3 border-b pb-5">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Users size={22} /></div>
          <div>
            <h2 className="text-lg font-bold">Daftar Semua Pengguna</h2>
            <p className="text-sm text-gray-500">Administrator, Operator, dan Viewer.</p>
          </div>
        </div>
        {loadingUsers ? <div className="flex items-center gap-2 py-6 text-sm text-gray-500"><Loader2 className="animate-spin" size={17} /> Memuat daftar pengguna...</div> : usersError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{usersError}</p> : users.length === 0 ? <p className="py-6 text-sm text-gray-500">Belum ada pengguna.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b text-xs uppercase tracking-wide text-gray-500"><th className="px-3 py-3 font-semibold">Nama</th><th className="px-3 py-3 font-semibold">Username</th><th className="px-3 py-3 font-semibold">Level</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Dibuat</th><th className="px-3 py-3 text-right font-semibold">Aksi</th></tr></thead>
              <tbody>{users.map((user) => <tr key={user.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium text-gray-800">{user.name}</td><td className="px-3 py-3 text-gray-600">{user.username}</td><td className="px-3 py-3">{user.role}</td><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{user.status}</span></td><td className="px-3 py-3 text-gray-600">{new Date(user.createdAt).toLocaleDateString("id-ID")}</td><td className="px-3 py-3"><div className="flex justify-end gap-1"><button type="button" title="Lihat pengguna" aria-label={`Lihat ${user.name}`} onClick={() => setSelectedUser(user)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-700"><Eye size={17} /></button><button type="button" title="Update pengguna" aria-label={`Update ${user.name}`} onClick={() => startEdit(user)} className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-700"><Pencil size={17} /></button><button type="button" title="Hapus pengguna" aria-label={`Hapus ${user.name}`} onClick={() => deleteUser(user)} disabled={actionLoading} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 size={17} /></button></div></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      {selectedUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedUser(null)}><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Detail Pengguna</h2><button type="button" title="Tutup" aria-label="Tutup detail" onClick={() => setSelectedUser(null)}><X size={20} /></button></div><dl className="space-y-3 text-sm"><div className="flex justify-between gap-4 border-b pb-2"><dt className="text-gray-500">Nama</dt><dd className="font-medium text-right">{selectedUser.name}</dd></div><div className="flex justify-between gap-4 border-b pb-2"><dt className="text-gray-500">Username</dt><dd className="font-medium text-right">{selectedUser.username}</dd></div><div className="flex justify-between gap-4 border-b pb-2"><dt className="text-gray-500">Level</dt><dd className="font-medium text-right">{selectedUser.role}</dd></div><div className="flex justify-between gap-4 border-b pb-2"><dt className="text-gray-500">Status</dt><dd className="font-medium text-right">{selectedUser.status}</dd></div><div className="flex justify-between gap-4"><dt className="text-gray-500">Dibuat</dt><dd className="font-medium text-right">{new Date(selectedUser.createdAt).toLocaleDateString("id-ID")}</dd></div></dl></div></div>}
+
+      {editingUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingUser(null)}><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Update Pengguna</h2><button type="button" title="Tutup" aria-label="Tutup update" onClick={() => setEditingUser(null)}><X size={20} /></button></div><form onSubmit={updateUser} className="space-y-4"><div><label className="mb-1 block text-sm font-medium">Username</label><input value={editingUser.username} disabled className="w-full rounded-xl border bg-gray-50 px-3 py-2.5 text-gray-500" /></div><div><label className="mb-1 block text-sm font-medium">Nama</label><input value={editName} onChange={(event) => setEditName(event.target.value)} required className="w-full rounded-xl border px-3 py-2.5" /></div><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Role</label><select value={editRole} onChange={(event) => setEditRole(event.target.value)} className="w-full rounded-xl border px-3 py-2.5">{roles.map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="mb-1 block text-sm font-medium">Status</label><select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="w-full rounded-xl border px-3 py-2.5">{statuses.map((item) => <option key={item}>{item}</option>)}</select></div></div><div><label className="mb-1 block text-sm font-medium">Password baru <span className="font-normal text-gray-400">(opsional)</span></label><input type="password" minLength={6} value={editPassword} onChange={(event) => setEditPassword(event.target.value)} className="w-full rounded-xl border px-3 py-2.5" /></div><button disabled={actionLoading} className="flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{actionLoading && <Loader2 className="animate-spin" size={17} />} Simpan Perubahan</button></form></div></div>}
+    </div>
+  );
+}
