import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { DashboardSummaryCards } from "@/components/finance/dashboard-summary-cards";
import { ExpenseCategoryChart } from "@/components/finance/expense-category-chart";
import { MonthlyTrendChart } from "@/components/finance/monthly-trend-chart";
import { BudgetProgressList } from "@/components/finance/budget-progress-list";
import { TransactionTable } from "@/components/finance/transaction-table";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // Get current month and year
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  // Fetch all data in parallel
  const [
    wallets,
    incomeResult,
    expenseResult,
    categories,
    recentTransactions,
    budgets,
  ] = await Promise.all([
    // Total balance
    prisma.wallet.aggregate({
      where: { userId, isActive: true },
      _sum: { currentBalance: true },
    }),
    // Income this month
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "INCOME",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    // Expense this month
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    // Categories for pie chart
    prisma.category.findMany({
      where: { userId, isActive: true },
    }),
    // Recent transactions
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true, wallet: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    // Budgets with progress
    prisma.budget.findMany({
      where: { userId, isActive: true },
      include: { category: true },
    }),
  ]);

  const totalBalance = wallets._sum.currentBalance || 0;
  const totalIncome = incomeResult._sum.amount || 0;
  const totalExpense = expenseResult._sum.amount || 0;
  const netCashflow = totalIncome.minus(totalExpense);

  // Calculate expense by category for this month
  const expensesByCategory = await Promise.all(
    categories.map(async (category) => {
      const result = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: category.id,
          type: "EXPENSE",
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });
      return {
        name: category.name,
        value: result._sum.amount?.toNumber() || 0,
        color: category.color,
      };
    })
  );

  // Filter out categories with no expenses
  const chartData = expensesByCategory.filter((c) => c.value > 0);

  // Calculate budget progress
  const budgetsWithProgress = await Promise.all(
    budgets.map(async (budget) => {
      const spentResult = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });

      const spent = spentResult._sum.amount || 0;
      const budgetAmount = budget.amount;
      const percentage = budgetAmount.toNumber() > 0
        ? (spent.toNumber() / budgetAmount.toNumber()) * 100
        : 0;

      let status: "safe" | "warning" | "over" = "safe";
      if (percentage >= 100) {
        status = "over";
      } else if (percentage >= 80) {
        status = "warning";
      }

      return {
        id: budget.id,
        categoryName: budget.category.name,
        budgetAmount: budgetAmount.toNumber(),
        spent: spent.toNumber(),
        percentage: Math.round(percentage),
        status,
      };
    })
  );

  // Sort budgets by percentage (highest first)
  budgetsWithProgress.sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {/* Summary Cards */}
      <DashboardSummaryCards
        totalBalance={totalBalance.toNumber()}
        totalIncome={totalIncome.toNumber()}
        totalExpense={totalExpense.toNumber()}
        netCashflow={netCashflow.toNumber()}
      />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseCategoryChart data={chartData} />
        <MonthlyTrendChart userId={userId} />
      </div>

      {/* Budget Progress */}
      {budgetsWithProgress.length > 0 && (
        <BudgetProgressList budgets={budgetsWithProgress} />
      )}

      {/* Recent Transactions */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
          <a
            href="/transactions"
            className="text-sm text-primary hover:underline"
          >
            Lihat semua
          </a>
        </div>
        <TransactionTable transactions={recentTransactions} userId={userId} />
      </div>
    </div>
  );
}
