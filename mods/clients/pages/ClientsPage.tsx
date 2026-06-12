import { useState, useMemo } from "react";
import { Form, redirect, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { getToken, getApiUrl } from "../../auth/util/auth.server";
import { Link } from "react-router";

type ClientType = {
  id: string;
  name: string;
  identificacion: string;
  email: string;
  telefono: string;
  direccion: string;
};

type ActionData = {
  success?: boolean;
  error?: string;
};

export async function loader({ request }: { request: Request }) {
  const token = await getToken(request);
  if (!token) {
    throw redirect("/login");
  }

  try {
    const url = new URL("/client", getApiUrl())
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { clients: [], token, error: "No se pudieron obtener los clientes." };
    }

    const result = await response.json();
    return {
      clients: (result.data as ClientType[]) ?? [],
      token,
    };
  } catch (error) {
    return { clients: [], token, error: "Error de conexión con el servidor." };
  }
}

export async function action({ request }: { request: Request }) {
  const token = await getToken(request);
  if (!token) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "create" || intent === "update") {
    const id = formData.get("id") ? String(formData.get("id")) : undefined;
    const name = String(formData.get("name") ?? "");
    const identificacion = String(formData.get("identificacion") ?? "");
    const email = String(formData.get("email") ?? "");
    const telefono = String(formData.get("telefono") ?? "");
    const direccion = String(formData.get("direccion") ?? "");

    const url = intent === "create"
      ? new URL("/client", getApiUrl())
      : new URL(`/client/${id}`, getApiUrl());
    const method = intent === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, identificacion, email, telefono, direccion }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        return {
          error: result.error?.description ?? "Error al procesar la solicitud",
          success: false,
        } satisfies ActionData;
      }

      return { success: true } satisfies ActionData;
    } catch (e) {
      return {
        error: "Error de red al conectar con el servidor",
        success: false,
      } satisfies ActionData;
    }
  }

  if (intent === "delete") {
    const id = String(formData.get("id") ?? "");
    try {
      const response = await fetch(new URL(`/client/${id}`, getApiUrl()), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        return {
          error: result.error?.description ?? "Error al eliminar el cliente",
          success: false,
        } satisfies ActionData;
      }

      return { success: true } satisfies ActionData;
    } catch (e) {
      return {
        error: "Error de red al conectar con el servidor",
        success: false,
      } satisfies ActionData;
    }
  }

  return null;
}

export default function ClientsPage() {
  const { clients, error: loaderError } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientType | null>(null);
  const [searchId, setSearchId] = useState("");
  const [searchedClient, setSearchedClient] = useState<ClientType | null>(null);
  const [searchError, setSearchError] = useState("");

  const isSubmitting = navigation.state === "submitting";

  // Reset modal when action succeeds
  useMemo(() => {
    if (actionData?.success) {
      setIsModalOpen(false);
      setEditingClient(null);
    }
  }, [actionData]);

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: ClientType) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente "${name}"?`)) {
      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("id", id);
      submit(formData, { method: "post" });
    }
  };

  const handleSearchById = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearchedClient(null);

    if (!searchId.trim()) {
      setSearchError("Por favor ingresa un ID válido.");
      return;
    }

    const client = clients.find((c) => c.id === searchId.trim());
    if (client) {
      setSearchedClient(client);
    } else {
      setSearchError("No se encontró ningún cliente con ese ID en la lista local.");
    }
  };

  const handleClearSearch = () => {
    setSearchId("");
    setSearchedClient(null);
    setSearchError("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 px-52 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Clientes
          </h1>
          <p className="text-sm text-black">
            Administra los clientes del sistema para facturación electrónica.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </button>
        <Link
          to="/logout"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:scale-110  text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </Link>
      </div>

      {/* Buscar por ID */}
      <div className="glass rounded-3xl p-6 border ">
        <h2 className="text-base font-bold  mb-3">
          Buscar Cliente por ID
        </h2>
        <form onSubmit={handleSearchById} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ingresa el ID del cliente (ej. clk8...)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border  bg-slate-50  text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-500 outline-none transition"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 px-5 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition"
            >
              Buscar
            </button>
            {(searchedClient || searchError) && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="h-11 px-4 border text-black font-bold rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>

        {searchError && (
          <p className="mt-3 text-sm font-semibold text-rose-500">{searchError}</p>
        )}

        {searchedClient && (
          <div className="mt-4 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
            <div>
              <p className="text-xs font-mono text-indigo-400 mb-1">ID: {searchedClient.id}</p>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{searchedClient.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 mt-2 text-sm text-black">
                <p><span className="font-semibold">Identificación:</span> {searchedClient.identificacion}</p>
                <p><span className="font-semibold">Email:</span> {searchedClient.email}</p>
                <p><span className="font-semibold">Teléfono:</span> {searchedClient.telefono}</p>
                <p><span className="font-semibold">Dirección:</span> {searchedClient.direccion}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleOpenEditModal(searchedClient)}
                className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg text-xs font-bold transition"
              >
                Editar
              </button>
              <button
                onClick={() => handleDeleteClient(searchedClient.id, searchedClient.name)}
                className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-xs font-bold transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error alerts */}
      {(loaderError || actionData?.error) && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30 text-sm font-medium text-rose-600 dark:text-rose-400">
          {actionData?.error ?? loaderError}
        </div>
      )}

      {/* Clientes Table */}
      <div className="glass rounded-3xl p-6 border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="pb-4 font-bold text-xs uppercase tracking-wider text-black">Nombre / ID</th>
                <th className="pb-4 font-bold text-xs uppercase tracking-wider text-black">Identificación</th>
                <th className="pb-4 font-bold text-xs uppercase tracking-wider text-black">Email</th>
                <th className="pb-4 font-bold text-xs uppercase tracking-wider text-black">Teléfono</th>
                <th className="pb-4 font-bold text-xs uppercase tracking-wider text-black">Dirección</th>
                <th className="pb-4 font-bold text-xs uppercase tracking-wider text-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y ">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-black">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="font-semibold text-sm text-[var(--text-primary)]">{client.name}</div>
                      <div className="text-[10px] font-mono text-black select-all">{client.id}</div>
                    </td>
                    <td className="py-4 text-sm text-black">{client.identificacion}</td>
                    <td className="py-4 text-sm text-black">{client.email}</td>
                    <td className="py-4 text-sm text-black">{client.telefono}</td>
                    <td className="py-4 text-sm text-black truncate max-w-[200px]" title={client.direccion}>
                      {client.direccion}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(client)}
                          className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Crear / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass w-full max-w-lg rounded-lg shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between rounded-t-lg">
              <h3 className="text-xl font-bold ">
                {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <Form method="post" className="p-6 space-y-4 bg-neutral-200">
              <input type="hidden" name="intent" value={editingClient ? "update" : "create"} />
              {editingClient && <input type="hidden" name="id" value={editingClient.id} />}

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black uppercase">
                  Nombre Completo
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingClient?.name ?? ""}
                  placeholder="ej. Juan Pérez"
                  className="w-full h-11 px-4 rounded-xl border bg-slate-50   placeholder-slate-400 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Identificación */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black uppercase">
                  Identificación (Cédula / RUC)
                </label>
                <input
                  name="identificacion"
                  type="text"
                  required
                  defaultValue={editingClient?.identificacion ?? ""}
                  placeholder="ej. 1729384756"
                  className="w-full h-11 px-4 rounded-xl border bg-slate-50  text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black uppercase">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editingClient?.email ?? ""}
                  placeholder="ej. juan@ejemplo.com"
                  className="w-full h-11 px-4 rounded-xl border bg-slate-50  text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black uppercase">
                  Teléfono
                </label>
                <input
                  name="telefono"
                  type="text"
                  required
                  defaultValue={editingClient?.telefono ?? ""}
                  placeholder="ej. 0987654321"
                  className="w-full h-11 px-4 rounded-xl border bg-slate-50  text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black uppercase">
                  Dirección
                </label>
                <input
                  name="direccion"
                  type="text"
                  required
                  defaultValue={editingClient?.direccion ?? ""}
                  placeholder="ej. Av. Amazonas N24-10"
                  className="w-full h-11 px-4 rounded-xl border bg-slate-50  text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border text-black font-bold rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition"
                >
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
