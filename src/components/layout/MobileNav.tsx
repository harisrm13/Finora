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
  X,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    full_name: string;
    email: string;
  } | null;
  onLogout?: () => void;
}

export function MobileNav({ isOpen, onClose, user, onLogout }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex w-72 max-w-[80%] flex-1 flex-col bg-white dark:bg-slate-900 shadow-2xl transition-colors">
        <div className="flex h-16 items-center justify-between border-b border-gray-100 dark:border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-slate-100">Finora</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-[#2563EB] text-white font-semibold shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 dark:text-slate-500")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-gray-100 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-slate-800/80 p-2.5">
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-gray-800 dark:text-slate-200">{user.full_name}</p>
                <p className="truncate text-[10px] text-gray-400 dark:text-slate-400">{user.email}</p>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
