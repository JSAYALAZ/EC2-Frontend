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
  successMessage?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  // Si el usuario ya está autenticado, redirigir
  const token = await getToken(request);
  if (token) {
    throw redirect("/dashboard");
  }

  const url = new URL(request.url);
  const verificationToken = url.searchParams.get("token");
  const email = url.searchParams.get("email") ?? "";

  // Si el token viene directamente en la URL, auto-verificar
  if (verificationToken) {
    const response = await fetch(new URL("/auth/verify", getApiUrl()), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: verificationToken }),
    });

    if (response.ok) {
      throw redirect("/login?verified=true");
    } else {
      try {
        const errData = await response.json();
        return {
          email,
          autoVerifyError: errData.error?.description || "El enlace de verificación no es válido o ha expirado.",
        };
      } catch {
        return {
          email,
          autoVerifyError: "El enlace de verificación no es válido o ha expirado.",
        };
      }
    }
  }

  return {
    email,
    autoVerifyError: null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "verify");

  if (intent === "verify") {
    const verificationToken = String(formData.get("token") ?? "");
    const response = await fetch(new URL("/auth/verify", getApiUrl()), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: verificationToken }),
    });

    if (response.ok) {
      throw redirect("/login?verified=true");
    }

    try {
      const errData = await response.json();
      return {
        error: errData.error?.description || "Token de verificación incorrecto.",
      } satisfies ActionData;
    } catch {
      return {
        error: "Error al verificar el token.",
      } satisfies ActionData;
    }
  }

  if (intent === "resend") {
    const email = String(formData.get("email") ?? "");
    const response = await fetch(new URL("/auth/resend-verification", getApiUrl()), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      return {
        successMessage: `Código enviado. Por favor revisa la bandeja de entrada de ${email}.`,
      } satisfies ActionData;
    }

    try {
      const errData = await response.json();
      return {
        error: errData.error?.description || "No se pudo enviar el correo de verificación.",
      } satisfies ActionData;
    } catch {
      return {
        error: "Error al reenviar el código de verificación.",
      } satisfies ActionData;
    }
  }

  return {};
}

export default function VerifyPage() {
  const { email, autoVerifyError } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const errorMessage = actionData?.error || autoVerifyError;
  const successMessage = actionData?.successMessage;

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
                  Verificación de cuenta
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Verificar Correo
                </h2>
                <p className="mt-3 text-base leading-7">
                  Ingresa el código de verificación enviado a tu dirección de correo electrónico para activar tu cuenta.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMessage}
                </div>
              )}

              {/* Formulario 1: Verificación de Token */}
              <Form method="post" className="space-y-5 mb-8">
                <input type="hidden" name="intent" value="verify" />
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Token de Verificación
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </span>
                    <input
                      name="token"
                      type="text"
                      required
                      placeholder="Pega tu token de verificación aquí (UUID)"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Verificando..." : "Verificar Cuenta"}
                </button>
              </Form>

              <hr className="border-slate-100 mb-6" />

              {/* Formulario 2: Reenviar Token */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">¿No recibiste el código?</h3>
                <Form method="post" className="flex flex-col sm:flex-row gap-3">
                  <input type="hidden" name="intent" value="resend" />
                  <div className="relative flex-1">
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={email}
                      placeholder="tu@correo.com"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 px-6 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    Reenviar código
                  </button>
                </Form>
              </div>

              <div className="mt-8 text-center text-sm">
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
