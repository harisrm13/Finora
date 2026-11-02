import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserAccounts, getUserCategories, getUserNotifications } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = getUserAccounts(user.id);
  const categories = getUserCategories(user.id);
  const notifications = getUserNotifications(user.id);

  return NextResponse.json({
    user,
    accounts,
    categories,
    notifications,
  });
}

