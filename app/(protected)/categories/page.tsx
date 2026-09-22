import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { CategoryForm, CategoryList } from "@/components/finance/category-form"

interface CategoriesPageProps {
  searchParams: Promise<{ edit?: string; new?: string }>
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const params = await searchParams
  const categories = await prisma.category.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { name: "asc" },
  })

  const isEditing = !!params.edit
  const isCreating = !!params.new

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kategori</h1>
        <Button href="/categories?new=true">Tambah Kategori</Button>
      </div>

      <CategoryList categories={categories} />

      {(isCreating || isEditing) && (
        <Modal
          isOpen={true}
          onClose={() => window.history.back()}
          title={isEditing ? "Edit Kategori" : "Tambah Kategori"}
        >
          <CategoryForm
            category={isEditing ? categories.find(c => c.id === params.edit) : undefined}
            onClose={() => window.history.back()}
          />
        </Modal>
      )}
    </div>
  )
}
