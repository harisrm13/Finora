"use client";

import React, { useState, useEffect } from "react";
import { PiggyBank, Plus, CheckCircle, Trash2, Calendar, Landmark, ArrowUpRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatDate, getTodayDateString } from "@/lib/utils";
import { SavingsGoal, SavingsContribution, Account } from "@/lib/types";

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalAccountId, setGoalAccountId] = useState("");
  const [goalNotes, setGoalNotes] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // Contribution modal
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [contribAmount, setContribAmount] = useState("");
  const [contribAccountId, setContribAccountId] = useState("");
  const [contribDate, setContribDate] = useState(getTodayDateString());
  const [contribNotes, setContribNotes] = useState("");
  const [savingContrib, setSavingContrib] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [gRes, cRes, iRes] = await Promise.all([
        fetch("/api/savings"),
        fetch("/api/savings/contributions"),
        fetch("/api/init"),
      ]);
      if (gRes.ok) setGoals(await gRes.json());
      if (cRes.ok) setContributions(await cRes.json());
      if (iRes.ok) {
        const i = await iRes.json();
        setAccounts(i.accounts || []);
        if (i.accounts?.length > 0) {
          setContribAccountId(i.accounts[0].id.toString());
          setGoalAccountId(i.accounts[0].id.toString());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(goalTargetAmount);
    if (!goalName.trim() || isNaN(amt) || amt <= 0) return setError("Nama dan target valid wajib diisi.");

    setSavingGoal(true);
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goalName.trim(),
          target_amount: amt,
          target_date: goalTargetDate || null,
          account_id: goalAccountId ? parseInt(goalAccountId) : null,
          notes: goalNotes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Gagal membuat target");
      setGoalModalOpen(false);
      setGoalName("");
      setGoalTargetAmount("");
      setGoalTargetDate("");
      setGoalNotes("");
      loadData();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(contribAmount);
    if (!selectedGoalId || isNaN(amt) || amt <= 0) return setError("Nominal setoran harus > 0");

    setSavingContrib(true);
    try {
      const res = await fetch("/api/savings/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: parseInt(selectedGoalId),
          accountId: parseInt(contribAccountId),
          amount: amt,
          date: contribDate,
          notes: contribNotes.trim() || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal mencatat setoran");
      setContribModalOpen(false);
      setContribAmount("");
      setContribNotes("");
      loadData();
      window.dispatchEvent(new CustomEvent("finora:tx-updated"));
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSavingContrib(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Hapus target tabungan ini? Riwayat setoran terkait juga akan terhapus.")) return;
    const res = await fetch(`/api/savings/${id}`, { method: "DELETE" });
    if (res.ok) loadData();
  };

  const handleDeleteContrib = async (id: number) => {
    if (!confirm("Hapus catatan setoran tabungan ini?")) return;
    const res = await fetch(`/api/savings/contributions?id=${id}`, { method: "DELETE" });
    if (res.ok) loadData();
  };

  return (
    <DashboardLayout title="Manajemen Tabungan">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Target & Impian Finansial</h2>
          <p className="text-xs text-gray-500">Bangun kebiasaan menabung secara terencana tanpa mengganggu arus kas.</p>
        </div>
        <div className="flex items-center gap-2">
          {goals.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setSelectedGoalId(goals[0].id.toString()); setContribModalOpen(true); }}>
              <ArrowUpRight className="h-4 w-4" /> Setor Tabungan
            </Button>
          )}
          <Button size="sm" onClick={() => setGoalModalOpen(true)}>
            <Plus className="h-4 w-4" /> Buat Target Baru
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-xs text-gray-400">Memuat target tabungan...</p>
      ) : goals.length === 0 ? (
        <Card className="py-12 text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 mb-3">
            <PiggyBank className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Belum Ada Target Tabungan</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Tetapkan impian seperti Dana Darurat, Gadget Baru, Liburan, atau Pendidikan.
          </p>
          <Button onClick={() => setGoalModalOpen(true)}><Plus className="h-4 w-4" />Buat Target Tabungan</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((g) => {
            const isCompleted = g.status === "completed" || (g.percentage || 0) >= 100;
            return (
              <Card key={g.id} className="border-gray-200">
                <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-sm">{g.name}</h4>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle className="h-3 w-3" /> Tercapai
                        </span>
                      )}
                    </div>
                    {g.target_date && <span className="text-[11px] text-gray-400">Target: {formatDate(g.target_date)}</span>}
                  </div>
                  <button onClick={() => handleDeleteGoal(g.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Terkumpul: <strong>{formatRupiah(g.current_amount)}</strong></span>
                    <span className="font-bold text-purple-700">{g.percentage}%</span>
                  </div>
                  <ProgressBar value={g.percentage || 0} max={100} color="primary" height="sm" />
                  <div className="flex justify-between text-[11px] text-gray-400 pt-1">
                    <span>Sisa: {formatRupiah(g.remaining)}</span>
                    <span>Target: {formatRupiah(g.target_amount)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">{g.account_name ? `Akun: ${g.account_name}` : "Alokasi Target"}</span>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedGoalId(g.id.toString()); setContribModalOpen(true); }}>
                    Setor Dana
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Card>
        <CardHeader><CardTitle>Riwayat Setoran Tabungan</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          {contributions.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">Belum ada riwayat setoran tabungan.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="pb-3 font-semibold">Tanggal</th>
                  <th className="pb-3 font-semibold">Target Tabungan</th>
                  <th className="pb-3 font-semibold">Sumber Dana</th>
                  <th className="pb-3 font-semibold text-right">Nominal</th>
                  <th className="pb-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="py-3 text-gray-500">{formatDate(c.date)}</td>
                    <td className="py-3 font-semibold text-gray-900">{c.goal_name}</td>
                    <td className="py-3 text-gray-600">{c.account_name}</td>
                    <td className="py-3 text-right font-bold text-purple-700">+{formatRupiah(c.amount)}</td>
                    <td className="py-3 text-center">
                      <button onClick={() => handleDeleteContrib(c.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal Target Tabungan Baru */}
      <Modal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} title="Buat Target Tabungan Baru">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input label="Nama Target Tabungan" placeholder="Contoh: Dana Darurat, Beli Laptop" value={goalName} onChange={(e) => setGoalName(e.target.value)} required />
          <Input label="Target Nominal (Rp)" type="number" placeholder="5000000" value={goalTargetAmount} onChange={(e) => setGoalTargetAmount(e.target.value)} required />
          <Input label="Tenggat Waktu Target (Opsional)" type="date" value={goalTargetDate} onChange={(e) => setGoalTargetDate(e.target.value)} />
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Akun Penyimpanan Tabungan (Opsional)</label>
            <select value={goalAccountId} onChange={(e) => setGoalAccountId(e.target.value)} className="w-full mt-1 border rounded-xl p-2.5 text-sm bg-white">
              <option value="">-- Alokasi Catatan Saja --</option>
              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Catatan (Opsional)</label>
            <input value={goalNotes} onChange={(e) => setGoalNotes(e.target.value)} placeholder="Catatan motivasi atau target..." className="w-full mt-1 border rounded-xl p-2.5 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setGoalModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={savingGoal}>Simpan Target</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Setor Tabungan */}
      <Modal isOpen={contribModalOpen} onClose={() => setContribModalOpen(false)} title="Setor Dana ke Tabungan">
        <form onSubmit={handleAddContribution} className="space-y-4">
          {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl">{error}</div>}
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Pilih Target Tabungan</label>
            <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)} className="w-full mt-1 border rounded-xl p-2.5 text-sm bg-white">
              {goals.map((g) => (<option key={g.id} value={g.id}>{g.name} (Terkumpul: {formatRupiah(g.current_amount)})</option>))}
            </select>
          </div>
          <Input label="Nominal Setoran (Rp)" type="number" placeholder="250000" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} required />
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Sumber Dana (Akun Keuangan)</label>
            <select value={contribAccountId} onChange={(e) => setContribAccountId(e.target.value)} className="w-full mt-1 border rounded-xl p-2.5 text-sm bg-white">
              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} (Saldo: {formatRupiah(a.current_balance)})</option>))}
            </select>
          </div>
          <Input label="Tanggal Setoran" type="date" value={contribDate} onChange={(e) => setContribDate(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setContribModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={savingContrib}>Catat Setoran</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}


