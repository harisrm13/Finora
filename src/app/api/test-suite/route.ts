import { NextResponse } from "next/server";
import {
  createUser,
  seedUserData,
  getUserAccounts,
  getUserCategories,
  createTransaction,
  deleteCategory,
  getDashboardSummary,
  updateDailyLimit,
  getDailyExpenseStats,
  setBudget,
  getBudgets,
  createSavingsGoal,
  getSavingsGoals,
  addSavingsContribution,
} from "@/lib/db";

export async function GET() {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    log("Test 1: User Registration & Auto Seeding");
    const userAId = createUser({
      email: `user.a.${Date.now()}@finora.id`,
      password_hash: "hashed_pwd_a",
      full_name: "User Alpha",
    });
    seedUserData(userAId);

    const userBId = createUser({
      email: `user.b.${Date.now()}@finora.id`,
      password_hash: "hashed_pwd_b",
      full_name: "User Beta",
    });
    seedUserData(userBId);

    if (userAId <= 0 || userBId <= 0 || userAId === userBId) {
      throw new Error("User registration failed");
    }

    const accountsA = getUserAccounts(userAId);
    const categoriesA = getUserCategories(userAId);
    if (accountsA.length < 4 || categoriesA.length < 15) {
      throw new Error("Default seeding failed");
    }
    log("✓ Test 1: User Registration & Auto Seeding PASSED");

    log("Test 2: Data Isolation Between Users");
    const accountsB = getUserAccounts(userBId);
    if (!accountsA.every((a) => a.user_id === userAId) || !accountsB.every((b) => b.user_id === userBId)) {
      throw new Error("Data isolation violation detected");
    }
    log("✓ Test 2: Data Isolation PASSED");

    log("Test 3: Balance & Core Transactions Calculation");
    const cashAccA = accountsA.find((a) => a.type === "cash")!;
    const bankAccA = accountsA.find((a) => a.type === "bank")!;
    const salaryCatA = categoriesA.find((c) => c.name === "Gaji")!;
    const foodCatA = categoriesA.find((c) => c.name === "Makanan & Minuman")!;

    const today = new Date().toISOString().split("T")[0];
    const tx1 = createTransaction(userAId, {
      type: "income",
      amount: 5000000,
      accountId: bankAccA.id,
      categoryId: salaryCatA.id,
      name: "Gaji Bulan Ini",
      date: today,
    });
    if (!tx1.success) throw new Error("Income failed");
    createTransaction(userAId, {
      type: "expense",
      amount: 50000,
      accountId: cashAccA.id,
      categoryId: foodCatA.id,
      name: "Makan Siang",
      date: today,
    });

    let accs = getUserAccounts(userAId);
    let bA = accs.find((a) => a.id === bankAccA.id)!;
    let cA = accs.find((a) => a.id === cashAccA.id)!;
    if (bA.current_balance !== 5000000 || cA.current_balance !== -50000) {
      throw new Error(`Balance calculation mismatch`);
    }

    let summary = getDashboardSummary(userAId);
    if (summary.thisMonthIncome !== 5000000 || summary.thisMonthExpense !== 50000 || summary.totalBalance !== 4950000) {
      throw new Error("Summary mismatch");
    }
    log("✓ Test 3: Core Transactions & Balance PASSED");

    log("Test 4: Internal Transfer (No Double Count Invariant)");
    createTransaction(userAId, {
      type: "transfer",
      amount: 1000000,
      accountId: bankAccA.id,
      destinationAccountId: cashAccA.id,
      name: "Tarik Tunai ke Dompet",
      date: today,
    });

    accs = getUserAccounts(userAId);
    bA = accs.find((a) => a.id === bankAccA.id)!;
    cA = accs.find((a) => a.id === cashAccA.id)!;
    if (bA.current_balance !== 4000000 || cA.current_balance !== 950000) {
      throw new Error("Transfer balance update mismatch");
    }

    summary = getDashboardSummary(userAId);
    if (summary.thisMonthIncome !== 5000000 || summary.thisMonthExpense !== 50000 || summary.totalBalance !== 4950000) {
      throw new Error("Internal transfer inflated income/expense or total wealth!");
    }
    log("✓ Test 4: Internal Transfer Invariant PASSED");

    log("Test 5: Daily Spending Limit & Status");
    updateDailyLimit(userAId, 100000, true);
    let daily = getDailyExpenseStats(userAId, today);
    if (daily.spentToday !== 50000 || daily.status !== "safe") {
      throw new Error("Daily limit safe state failed");
    }

    createTransaction(userAId, {
      type: "expense",
      amount: 60000,
      accountId: cashAccA.id,
      categoryId: foodCatA.id,
      name: "Makan Malam",
      date: today,
    });
    daily = getDailyExpenseStats(userAId, today);
    if (daily.spentToday !== 110000 || daily.status !== "exceeded") {
      throw new Error("Daily limit exceeded state failed");
    }
    log("✓ Test 5: Daily Spending Limit & Alert PASSED");

    log("Test 6: Budget Management");
    const curMonth = new Date().getMonth() + 1;
    const curYear = new Date().getFullYear();
    setBudget(userAId, {
      categoryId: foodCatA.id,
      month: curMonth,
      year: curYear,
      amount: 500000,
    });
    const budgets = getBudgets(userAId, curMonth, curYear);
    const fb = budgets.find((b) => b.category_id === foodCatA.id)!;
    if (fb.spent !== 110000 || fb.remaining !== 390000) {
      throw new Error("Budget spent/remaining mismatch");
    }
    log("✓ Test 6: Budget Management PASSED");

    log("Test 7: Savings Goals & Contributions");
    const goalId = createSavingsGoal(userAId, {
      name: "Dana Darurat",
      target_amount: 1000000,
      account_id: bankAccA.id,
    });
    addSavingsContribution(userAId, {
      goalId,
      accountId: cashAccA.id,
      amount: 250000,
      date: today,
    });
    const goal = getSavingsGoals(userAId).find((g) => g.id === goalId)!;
    if (goal.current_amount !== 250000 || goal.percentage !== 25) {
      throw new Error("Savings goal progress mismatch");
    }
    log("✓ Test 7: Savings Goals & Contributions PASSED");

    log("Test 8: Edge Cases Validation");
    const negTx = createTransaction(userAId, {
      type: "expense",
      amount: -500,
      accountId: cashAccA.id,
      name: "Negatif",
      date: today,
    });
    if (negTx.success) throw new Error("Negative amount should be rejected");

    const selfTransfer = createTransaction(userAId, {
      type: "transfer",
      amount: 50000,
      accountId: cashAccA.id,
      destinationAccountId: cashAccA.id,
      name: "Self transfer",
      date: today,
    });
    if (selfTransfer.success) throw new Error("Self transfer should be rejected");

    const delUsedCat = deleteCategory(userAId, foodCatA.id);
    if (delUsedCat.success) throw new Error("Used category deletion should be blocked");
    log("✓ Test 8: Edge Cases Validation PASSED");

    return NextResponse.json({
      success: true,
      message: "All 8 Finora Tests Passed Successfully!",
      logs,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message,
        logs,
      },
      { status: 500 }
    );
  }
}

