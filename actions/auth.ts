"use server";

import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validation = registerSchema.safeParse({
    name,
    email,
    password,
    confirmPassword,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email sudah terdaftar" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Buat user dengan wallet dan kategori default
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        wallets: {
          create: {
            name: "Tunai",
            type: "CASH",
            initialBalance: 0,
            currentBalance: 0,
            currency: "IDR",
          },
        },
        categories: {
          create: [
            { name: "Gaji", type: "INCOME", color: "#10B981", icon: "💰", isSystem: true },
            { name: "Makanan", type: "EXPENSE", color: "#F59E0B", icon: "🍔", isSystem: true },
            { name: "Transportasi", type: "EXPENSE", color: "#3B82F6", icon: "🚗", isSystem: true },
            { name: "Belanja", type: "EXPENSE", color: "#8B5CF6", icon: "🛒", isSystem: true },
            { name: "Tagihan", type: "EXPENSE", color: "#EF4444", icon: "📄", isSystem: true },
            { name: "Kesehatan", type: "EXPENSE", color: "#EC4899", icon: "🏥", isSystem: true },
            { name: "Hiburan", type: "EXPENSE", color: "#F97316", icon: "🎬", isSystem: true },
            { name: "Lainnya", type: "BOTH", color: "#6B7280", icon: "📁", isSystem: true },
          ],
        },
      },
    });

    redirect("/auth/signin?registered=true");
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Terjadi kesalahan saat registrasi" };
  }
}
