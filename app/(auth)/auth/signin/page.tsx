import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Masuk ke FinNote
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Catat keuangan harian dengan sederhana
          </p>
        </div>
        
        <form
          action={async (formData) => {
            "use server";
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            
            try {
              await signIn("credentials", {
                email,
                password,
                redirectTo: "/dashboard",
              });
            } catch {
              // Error akan dihandle oleh Auth.js
            }
          }}
          className="mt-8 space-y-6"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <Button type="submit" className="w-full" variant="primary">
            Masuk
          </Button>
        </form>

        <div className="text-center">
          <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Belum punya akun? Daftar disini
          </a>
        </div>
      </div>
    </div>
  );
}
