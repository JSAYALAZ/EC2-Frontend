import React from "react";
import { Link } from "react-router";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto relative z-10">
        <div className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          FacturaJS
        </div>
        <div className="flex items-center gap-8">
          <Link to="/login" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-indigo-600 transition-colors">
            Iniciar Sesión
          </Link>
          <Link to="/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer">
            Empezar Gratis
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 relative text-center">
        {/* Animated Orbs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>

        <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-bold tracking-wider uppercase mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            Nueva Factura Electrónica v2.0
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-[var(--text-primary)] leading-tight tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
            Facturación electronica <br />
            <span className="bg-gradient-to-r from-yellow-400 via-blue-600 to-red-500 bg-clip-text text-transparent">
              Ecuatoriana
            </span>
            &nbsp;para desarrolladores.
          </h1>

          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000">
            La herramienta más rápida y elegante para gestionar tus facturas electrónicas.
            Cumple con todas las normativas sin perder la cabeza.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in zoom-in duration-1000 delay-500">
            <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-2xl shadow-2xl shadow-indigo-500/40 transition-all hover:scale-110 active:scale-95 cursor-pointer">
              Únete ahora
            </Link>
            <button className="w-full sm:w-auto px-10 py-5 glass border border-[var(--border-color)] text-[var(--text-primary)] text-lg font-bold rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              Ver Demo
            </button>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="mt-24 relative animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 blur-3xl opacity-50"></div>
            <div className="glass rounded-[2rem] border border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden scale-95 hover:scale-100 transition-transform duration-700">
              <div className="h-12 bg-white/10 border-b border-white/10 flex items-center px-6 gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-md">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="h-20 bg-white/10 rounded-2xl"></div>
                </div>
                <div className="h-64 bg-white/5 rounded-3xl border border-white/5"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-12 px-8 text-center text-[var(--text-secondary)] text-sm">
        © 2024 FacturaJS. Construido con pasión para desarrolladores y empresas.
      </footer>
    </div>
  );
}