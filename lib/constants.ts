export const TRANSACTION_TYPES = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const

export const CATEGORY_TYPES = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  BOTH: "BOTH",
} as const

export const WALLET_TYPES = {
  CASH: "CASH",
  BANK: "BANK",
  EWALLET: "EWALLET",
  CREDIT_CARD: "CREDIT_CARD",
  OTHER: "OTHER",
} as const

export const DEFAULT_CATEGORIES = [
  { name: "Gaji", type: "INCOME" as const, color: "#22c55e", icon: "💰" },
  { name: "Makanan", type: "EXPENSE" as const, color: "#f97316", icon: "🍜" },
  { name: "Transportasi", type: "EXPENSE" as const, color: "#3b82f6", icon: "🚗" },
  { name: "Belanja", type: "EXPENSE" as const, color: "#ec4899", icon: "🛒" },
  { name: "Tagihan", type: "EXPENSE" as const, color: "#ef4444", icon: "📄" },
  { name: "Kesehatan", type: "EXPENSE" as const, color: "#8b5cf6", icon: "🏥" },
  { name: "Hiburan", type: "EXPENSE" as const, color: "#eab308", icon: "🎬" },
  { name: "Lainnya", type: "BOTH" as const, color: "#6b7280", icon: "📦" },
]

export const BUDGET_STATUS = {
  SAFE: "safe",
  WARNING: "warning",
  OVER: "over",
} as const

export const DATE_PRESETS = {
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  LAST_3_MONTHS: "last_3_months",
  LAST_6_MONTHS: "last_6_months",
  THIS_YEAR: "this_year",
  CUSTOM: "custom",
} as const

export const NAVIGATION_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/transactions", label: "Transaksi", icon: "💳" },
  { href: "/categories", label: "Kategori", icon: "🏷️" },
  { href: "/wallets", label: "Dompet", icon: "👛" },
  { href: "/budgets", label: "Anggaran", icon: "📈" },
  { href: "/reports", label: "Laporan", icon: "📑" },
  { href: "/settings", label: "Pengaturan", icon: "⚙️" },
]
