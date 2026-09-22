"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function createCategory(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = createCategorySchema.safeParse({
      name: formData.get("name"),
      type: formData.get("type"),
      color: formData.get("color"),
      icon: formData.get("icon"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, type, color, icon } = validatedFields.data;

    // Check for duplicate category name per user per type
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        name,
        type: type === "BOTH" ? { in: ["INCOME", "EXPENSE", "BOTH"] } : type,
      },
    });

    if (existingCategory) {
      return { error: "Kategori dengan nama ini sudah ada" };
    }

    await prisma.category.create({
      data: {
        userId,
        name,
        type,
        color,
        icon,
        isSystem: false,
        isActive: true,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return { success: true };
  } catch (error) {
    console.error("Create category error:", error);
    return { error: "Gagal membuat kategori" };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = updateCategorySchema.safeParse({
      id,
      name: formData.get("name"),
      type: formData.get("type"),
      color: formData.get("color"),
      icon: formData.get("icon"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, type, color, icon } = validatedFields.data;

    // Verify category belongs to user and is not system category
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      return { error: "Kategori tidak ditemukan" };
    }

    if (existingCategory.isSystem) {
      return { error: "Tidak dapat mengedit kategori sistem" };
    }

    // Check for duplicate category name per user per type (excluding current category)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        userId,
        name,
        type: type === "BOTH" ? { in: ["INCOME", "EXPENSE", "BOTH"] } : type,
        NOT: { id },
      },
    });

    if (duplicateCategory) {
      return { error: "Kategori dengan nama ini sudah ada" };
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        type,
        color,
        icon,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return { success: true };
  } catch (error) {
    console.error("Update category error:", error);
    return { error: "Gagal mengupdate kategori" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = deleteCategorySchema.safeParse({ id });

    if (!validatedFields.success) {
      return { error: "ID kategori tidak valid" };
    }

    // Verify category belongs to user and is not system category
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      return { error: "Kategori tidak ditemukan" };
    }

    if (category.isSystem) {
      return { error: "Tidak dapat menghapus kategori sistem" };
    }

    // Check if category is used in any transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      return {
        error: `Tidak dapat menghapus kategori karena masih digunakan oleh ${transactionCount} transaksi. Pindahkan atau hapus transaksi terlebih dahulu.`,
      };
    }

    // Check if category is used in any budgets
    const budgetCount = await prisma.budget.count({
      where: { categoryId: id },
    });

    if (budgetCount > 0) {
      return {
        error: `Tidak dapat menghapus kategori karena masih digunakan oleh ${budgetCount} budget. Hapus budget terlebih dahulu.`,
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return { error: "Gagal menghapus kategori" };
  }
}

export async function getCategories(userId: string) {
  const categories = await prisma.category.findMany({
    where: { userId, isActive: true },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          transactions: true,
          budgets: true,
        },
      },
    },
  });

  return categories;
}

export async function getUserCategories(
  userId: string,
  type?: "INCOME" | "EXPENSE" | "BOTH"
) {
  const where: Prisma.CategoryWhereInput = {
    userId,
    isActive: true,
  };

  if (type && type !== "BOTH") {
    where.type = type;
  } else if (type === "BOTH") {
    where.type = { in: ["INCOME", "EXPENSE", "BOTH"] };
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return categories;
}
