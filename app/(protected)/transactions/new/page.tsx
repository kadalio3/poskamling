import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TransactionForm } from "@/components/finance/transaction-form";
import Link from "next/link";

export default async function NewTransactionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // Fetch categories and wallets for the form
  const [categories, wallets] = await Promise.all([
    prisma.category.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.wallet.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/transactions" className="text-sm text-muted-foreground hover:text-foreground">
          ← Kembali
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Transaksi</h1>
      </div>

      <TransactionForm categories={categories} wallets={wallets} />
    </div>
  );
}
