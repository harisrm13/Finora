"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Plus, Edit2, Trash2, Wallet, CreditCard, Smartphone, PiggyBank } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils";
import { Account, AccountType } from "@/lib/types";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [initialBalance, setInitialBalance] = useState("0");
  const [color, setColor] = useState("#2563EB");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const openModal = (acc?: Account) => {
    if (acc) {
      setEditingAcc(acc);
      setName(acc.name);
      setType(acc.type);
      setInitialBalance(String(acc.initial_balance));
      setColor(acc.color || "#2563EB");
    } else {
      setEditingAcc(null);
      setName("");
      setType("bank");
      setInitialBalance("0");
      setColor("#2563EB");
    }
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Nama akun wajib diisi.");
    const initBal = parseFloat(initialBalance) || 0;

    setSaving(true);
    try {
      const url = editingAcc ? `/api/accounts/${editingAcc.id}` : "/api/accounts";
      const method = editingAcc ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, initial_balance: initBal, color }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal menyimpan akun.");
      }
      setModalOpen(false);
      loadAccounts();
      window.dispatchEvent(new CustomEvent("finora:tx-updated"));
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus akun keuangan ini? Jika sudah ada transaksi terkait, akun akan dinonaktifkan dengan aman.")) return;
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadAccounts();
      window.dispatchEvent(new CustomEvent("finora:tx-updated"));
    }
  };

  const totalAllBalance = accounts.reduce((s, a) => s + (a.current_balance || 0), 0);

  const getTypeIcon = (t: AccountType) => {
    switch (t) {
      case "cash": return <Wallet className="h-5 w-5" />;
      case "bank": return <CreditCard className="h-5 w-5" />;
      case "ewallet": return <Smartphone className="h-5 w-5" />;
      case "savings": return <PiggyBank className="h-5 w-5" />;
    }
  };

  const getTypeName = (t: AccountType) => {
    switch (t) {
      case "cash": return "Dompet Tunai";
      case "bank": return "Rekening Bank";
      case "ewallet": return "E-Wallet";
      case "savings": return "Tabungan";
    }
  };

  return (
    <DashboardLayout title="Akun Keuangan">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Kelola Akun Keuangan</h2>
          <p className="text-xs text-gray-500">Saldo riil dihitung otomatis dari saldo awal dan seluruh mutasi transaksi.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4" /> Tambah Akun Baru
        </Button>
      </div>

      {/* Hero Overview */}
      <Card className="mb-6 border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-md shadow-blue-500/15">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Total Kekayaan Bersih (Seluruh Akun)</span>
        <h3 className="text-3xl font-extrabold tracking-tight mt-1">{formatRupiah(totalAllBalance)}</h3>
        <p className="text-xs text-blue-100/80 mt-1">Total {accounts.length} akun aktif</p>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <Card key={acc.id} className="relative overflow-hidden border-gray-200">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: acc.color || "#2563EB" }}>
                  {getTypeIcon(acc.type)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{acc.name}</h4>
                  <Badge variant="neutral" size="sm">{getTypeName(acc.type)}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openModal(acc)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 py-2">
              <div>
                <span className="text-[11px] text-gray-400 block">Saldo Saat Ini</span>
                <span className={`text-xl font-bold ${(acc.current_balance || 0) < 0 ? "text-red-600" : "text-gray-900"}`}>
                  {formatRupiah(acc.current_balance)}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-50 flex justify-between">
                <span>Saldo Awal:</span>
                <span>{formatRupiah(acc.initial_balance)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Account Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingAcc ? "Edit Akun Keuangan" : "Tambah Akun Keuangan"}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl">{error}</div>}
          <Input label="Nama Akun" placeholder="Contoh: Dompet Tunai, BCA, GoPay" value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Jenis Akun</label>
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className="w-full mt-1 border rounded-xl p-2.5 text-sm bg-white">
              <option value="cash">Dompet Tunai</option>
              <option value="bank">Rekening Bank</option>
              <option value="ewallet">E-Wallet (GoPay, OVO, DANA)</option>
              <option value="savings">Rekening Tabungan</option>
            </select>
          </div>
          <Input label="Saldo Awal (Rp)" type="number" placeholder="0" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={saving}>Simpan Akun</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

