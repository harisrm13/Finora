import { NextResponse } from "next/server";
import {
  findUserByEmail,
  getUserAccounts,
  getUserCategories,
  createTransaction,
  setBudget,
  createAllowancePlan,
  createSavingsGoal,
  addSavingsContribution,
} from "@/lib/db";

export async function GET() {
  const user = findUserByEmail("demo@finora.id");
  if (!user) {
    return NextResponse.json({ error: "Demo user not found" }, { status: 404 });
  }

  const userId = user.id;
  const accounts = getUserAccounts(userId);
  const categories = getUserCategories(userId);

  const bank = accounts.find((a) => a.type === "bank") || accounts[0];
  const cash = accounts.find((a) => a.type === "cash") || accounts[1];
  const ewallet = accounts.find((a) => a.type === "ewallet") || accounts[2];
  const savingsAcc = accounts.find((a) => a.type === "savings") || accounts[3];

  const catGaji = categories.find((c) => c.name === "Gaji");
  const catFreelance = categories.find((c) => c.name === "Freelance");
  const catSaku = categories.find((c) => c.name === "Uang Saku");

  const catMakan = categories.find((c) => c.name === "Makanan & Minuman");
  const catTransport = categories.find((c) => c.name === "Transportasi");
  const catInternet = categories.find((c) => c.name === "Pulsa & Internet");
  const catBelanja = categories.find((c) => c.name === "Belanja");

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  // Income
  createTransaction(userId, {
    type: "income",
    amount: 6500000,
    accountId: bank.id,
    categoryId: catGaji?.id,
    name: "Gaji Pokok Bulanan",
    date: `${y}-${m}-01`,
  });

  createTransaction(userId, {
    type: "income",
    amount: 1500000,
    accountId: bank.id,
    categoryId: catFreelance?.id,
    name: "Projek Web Freelance",
    date: `${y}-${m}-05`,
  });

  createTransaction(userId, {
    type: "income",
    amount: 500000,
    accountId: cash.id,
    categoryId: catSaku?.id,
    name: "Uang Saku Tambahan",
    date: `${y}-${m}-10`,
  });

  // Transfers
  createTransaction(userId, {
    type: "transfer",
    amount: 1000000,
    accountId: bank.id,
    destinationAccountId: ewallet.id,
    name: "Top-up Saldo E-Wallet",
    date: `${y}-${m}-02`,
  });

  createTransaction(userId, {
    type: "transfer",
    amount: 500000,
    accountId: bank.id,
    destinationAccountId: cash.id,
    name: "Tarik Tunai ATM",
    date: `${y}-${m}-03`,
  });

  // Expenses
  createTransaction(userId, {
    type: "expense",
    amount: 45000,
    accountId: cash.id,
    categoryId: catMakan?.id,
    name: "Makan Siang Nasi Padang",
    date: todayStr,
  });

  createTransaction(userId, {
    type: "expense",
    amount: 25000,
    accountId: ewallet.id,
    categoryId: catMakan?.id,
    name: "Beli Kopi Susu",
    date: todayStr,
  });

  createTransaction(userId, {
    type: "expense",
    amount: 150000,
    accountId: bank.id,
    categoryId: catInternet?.id,
    name: "Paket Internet & WiFi",
    date: `${y}-${m}-04`,
  });

  createTransaction(userId, {
    type: "expense",
    amount: 350000,
    accountId: ewallet.id,
    categoryId: catBelanja?.id,
    name: "Belanja Bulanan Supermarket",
    date: `${y}-${m}-07`,
  });

  createTransaction(userId, {
    type: "expense",
    amount: 80000,
    accountId: cash.id,
    categoryId: catTransport?.id,
    name: "Isi Bensin Motor",
    date: `${y}-${m}-08`,
  });

  // Budgets
  if (catMakan) setBudget(userId, { categoryId: catMakan.id, month: parseInt(m), year: y, amount: 1200000 });
  if (catTransport) setBudget(userId, { categoryId: catTransport.id, month: parseInt(m), year: y, amount: 350000 });
  if (catInternet) setBudget(userId, { categoryId: catInternet.id, month: parseInt(m), year: y, amount: 200000 });
  if (catBelanja) setBudget(userId, { categoryId: catBelanja.id, month: parseInt(m), year: y, amount: 800000 });

  // Allowance
  const lastDay = new Date(y, parseInt(m), 0).getDate();
  createAllowancePlan(userId, {
    name: `Uang Saku Bulan ${m}/${y}`,
    period_type: "monthly",
    start_date: `${y}-${m}-01`,
    end_date: `${y}-${m}-${lastDay}`,
    target_amount: 2000000,
    spending_limit: 1500000,
    savings_target: 500000,
    notes: "Rencana disiplin pengeluaran",
  });

  // Savings
  const goal1Id = createSavingsGoal(userId, {
    name: "Dana Darurat 3 Bulan",
    target_amount: 5000000,
    target_date: `${y}-12-31`,
    account_id: savingsAcc.id,
    notes: "Tabungan antisipasi pengeluaran mendadak",
  });

  addSavingsContribution(userId, {
    goalId: goal1Id,
    accountId: bank.id,
    amount: 1500000,
    date: `${y}-${m}-02`,
    notes: "Setoran awal dana darurat",
  });

  const goal2Id = createSavingsGoal(userId, {
    name: "Beli Laptop Kerja Baru",
    target_amount: 8000000,
    target_date: `${y + 1}-03-31`,
    account_id: savingsAcc.id,
    notes: "Upgrade laptop produktivitas",
  });

  addSavingsContribution(userId, {
    goalId: goal2Id,
    accountId: bank.id,
    amount: 2000000,
    date: `${y}-${m}-06`,
    notes: "Alokasi dari bonus freelance",
  });

  return NextResponse.json({ success: true, message: "Demo data populated!" });
}
