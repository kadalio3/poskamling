"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function exportTransactionsToCSV(filters?: {
  month?: number;
  year?: number;
  type?: "INCOME" | "EXPENSE";
  categoryId?: string;
  walletId?: string;
  search?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    // Date filter
    if (filters?.month !== undefined && filters?.year !== undefined) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Type filter
    if (filters?.type) {
      where.type = filters.type;
    }

    // Category filter
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // Wallet filter
    if (filters?.walletId) {
      where.walletId = filters.walletId;
    }

    // Search filter
    if (filters?.search) {
      where.note = {
        contains: filters.search,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        wallet: true,
      },
      orderBy: { date: "desc" },
    });

    // CSV Header
    const headers = ["Tanggal", "Tipe", "Kategori", "Dompet", "Jumlah", "Catatan"];

    // CSV Rows
    const rows = transactions.map((t) => {
      const date = formatDate(t.date);
      const type = t.type === "INCOME" ? "Pemasukan" : "Pengeluaran";
      const category = escapeCSV(t.category.name);
      const wallet = escapeCSV(t.wallet.name);
      const amount = formatAmount(t.amount.toNumber(), t.type);
      const note = escapeCSV(t.note || "");

      return [date, type, category, wallet, amount, note].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return { success: true, csv };
  } catch (error) {
    console.error("Export CSV error:", error);
    return { error: "Gagal mengekspor CSV" };
  }
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAmount(amount: number, type: "INCOME" | "EXPENSE"): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

  // Remove negative sign for expense (already indicated by type)
  return formatted.replace("-", "");
}

function escapeCSV(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
