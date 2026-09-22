import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { BudgetForm, BudgetList } from "@/components/finance/budget-form"
import { Modal } from "@/components/ui/modal"
import { getStartOfMonth, getEndOfMonth } from "@/lib/utils"

interface BudgetsPageProps {
  searchParams: Promise<{ edit?: string; new?: string }>
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const params = await searchParams
  
  const budgets = await prisma.budget.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()
  const startDate = getStartOfMonth(now)
  const endDate = getEndOfMonth(now)

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (budget) => {
      const result = await prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      })

      const spent = result._sum.amount?.toNumber() || 0
      const budgetAmount = budget.amount.toNumber()
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      const status = percentage > 100 ? "over" : percentage >= 80 ? "warning" : "safe"

      return {
        budget,
        spent,
        percentage,
        status,
      }
    })
  )

  const categories = await prisma.category.findMany({
    where: { 
      userId: session.user.id,
      isActive: true,
      type: { in: ["EXPENSE", "BOTH"] },
    },
    select: { id: true, name: true },
  })

  const isEditing = !!params.edit
  const isCreating = !!params.new

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Anggaran</h1>
        <Button href="/budgets?new=true">Tambah Anggaran</Button>
      </div>

      <BudgetList budgets={budgetsWithProgress} />

      {(isCreating || isEditing) && (
        <Modal
          isOpen={true}
          onClose={() => window.history.back()}
          title={isEditing ? "Edit Anggaran" : "Tambah Anggaran"}
        >
          <BudgetForm
            budget={isEditing ? budgets.find(b => b.id === params.edit) : undefined}
            categories={categories}
            onClose={() => window.history.back()}
          />
        </Modal>
      )}
    </div>
  )
}
