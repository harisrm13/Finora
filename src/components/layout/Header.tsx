"use client";

import React, { useState } from "react";
import { Bell, Plus, Menu } from "lucide-react";
import { formatDate, getTodayDateString } from "@/lib/utils";
import { Notification } from "@/lib/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface HeaderProps {
  title?: string;
  onOpenMobileNav: () => void;
  onQuickAddTx?: () => void;
  notifications?: Notification[];
  onMarkNotificationRead?: (id: number) => void;
}

export function Header({
  title,
  onOpenMobileNav,
  onQuickAddTx,
  notifications = [],
  onMarkNotificationRead,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const todayStr = getTodayDateString();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 sm:px-6 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="rounded-xl p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight">
            {title || "Finora"}
          </h1>
          <p className="hidden sm:block text-[11px] text-gray-500 dark:text-slate-400">
            {formatDate(todayStr, true)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1-Click Dark/Light Mode Toggle Button */}
        <ThemeToggle />

        {/* Quick Add Button */}
        {onQuickAddTx && (
          <button
            onClick={onQuickAddTx}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-sm shadow-blue-600/20 hover:bg-[#1D4ED8] transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Catat Transaksi</span>
            <span className="xs:hidden">Catat</span>
          </button>
        )}

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl border border-gray-200 dark:border-slate-700 p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white shadow">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2 px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200">
                  Notifikasi
                </span>
                <span className="text-[11px] text-gray-400 dark:text-slate-400">
                  {unreadCount} belum dibaca
                </span>
              </div>
              <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400 dark:text-slate-400">
                    Belum ada notifikasi
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkNotificationRead?.(notif.id);
                      }}
                      className={`cursor-pointer rounded-xl p-3 text-xs transition ${
                        notif.is_read
                          ? "bg-white dark:bg-slate-800/80 text-gray-500 dark:text-slate-400"
                          : "bg-blue-50/60 dark:bg-blue-900/30 text-gray-800 dark:text-slate-200 font-medium"
                      } hover:bg-gray-50 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/60`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{notif.title}</p>
                        {!notif.is_read && (
                          <span className="h-2 w-2 rounded-full bg-[#2563EB] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="mt-1 text-gray-600 dark:text-slate-400 leading-relaxed text-[11px]">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

