"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransactionSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTransaction } from "@/actions/transactions";
import { Category, Wallet } from "@prisma/client";

interface TransactionFormProps {
  categories: Category[];
  wallets: Wallet[];
}

export function TransactionForm({ categories, wallets }: TransactionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "EXPENSE",
      amount: "",
      categoryId: "",
      walletId: "",
      note: "",
    },
  });

  const transactionType = watch("type");

  // Filter categories based on transaction type
  const filteredCategories = categories.filter((cat) => {
    if (transactionType === "INCOME") {
      return cat.type === "INCOME" || cat.type === "BOTH";
    } else if (transactionType === "EXPENSE") {
      return cat.type === "EXPENSE" || cat.type === "BOTH";
    }
    return true;
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("date", data.date);
      formData.set("type", data.type);
      formData.set("amount", data.amount.toString());
      formData.set("categoryId", data.categoryId);
      formData.set("walletId", data.walletId);
      formData.set("note", data.note || "");

      const result = await createTransaction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/transactions");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan saat membuat transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Transaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Tanggal</label>
              <Input
                type="date"
                {...register("date")}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.date.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Tipe</label>
              <Select
                {...register("type")}
                className={errors.type ? "border-red-500" : ""}
              >
                <option value="EXPENSE">Pengeluaran</option>
                <option value="INCOME">Pemasukan</option>
              </Select>
              {errors.type && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.type.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Jumlah</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                {...register("amount")}
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.amount.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Kategori</label>
              <Select
                {...register("categoryId")}
                className={errors.categoryId ? "border-red-500" : ""}
              >
                <option value="">Pilih kategori</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.categoryId.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Dompet</label>
              <Select
                {...register("walletId")}
                className={errors.walletId ? "border-red-500" : ""}
              >
                <option value="">Pilih dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Rp {w.currentBalance.toNumber().toLocaleString("id-ID")})
                  </option>
                ))}
              </Select>
              {errors.walletId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.walletId.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Catatan (opsional)</label>
              <Input
                placeholder="Catatan..."
                {...register("note")}
                className={errors.note ? "border-red-500" : ""}
              />
              {errors.note && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.note.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
