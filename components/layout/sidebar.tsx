"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAVIGATION_ITEMS } from "@/lib/constants"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <div className="px-4 mb-6">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            FinNote
          </Link>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
