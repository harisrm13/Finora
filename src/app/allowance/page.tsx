"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Plus, Trash2, Calendar, Target, TrendingDown, PiggyBank, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatDate, getTodayDateString } from "@/lib/utils";
import { AllowancePlan } from "@/lib/types";

export default function AllowancePage() {
  const [plans, setPlans] = useState<AllowancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [periodType, setPeriodType] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("");
  const [savingsTarget, setSavingsTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      const res = await fetch("/api/allowance");
      if (res.ok) {
        const data = await res.json();
        setPlans(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handlePeriodChange = (p: "daily" | "weekly" | "monthly") => {
    setPeriodType(p);
    const start = new Date(startDate || new Date());
    const end = new Date(start);
    if (p === "daily") end.setDate(start.getDate());
    else if (p === "weekly") end.setDate(start.getDate() + 6);
    else if (p === "monthly") end.setMonth(start.getMonth() + 1, 0); // last day of month
    setEndDate(end.toISOString().split("T")[0]);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const tAmt = parseFloat(targetAmount);
    const sLimit = parseFloat(spendingLimit);
    const sTgt = parseFloat(savingsTarget || "0");

    if (!name.trim()) return setError("Nama rencana wajib diisi.");
    if (isNaN(tAmt) || tAmt <= 0) return setError("Nominal uang saku harus > 0");
    if (isNaN(sLimit) || sLimit <= 0) return setError("Batas pengeluaran harus > 0");
    if (!startDate || !endDate) return setError("Tanggal mulai dan berakhir wajib diisi.");

    setSaving(true);
    try {
      const res = await fetch("/api/allowance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          period_type: periodType,
          start_date: startDate,
          end_date: endDate,
          target_amount: tAmt,
          spending_limit: sLimit,
          savings_target: sTgt,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat rencana uang saku");
      setModalOpen(false);
      setName("");
      setTargetAmount("");
      setSpendingLimit("");
      setSavingsTarget("");
      setNotes("");
      loadPlans();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm("Hapus rencana uang saku ini?")) return;
    const res = await fetch(`/api/allowance/${id}`, { method: "DELETE" });
    if (res.ok) loadPlans();
  };

  return (
    <DashboardLayout title="Pengelolaan Uang Saku">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Perencanaan Uang Saku</h2>
          <p className="text-xs text-gray-500">Atur uang saku harian, mingguan, atau bulanan Anda agar terkontrol.</p>
        </div>
        <Button onClick={() => { handlePeriodChange("monthly"); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          Buat Rencana Uang Saku
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-xs text-gray-400">Memuat rencana uang saku...</p>
      ) : plans.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-[#2563EB] mb-3">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Belum Ada Rencana Uang Saku</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Buat rencana alokasi uang saku untuk membatasi pengeluaran per hari dan menyisihkan tabungan.
          </p>
          <Button onClick={() => { handlePeriodChange("monthly"); setModalOpen(true); }}>
            <Plus className="h-4 w-4" />
            Mulai Buat Rencana
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((p) => {
            const spent = p.spent_amount || 0;
            const limit = p.spending_limit || 1;
            const pct = Math.min(100, Math.round((spent / limit) * 100));
            const remaining = (p.spending_limit || 0) - spent;

            return (
              <Card key={p.id} className="relative overflow-hidden border-gray-200">
                <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{p.name}</h3>
                      <Badge variant="primary" size="sm">
                        {p.period_type === "daily" ? "Harian" : p.period_type === "weekly" ? "Mingguan" : "Bulanan"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(p.start_date)} s/d {formatDate(p.end_date)}
                    </p>
                  </div>
                  <button onClick={() => handleDeletePlan(p.id)} className="p-1 text-gray-400 hover:text-red-600 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <span className="text-gray-400 block text-[11px]">Total Uang Saku</span>
                    <strong className="text-gray-900 text-sm font-bold">{formatRupiah(p.target_amount)}</strong>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <span className="text-gray-400 block text-[11px]">Batas Pengeluaran</span>
                    <strong className="text-gray-900 text-sm font-bold">{formatRupiah(p.spending_limit)}</strong>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <span className="text-gray-400 block text-[11px]">Total Dibelanjakan</span>
                    <strong className="text-red-600 text-sm font-bold">{formatRupiah(spent)}</strong>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <span className="text-gray-400 block text-[11px]">Sisa Uang Saku</span>
                    <strong className={`text-sm font-bold ${remaining >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatRupiah(remaining)}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Penggunaan Uang Saku</span>
                    <span className={`font-bold ${pct > 90 ? "text-red-600" : pct > 75 ? "text-amber-600" : "text-emerald-600"}`}>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} max={100} color="auto" height="sm" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-3">
                  <span>Rata-rata: <strong>{formatRupiah(p.avg_daily_spent)}/hari</strong></span>
                  <span>Sisa waktu: <strong>{p.days_remaining} hari lagi</strong></span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Buat Rencana Uang Saku">
        <form onSubmit={handleCreatePlan} className="space-y-4">
          {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl">{error}</div>}

          <Input label="Nama Rencana" placeholder="Uang Saku Bulan Ini" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button key={p} type="button" onClick={() => handlePeriodChange(p)} className={`py-1.5 text-xs font-semibold rounded-lg capitalize ${periodType === p ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input label="Tanggal Mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input label="Tanggal Berakhir" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>

          <Input label="Total Uang Saku (Rp)" type="number" placeholder="1500000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
          <Input label="Batas Pengeluaran (Rp)" type="number" placeholder="1200000" value={spendingLimit} onChange={(e) => setSpendingLimit(e.target.value)} required />
          <Input label="Target Tabungan (Rp)" type="number" placeholder="300000" value={savingsTarget} onChange={(e) => setSavingsTarget(e.target.value)} />

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={saving}>Simpan Rencana</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}


