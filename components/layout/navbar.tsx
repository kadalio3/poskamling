"use client"

import Link from "next/link"
import { signOut } from "@/lib/auth"
import { ThemeToggle } from "./theme-toggle"

interface NavbarProps {
  userName: string
}

export function Navbar({ userName }: NavbarProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="md:hidden">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              FinNote
            </Link>
          </div>

          <div className="flex-1 md:flex-none"></div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {userName}
              </span>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
