"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createBudget, updateBudget, deleteBudget } from "@/actions/budgets"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/format"
import type { BudgetWithCategory } from "@/actions/budgets"

interface BudgetFormProps {
  budget?: BudgetWithCategory
  categories: Array<{ id: string; name: string }>
  onClose: () => void
}

export function BudgetForm({ budget, categories, onClose }: BudgetFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      categoryId: formData.get("categoryId") as string,
      amount: parseFloat(formData.get("amount") as string),
    }

    try {
      if (budget) {
        await updateBudget(budget.id, data)
      } else {
        await createBudget(data)
      }
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const expenseCategories = categories.filter((c) => c.name !== "Gaji")

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium mb-1">
          Kategori
        </label>
        <Select
          id="categoryId"
          name="categoryId"
          defaultValue={budget?.categoryId}
          options={expenseCategories.map((c) => ({
            value: c.id,
            label: c.name,
          }))}
          required
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">
          Nominal Anggaran (per bulan)
        </label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={budget?.amount?.toNumber() || 0}
          placeholder="Contoh: 1000000"
          required
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {budget ? "Update" : "Buat"} Anggaran
        </Button>
      </div>
    </form>
  )
}

interface BudgetProgress {
  budget: BudgetWithCategory
  spent: number
  percentage: number
  status: "safe" | "warning" | "over"
}

interface BudgetListProps {
  budgets: BudgetProgress[]
}

export function BudgetList({ budgets }: BudgetListProps) {
  const router = useRouter()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!selectedBudget) return
    setIsDeleting(true)
    try {
      await deleteBudget(selectedBudget.id)
      router.refresh()
      setDeleteModalOpen(false)
      setSelectedBudget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus anggaran")
    } finally {
      setIsDeleting(false)
    }
  }

  if (budgets.length === 0) {
    return (
      <EmptyState
        icon="📈"
        title="Belum ada anggaran"
        description="Buat anggaran pertama Anda untuk mengontrol pengeluaran"
      />
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "over":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "safe":
        return "Aman"
      case "warning":
        return "Hati-hati"
      case "over":
        return "Melebihi"
      default:
        return ""
    }
  }

  return (
    <>
      <div className="space-y-4">
        {budgets.map((item) => (
          <Card key={item.budget.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{item.budget.category.name}</CardTitle>
                  <CardDescription>
                    Anggaran: {formatCurrency(item.budget.amount.toNumber())}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Terpakai: {formatCurrency(item.spent)}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      item.status === "over"
                        ? "text-red-600"
                        : item.status === "warning"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {getStatusText(item.status)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="font-medium">{Math.min(item.percentage, 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getStatusColor(item.status)}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sisa: {formatCurrency(Math.max(item.budget.amount.toNumber() - item.spent, 0))}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/budgets?edit=${item.budget.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedBudget(item.budget)
                      setDeleteModalOpen(true)
                    }}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Anggaran"
        description="Apakah Anda yakin ingin menghapus anggaran ini?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Penganggaran untuk kategori ini akan dihapus.
        </p>
      </Modal>
    </>
  )
}
