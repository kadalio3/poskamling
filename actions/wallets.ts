"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createWalletSchema,
  updateWalletSchema,
  deleteWalletSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function createWallet(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = createWalletSchema.safeParse({
      name: formData.get("name"),
      type: formData.get("type"),
      initialBalance: formData.get("initialBalance"),
      currency: formData.get("currency"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, type, initialBalance, currency } = validatedFields.data;

    await prisma.wallet.create({
      data: {
        userId,
        name,
        type,
        currency: currency || "IDR",
        initialBalance: new Prisma.Decimal(initialBalance),
        currentBalance: new Prisma.Decimal(initialBalance),
        isActive: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/wallets");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error) {
    console.error("Create wallet error:", error);
    return { error: "Gagal membuat dompet" };
  }
}

export async function updateWallet(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = updateWalletSchema.safeParse({
      id,
      name: formData.get("name"),
      type: formData.get("type"),
      currency: formData.get("currency"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, type, currency } = validatedFields.data;

    // Verify wallet belongs to user
    const existingWallet = await prisma.wallet.findFirst({
      where: { id, userId },
    });

    if (!existingWallet) {
      return { error: "Dompet tidak ditemukan" };
    }

    await prisma.wallet.update({
      where: { id },
      data: {
        name,
        type,
        currency: currency || "IDR",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/wallets");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error) {
    console.error("Update wallet error:", error);
    return { error: "Gagal mengupdate dompet" };
  }
}

export async function archiveWallet(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: { id, userId },
    });

    if (!wallet) {
      return { error: "Dompet tidak ditemukan" };
    }

    // Check if wallet has transactions
    const transactionCount = await prisma.transaction.count({
      where: { walletId: id },
    });

    if (transactionCount > 0) {
      return {
        error: `Tidak dapat menonaktifkan dompet karena masih ada ${transactionCount} transaksi.`,
      };
    }

    await prisma.wallet.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/wallets");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error) {
    console.error("Archive wallet error:", error);
    return { error: "Gagal menonaktifkan dompet" };
  }
}

export async function deleteWallet(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = deleteWalletSchema.safeParse({ id });

    if (!validatedFields.success) {
      return { error: "ID dompet tidak valid" };
    }

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: { id, userId },
    });

    if (!wallet) {
      return { error: "Dompet tidak ditemukan" };
    }

    // Check if wallet has transactions
    const transactionCount = await prisma.transaction.count({
      where: { walletId: id },
    });

    if (transactionCount > 0) {
      return {
        error: `Tidak dapat menghapus dompet karena masih ada ${transactionCount} transaksi.`,
      };
    }

    await prisma.wallet.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/wallets");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error) {
    console.error("Delete wallet error:", error);
    return { error: "Gagal menghapus dompet" };
  }
}

export async function getWallets(userId: string, includeInactive = false) {
  const where: Prisma.WalletWhereInput = {
    userId,
  };

  if (!includeInactive) {
    where.isActive = true;
  }

  const wallets = await prisma.wallet.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  return wallets;
}

export async function getTotalBalance(userId: string) {
  const result = await prisma.wallet.aggregate({
    where: {
      userId,
      isActive: true,
    },
    _sum: {
      currentBalance: true,
    },
  });

  return result._sum.currentBalance || new Prisma.Decimal(0);
}
