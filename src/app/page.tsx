"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentTransactionsTable } from "@/components/dashboard/RecentTransactionsTable";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { formatRupiah } from "@/lib/utils";
import {
  DashboardSummary,
  CashFlowDataPoint,
  SpendingByCategory,
  Transaction,
  Budget,
  Account,
  Category,
} from "@/lib/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowDataPoint[]>([]);
  const [spending, setSpending] = useState<SpendingByCategory[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [period, setPeriod] = useState<"7days" | "month" | "3months" | "6months" | "1year">("month");
  const [modalOpen, setModalOpen] = useState(false);
  const [initialTx, setInitialTx] = useState<Transaction | null>(null);

  const loadData = async (p = period) => {
    try {
      const [dRes, iRes] = await Promise.all([
        fetch(`/api/dashboard?period=${p}`),
        fetch("/api/init"),
      ]);
      if (dRes.ok) {
        const d = await dRes.json();
        setSummary(d.summary);
        setCashFlow(d.cashFlow);
        setSpending(d.spendingBreakdown);
        setRecentTx(d.recentTransactions);
        setBudgets(d.budgets);
      }
      if (iRes.ok) {
        const i = await iRes.json();
        setAccounts(i.accounts || []);
        setCategories(i.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData(period);
    const handler = () => loadData(period);
    window.addEventListener("finora:tx-updated", handler);
    return () => window.removeEventListener("finora:tx-updated", handler);
  }, [period]);

  return (
    <DashboardLayout title="Dashboard Keuangan">
      <SummaryCards summary={summary} accountsCount={accounts.length} />

      <QuickActions
        onAddIncome={() => {
          setInitialTx({ type: "income", amount: 0, account_id: accounts[0]?.id || 1, name: "", date: "" } as Transaction);
          setModalOpen(true);
        }}
        onAddExpense={() => {
          setInitialTx({ type: "expense", amount: 0, account_id: accounts[0]?.id || 1, name: "", date: "" } as Transaction);
          setModalOpen(true);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CashFlowChart data={cashFlow} period={period} onPeriodChange={setPeriod} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran Bulan Ini</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {spending.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">Belum ada pengeluaran bulan ini.</p>
            ) : (
              spending.slice(0, 5).map((cat) => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{cat.categoryName}</span>
                    <span className="font-bold text-gray-900 dark:text-slate-100">{formatRupiah(cat.totalAmount)}</span>
                  </div>
                  <ProgressBar value={cat.percentage} max={100} color="primary" height="sm" />
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-500">
                    <span>{cat.count} transaksi</span>
                    <span>{cat.percentage}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Progress Anggaran</CardTitle>
            <Link href="/budgets" className="text-xs text-[#2563EB] hover:underline font-medium">Lihat Semua</Link>
          </CardHeader>
          <div className="space-y-3">
            {budgets.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">Belum ada anggaran.</p>
                <Link href="/budgets"><Button size="sm" variant="outline">Buat Anggaran</Button></Link>
              </div>
            ) : (
              budgets.slice(0, 4).map((b) => (
                <div key={b.id} className="space-y-1 rounded-xl bg-gray-50/80 dark:bg-slate-800/80 p-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{b.category_name}</span>
                    <span className={`text-[11px] font-bold ${(b.percentage || 0) > 90 ? "text-red-600" : "text-emerald-600"}`}>{b.percentage}%</span>
                  </div>
                  <ProgressBar value={b.percentage || 0} max={100} color="auto" height="sm" />
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400 pt-0.5">
                    <span>Terpakai: {formatRupiah(b.spent)}</span>
                    <span>Batas: {formatRupiah(b.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <Link href="/transactions" className="text-xs text-[#2563EB] hover:underline font-medium">Semua Transaksi</Link>
          </CardHeader>
          <RecentTransactionsTable transactions={recentTx} />
        </Card>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        accounts={accounts}
        categories={categories}
        initialData={initialTx}
        onSuccess={() => loadData(period)}
      />
    </DashboardLayout>
  );
}

