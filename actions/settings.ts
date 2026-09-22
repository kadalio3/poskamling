"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function changePassword(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { currentPassword, newPassword, confirmPassword } = validatedFields.data;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return { error: "User tidak ditemukan" };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return { error: "Password saat ini salah" };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Gagal mengubah password" };
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    const validatedFields = updateProfileSchema.safeParse({
      name: formData.get("name"),
    });

    if (!validatedFields.success) {
      return {
        error: "Validasi gagal",
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name } = validatedFields.data;

    await prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Gagal mengupdate profil" };
  }
}

export async function getUserSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
}
