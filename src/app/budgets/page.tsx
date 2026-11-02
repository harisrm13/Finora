"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Plus, Trash2, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatRupiah } from "@/lib/utils";
import { Budget, Category } from "@/lib/types";

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch("/api/categories?type=expense"),
      ]);
      if (bRes.ok) setBudgets(await bRes.json());
      if (cRes.ok) {
        const cats = await cRes.json();
        setCategories(cats);
        if (cats.length > 0 && !selectedCatId) setSelectedCatId(cats[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amountInput);
    if (!selectedCatId) return setError("Pilih kategori pengeluaran.");
    if (isNaN(amt) || amt <= 0) return setError("Nominal anggaran harus > 0");

    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: parseInt(selectedCatId),
          month,
          year,
          amount: amt,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal menyimpan anggaran");
      }
      setModalOpen(false);
      setAmountInput("");
      loadData();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm("Hapus anggaran kategori ini?")) return;
    const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
    if (res.ok) loadData();
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <DashboardLayout title="Perencanaan Anggaran">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Anggaran Bulanan</h2>
          <p className="text-xs text-gray-500">Tetapkan batas belanja per kategori untuk menjaga stabilitas keuangan.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm">
            {months.map((m, idx) => (<option key={idx + 1} value={idx + 1}>{m}</option>))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm">
            {[2025, 2026, 2027, 2028].map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Atur Anggaran
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Total Anggaran Dialokasikan</span>
          <h3 className="text-xl font-bold text-gray-900 mt-2">{formatRupiah(totalBudgeted)}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{budgets.length} kategori yang dianggarkan</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Total Pengeluaran Aktual</span>
          <h3 className="text-xl font-bold text-red-600 mt-2">{formatRupiah(totalSpent)}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{overallPercentage}% dari total alokasi</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold uppercase text-gray-500">Sisa Anggaran Bersih</span>
          <h3 className={`text-xl font-bold mt-2 ${totalRemaining >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatRupiah(totalRemaining)}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{totalRemaining >= 0 ? "Masih dalam batas aman" : "Melebihi batas"}</p>
        </Card>
      </div>
      {loading ? (
        <p className="py-12 text-center text-xs text-gray-400">Memuat data anggaran...</p>
      ) : budgets.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-[#2563EB] mb-3">
            <PieChart className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Belum Ada Anggaran untuk {months[month - 1]} {year}</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">Mulai tetapkan batas belanja bulanan Anda.</p>
          <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" />Buat Anggaran Sekarang</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const pct = b.percentage || 0;
            return (
              <Card key={b.id} className="border-gray-200">
                <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{b.category_name}</h4>
                    <span className="text-[11px] text-gray-400">Batas: {formatRupiah(b.amount)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pct > 100 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">Lebih</span>
                    ) : pct >= 75 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Waspada</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Aman</span>
                    )}
                    <button onClick={() => handleDeleteBudget(b.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Terpakai: <strong>{formatRupiah(b.spent)}</strong></span>
                    <span className="font-bold text-gray-900">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} max={100} color="auto" height="sm" />
                </div>

                <div className="flex justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  <span>Sisa kuota:</span>
                  <strong className={b.remaining !== undefined && b.remaining < 0 ? "text-red-600" : "text-gray-800"}>
                    {formatRupiah(b.remaining)}
                  </strong>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Atur Anggaran Kategori">
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl">{error}</div>}
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Kategori Pengeluaran</label>
            <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className="w-full mt-1 border rounded-xl p-2.5 text-sm bg-white">
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <Input label="Batas Anggaran Bulanan (Rp)" type="number" placeholder="Contoh: 750000" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={saving}>Simpan Anggaran</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}


