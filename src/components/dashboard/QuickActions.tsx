import React from "react";
import Link from "next/link";
import { Plus, PiggyBank, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export function QuickActions({ onAddIncome, onAddExpense }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-colors">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400">Aksi Cepat:</span>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="success" onClick={onAddIncome}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Pemasukan
        </Button>
        <Button size="sm" variant="danger" onClick={onAddExpense}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Pengeluaran
        </Button>
        <Link href="/savings">
          <Button size="sm" variant="outline">
            <PiggyBank className="h-3.5 w-3.5" />
            Kelola Tabungan
          </Button>
        </Link>
        <Link href="/transactions">
          <Button size="sm" variant="ghost">
            Lihat Semua Transaksi
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
