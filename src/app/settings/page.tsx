"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/init")
      .then((res) => res.json())
      .then((d) => {
        if (d.user) {
          setFullName(d.user.full_name || "");
          setEmail(d.user.email || "");
        }
      });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui profil.");
      setProfileMsg({ type: "success", text: "Profil berhasil diperbarui." });
    } catch (err: unknown) {
      setProfileMsg({ type: "error", text: (err as Error).message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Konfirmasi kata sandi baru tidak cocok." });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui kata sandi.");
      setPasswordMsg({ type: "success", text: "Kata sandi berhasil diperbarui!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordMsg({ type: "error", text: (err as Error).message });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan Akun">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Pengaturan & Profil Pengguna</h2>
          <p className="text-xs text-gray-500">Kelola identitas akun dan keamanan kata sandi Anda.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#2563EB]" />
              <CardTitle>Informasi Profil</CardTitle>
            </div>
          </CardHeader>
          {profileMsg && (
            <div className={`p-3 text-xs rounded-xl mb-4 ${profileMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input label="Email Akun" type="email" value={email} disabled />
            <Input label="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={savingProfile}>Simpan Profil</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-700" />
              <CardTitle>Ganti Kata Sandi</CardTitle>
            </div>
          </CardHeader>
          {passwordMsg && (
            <div className={`p-3 text-xs rounded-xl mb-4 ${passwordMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {passwordMsg.text}
            </div>
          )}
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input label="Kata Sandi Lama" type="password" placeholder="••••••••" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            <Input label="Kata Sandi Baru" type="password" placeholder="Minimal 6 karakter" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <Input label="Konfirmasi Kata Sandi Baru" type="password" placeholder="Ulangi kata sandi baru" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <div className="flex justify-end">
              <Button type="submit" variant="outline" size="sm" isLoading={savingPassword}>Perbarui Kata Sandi</Button>
            </div>
          </form>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600 mb-2">
            <Shield className="h-4 w-4 text-[#2563EB]" />
            <span>Spesifikasi Sistem Finora</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>Mata Uang: <strong>Rupiah (IDR)</strong></div>
            <div>Zona Waktu: <strong>WIB (Asia/Jakarta)</strong></div>
            <div>Database: <strong>SQLite (Native WAL mode)</strong></div>
            <div>Status: <strong>Produksi Siap Pakai</strong></div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

