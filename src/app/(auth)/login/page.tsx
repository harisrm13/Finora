"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Lock, Mail, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk. Periksa email dan kata sandi.");
      }
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // First try to login demo user; if not exists, register demo user
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@finora.id", password: "password123" }),
      });

      if (loginRes.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      // If doesn't exist yet, auto register demo
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@finora.id",
          password: "password123",
          full_name: "Demo Finora User",
        }),
      });

      if (!regRes.ok) {
        const d = await regRes.json();
        throw new Error(d.error || "Gagal membuat akun demo");
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-lg shadow-blue-500/25 mb-4">
            <TrendingUp className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Masuk ke Finora
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Take Control of Your Money. Kelola uang saku, anggaran, dan tabungan Anda.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              Masuk Sekarang
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-xs text-gray-400">
              Atau coba langsung
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full border-blue-200 bg-blue-50/50 text-[#2563EB] hover:bg-blue-100/50"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            Masuk dengan Akun Demo (1-Klik)
          </Button>

          <p className="mt-6 text-center text-xs text-gray-500">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
