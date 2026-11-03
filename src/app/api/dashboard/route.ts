import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getDashboardSummary,
  getCashFlowChartData,
  getSpendingBreakdown,
  getTransactions,
  getBudgets,
  getSavingsGoals,
} from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "month") as "7days" | "month" | "3months" | "6months" | "1year";

  const [summary, cashFlow, spendingBreakdown, txResult, budgets, savingsGoals] = await Promise.all([
    getDashboardSummary(user.id),
    getCashFlowChartData(user.id, period),
    getSpendingBreakdown(user.id),
    getTransactions(user.id, { page: 1, limit: 5 }),
    getBudgets(user.id, new Date().getMonth() + 1, new Date().getFullYear()),
    getSavingsGoals(user.id),
  ]);

  return NextResponse.json({
    summary,
    cashFlow,
    spendingBreakdown,
    recentTransactions: txResult.transactions,
    budgets,
    savingsGoals,
  });
}
