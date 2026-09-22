import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Get monthly income and expense
    const monthlyData = await prisma.transaction.groupBy({
      by: ["type", "date"],
      where: {
        userId,
        date: { gte: sixMonthsAgo },
      },
      _sum: {
        amount: true,
      },
    });

    // Process data into monthly buckets
    const months: Array<{ month: string; income: number; expense: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
      });

      const monthTransactions = monthlyData.filter((t) => {
        const tDate = new Date(t.date);
        return (
          tDate.getFullYear() === date.getFullYear() &&
          tDate.getMonth() === date.getMonth()
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + (t._sum.amount?.toNumber() || 0), 0);

      const expense = monthTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + (t._sum.amount?.toNumber() || 0), 0);

      months.push({
        month: monthName,
        income,
        expense,
      });
    }

    return NextResponse.json({ data: months });
  } catch (error) {
    console.error("Monthly trend API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly trend" },
      { status: 500 }
    );
  }
}
