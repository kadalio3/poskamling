"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createWallet, updateWallet, deactivateWallet } from "@/actions/wallets"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/format"
import { WALLET_TYPES } from "@/lib/constants"
import type { WalletWithTransactions } from "@/actions/wallets"

interface WalletFormProps {
  wallet?: WalletWithTransactions
  onClose: () => void
}

export function WalletForm({ wallet, onClose }: WalletFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as "CASH" | "BANK" | "EWALLET" | "CREDIT_CARD" | "OTHER",
      initialBalance: parseFloat(formData.get("initialBalance") as string) || 0,
    }

    try {
      if (wallet) {
        await updateWallet(wallet.id, data)
      } else {
        await createWallet(data)
      }
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Nama Dompet
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={wallet?.name}
          required
          minLength={2}
          placeholder="Contoh: Tunai, BCA, GoPay"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">
          Tipe Dompet
        </label>
        <Select
          id="type"
          name="type"
          defaultValue={wallet?.type || "CASH"}
          options={[
            { value: "CASH", label: "Tunai" },
            { value: "BANK", label: "Bank" },
            { value: "EWALLET", label: "E-Wallet" },
            { value: "CREDIT_CARD", label: "Kartu Kredit" },
            { value: "OTHER", label: "Lainnya" },
          ]}
        />
      </div>

      {!wallet && (
        <div>
          <label htmlFor="initialBalance" className="block text-sm font-medium mb-1">
            Saldo Awal
          </label>
          <Input
            id="initialBalance"
            name="initialBalance"
            type="number"
            step="0.01"
            min="0"
            defaultValue={wallet?.initialBalance?.toNumber() || 0}
            placeholder="0"
          />
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {wallet ? "Update" : "Buat"} Dompet
        </Button>
      </div>
    </form>
  )
}

interface WalletListProps {
  wallets: WalletWithTransactions[]
}

export function WalletList({ wallets }: WalletListProps) {
  const router = useRouter()
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletWithTransactions | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const handleDeactivate = async () => {
    if (!selectedWallet) return
    setIsDeactivating(true)
    try {
      await deactivateWallet(selectedWallet.id)
      router.refresh()
      setDeactivateModalOpen(false)
      setSelectedWallet(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menonaktifkan dompet")
    } finally {
      setIsDeactivating(false)
    }
  }

  if (wallets.length === 0) {
    return (
      <EmptyState
        icon="👛"
        title="Belum ada dompet"
        description="Buat dompet pertama Anda untuk mulai mencatat transaksi"
      />
    )
  }

  const activeWallets = wallets.filter((w) => w.isActive)
  const inactiveWallets = wallets.filter((w) => !w.isActive)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeWallets.map((wallet) => (
          <Card key={wallet.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{wallet.name}</CardTitle>
                  <CardDescription>
                    {wallet.type === "CASH" && "Tunai"}
                    {wallet.type === "BANK" && "Bank"}
                    {wallet.type === "EWALLET" && "E-Wallet"}
                    {wallet.type === "CREDIT_CARD" && "Kartu Kredit"}
                    {wallet.type === "OTHER" && "Lainnya"}
                  </CardDescription>
                </div>
                <span className="text-2xl">
                  {wallet.type === "CASH" && "💵"}
                  {wallet.type === "BANK" && "🏦"}
                  {wallet.type === "EWALLET" && "📱"}
                  {wallet.type === "CREDIT_CARD" && "💳"}
                  {wallet.type === "OTHER" && "📦"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Saat Ini</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(wallet.currentBalance.toNumber())}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {wallet._count.transactions} transaksi
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/wallets?edit=${wallet.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedWallet(wallet)
                      setDeactivateModalOpen(true)
                    }}
                  >
                    Nonaktifkan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inactiveWallets.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Dompet Nonaktif</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {inactiveWallets.map((wallet) => (
              <Card key={wallet.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{wallet.name}</CardTitle>
                  <CardDescription>Nonaktif</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(wallet.currentBalance.toNumber())}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        title="Nonaktifkan Dompet"
        description="Apakah Anda yakin ingin menonaktifkan dompet ini?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeactivateModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeactivate} isLoading={isDeactivating}>
              Nonaktifkan
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Dompet yang dinonaktifkan tidak akan muncul dalam pilihan saat membuat transaksi baru.
        </p>
      </Modal>
    </>
  )
}
