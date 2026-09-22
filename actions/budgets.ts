"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createBudgetSchema,
  updateBudgetSchema,
  deleteBudgetSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function createBudget(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = createBudgetSchema.safeParse({
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { categoryId, amount } = validatedFields.data;

    // Verify category belongs to user and is expense or both type
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      return { error: "Kategori tidak ditemukan" };
    }

    if (category.type === "INCOME") {
      return { error: "Budget hanya dapat dibuat untuk kategori pengeluaran" };
    }

    // Check for existing budget for this category
    const existingBudget = await prisma.budget.findFirst({
      where: { userId, categoryId },
    });

    if (existingBudget) {
      return { error: "Budget untuk kategori ini sudah ada" };
    }

    await prisma.budget.create({
      data: {
        userId,
        categoryId,
        amount: new Prisma.Decimal(amount),
        isActive: true,
      },
    });

    revalidatePath("/budgets");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Create budget error:", error);
    return { error: "Gagal membuat budget" };
  }
}

export async function updateBudget(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = updateBudgetSchema.safeParse({
      id,
      amount: formData.get("amount"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { amount } = validatedFields.data;

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existingBudget) {
      return { error: "Budget tidak ditemukan" };
    }

    await prisma.budget.update({
      where: { id },
      data: {
        amount: new Prisma.Decimal(amount),
      },
    });

    revalidatePath("/budgets");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update budget error:", error);
    return { error: "Gagal mengupdate budget" };
  }
}

export async function deleteBudget(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = deleteBudgetSchema.safeParse({ id });

    if (!validatedFields.success) {
      return { error: "ID budget tidak valid" };
    }

    // Verify budget belongs to user
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      return { error: "Budget tidak ditemukan" };
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePath("/budgets");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete budget error:", error);
    return { error: "Gagal menghapus budget" };
  }
}

export async function getBudgets(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return budgets;
}

export async function getBudgetsWithProgress(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (budget) => {
      // Calculate spent amount for this category this month
      const spentResult = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const spent = spentResult._sum.amount || new Prisma.Decimal(0);
      const budgetAmount = budget.amount;
      const percentage = budgetAmount.toNumber() > 0
        ? (spent.toNumber() / budgetAmount.toNumber()) * 100
        : 0;

      let status: "safe" | "warning" | "over" = "safe";
      if (percentage >= 100) {
        status = "over";
      } else if (percentage >= 80) {
        status = "warning";
      }

      return {
        ...budget,
        spent,
        remaining: budgetAmount.minus(spent),
        percentage: Math.round(percentage),
        status,
      };
    })
  );

  return budgetsWithProgress;
}

export async function getBudgetByCategory(
  userId: string,
  categoryId: string,
  year: number,
  month: number // 1-12
) {
  const budget = await prisma.budget.findFirst({
    where: { userId, categoryId, isActive: true },
    include: {
      category: true,
    },
  });

  if (!budget) {
    return null;
  }

  // Calculate spent amount for this category in the specified month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const spentResult = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const spent = spentResult._sum.amount || new Prisma.Decimal(0);
  const budgetAmount = budget.amount;
  const percentage = budgetAmount.toNumber() > 0
    ? (spent.toNumber() / budgetAmount.toNumber()) * 100
    : 0;

  let status: "safe" | "warning" | "over" = "safe";
  if (percentage >= 100) {
    status = "over";
  } else if (percentage >= 80) {
    status = "warning";
  }

  return {
    ...budget,
    spent,
    remaining: budgetAmount.minus(spent),
    percentage: Math.round(percentage),
    status,
  };
}
