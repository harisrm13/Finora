"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, TrendingDown, Calendar, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/utils";

interface InsightsData {
  curExpense: number;
  lastExpense: number;
  expenseDiff: number;
  expenseDiffPercent: number;
  topCategory: { name: string; total: number } | null;
  highestDay: { date: string; total: number } | null;
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Analisis Keuangan">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Financial Insights</h2>
        <p className="text-xs text-gray-500">
          Ringkasan analitik berbasis perhitungan transaksi aktual Anda untuk pengambilan keputusan finansial.
        </p>
      </div>

      {loading ? (
        <p className="py-12 text-center text-xs text-gray-400">Menghitung analisis keuangan...</p>
      ) : !data || (data.curExpense === 0 && data.lastExpense === 0) ? (
        <Card className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-[#2563EB] mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Data Transaksi Belum Mencukupi</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Catat lebih banyak transaksi bulan ini untuk membuka wawasan analitik pola keuangan Anda.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-red-500 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Kategori Pengeluaran Terbesar</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {data.topCategory ? data.topCategory.name : "Belum ada"}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              {data.topCategory ? (
                <>
                  Sebesar <strong className="text-gray-900">{formatRupiah(data.topCategory.total)}</strong> dialokasikan untuk kategori ini.
                  Pertimbangkan mengevaluasi pos ini jika ingin berhemat.
                </>
              ) : "Belum ada transaksi pengeluaran bulan ini."}
            </p>
          </Card>

          <Card className="border-l-4 border-l-blue-500 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Perbandingan vs Bulan Lalu</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {data.expenseDiffPercent > 0 ? `+${data.expenseDiffPercent}% Naik` : `${data.expenseDiffPercent}% Turun`}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              Pengeluaran bulan ini <strong className="text-gray-900">{formatRupiah(data.curExpense)}</strong> dibandingkan{" "}
              <strong className="text-gray-900">{formatRupiah(data.lastExpense)}</strong> pada bulan sebelumnya.
            </p>
          </Card>

          <Card className="border-l-4 border-l-amber-500 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Hari Pengeluaran Tertinggi</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {data.highestDay ? data.highestDay.date : "Tidak ada"}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              {data.highestDay ? (
                <>Pengeluaran puncak tercatat sebesar <strong className="text-gray-900">{formatRupiah(data.highestDay.total)}</strong> dalam satu hari.</>
              ) : "Belum ada data pengeluaran."}
            </p>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Privasi & Keamanan Data</span>
                <h3 className="text-lg font-bold text-emerald-700 mt-0.5">Terkontrol & Mandiri</h3>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              Seluruh data keuangan dihitung secara lokal di backend Anda. Tidak ada data finansial yang dibagikan ke pihak ketiga atau model AI eksternal.
            </p>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
