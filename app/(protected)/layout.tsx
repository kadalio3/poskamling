import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { MobileNav } from "@/components/layout/mobile-nav"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="md:pl-64">
        <Navbar userName={session.user.name || session.user.email || "User"} />
        <main className="py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
