import React from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/utils";
import { DashboardSummary } from "@/lib/types";

interface Props {
  summary: DashboardSummary | null;
  accountsCount: number;
}

export function SummaryCards({ summary, accountsCount }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Saldo */}
      <Card className="border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Total Saldo</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-slate-100">{formatRupiah(summary?.totalBalance)}</h2>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{accountsCount} akun aktif terhubung</p>
        </div>
      </Card>

      {/* Pemasukan Bulan Ini */}
      <Card className="border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Pemasukan Bulan Ini</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#16A34A] dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-2xl font-bold tracking-tight text-[#16A34A] dark:text-emerald-400">{formatRupiah(summary?.thisMonthIncome)}</h2>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {summary && summary.incomeChangePercentage >= 0 ? (
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold"><ArrowUpRight className="h-3 w-3" /> +{summary.incomeChangePercentage}%</span>
            ) : (
              <span className="flex items-center text-red-500 dark:text-red-400 font-semibold"><ArrowDownRight className="h-3 w-3" /> {summary?.incomeChangePercentage}%</span>
            )}
            <span className="text-gray-400 dark:text-slate-500">vs bulan lalu</span>
          </div>
        </div>
      </Card>

      {/* Pengeluaran Bulan Ini */}
      <Card className="border-red-100 dark:border-red-900/40 bg-gradient-to-br from-white to-red-50/40 dark:from-slate-900 dark:to-red-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Pengeluaran Bulan Ini</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950 text-[#DC2626] dark:text-red-400">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-2xl font-bold tracking-tight text-[#DC2626] dark:text-red-400">{formatRupiah(summary?.thisMonthExpense)}</h2>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {summary && summary.expenseChangePercentage <= 0 ? (
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold"><ArrowDownRight className="h-3 w-3" /> {summary.expenseChangePercentage}%</span>
            ) : (
              <span className="flex items-center text-red-500 dark:text-red-400 font-semibold"><ArrowUpRight className="h-3 w-3" /> +{summary?.expenseChangePercentage}%</span>
            )}
            <span className="text-gray-400 dark:text-slate-500">vs bulan lalu</span>
          </div>
        </div>
      </Card>

      {/* Total Tabungan */}
      <Card className="border-purple-100 dark:border-purple-900/40 bg-gradient-to-br from-white to-purple-50/40 dark:from-slate-900 dark:to-purple-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Total Tabungan</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <PiggyBank className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-2xl font-bold tracking-tight text-purple-700 dark:text-purple-400">{formatRupiah(summary?.totalSavings)}</h2>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">Total dana di target tabungan</p>
        </div>
      </Card>
    </div>
  );
}
