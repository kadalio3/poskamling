import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            FinNote
          </div>
          <div className="space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Masuk</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="primary">Daftar</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
            Catat Keuangan Harian dengan Sederhana, Aman, dan Visual
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            FinNote membantu Anda mengelola keuangan pribadi dengan mudah. 
            Lacak pemasukan, pengeluaran, dan budget dalam satu tempat.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/register">
              <Button variant="primary" size="lg">
                Mulai Sekarang - Gratis
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="secondary" size="lg">
                Masuk
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Dashboard Visual
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Lihat ringkasan keuangan, grafik pengeluaran, dan progress budget dalam satu tampilan.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Aman & Privat
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Data Anda terenkripsi dan terisolasi. Password di-hash dengan bcrypt.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Responsif
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Akses dari desktop, tablet, atau mobile. UI modern dengan Tailwind CSS.
            </p>
          </div>
        </div>

        {/* More Features */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💰 Manajemen Transaksi</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Catat pemasukan dan pengeluaran dengan kategori custom. Saldo dompet otomatis terupdate.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Budget Planning</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Set budget bulanan per kategori. Dapatkan notifikasi saat mendekati batas.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Laporan & Grafik</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Analisis tren pengeluaran dengan grafik interaktif. Export data ke CSV.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🌙 Dark Mode</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Nyaman di mata dengan mode gelap. Pilih preferensi tema Anda.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>&copy; 2025 FinNote. Dibuat dengan ❤️ untuk pengelolaan keuangan yang lebih baik.</p>
        </div>
      </footer>
    </div>
  );
}
