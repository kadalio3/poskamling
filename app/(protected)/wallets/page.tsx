import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { WalletForm, WalletList } from "@/components/finance/wallet-form"
import { Modal } from "@/components/ui/modal"

interface WalletsPageProps {
  searchParams: Promise<{ edit?: string; new?: string }>
}

export default async function WalletsPage({ searchParams }: WalletsPageProps) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const params = await searchParams
  const wallets = await prisma.wallet.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const isEditing = !!params.edit
  const isCreating = !!params.new

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dompet</h1>
        <Button href="/wallets?new=true">Tambah Dompet</Button>
      </div>

      <WalletList wallets={wallets} />

      {(isCreating || isEditing) && (
        <Modal
          isOpen={true}
          onClose={() => window.history.back()}
          title={isEditing ? "Edit Dompet" : "Tambah Dompet"}
        >
          <WalletForm
            wallet={isEditing ? wallets.find(w => w.id === params.edit) : undefined}
            onClose={() => window.history.back()}
          />
        </Modal>
      )}
    </div>
  )
}
