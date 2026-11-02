"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CalendarDays,
  Wallet,
  PieChart,
  PiggyBank,
  BarChart3,
  Landmark,
  Tags,
  Sparkles,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: {
    full_name: string;
    email: string;
  } | null;
  onLogout?: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
    { name: "Pengeluaran Harian", href: "/daily", icon: CalendarDays },
    { name: "Uang Saku", href: "/allowance", icon: Wallet },
    { name: "Anggaran", href: "/budgets", icon: PieChart },
    { name: "Tabungan", href: "/savings", icon: PiggyBank },
    { name: "Laporan", href: "/reports", icon: BarChart3 },
    { name: "Akun Keuangan", href: "/accounts", icon: Landmark },
    { name: "Kategori", href: "/categories", icon: Tags },
    { name: "Insights", href: "/insights", icon: Sparkles },
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-screen transition-colors">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 dark:border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-md shadow-blue-500/25">
          <TrendingUp className="h-5 w-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-slate-100 block leading-tight">
            Finora
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500 block">
            Finance Tracker
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Menu Utama
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#2563EB] text-white shadow-sm shadow-blue-600/20"
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-white" : "text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-100 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-slate-800/80 p-2.5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-xs font-bold text-[#2563EB]">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-semibold text-gray-800 dark:text-slate-200">
                {user?.full_name || "Pengguna"}
              </p>
              <p className="truncate text-[11px] text-gray-400 dark:text-slate-400">
                {user?.email || "finora@user.com"}
              </p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
