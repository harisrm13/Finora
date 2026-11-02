"use client";

import React, { useState, useEffect } from "react";
import { Download, FileText, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatRupiah, formatDate, sanitizeCsvCell, getTodayDateString } from "@/lib/utils";
import { Transaction, SpendingByCategory } from "@/lib/types";
import { jsPDF } from "jspdf";

export default function ReportsPage() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");

  const [periodPreset, setPeriodPreset] = useState<"today" | "this_week" | "this_month" | "this_year" | "custom">("this_month");
  const [startDate, setStartDate] = useState(`${y}-${m}-01`);
  const [endDate, setEndDate] = useState(getTodayDateString());

  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netCashFlow, setNetCashFlow] = useState(0);
  const [totalDays, setTotalDays] = useState(1);
  const [avgDailyExpense, setAvgDailyExpense] = useState(0);
  const [categories, setCategories] = useState<SpendingByCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handlePresetChange = (preset: "today" | "this_week" | "this_month" | "this_year" | "custom") => {
    setPeriodPreset(preset);
    const today = new Date();
    const todayStr = getTodayDateString();

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "this_week") {
      const d = new Date(today);
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      setStartDate(d.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "this_month") {
      setStartDate(`${y}-${m}-01`);
      setEndDate(todayStr);
    } else if (preset === "this_year") {
      setStartDate(`${y}-01-01`);
      setEndDate(todayStr);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const d = await res.json();
        setTotalIncome(d.totalIncome || 0);
        setTotalExpense(d.totalExpense || 0);
        setNetCashFlow(d.netCashFlow || 0);
        setTotalDays(d.totalDays || 1);
        setAvgDailyExpense(d.avgDailyExpense || 0);
        setCategories(d.categoryBreakdown || []);
        setTransactions(d.transactions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  const exportCSV = () => {
    const headers = ["Tanggal", "Nama Transaksi", "Jenis", "Kategori", "Akun", "Nominal (IDR)", "Catatan"];
    const rows = transactions.map((t) => [
      sanitizeCsvCell(t.date),
      sanitizeCsvCell(t.name),
      sanitizeCsvCell(t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer"),
      sanitizeCsvCell(t.category_name || "-"),
      sanitizeCsvCell(t.account_name || "-"),
      sanitizeCsvCell(t.amount),
      sanitizeCsvCell(t.notes || ""),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Finora_${startDate}_sd_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("FINORA — LAPORAN KEUANGAN PRIBADI", 14, 15);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}`, 14, 32);
    doc.text(`Dicetak pada: ${formatDate(getTodayDateString(), true)}`, 14, 38);

    doc.setFillColor(247, 248, 250);
    doc.roundedRect(14, 44, 182, 26, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("TOTAL PEMASUKAN", 20, 52);
    doc.text("TOTAL PENGELUARAN", 80, 52);
    doc.text("ARUS KAS BERSIH", 140, 52);

    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74);
    doc.text(formatRupiah(totalIncome), 20, 62);
    doc.setTextColor(220, 38, 38);
    doc.text(formatRupiah(totalExpense), 80, 62);
    doc.setTextColor(37, 99, 235);
    doc.text(formatRupiah(netCashFlow), 140, 62);

    let yPos = 78;
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("Daftar Transaksi", 14, yPos);

    yPos += 5;
    doc.setFillColor(243, 244, 246);
    doc.rect(14, yPos, 182, 7, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text("Tanggal", 16, yPos + 5);
    doc.text("Nama", 42, yPos + 5);
    doc.text("Kategori", 100, yPos + 5);
    doc.text("Nominal", 160, yPos + 5);

    yPos += 7;
    doc.setFontSize(8);
    transactions.slice(0, 30).forEach((t) => {
      if (yPos > 275) { doc.addPage(); yPos = 20; }
      doc.setTextColor(55, 65, 81);
      doc.text(t.date, 16, yPos + 5);
      doc.text((t.name || "").substring(0, 26), 42, yPos + 5);
      doc.text((t.category_name || "-").substring(0, 18), 100, yPos + 5);
      doc.text(formatRupiah(t.amount), 160, yPos + 5);
      yPos += 6;
    });

    doc.save(`Laporan_Finora_${startDate}_sd_${endDate}.pdf`);
  };
  return (
    <DashboardLayout title="Laporan Keuangan">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Laporan & Ekspor Data</h2>
          <p className="text-xs text-gray-500">Analisis arus kas, distribusi belanja per kategori, dan unduh dokumen resmi.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Unduh CSV
          </Button>
          <Button size="sm" variant="primary" onClick={exportPDF}>
            <FileText className="h-4 w-4" /> Cetak PDF
          </Button>
        </div>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
            {(["today", "this_week", "this_month", "this_year", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg capitalize ${periodPreset === p ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
              >
                {p === "today" ? "Hari Ini" : p === "this_week" ? "Minggu Ini" : p === "this_month" ? "Bulan Ini" : p === "this_year" ? "Tahun Ini" : "Kustom"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Rentang:</span>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPeriodPreset("custom"); }} className="rounded-xl border p-1.5 text-xs bg-white" />
            <span className="text-gray-400">s/d</span>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPeriodPreset("custom"); }} className="rounded-xl border p-1.5 text-xs bg-white" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Pemasukan Periode</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-2">{formatRupiah(totalIncome)}</h3>
        </Card>
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Pengeluaran Periode</span>
          <h3 className="text-xl font-bold text-red-600 mt-2">{formatRupiah(totalExpense)}</h3>
        </Card>
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Arus Kas Bersih</span>
          <h3 className={`text-xl font-bold mt-2 ${netCashFlow >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {formatRupiah(netCashFlow)}
          </h3>
        </Card>
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Rata-rata Pengeluaran</span>
          <h3 className="text-xl font-bold text-gray-900 mt-2">{formatRupiah(avgDailyExpense)}/hari</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Dihitung selama {totalDays} hari</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Pengeluaran per Kategori</CardTitle></CardHeader>
          <div className="space-y-4">
            {categories.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">Tidak ada pengeluaran dalam rentang tanggal ini.</p>
            ) : (
              categories.map((c) => (
                <div key={c.categoryId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-800">{c.categoryName}</span>
                    <span className="font-bold text-gray-900">{formatRupiah(c.totalAmount)}</span>
                  </div>
                  <ProgressBar value={c.percentage} max={100} color="primary" height="sm" />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{c.count} transaksi</span>
                    <span>{c.percentage}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Daftar Transaksi ({transactions.length})</CardTitle></CardHeader>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 sticky top-0">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">Tidak ada transaksi ditemukan.</td></tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="p-3 text-gray-500 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="p-3 font-semibold text-gray-900">{t.name}</td>
                      <td className="p-3 text-gray-600">{t.category_name || "-"}</td>
                      <td className={`p-3 text-right font-bold ${t.type === "income" ? "text-emerald-600" : t.type === "expense" ? "text-red-600" : "text-blue-600"}`}>
                        {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}{formatRupiah(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}


