import Link from "next/link";
import { BookOpen, ShieldCheck, RefreshCw, HelpCircle } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-brand-dark  relative">
      <div className="px-6 py-4 flex flex-col items-center gap-8">



        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold text-white/60">
          <Link
            href="/legal/terminos-y-condiciones"
            className="flex items-center gap-1.5 hover:text-primary transition-colors duration-250 cursor-pointer group"
          >
            <ShieldCheck size={14} className="text-white/30 group-hover:text-primary transition-colors" />
            <span>Términos y Condiciones</span>
          </Link>

          <Link
            href="/legal/politicas-de-cambios"
            className="flex items-center gap-1.5 hover:text-primary transition-colors duration-250 cursor-pointer group"
          >
            <RefreshCw size={14} className="text-white/30 group-hover:text-primary transition-all duration-500 group-hover:rotate-180" />
            <span>Políticas de Cambio o Devoluciones</span>
          </Link>

          <Link
            href="/legal/libro-de-reclamaciones"
            className="flex items-center gap-1.5 hover:text-primary transition-colors duration-250 cursor-pointer  px-3 py-1.5 "
          >
            <BookOpen size={14} className="text-white/40 group-hover:text-primary transition-colors" />
            <span>Libro de Reclamaciones</span>
          </Link>
        </div>


      </div>
    </footer>
  );
}
