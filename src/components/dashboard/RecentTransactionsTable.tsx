import React from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

export function RecentTransactionsTable({ transactions }: Props) {
  return (
    <div className="overflow-x-auto">
      {transactions.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">Belum ada transaksi tercatat.</p>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400">
              <th className="pb-3 font-semibold">Nama & Kategori</th>
              <th className="pb-3 font-semibold">Akun</th>
              <th className="pb-3 font-semibold">Tanggal</th>
              <th className="pb-3 font-semibold text-right">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                <td className="py-3 font-medium text-gray-900">
                  <div className="font-semibold">{tx.name}</div>
                  <div className="text-[11px] text-gray-400">
                    {tx.type === "transfer" ? "Transfer Internal" : tx.category_name || "Lainnya"}
                  </div>
                </td>
                <td className="py-3 text-gray-600">
                  {tx.type === "transfer" ? `${tx.account_name} ➔ ${tx.destination_account_name}` : tx.account_name}
                </td>
                <td className="py-3 text-gray-500">{formatDate(tx.date)}</td>
                <td className={`py-3 text-right font-bold ${
                  tx.type === "income" ? "text-[#16A34A]" : tx.type === "expense" ? "text-[#DC2626]" : "text-[#2563EB]"
                }`}>
                  {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                  {formatRupiah(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
