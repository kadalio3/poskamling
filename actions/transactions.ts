"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTransactionSchema,
  updateTransactionSchema,
  deleteTransactionSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function createTransaction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = createTransactionSchema.safeParse({
      date: formData.get("date"),
      type: formData.get("type"),
      amount: formData.get("amount"),
      categoryId: formData.get("categoryId"),
      walletId: formData.get("walletId"),
      note: formData.get("note"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { date, type, amount, categoryId, walletId, note } = validatedFields.data;

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      return { error: "Kategori tidak ditemukan" };
    }

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });
    if (!wallet) {
      return { error: "Dompet tidak ditemukan" };
    }

    // Check if category type is compatible with transaction type
    if (
      category.type === "INCOME" && type === "EXPENSE" ||
      category.type === "EXPENSE" && type === "INCOME"
    ) {
      return { error: "Tipe kategori tidak cocok dengan tipe transaksi" };
    }

    // Create transaction and update wallet balance atomically
    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId,
          walletId,
          categoryId,
          type,
          amount: new Prisma.Decimal(amount),
          date: new Date(date),
          note: note || null,
        },
      });

      // Update wallet balance
      const balanceChange = type === "INCOME" ? amount : -amount;
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          currentBalance: {
            increment: balanceChange,
          },
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/reports");
    revalidatePath("/budgets");

    return { success: true };
  } catch (error) {
    console.error("Create transaction error:", error);
    return { error: "Gagal membuat transaksi" };
  }
}

export async function updateTransaction(
  id: string,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = updateTransactionSchema.safeParse({
      id,
      date: formData.get("date"),
      type: formData.get("type"),
      amount: formData.get("amount"),
      categoryId: formData.get("categoryId"),
      walletId: formData.get("walletId"),
      note: formData.get("note"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { date, type, amount, categoryId, walletId, note } = validatedFields.data;

    // Get existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { wallet: true },
    });

    if (!existingTransaction) {
      return { error: "Transaksi tidak ditemukan" };
    }

    // Verify new category belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      return { error: "Kategori tidak ditemukan" };
    }

    // Verify new wallet belongs to user
    const newWallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });
    if (!newWallet) {
      return { error: "Dompet tidak ditemukan" };
    }

    // Check if category type is compatible with transaction type
    if (
      category.type === "INCOME" && type === "EXPENSE" ||
      category.type === "EXPENSE" && type === "INCOME"
    ) {
      return { error: "Tipe kategori tidak cocok dengan tipe transaksi" };
    }

    const oldAmount = existingTransaction.amount.toNumber();
    const oldType = existingTransaction.type;
    const oldWalletId = existingTransaction.walletId;

    // Update transaction and adjust balances atomically
    await prisma.$transaction(async (tx) => {
      // Reverse old transaction effect on old wallet
      const oldBalanceChange = oldType === "INCOME" ? -oldAmount : oldAmount;
      await tx.wallet.update({
        where: { id: oldWalletId },
        data: {
          currentBalance: {
            increment: oldBalanceChange,
          },
        },
      });

      // Apply new transaction effect on new wallet
      const newBalanceChange = type === "INCOME" ? amount : -amount;
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          currentBalance: {
            increment: newBalanceChange,
          },
        },
      });

      // Update transaction
      await tx.transaction.update({
        where: { id },
        data: {
          date: new Date(date),
          type,
          amount: new Prisma.Decimal(amount),
          categoryId,
          walletId,
          note: note || null,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/reports");
    revalidatePath("/budgets");

    return { success: true };
  } catch (error) {
    console.error("Update transaction error:", error);
    return { error: "Gagal mengupdate transaksi" };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = deleteTransactionSchema.safeParse({ id });

    if (!validatedFields.success) {
      return { error: "ID transaksi tidak valid" };
    }

    // Get transaction
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { wallet: true },
    });

    if (!transaction) {
      return { error: "Transaksi tidak ditemukan" };
    }

    const amount = transaction.amount.toNumber();
    const type = transaction.type;
    const walletId = transaction.walletId;

    // Delete transaction and reverse balance atomically
    await prisma.$transaction(async (tx) => {
      // Reverse transaction effect on wallet
      const balanceChange = type === "INCOME" ? -amount : amount;
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          currentBalance: {
            increment: balanceChange,
          },
        },
      });

      // Delete transaction
      await tx.transaction.delete({
        where: { id },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/reports");
    revalidatePath("/budgets");

    return { success: true };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return { error: "Gagal menghapus transaksi" };
  }
}

export async function getTransactions(
  userId: string,
  filters?: {
    month?: number;
    year?: number;
    type?: "INCOME" | "EXPENSE";
    categoryId?: string;
    walletId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const {
    month,
    year,
    type,
    categoryId,
    walletId,
    search,
    page = 1,
    limit = 10,
  } = filters || {};

  const where: Prisma.TransactionWhereInput = {
    userId,
  };

  // Date filter
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Type filter
  if (type) {
    where.type = type;
  }

  // Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Wallet filter
  if (walletId) {
    where.walletId = walletId;
  }

  // Search filter
  if (search) {
    where.note = {
      contains: search,
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        wallet: true,
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, totalPages: Math.ceil(total / limit) };
}
