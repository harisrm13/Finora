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

  const summary = getDashboardSummary(user.id);
  const cashFlow = getCashFlowChartData(user.id, period);
  const spendingBreakdown = getSpendingBreakdown(user.id);
  const { transactions: recentTransactions } = getTransactions(user.id, {
    page: 1,
    limit: 5,
  });

  const now = new Date();
  const budgets = getBudgets(user.id, now.getMonth() + 1, now.getFullYear());
  const savingsGoals = getSavingsGoals(user.id);

  return NextResponse.json({
    summary,
    cashFlow,
    spendingBreakdown,
    recentTransactions,
    budgets,
    savingsGoals,
  });
}
