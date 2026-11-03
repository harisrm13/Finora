import { getSupabaseAdmin } from "../supabase";
import { Account } from "../types";

export async function getUserAccounts(userId: number): Promise<Account[]> {
  const supabase = getSupabaseAdmin();
  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", 1)
    .order("id", { ascending: true });

  if (error || !accounts) return [];

  // Fetch all user transactions to compute dynamic account balances
  const { data: txs } = await supabase
    .from("transactions")
    .select("type, amount, account_id, destination_account_id")
    .eq("user_id", userId);

  const transactions = txs || [];

  return accounts.map((acc) => {
    let incomeSum = 0;
    let expenseSum = 0;
    let transferInSum = 0;
    let transferOutSum = 0;

    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income" && Number(t.account_id) === Number(acc.id)) {
        incomeSum += amt;
      } else if (t.type === "expense" && Number(t.account_id) === Number(acc.id)) {
        expenseSum += amt;
      } else if (t.type === "transfer") {
        if (Number(t.destination_account_id) === Number(acc.id)) {
          transferInSum += amt;
        }
        if (Number(t.account_id) === Number(acc.id)) {
          transferOutSum += amt;
        }
      }
    }

    const current_balance =
      Number(acc.initial_balance || 0) +
      incomeSum -
      expenseSum +
      transferInSum -
      transferOutSum;

    return {
      ...acc,
      id: Number(acc.id),
      user_id: Number(acc.user_id),
      initial_balance: Number(acc.initial_balance || 0),
      current_balance,
    } as Account;
  });
}

export async function createAccount(
  userId: number,
  data: { name: string; type: string; initial_balance: number; color?: string }
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: data.name.trim(),
      type: data.type,
      initial_balance: data.initial_balance || 0,
      color: data.color || "#2563EB",
      is_active: 1,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message || "Gagal membuat akun");
  return Number(inserted.id);
}

export async function updateAccount(
  userId: number,
  accountId: number,
  data: { name: string; type: string; initial_balance: number; color?: string }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("accounts")
    .update({
      name: data.name.trim(),
      type: data.type,
      initial_balance: data.initial_balance || 0,
      color: data.color || "#2563EB",
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("user_id", userId);

  return !error;
}

export async function deleteAccount(userId: number, accountId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  // Check if account has transactions
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .or(`account_id.eq.${accountId},destination_account_id.eq.${accountId}`);

  if (count && count > 0) {
    // Soft delete to protect financial integrity
    const { error } = await supabase
      .from("accounts")
      .update({ is_active: 0, updated_at: new Date().toISOString() })
      .eq("id", accountId)
      .eq("user_id", userId);
    return !error;
  } else {
    // Hard delete
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", userId);
    return !error;
  }
}
