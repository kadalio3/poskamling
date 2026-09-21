import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan confirm password tidak cocok",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password baru minimal 8 karakter")
    .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Password baru dan confirm password tidak cocok",
  path: ["confirmNewPassword"],
});

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Jumlah harus lebih dari 0"
  ),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  walletId: z.string().min(1, "Dompet wajib dipilih"),
  note: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]),
  color: z.string().regex(/^#?[0-9A-F]{6}$/i, "Warna harus format hex"),
  icon: z.string().optional(),
});

export const walletSchema = z.object({
  name: z.string().min(1, "Nama dompet wajib diisi"),
  type: z.enum(["CASH", "BANK", "EWALLET", "CREDIT_CARD", "OTHER"]),
  initialBalance: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    "Saldo awal harus >= 0"
  ),
  currency: z.string().default("IDR"),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Nominal budget harus lebih dari 0"
  ),
});
