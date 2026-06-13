import { useState, useMemo, useRef } from "react";
import { Form, redirect, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { getToken, getApiUrl } from "../../auth/util/auth.server";
import { Link } from "react-router";

type MediaItem = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  s3Key: string;
  bucket: string;
  createdAt: string;
};

type ActionData = {
  success?: boolean;
  error?: string;
  uploadedId?: string;
};

export async function loader({ request }: { request: Request }) {
  const token = await getToken(request);
  if (!token) {
    throw redirect("/login");
  }

  try {
    const url = new URL("/media", getApiUrl());
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { mediaList: [], token, error: "No se pudieron obtener los recursos multimedia." };
    }

    const result = await response.json();
    return {
      mediaList: (result.data as MediaItem[]) ?? [],
      token,
    };
  } catch (error) {
    return { mediaList: [], token, error: "Error de conexión con el servidor." };
  }
}

export async function action({ request }: { request: Request }) {
  const token = await getToken(request);
  if (!token) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "upload") {
    const file = formData.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "Seleccione un archivo válido para subir." } satisfies ActionData;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await fetch(new URL("/media", getApiUrl()), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        return {
          error: result.error?.description ?? "Error al subir el archivo",
          success: false,
        } satisfies ActionData;
      }

      return { success: true, uploadedId: result.data?.id } satisfies ActionData;
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
      const response = await fetch(new URL(`/media/${id}`, getApiUrl()), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        return {
          error: result.error?.description ?? "Error al eliminar el recurso",
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

export default function MediaPage() {
  const { mediaList, error: loaderError } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = navigation.state === "submitting";

  // Formateador de bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Filtrado de recursos multimedia
  const filteredMedia = useMemo(() => {
    if (filterType === "all") return mediaList;
    if (filterType === "image") return mediaList.filter(item => item.mimeType.startsWith("image/"));
    if (filterType === "video") return mediaList.filter(item => item.mimeType.startsWith("video/"));
    if (filterType === "audio") return mediaList.filter(item => item.mimeType.startsWith("audio/"));
    return mediaList.filter(item =>
      !item.mimeType.startsWith("image/") &&
      !item.mimeType.startsWith("video/") &&
      !item.mimeType.startsWith("audio/")
    );
  }, [mediaList, filterType]);

  // Manejar subida automática
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append("intent", "upload");
      formData.append("file", e.target.files[0]);
      submit(formData, { method: "post", encType: "multipart/form-data" });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const formData = new FormData();
      formData.append("intent", "upload");
      formData.append("file", e.dataTransfer.files[0]);
      submit(formData, { method: "post", encType: "multipart/form-data" });
    }
  };

  const handleCardClick = (item: MediaItem) => {
    setSelectedMedia(item);
  };

  const handleDeleteMedia = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de que deseas eliminar el archivo "${name}"?`)) {
      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("id", id);
      submit(formData, { method: "post" });
      if (selectedMedia?.id === id) {
        setSelectedMedia(null);
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(url);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return (
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.startsWith("video/")) {
      return (
        <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.startsWith("audio/")) {
      return (
        <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Navbar Premium */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Biblioteca Multimedia
            </h1>
            <p className="text-xs text-slate-500">AWS S3 Cloud Storage</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/logout"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all text-sm hover:scale-105 border border-slate-700/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </Link>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-73px)]">

        {/* Left Section: Library and Uploader */}
        <main className="lg:col-span-8 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Feedback Messages */}
          {(loaderError || actionData?.error) && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-sm font-medium animate-in slide-in-from-top duration-300">
              {actionData?.error ?? loaderError}
            </div>
          )}

          {actionData?.success && !actionData?.error && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm font-medium animate-in slide-in-from-top duration-300">
              Operación realizada con éxito.
            </div>
          )}

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isSubmitting
              ? "border-indigo-500 bg-indigo-500/5 cursor-not-allowed"
              : "border-slate-800 bg-slate-950/40 hover:border-indigo-500/60 hover:bg-slate-950/60"
              }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
            {isSubmitting ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-indigo-400">Subiendo archivo a AWS S3...</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-slate-900 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-800">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-200">Arrastra archivos aquí o haz clic para subir</p>
                <p className="text-xs text-slate-500 mt-1">Soporta imágenes, videos, audios y documentos</p>
              </>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-200">Mis Archivos</h2>
            <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              {["all", "image", "video", "audio", "other"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${filterType === type
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/15"
                    : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  {type === "all" ? "Todos" : type === "image" ? "Imágenes" : type === "video" ? "Videos" : type === "audio" ? "Audios" : "Otros"}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout of Media Files */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredMedia.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500">
                <svg className="w-12 h-12 mx-auto text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm font-medium">No se encontraron archivos en esta categoría.</p>
              </div>
            ) : (
              filteredMedia.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`group relative rounded-2xl overflow-hidden bg-slate-950/40 border transition-all cursor-pointer ${selectedMedia?.id === item.id
                    ? "border-indigo-500 shadow-lg shadow-indigo-500/5"
                    : "border-slate-800 hover:border-slate-700 hover:bg-slate-950/60"
                    }`}
                >
                  {/* Thumbnail / File representation */}
                  <div className="aspect-square w-full bg-slate-950 flex items-center justify-center relative overflow-hidden border-b border-slate-900/50">
                    {item.mimeType.startsWith("image/") ? (
                      <img
                        src={item.url}
                        alt={item.originalName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="group-hover:scale-110 transition-transform duration-500">
                        {getFileIcon(item.mimeType)}
                      </div>
                    )}
                    {/* Badge representing format */}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                      {item.mimeType.split("/")[1] || "File"}
                    </span>
                  </div>

                  {/* Details summary */}
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-200 truncate" title={item.originalName}>
                      {item.originalName}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatBytes(item.size)}
                    </p>
                  </div>

                  {/* Actions overlay on hover */}
                  <button
                    onClick={(e) => handleDeleteMedia(item.id, item.originalName, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/90 text-white hover:bg-rose-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Eliminar"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Right Section: Metadata Details Panel */}
        <aside className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/30 flex flex-col overflow-y-auto">
          {selectedMedia ? (
            <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-200">Detalles del Archivo</h2>
                  <p className="text-xs text-slate-500">Metadatos del recurso en S3</p>
                </div>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Preview Zone */}
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 p-2 flex items-center justify-center">
                {selectedMedia.mimeType.startsWith("image/") ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.originalName}
                    className="w-full max-h-60 object-contain rounded-xl"
                  />
                ) : selectedMedia.mimeType.startsWith("video/") ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="w-full rounded-xl max-h-60"
                  />
                ) : selectedMedia.mimeType.startsWith("audio/") ? (
                  <div className="w-full p-4 flex flex-col items-center space-y-3 bg-slate-900/40 rounded-xl">
                    {getFileIcon(selectedMedia.mimeType)}
                    <audio
                      src={selectedMedia.url}
                      controls
                      className="w-full mt-2"
                    />
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center space-y-2">
                    {getFileIcon(selectedMedia.mimeType)}
                    <p className="text-xs font-semibold text-slate-400">Previsualización no disponible</p>
                  </div>
                )}
              </div>

              {/* Metadata Details List */}
              <div className="space-y-4">

                {/* ID */}
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID del Recurso</span>
                  <span className="text-xs font-mono text-slate-300 break-all select-all">{selectedMedia.id}</span>
                </div>

                {/* Original Name */}
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre Original</span>
                  <span className="text-xs font-semibold text-slate-200 break-all">{selectedMedia.originalName}</span>
                </div>

                {/* MIME Type & Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo MIME</span>
                    <span className="text-xs font-semibold text-slate-200">{selectedMedia.mimeType}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tamaño</span>
                    <span className="text-xs font-semibold text-slate-200">{formatBytes(selectedMedia.size)}</span>
                  </div>
                </div>

                {/* Bucket name */}
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bucket AWS S3</span>
                  <span className="text-xs font-semibold text-slate-300">{selectedMedia.bucket}</span>
                </div>

                {/* S3 Key */}
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clave S3 (S3 Key)</span>
                  <span className="text-xs font-mono text-slate-300 break-all">{selectedMedia.s3Key}</span>
                </div>

                {/* URL */}
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 relative group">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">URL Pública</span>
                  <span className="text-xs font-mono text-indigo-400 break-all block mr-8">{selectedMedia.url}</span>
                  <button
                    onClick={() => handleCopyUrl(selectedMedia.url)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    title="Copiar URL"
                  >
                    {copiedId === selectedMedia.url ? (
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Uploaded At */}
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha de Carga</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {new Date(selectedMedia.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <a
                  href={selectedMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold transition text-xs border border-slate-700/50 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Abrir en S3
                </a>
                <button
                  onClick={(e) => handleDeleteMedia(selectedMedia.id, selectedMedia.originalName, e)}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar Archivo
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 my-auto">
              <svg className="w-12 h-12 mx-auto text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">Selecciona un archivo multimedia para ver sus metadatos y previsualización detallada.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
