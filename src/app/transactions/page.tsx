"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit2, Trash2, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Transaction, Account, Category } from "@/lib/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAccountsAndCats = async () => {
    const res = await fetch("/api/init");
    if (res.ok) {
      const data = await res.json();
      setAccounts(data.accounts || []);
      setCategories(data.categories || []);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (search) params.set("search", search);
      if (type) params.set("type", type);
      if (categoryId) params.set("categoryId", categoryId);
      if (accountId) params.set("accountId", accountId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountsAndCats();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, type, categoryId, accountId, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadTransactions();
      window.dispatchEvent(new CustomEvent("finora:tx-updated"));
    }
  };

  return (
    <DashboardLayout title="Manajemen Transaksi">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Riwayat Transaksi</h2>
          <p className="text-xs text-gray-500">Total {total} transaksi tercatat dalam sistem</p>
        </div>
        <Button onClick={() => { setEditingTx(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          Tambah Transaksi
        </Button>
      </div>

      <Card className="mb-6 p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Cari transaksi atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs text-gray-900"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 p-2 text-xs bg-white">
            <option value="">Semua Jenis</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>

          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 p-2 text-xs bg-white">
            <option value="">Semua Kategori</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>

          <select value={accountId} onChange={(e) => { setAccountId(e.target.value); setPage(1); }} className="rounded-xl border border-gray-200 p-2 text-xs bg-white">
            <option value="">Semua Akun</option>
            {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>

          <div className="flex gap-1.5">
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-1/2 rounded-xl border border-gray-200 p-2 text-[11px] bg-white" title="Dari Tanggal" />
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-1/2 rounded-xl border border-gray-200 p-2 text-[11px] bg-white" title="Sampai Tanggal" />
          </div>
        </form>
      </Card>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Nama Transaksi</th>
                <th className="p-4">Jenis & Kategori</th>
                <th className="p-4">Akun Keuangan</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Memuat data transaksi...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Tidak ada transaksi yang cocok.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="p-4 font-semibold text-gray-900">
                      <div>{tx.name}</div>
                      {tx.notes && <div className="text-[11px] text-gray-400 font-normal">{tx.notes}</div>}
                    </td>
                    <td className="p-4">
                      {tx.type === "transfer" ? (
                        <Badge variant="primary" size="sm">Transfer</Badge>
                      ) : (
                        <Badge variant={tx.type === "income" ? "success" : "danger"} size="sm">
                          {tx.category_name || (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {tx.type === "transfer" ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{tx.account_name}</span>
                          <span className="text-gray-400">➔</span>
                          <span className="text-blue-600">{tx.destination_account_name}</span>
                        </div>
                      ) : (
                        tx.account_name
                      )}
                    </td>
                    <td className={`p-4 text-right font-bold text-sm ${
                      tx.type === "income" ? "text-[#16A34A]" : tx.type === "expense" ? "text-[#DC2626]" : "text-[#2563EB]"
                    }`}>
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}{formatRupiah(tx.amount)}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => { setEditingTx(tx); setModalOpen(true); }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 p-4 text-xs text-gray-500">
          <span>Halaman {page} dari {totalPages} ({total} transaksi)</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        accounts={accounts}
        categories={categories}
        initialData={editingTx}
        onSuccess={() => { loadTransactions(); window.dispatchEvent(new CustomEvent("finora:tx-updated")); }}
      />
    </DashboardLayout>
  );
}


