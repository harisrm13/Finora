"use client";

import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, CheckCircle2, AlertCircle, Settings, Plus, ArrowUpRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatRupiah, formatDate, getTodayDateString } from "@/lib/utils";
import { Transaction } from "@/lib/types";

export default function DailyExpensePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [spentToday, setSpentToday] = useState(0);
  const [spentYesterday, setSpentYesterday] = useState(0);
  const [largestExpense, setLargestExpense] = useState<{ name: string; amount: number } | null>(null);
  const [limitAmount, setLimitAmount] = useState(0);
  const [remainingLimit, setRemainingLimit] = useState(0);
  const [limitPercentage, setLimitPercentage] = useState(0);
  const [status, setStatus] = useState<"safe" | "warning" | "exceeded">("safe");
  const [last7Days, setLast7Days] = useState<{ date: string; dayName: string; amount: number }[]>([]);
  const [averageDaily, setAverageDaily] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Limit settings modal
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [newLimitInput, setNewLimitInput] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);

  const loadDailyData = async (date = selectedDate) => {
    try {
      const res = await fetch(`/api/daily?date=${date}`);
      if (res.ok) {
        const d = await res.json();
        setSpentToday(d.spentToday || 0);
        setSpentYesterday(d.spentYesterday || 0);
        setLargestExpense(d.largestExpense);
        setLimitAmount(d.limitAmount || 0);
        setRemainingLimit(d.remainingLimit || 0);
        setLimitPercentage(d.limitPercentage || 0);
        setStatus(d.status || "safe");
        setLast7Days(d.last7Days || []);
        setAverageDaily(d.averageDaily || 0);
        setTransactions(d.transactions || []);
        setNewLimitInput(String(d.limitAmount || 100000));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newLimitInput);
    if (isNaN(val) || val < 0) return;
    setSavingLimit(true);
    try {
      await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val, isActive: true }),
      });
      setLimitModalOpen(false);
      loadDailyData(selectedDate);
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <DashboardLayout title="Pengeluaran Harian">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Monitor Pengeluaran Harian</h2>
          <p className="text-xs text-gray-500">Kontrol disiplin batas pengeluaran harian Anda agar tidak boros.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm"
          />
          <Button size="sm" variant="outline" onClick={() => setLimitModalOpen(true)}>
            <Settings className="h-4 w-4" />
            Atur Batas Harian
          </Button>
        </div>
      </div>

      <Card className="mb-6 border-l-4 border-l-[#2563EB] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Batas Pengeluaran Hari Ini</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold text-gray-900">{formatRupiah(spentToday)}</h3>
              <span className="text-xs text-gray-400">/ {formatRupiah(limitAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "safe" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" /> Pengeluaran Aman
              </span>
            )}
            {status === "warning" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                <AlertCircle className="h-4 w-4" /> Mendekati Batas Maksimal
              </span>
            )}
            {status === "exceeded" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
                <AlertTriangle className="h-4 w-4" /> Melebihi Batas Harian!
              </span>
            )}
          </div>
        </div>

        <ProgressBar value={limitPercentage} max={100} color="auto" height="md" showLabel />

        <div className="mt-3 flex flex-wrap justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
          <span>Sisa kuota: <strong className="text-gray-900">{formatRupiah(remainingLimit)}</strong></span>
          <span>Rata-rata 7 hari: <strong className="text-gray-900">{formatRupiah(averageDaily)}/hari</strong></span>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Pengeluaran Kemarin</span>
          <h4 className="text-lg font-bold text-gray-900 mt-2">{formatRupiah(spentYesterday)}</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Perbandingan hari kemarin</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Pengeluaran Terbesar</span>
          <h4 className="text-lg font-bold text-red-600 mt-2">{largestExpense ? formatRupiah(largestExpense.amount) : "Rp 0"}</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">{largestExpense ? largestExpense.name : "Belum ada transaksi hari ini"}</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Tren Rata-rata</span>
          <h4 className="text-lg font-bold text-blue-600 mt-2">{formatRupiah(averageDaily)}</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Rata-rata 7 hari terakhir</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Ringkasan 7 Hari Terakhir</CardTitle></CardHeader>
          <div className="space-y-3">
            {last7Days.map((d) => (
              <div key={d.date} className="flex items-center justify-between text-xs">
                <span className="w-16 font-medium text-gray-600">{d.dayName}</span>
                <div className="flex-1 mx-3">
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.amount > limitAmount && limitAmount > 0 ? "bg-red-500" : "bg-blue-600"}`}
                      style={{ width: `${limitAmount > 0 ? Math.min(100, (d.amount / limitAmount) * 100) : 50}%` }}
                    />
                  </div>
                </div>
                <span className="font-semibold text-gray-800">{formatRupiah(d.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaksi Tanggal {formatDate(selectedDate)}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">Tidak ada pengeluaran yang dicatat pada tanggal ini.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400">
                    <th className="pb-3 font-semibold">Nama</th>
                    <th className="pb-3 font-semibold">Kategori</th>
                    <th className="pb-3 font-semibold">Akun</th>
                    <th className="pb-3 font-semibold text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-semibold text-gray-900">{tx.name}</td>
                      <td className="py-3 text-gray-600">{tx.category_name || "Lainnya"}</td>
                      <td className="py-3 text-gray-600">{tx.account_name}</td>
                      <td className="py-3 text-right font-bold text-red-600">-{formatRupiah(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={limitModalOpen} onClose={() => setLimitModalOpen(false)} title="Atur Batas Harian">
        <form onSubmit={handleSaveLimit} className="space-y-4">
          <p className="text-xs text-gray-500">Tentukan batas maksimal pengeluaran per hari.</p>
          <Input label="Batas Harian (Rp)" type="number" value={newLimitInput} onChange={(e) => setNewLimitInput(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setLimitModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={savingLimit}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

