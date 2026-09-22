import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TransactionTable } from "@/components/finance/transaction-table";
import { TransactionFilters } from "@/components/finance/transaction-filters";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SearchParams {
  month?: string;
  year?: string;
  type?: string;
  categoryId?: string;
  walletId?: string;
  search?: string;
  page?: string;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const currentPage = parseInt(searchParams.page || "1");
  const limit = 20;

  // Parse filters
  const month = searchParams.month ? parseInt(searchParams.month) : undefined;
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;
  const type = searchParams.type as "INCOME" | "EXPENSE" | undefined;
  const categoryId = searchParams.categoryId;
  const walletId = searchParams.walletId;
  const search = searchParams.search;

  // Build where clause
  const where: any = { userId };

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    where.date = { gte: startDate, lte: endDate };
  }

  if (type) {
    where.type = type;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (walletId) {
    where.walletId = walletId;
  }

  if (search) {
    where.note = { contains: search };
  }

  // Fetch transactions with pagination
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, wallet: true },
      orderBy: { date: "desc" },
      skip: (currentPage - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Fetch categories and wallets for filters
  const [categories, wallets] = await Promise.all([
    prisma.category.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.wallet.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transaksi</h1>
        <Button asChild>
          <Link href="/transactions/new">Tambah Transaksi</Link>
        </Button>
      </div>

      <TransactionFilters
        categories={categories}
        wallets={wallets}
        currentMonth={month}
        currentYear={year}
        currentType={type}
        currentCategoryId={categoryId}
        currentWalletId={walletId}
        currentSearch={search}
      />

      <div className="rounded-lg border bg-card">
        <TransactionTable transactions={transactions} userId={userId} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link
                href={{
                  pathname: "/transactions",
                  query: { ...searchParams, page: currentPage - 1 },
                }}
              >
                Sebelumnya
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link
                href={{
                  pathname: "/transactions",
                  query: { ...searchParams, page: currentPage + 1 },
                }}
              >
                Berikutnya
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
