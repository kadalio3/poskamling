import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExpenseCategoryChart } from "@/components/finance/expense-category-chart"
import { MonthlyTrendChart } from "@/components/finance/monthly-trend-chart"
import { formatCurrency } from "@/lib/format"
import { getStartOfMonth, getEndOfMonth, getLastMonths } from "@/lib/utils"

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const now = new Date()
  const startDate = getStartOfMonth(now)
  const endDate = getEndOfMonth(now)

  // Get monthly totals
  const [incomeResult, expenseResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: "INCOME",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: "EXPENSE",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
  ])

  const totalIncome = incomeResult._sum.amount?.toNumber() || 0
  const totalExpense = expenseResult._sum.amount?.toNumber() || 0
  const netCashflow = totalIncome - totalExpense

  // Get expense by category
  const expensesByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId: session.user.id,
      type: "EXPENSE",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  })

  const categories = await prisma.category.findMany({
    where: { id: { in: expensesByCategory.map(e => e.categoryId) } },
  })

  const categoryData = expensesByCategory.map(item => ({
    categoryId: item.categoryId,
    amount: item._sum.amount?.toNumber() || 0,
    category: categories.find(c => c.id === item.categoryId),
  })).filter(item => item.category)

  // Get last 6 months data for trend
  const last6Months = getLastMonths(6)
  const monthlyData = await Promise.all(
    last6Months.map(async (date) => {
      const monthStart = getStartOfMonth(date)
      const monthEnd = getEndOfMonth(date)
      
      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: "INCOME",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: "EXPENSE",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
      ])

      return {
        month: date.toLocaleString("id-ID", { month: "short" }),
        income: income._sum.amount?.toNumber() || 0,
        expense: expense._sum.amount?.toNumber() || 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pemasukan Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pengeluaran Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpense)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Arus Kas Bersih
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netCashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netCashflow)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
            <CardDescription>Bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseCategoryChart data={categoryData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tren 6 Bulan Terakhir</CardTitle>
            <CardDescription>Pemasukan vs Pengeluaran</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={monthlyData} />
          </CardContent>
        </Card>
      </div>

      {/* Category Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Kategori</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Jumlah</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((item) => (
                  <tr key={item.categoryId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <span className="mr-2">{item.category?.icon}</span>
                      {item.category?.name}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">
                      {totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
