import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TransactionForm } from "@/components/finance/transaction-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"

interface EditTransactionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const { id } = await params
  const transaction = await prisma.transaction.findUnique({
    where: { id, userId: session.user.id },
    include: {
      wallet: true,
      category: true,
    },
  })

  if (!transaction) {
    notFound()
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId: session.user.id, isActive: true },
  })

  const categories = await prisma.category.findMany({
    where: { 
      userId: session.user.id,
      isActive: true,
      OR: [
        { type: "BOTH" },
        { type: transaction.type === "INCOME" ? "INCOME" : "EXPENSE" },
      ],
    },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            transaction={transaction}
            wallets={wallets}
            categories={categories}
            onCancelUrl="/transactions"
          />
        </CardContent>
      </Card>
    </div>
  )
}
