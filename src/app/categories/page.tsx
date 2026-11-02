"use client";

import React, { useState, useEffect } from "react";
import { Tags, Plus, Edit2, Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Category, CategoryType } from "@/lib/types";

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [color, setColor] = useState("#2563EB");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setType(cat.type);
      setColor(cat.color);
    } else {
      setEditingCat(null);
      setName("");
      setType(activeTab);
      setColor(activeTab === "income" ? "#16A34A" : "#DC2626");
    }
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Nama kategori wajib diisi.");

    setSaving(true);
    try {
      const url = editingCat ? `/api/categories/${editingCat.id}` : "/api/categories";
      const method = editingCat ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kategori.");
      setModalOpen(false);
      loadCategories();
      window.dispatchEvent(new CustomEvent("finora:tx-updated"));
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus kategori ini? Kategori tidak dapat dihapus jika masih digunakan oleh transaksi.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal menghapus kategori.");
      return;
    }
    loadCategories();
    window.dispatchEvent(new CustomEvent("finora:tx-updated"));
  };

  const filtered = categories.filter((c) => c.type === activeTab);

  return (
    <DashboardLayout title="Manajemen Kategori">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Kategori Keuangan</h2>
          <p className="text-xs text-gray-500">Kelola kategori pemasukan dan pengeluaran agar pencatatan tetap rapi.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("expense")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === "expense"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ArrowDownCircle className="h-4 w-4" /> Kategori Pengeluaran ({categories.filter((c) => c.type === "expense").length})
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === "income"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ArrowUpCircle className="h-4 w-4" /> Kategori Pemasukan ({categories.filter((c) => c.type === "income").length})
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((cat) => (
          <Card key={cat.id} className="flex items-center justify-between p-4 border-gray-200">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: cat.color || "#2563EB" }} />
              <div>
                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">{cat.name}</h4>
                <span className="text-[10px] text-gray-400 capitalize">{cat.type === "income" ? "Pemasukan" : "Pengeluaran"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openModal(cat)} className="p-1 text-gray-400 hover:text-gray-700 rounded">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Kategori */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCat ? "Edit Kategori" : "Tambah Kategori Baru"}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl">{error}</div>}
          <Input label="Nama Kategori" placeholder="Contoh: Kebutuhan Kuliah, Hobi" value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Tipe Kategori</label>
            <select value={type} onChange={(e) => setType(e.target.value as CategoryType)} className="w-full mt-1 border rounded-xl p-2.5 text-sm bg-white">
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Warna Label</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 rounded-lg cursor-pointer border p-0.5" />
              <span className="text-xs text-gray-500 font-mono">{color}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" isLoading={saving}>Simpan Kategori</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

