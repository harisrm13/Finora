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
      <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Saldo</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950">{formatRupiah(summary?.totalBalance)}</h2>
          <p className="mt-1 text-[11px] text-gray-500">{accountsCount} akun aktif terhubung</p>
        </div>
      </Card>

      {/* Pemasukan Bulan Ini */}
      <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pemasukan Bulan Ini</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#16A34A]">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-2xl font-bold tracking-tight text-[#16A34A]">{formatRupiah(summary?.thisMonthIncome)}</h2>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {summary && summary.incomeChangePercentage >= 0 ? (
              <span className="flex items-center text-emerald-600 font-semibold"><ArrowUpRight className="h-3 w-3" /> +{summary.incomeChangePercentage}%</span>
            ) : (
              <span className="flex items-center text-red-500 font-semibold"><ArrowDownRight className="h-3 w-3" /> {summary?.incomeChangePercentage}%</span>
            )}
            <span className="text-gray-400">vs bulan lalu</span>
          </div>
        </div>
      </Card>

      {/* Pengeluaran Bulan Ini */}
      <Card className="border-red-100 bg-gradient-to-br from-white to-red-50/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pengeluaran Bulan Ini</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-[#DC2626]">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-2xl font-bold tracking-tight text-[#DC2626]">{formatRupiah(summary?.thisMonthExpense)}</h2>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {summary && summary.expenseChangePercentage <= 0 ? (
              <span className="flex items-center text-emerald-600 font-semibold"><ArrowDownRight className="h-3 w-3" /> {summary.expenseChangePercentage}%</span>
            ) : (
              <span className="flex items-center text-red-500 font-semibold"><ArrowUpRight className="h-3 w-3" /> +{summary?.expenseChangePercentage}%</span>
            )}
            <span className="text-gray-400">vs bulan lalu</span>
          </div>
        </div>
      </Card>

      {/* Total Tabungan */}
      <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Tabungan</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <PiggyBank className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <h2 className="text-2xl font-bold tracking-tight text-purple-700">{formatRupiah(summary?.totalSavings)}</h2>
          <p className="mt-1 text-[11px] text-gray-500">Total dana di target tabungan</p>
        </div>
      </Card>
    </div>
  );
}
