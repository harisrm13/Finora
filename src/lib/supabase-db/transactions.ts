import { getSupabaseAdmin } from "../supabase";
import { Transaction } from "../types";

export interface GetTxOptions {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: number;
  accountId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  sort?: "desc" | "asc";
}

export async function getTransactions(
  userId: number,
  options?: GetTxOptions
): Promise<{ transactions: Transaction[]; total: number; totalPages: number }> {
  const supabase = getSupabaseAdmin();
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, Math.min(100, options?.limit || 15));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (options?.type && ["income", "expense", "transfer"].includes(options.type)) {
    query = query.eq("type", options.type);
  }
  if (options?.categoryId) query = query.eq("category_id", options.categoryId);
  if (options?.accountId) {
    query = query.or(`account_id.eq.${options.accountId},destination_account_id.eq.${options.accountId}`);
  }
  if (options?.startDate) query = query.gte("date", options.startDate);
  if (options?.endDate) query = query.lte("date", options.endDate);
  if (options?.search && options.search.trim()) {
    query = query.or(`name.ilike.%${options.search.trim()}%,notes.ilike.%${options.search.trim()}%`);
  }

  const ascending = options?.sort === "asc";
  query = query.order("date", { ascending }).order("id", { ascending }).range(offset, offset + limit - 1);

  const { data: rows, count, error } = await query;
  if (error || !rows) return { transactions: [], total: 0, totalPages: 1 };

  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const { data: categories } = await supabase.from("categories").select("id, name, icon, color").eq("user_id", userId);
  const { data: accounts } = await supabase.from("accounts").select("id, name").eq("user_id", userId);

  const catMap = new Map((categories || []).map((c) => [Number(c.id), c]));
  const accMap = new Map((accounts || []).map((a) => [Number(a.id), a.name]));

  const transactions = rows.map((t) => {
    const cat = t.category_id ? catMap.get(Number(t.category_id)) : null;
    return {
      ...t,
      id: Number(t.id),
      user_id: Number(t.user_id),
      amount: Number(t.amount),
      category_id: t.category_id ? Number(t.category_id) : null,
      account_id: Number(t.account_id),
      destination_account_id: t.destination_account_id ? Number(t.destination_account_id) : null,
      category_name: cat ? cat.name : undefined,
      category_icon: cat ? cat.icon : undefined,
      category_color: cat ? cat.color : undefined,
      account_name: accMap.get(Number(t.account_id)) || "Akun",
      destination_account_name: t.destination_account_id ? accMap.get(Number(t.destination_account_id)) : undefined,
    } as Transaction;
  });

  return { transactions, total, totalPages };
}

export async function getTransactionById(userId: number, txId: number): Promise<Transaction | null> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", txId)
    .eq("user_id", userId)
    .single();

  if (error || !row) return null;

  const { data: categories } = await supabase.from("categories").select("id, name, icon, color").eq("user_id", userId);
  const { data: accounts } = await supabase.from("accounts").select("id, name").eq("user_id", userId);

  const catMap = new Map((categories || []).map((c) => [Number(c.id), c]));
  const accMap = new Map((accounts || []).map((a) => [Number(a.id), a.name]));
  const cat = row.category_id ? catMap.get(Number(row.category_id)) : null;

  return {
    ...row,
    id: Number(row.id),
    user_id: Number(row.user_id),
    amount: Number(row.amount),
    category_id: row.category_id ? Number(row.category_id) : null,
    account_id: Number(row.account_id),
    destination_account_id: row.destination_account_id ? Number(row.destination_account_id) : null,
    category_name: cat ? cat.name : undefined,
    category_icon: cat ? cat.icon : undefined,
    category_color: cat ? cat.color : undefined,
    account_name: accMap.get(Number(row.account_id)) || "Akun",
    destination_account_name: row.destination_account_id ? accMap.get(Number(row.destination_account_id)) : undefined,
  } as Transaction;
}

export async function createTransaction(
  userId: number,
  data: {
    type: "income" | "expense" | "transfer";
    amount: number;
    categoryId?: number | null;
    accountId: number;
    destinationAccountId?: number | null;
    name: string;
    notes?: string | null;
    date: string;
  }
): Promise<{ success: boolean; transactionId?: number; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!data.name || !data.name.trim()) return { success: false, error: "Nama transaksi wajib diisi." };
  if (!data.amount || data.amount <= 0) return { success: false, error: "Nominal harus lebih dari 0." };

  if (data.type === "transfer") {
    if (!data.destinationAccountId) return { success: false, error: "Akun tujuan transfer wajib dipilih." };
    if (data.accountId === data.destinationAccountId) {
      return { success: false, error: "Akun sumber dan tujuan tidak boleh sama." };
    }
  }

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: data.type,
      amount: data.amount,
      category_id: data.type === "transfer" ? null : data.categoryId || null,
      account_id: data.accountId,
      destination_account_id: data.type === "transfer" ? data.destinationAccountId || null : null,
      name: data.name.trim(),
      notes: data.notes?.trim() || null,
      date: data.date,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message || "Gagal mencatat transaksi." };
  }

  return { success: true, transactionId: Number(inserted.id) };
}

export async function updateTransaction(
  userId: number,
  txId: number,
  data: {
    type: "income" | "expense" | "transfer";
    amount: number;
    categoryId?: number | null;
    accountId: number;
    destinationAccountId?: number | null;
    name: string;
    notes?: string | null;
    date: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("transactions")
    .update({
      type: data.type,
      amount: data.amount,
      category_id: data.type === "transfer" ? null : data.categoryId || null,
      account_id: data.accountId,
      destination_account_id: data.type === "transfer" ? data.destinationAccountId || null : null,
      name: data.name.trim(),
      notes: data.notes?.trim() || null,
      date: data.date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", txId)
    .eq("user_id", userId);

  return { success: !error, error: error?.message };
}

export async function deleteTransaction(userId: number, txId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", txId)
    .eq("user_id", userId);

  return !error;
}

