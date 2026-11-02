"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Account, Category, Transaction } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialData?: Transaction | null;
  onSuccess: () => void;
}

export function TransactionModal({ isOpen, onClose, accounts, categories, initialData, onSuccess }: Props) {
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [catId, setCatId] = useState("");
  const [accId, setAccId] = useState("");
  const [destId, setDestId] = useState("");
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(String(initialData.amount));
      setName(initialData.name);
      setCatId(initialData.category_id ? String(initialData.category_id) : "");
      setAccId(String(initialData.account_id));
      setDestId(initialData.destination_account_id ? String(initialData.destination_account_id) : "");
      setDate(initialData.date);
      setNotes(initialData.notes || "");
    } else {
      setType("expense");
      setAmount("");
      setName("");
      setCatId("");
      if (accounts[0]) setAccId(String(accounts[0].id));
      if (accounts[1]) setDestId(String(accounts[1].id));
      setDate(getTodayDateString());
      setNotes("");
    }
    setErr(null);
  }, [initialData, isOpen, accounts]);

  const cats = categories.filter((c) => c.type === type);
  useEffect(() => {
    if (type !== "transfer" && (!catId || !cats.some(c => String(c.id) === catId))) {
      if (cats[0]) setCatId(String(cats[0].id));
    }
  }, [type, cats, catId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return setErr("Nominal harus > 0");
    if (!name.trim()) return setErr("Nama wajib diisi.");
    if (!accId) return setErr("Pilih akun.");
    if (type === "transfer" && (!destId || accId === destId)) return setErr("Pilih akun tujuan berbeda.");

    setLoading(true);
    try {
      const res = await fetch(initialData ? `/api/transactions/${initialData.id}` : "/api/transactions", {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, amount: num, name: name.trim(), date, notes: notes.trim() || null,
          accountId: parseInt(accId),
          destinationAccountId: type === "transfer" ? parseInt(destId) : null,
          categoryId: type === "transfer" ? null : parseInt(catId) || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Transaksi" : "Tambah Transaksi"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {err && <div className="p-2 text-xs bg-red-50 text-red-600 rounded-xl">{err}</div>}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          {(["expense", "income", "transfer"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`py-1.5 text-xs font-semibold rounded-lg ${type === t ? "bg-white dark:bg-slate-700 shadow text-gray-900 dark:text-slate-100" : "text-gray-500 dark:text-slate-400"}`}>
              {t === "expense" ? "Pengeluaran" : t === "income" ? "Pemasukan" : "Transfer"}
            </button>
          ))}
        </div>
        <Input label="Nominal (Rp)" type="number" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input label="Nama Transaksi" placeholder="Makan Siang / Gaji" value={name} onChange={(e) => setName(e.target.value)} required />
        {type !== "transfer" && (
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Kategori</label>
            <select value={catId} onChange={(e) => setCatId(e.target.value)} className="w-full mt-1 border border-gray-200 dark:border-slate-700 rounded-xl p-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100">
              {cats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">{type === "transfer" ? "Dari Akun" : "Akun"}</label>
            <select value={accId} onChange={(e) => setAccId(e.target.value)} className="w-full mt-1 border border-gray-200 dark:border-slate-700 rounded-xl p-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100">
              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
          </div>
          {type === "transfer" && (
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Ke Akun</label>
              <select value={destId} onChange={(e) => setDestId(e.target.value)} className="w-full mt-1 border border-gray-200 dark:border-slate-700 rounded-xl p-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100">
                {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </div>
          )}
        </div>
        <Input label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Catatan</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan singkat..." className="w-full mt-1 border border-gray-200 dark:border-slate-700 rounded-xl p-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary" isLoading={loading}>Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}

