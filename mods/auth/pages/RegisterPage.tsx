import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import type { Route } from ".react-router/types/app/+types/root";
import {
  getApiUrl,
  getToken,
} from "../util/auth.server";

type ActionData = {
  error?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);

  if (token) {
    throw redirect("/dashboard");
  }

  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const response = await fetch(new URL("/auth/register", getApiUrl()), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    try {
      const errData = await response.json();
      return {
        error: errData.error?.description || "Error al crear la cuenta",
      } satisfies ActionData;
    } catch {
      return {
        error: "Error de red o del servidor al registrarse",
      } satisfies ActionData;
    }
  }

  // Si se registra con éxito, el backend enviará un correo con el token de verificación.
  // Redirigimos a la página de verificación pasando el correo como parámetro de consulta
  return redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export default function RegisterPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errorMessage = actionData?.error;

  return (
    <main className="min-h-screen">
      <div>
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-lg">
            <div className="mb-8 lg:hidden">
              <Link
                to="/"
                className="inline-flex items-center gap-3 text-sm font-semibold transition-colors"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border font-black shadow-sm">
                  FJ
                </span>
                FacturaJS
              </Link>
            </div>

            <div className="border p-8 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] sm:p-10">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Comienza ahora
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Crear una cuenta
                </h2>
                <p className="mt-3 text-base leading-7">
                  Regístrate para empezar a administrar tu facturación electrónica.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              <Form method="post" className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </span>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="Tu nombre completo"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                        />
                      </svg>
                    </span>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="tu@correo.com"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </span>
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="********"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Registrando...
                    </span>
                  ) : (
                    "Registrarse"
                  )}
                </button>
              </Form>

              <div className="mt-8 text-center text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                >
                  Inicia sesión
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
