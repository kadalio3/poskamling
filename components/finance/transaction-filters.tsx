"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Category, Wallet } from "@prisma/client";

interface TransactionFiltersProps {
  categories: Category[];
  wallets: Wallet[];
  currentMonth?: number;
  currentYear?: number;
  currentType?: "INCOME" | "EXPENSE";
  currentCategoryId?: string;
  currentWalletId?: string;
  currentSearch?: string;
}

export function TransactionFilters({
  categories,
  wallets,
  currentMonth,
  currentYear,
  currentType,
  currentCategoryId,
  currentWalletId,
  currentSearch,
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [month, setMonth] = useState(currentMonth?.toString() || "");
  const [year, setYear] = useState(currentYear?.toString() || new Date().getFullYear().toString());
  const [type, setType] = useState(currentType || "");
  const [categoryId, setCategoryId] = useState(currentCategoryId || "");
  const [walletId, setWalletId] = useState(currentWalletId || "");
  const [search, setSearch] = useState(currentSearch || "");

  const handleFilter = () => {
    const params = new URLSearchParams();

    if (month) params.set("month", month);
    if (year) params.set("year", year);
    if (type) params.set("type", type);
    if (categoryId) params.set("categoryId", categoryId);
    if (walletId) params.set("walletId", walletId);
    if (search) params.set("search", search);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setMonth("");
    setYear(new Date().getFullYear().toString());
    setType("");
    setCategoryId("");
    setWalletId("");
    setSearch("");
    router.push(pathname);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div>
          <label className="text-sm font-medium mb-1 block">Bulan</label>
          <Select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full"
          >
            <option value="">Semua</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleDateString("id-ID", { month: "long" })}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Tahun</label>
          <Select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Tipe</label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full"
          >
            <option value="">Semua</option>
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Kategori</label>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full"
          >
            <option value="">Semua</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Dompet</label>
          <Select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full"
          >
            <option value="">Semua</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Cari</label>
          <Input
            placeholder="Catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleFilter}>Filter</Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
