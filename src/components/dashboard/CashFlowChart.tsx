"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatRupiah } from "@/lib/utils";
import { CashFlowDataPoint } from "@/lib/types";

interface Props {
  data: CashFlowDataPoint[];
  period: "7days" | "month" | "3months" | "6months" | "1year";
  onPeriodChange: (p: "7days" | "month" | "3months" | "6months" | "1year") => void;
}

export function CashFlowChart({ data, period, onPeriodChange }: Props) {
  const periods = [
    { key: "7days", label: "7 Hari" },
    { key: "month", label: "Bulan Ini" },
    { key: "3months", label: "3 Bulan" },
    { key: "6months", label: "6 Bulan" },
    { key: "1year", label: "1 Tahun" },
  ] as const;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 tracking-tight">
            Arus Kas Keuangan
          </h3>
          <p className="text-xs text-gray-500">
            Perbandingan pemasukan dan pengeluaran aktual
          </p>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                period === p.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Belum ada data untuk periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : val >= 1000 ? `${(val / 1000).toFixed(0)}rb` : val)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const inc = payload.find((p) => p.dataKey === "income")?.value as number || 0;
                    const exp = payload.find((p) => p.dataKey === "expense")?.value as number || 0;
                    return (
                      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-xs space-y-1">
                        <p className="font-bold text-gray-800">{label}</p>
                        <p className="text-emerald-600 font-semibold">Pemasukan: {formatRupiah(inc)}</p>
                        <p className="text-red-600 font-semibold">Pengeluaran: {formatRupiah(exp)}</p>
                        <p className="text-gray-600 pt-1 border-t text-[11px]">Selisih: {formatRupiah(inc - exp)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="income" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" name="Pemasukan" />
              <Area type="monotone" dataKey="expense" stroke="#DC2626" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" name="Pengeluaran" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
