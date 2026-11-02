import assert from "node:assert";
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
  getFinancialReport,
  getFinancialInsights,
} from "../src/lib/db.ts";

async function runTests() {
  console.log("=== STARTING FINORA VERIFICATION TEST SUITE ===\n");

  console.log("Test 1: User Registration & Auto Seeding");
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

  assert.ok(userAId > 0, "User A must have valid ID");
  assert.ok(userBId > 0, "User B must have valid ID");
  assert.notStrictEqual(userAId, userBId, "User IDs must be distinct");

  const accountsA = getUserAccounts(userAId);
  const categoriesA = getUserCategories(userAId);
  assert.ok(accountsA.length >= 4, "User A should have at least 4 seeded accounts");
  assert.ok(categoriesA.length >= 15, "User A should have default categories");
  console.log("✓ User registration & seed passed!\n");

  console.log("Test 2: Data Isolation Between Users");
  const accountsB = getUserAccounts(userBId);
  assert.strictEqual(accountsA.every((a) => a.user_id === userAId), true);
  assert.strictEqual(accountsB.every((b) => b.user_id === userBId), true);
  console.log("✓ Data isolation verified!\n");

  console.log("Test 3: Balance & Core Transactions Calculation");
  const cashAccA = accountsA.find((a) => a.type === "cash");
  const bankAccA = accountsA.find((a) => a.type === "bank");
  const salaryCatA = categoriesA.find((c) => c.name === "Gaji");
  const foodCatA = categoriesA.find((c) => c.name === "Makanan & Minuman");

  const today = new Date().toISOString().split("T")[0];
  const tx1 = createTransaction(userAId, {
    type: "income",
    amount: 5000000,
    accountId: bankAccA.id,
    categoryId: salaryCatA.id,
    name: "Gaji Bulan Ini",
    date: today,
  });
  assert.strictEqual(tx1.success, true);
  createTransaction(userAId, {
    type: "expense",
    amount: 50000,
    accountId: cashAccA.id,
    categoryId: foodCatA.id,
    name: "Makan Siang",
    date: today,
  });

  let accs = getUserAccounts(userAId);
  let bA = accs.find((a) => a.id === bankAccA.id);
  let cA = accs.find((a) => a.id === cashAccA.id);
  assert.strictEqual(bA.current_balance, 5000000);
  assert.strictEqual(cA.current_balance, -50000);

  let summary = getDashboardSummary(userAId);
  assert.strictEqual(summary.thisMonthIncome, 5000000);
  assert.strictEqual(summary.thisMonthExpense, 50000);
  assert.strictEqual(summary.totalBalance, 4950000);
  console.log("✓ Core transactions and balance calculations verified!\n");

  console.log("Test 4: Internal Transfer (No Double Count)");
  createTransaction(userAId, {
    type: "transfer",
    amount: 1000000,
    accountId: bankAccA.id,
    destinationAccountId: cashAccA.id,
    name: "Tarik Tunai ke Dompet",
    date: today,
  });

  accs = getUserAccounts(userAId);
  bA = accs.find((a) => a.id === bankAccA.id);
  cA = accs.find((a) => a.id === cashAccA.id);
  assert.strictEqual(bA.current_balance, 4000000);
  assert.strictEqual(cA.current_balance, 950000);

  summary = getDashboardSummary(userAId);
  assert.strictEqual(summary.thisMonthIncome, 5000000);
  assert.strictEqual(summary.thisMonthExpense, 50000);
  assert.strictEqual(summary.totalBalance, 4950000);
  console.log("✓ Transfer logic & net wealth invariant verified!\n");

  console.log("Test 5: Daily Spending Limit & Status");
  updateDailyLimit(userAId, 100000, true);
  let daily = getDailyExpenseStats(userAId, today);
  assert.strictEqual(daily.spentToday, 50000);
  assert.strictEqual(daily.status, "safe");

  createTransaction(userAId, {
    type: "expense",
    amount: 60000,
    accountId: cashAccA.id,
    categoryId: foodCatA.id,
    name: "Makan Malam",
    date: today,
  });
  daily = getDailyExpenseStats(userAId, today);
  assert.strictEqual(daily.spentToday, 110000);
  assert.strictEqual(daily.status, "exceeded");
  console.log("✓ Daily spending limit exceeded state triggered correctly!\n");

  console.log("Test 6: Budget Management");
  const curMonth = new Date().getMonth() + 1;
  const curYear = new Date().getFullYear();
  setBudget(userAId, {
    categoryId: foodCatA.id,
    month: curMonth,
    year: curYear,
    amount: 500000,
  });
  const budgets = getBudgets(userAId, curMonth, curYear);
  const fb = budgets.find((b) => b.category_id === foodCatA.id);
  assert.strictEqual(fb.spent, 110000);
  assert.strictEqual(fb.remaining, 390000);
  console.log("✓ Budget calculations verified!\n");

  console.log("Test 7: Savings Goals & Contributions");
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
  const emergencyGoal = getSavingsGoals(userAId).find((g) => g.id === goalId);
  assert.strictEqual(emergencyGoal.current_amount, 250000);
  assert.strictEqual(emergencyGoal.percentage, 25);
  console.log("✓ Savings goals & contributions verified!\n");

  console.log("Test 8: Edge Cases Validation");
  const invalidAmt = createTransaction(userAId, {
    type: "expense",
    amount: -500,
    accountId: cashAccA.id,
    name: "Invalid Negatif",
    date: today,
  });
  assert.strictEqual(invalidAmt.success, false);

  const invalidTransfer = createTransaction(userAId, {
    type: "transfer",
    amount: 50000,
    accountId: cashAccA.id,
    destinationAccountId: cashAccA.id,
    name: "Self transfer",
    date: today,
  });
  assert.strictEqual(invalidTransfer.success, false);

  const deleteUsedCat = deleteCategory(userAId, foodCatA.id);
  assert.strictEqual(deleteUsedCat.success, false);
  console.log("✓ Validation edge cases passed!\n");

  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! FINORA SYSTEM IS 100% OPERATIONAL.");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});

