"use client";

import React, { useState } from "react";
import { Bell, Plus, Menu } from "lucide-react";
import { formatDate, getTodayDateString } from "@/lib/utils";
import { Notification } from "@/lib/types";

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            {title || "Finora"}
          </h1>
          <p className="hidden sm:block text-[11px] text-gray-500">
            {formatDate(todayStr, true)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
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
            className="relative rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white shadow">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Notifikasi
                </span>
                <span className="text-[11px] text-gray-400">
                  {unreadCount} belum dibaca
                </span>
              </div>
              <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">
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
                        notif.is_read ? "bg-white text-gray-500" : "bg-blue-50/60 text-gray-800 font-medium"
                      } hover:bg-gray-50 border border-gray-100`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900">{notif.title}</p>
                        {!notif.is_read && (
                          <span className="h-2 w-2 rounded-full bg-[#2563EB] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="mt-1 text-gray-600 leading-relaxed text-[11px]">
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
