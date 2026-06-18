import { redirect } from "next/navigation";
import { appConfig } from "@/lib/app-config";
import { createAdminSession, validateAdminCredentials } from "@/lib/admin-auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!validateAdminCredentials(email, password)) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession();
  redirect("/admin");
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <main
      className="grid min-h-dvh place-items-center px-5 py-8 text-slate-950"
      style={{ backgroundColor: appConfig.backgroundColor }}
    >
      <section className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-500">
            {appConfig.shortName}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-normal">
            Admin MVP
          </h1>
        </div>

        <form action={login} className="grid gap-4 rounded-lg bg-white p-5 shadow-sm">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Email
            <input
              autoComplete="email"
              className="min-h-12 rounded-lg border border-slate-200 px-3 text-base font-normal outline-none focus:border-slate-400"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Senha
            <input
              autoComplete="current-password"
              className="min-h-12 rounded-lg border border-slate-200 px-3 text-base font-normal outline-none focus:border-slate-400"
              name="password"
              required
              type="password"
            />
          </label>

          <button
            className="min-h-12 rounded-lg px-4 text-base font-bold text-white"
            style={{ backgroundColor: appConfig.themeColor }}
            type="submit"
          >
            Entrar
          </button>

          {hasError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              Credenciais invalidas ou variaveis admin nao configuradas.
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
