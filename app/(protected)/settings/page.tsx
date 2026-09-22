import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { changePassword } from "@/actions/settings"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengaturan</h1>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informasi akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama</label>
            <Input value={session.user.name || ""} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={session.user.email || ""} disabled />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Untuk mengubah nama atau email, hubungi administrator.
          </p>
        </CardContent>
      </Card>

      {/* Ganti Password */}
      <Card>
        <CardHeader>
          <CardTitle>Ganti Password</CardTitle>
          <CardDescription>Update password Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={changePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                Password Saat Ini
              </label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                Password Baru
              </label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Konfirmasi Password Baru
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferensi */}
      <Card>
        <CardHeader>
          <CardTitle>Preferensi</CardTitle>
          <CardDescription>Pengaturan tampilan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tema</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pilih tema terang atau gelap
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div>
            <p className="font-medium mb-1">Mata Uang</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              IDR (Rupiah Indonesia) - Fixed untuk MVP
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Zona Bahaya</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server"
              await require("@/lib/auth").signOut({ redirectTo: "/" })
            }}
          >
            <Button type="submit" variant="danger">Logout</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
