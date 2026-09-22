"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import { CATEGORY_TYPES } from "@/lib/constants"
import type { CategoryWithCount } from "@/actions/categories"

interface CategoryFormProps {
  category?: CategoryWithCount
  onClose: () => void
}

export function CategoryForm({ category, onClose }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as "INCOME" | "EXPENSE" | "BOTH",
      color: formData.get("color") as string,
      icon: formData.get("icon") as string,
    }

    try {
      if (category) {
        await updateCategory(category.id, data)
      } else {
        await createCategory(data)
      }
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Nama Kategori
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          required
          minLength={2}
          placeholder="Contoh: Makanan"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">
          Tipe
        </label>
        <Select
          id="type"
          name="type"
          defaultValue={category?.type || "EXPENSE"}
          options={[
            { value: "INCOME", label: "Pemasukan" },
            { value: "EXPENSE", label: "Pengeluaran" },
            { value: "BOTH", label: "Keduanya" },
          ]}
        />
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium mb-1">
          Warna
        </label>
        <Input
          id="color"
          name="color"
          type="color"
          defaultValue={category?.color || "#3b82f6"}
          required
        />
      </div>

      <div>
        <label htmlFor="icon" className="block text-sm font-medium mb-1">
          Icon (Emoji)
        </label>
        <Input
          id="icon"
          name="icon"
          defaultValue={category?.icon || "📁"}
          placeholder="📁"
          maxLength={2}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {category ? "Update" : "Buat"} Kategori
        </Button>
      </div>
    </form>
  )
}

interface CategoryListProps {
  categories: CategoryWithCount[]
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithCount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!selectedCategory) return
    setIsDeleting(true)
    try {
      await deleteCategory(selectedCategory.id)
      router.refresh()
      setDeleteModalOpen(false)
      setSelectedCategory(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus kategori")
    } finally {
      setIsDeleting(false)
    }
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon="🏷️"
        title="Belum ada kategori"
        description="Buat kategori pertama Anda untuk mulai mengelola transaksi"
      />
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.type === "INCOME" && "Pemasukan"}
                      {category.type === "EXPENSE" && "Pengeluaran"}
                      {category.type === "BOTH" && "Keduanya"}
                    </p>
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {category._count.transactions} transaksi
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/categories?edit=${category.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedCategory(category)
                      setDeleteModalOpen(true)
                    }}
                    disabled={category._count.transactions > 0}
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
        title="Hapus Kategori"
        description="Apakah Anda yakin ingin menghapus kategori ini?"
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
          Kategori yang masih digunakan tidak dapat dihapus. Pindahkan atau hapus transaksi terkait terlebih dahulu.
        </p>
      </Modal>
    </>
  )
}
