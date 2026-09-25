"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Table2,
  ClipboardList,
  History,
  LogOut,
  Menu,
  X,
  UsersRound,
  RefreshCw,
  Settings,
  UserPlus,
  MapPinned,
  Bell,
  ClipboardCheck,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

type DataNotification = {
  id: string;
  timestamp: string;
  tingkat: string;
  provinsi: string;
  kabupatenKota: string;
  pengirim: string;
};

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/data-ormas", label: "Semua Data", icon: Table2 },
  {
    href: "/dashboard/laporan/bidang",
    label: "Laporan Bidang",
    icon: ClipboardList,
  },
  { href: "/dashboard/laporan/daerah-pengirim", label: "Daerah Pengirim Data", icon: MapPinned },
  { href: "/dashboard/laporan/rekap-ormas", label: "Rekap Data Ormas", icon: ClipboardCheck },
];
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<DataNotification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) {
          router.replace("/login");
          return;
        }
        setUser(d.user);
      })
      .finally(() => setLoading(false));
  }, [router]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/laporan/daerah-pengirim?pageSize=1", {
          cache: "no-store",
        });
        const result = await response.json();
        if (!active || !result.success) return;
        const items = result.notifications || [];
        setNotifications(items);
        const seen = new Set<string>(JSON.parse(localStorage.getItem("daerah-pengirim-notifications") || "[]"));
        setUnreadCount(items.filter((item: DataNotification) => !seen.has(item.id)).length);
      } catch {
        // Notifications are supplementary and should not interrupt dashboard use.
      }
    };
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user]);

  function markNotificationsRead() {
    localStorage.setItem("daerah-pengirim-notifications", JSON.stringify(notifications.map((item) => item.id)));
    setUnreadCount(0);
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  if (loading)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-blue-800">
        <RefreshCw className="animate-spin" />
      </div>
    );
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  return (
    <div className="min-h-screen bg-gray-100">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-blue-950 text-white transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-blue-900 px-5">
          <div className="flex items-center gap-2 font-bold">
            <UsersRound size={22} />
            Pendataan Ormas
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <div className="border-b border-blue-900 p-4">
          <div className="truncate font-semibold">{user?.name}</div>
          <div className="text-xs text-blue-300">{user?.role}</div>
        </div>
        <nav className="scrollbar-thin space-y-1 overflow-y-auto p-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${active(n.href) ? "bg-blue-700 font-semibold" : "text-blue-100 hover:bg-blue-900"}`}
            >
              <n.icon size={18} />
              {n.label}
            </Link>
          ))}
          <Link
            href="/dashboard/pengaturan-akun"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${active("/dashboard/pengaturan-akun") ? "bg-blue-700 font-semibold" : "text-blue-100 hover:bg-blue-900"}`}
          >
            <Settings size={18} />
            Pengaturan Akun
          </Link>
          {user?.role === "Administrator" && (
            <Link
              href="/dashboard/tambah-akun"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${active("/dashboard/tambah-akun") ? "bg-blue-700 font-semibold" : "text-blue-100 hover:bg-blue-900"}`}
            >
              <UserPlus size={18} />
              Tambah Akun
            </Link>
          )}
          {user?.role === "Administrator" && (
            <Link
              href="/dashboard/log-aktivitas"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${active("/dashboard/log-aktivitas") ? "bg-blue-700 font-semibold" : "text-blue-100 hover:bg-blue-900"}`}
            >
              <History size={18} />
              Log Aktivitas
            </Link>
          )}
        </nav>
        <button
          onClick={logout}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 font-semibold hover:bg-red-600"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </aside>
      <div className="md:pl-72">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white px-4 shadow-sm md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="text-lg font-bold">{pageTitle(pathname)}</div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationOpen((value) => !value);
                  if (!notificationOpen) markNotificationsRead();
                }}
                className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Notifikasi data masuk"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-white text-left shadow-lg">
                  <div className="border-b px-4 py-3 font-semibold">Daerah Pengirim Data</div>
                  {notifications.length ? (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((item) => (
                        <div key={item.id} className="border-b px-4 py-3 last:border-0">
                          <div className="text-sm font-semibold">
                            {item.kabupatenKota || item.provinsi}
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.provinsi} · {item.pengirim}
                          </div>
                          <div className="mt-1 text-[11px] text-gray-400">{item.timestamp || "Waktu tidak tersedia"}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Belum ada data masuk.</div>
                  )}
                </div>
              )}
            </div>
            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
function pageTitle(path: string) {
  if (path === "/dashboard") return "Dashboard";
  if (path.startsWith("/dashboard/data-ormas")) return "Data Ormas";
  if (path.startsWith("/dashboard/laporan/bidang"))
    return "Laporan Bidang Kegiatan";
  if (path.startsWith("/dashboard/laporan/wilayah")) return "Rekap Wilayah";
  if (path.startsWith("/dashboard/laporan/daerah-pengirim")) return "Daerah Pengirim Data";
  if (path.startsWith("/dashboard/laporan/rekap-ormas")) return "Rekap Data Ormas";
  if (path.startsWith("/dashboard/pengaturan-akun")) return "Pengaturan Akun";
  if (path.startsWith("/dashboard/tambah-akun")) return "Tambah Akun";
  if (path.startsWith("/dashboard/log-aktivitas")) return "Log Aktivitas";
  return "Pendataan Ormas";
}
