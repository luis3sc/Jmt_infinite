import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col relative overflow-x-hidden">
      {/* Premium Light Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-slate-200/40 rounded-full blur-[160px] opacity-50" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-4xl mx-auto px-6 pt-24 pb-16">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-all duration-300 group"
          >
            <ArrowLeft
              size={16}
              className="transform group-hover:-translate-x-1 transition-transform duration-300 text-slate-400 group-hover:text-primary"
            />
            <span>Volver al Inicio</span>
          </Link>
        </div>

        {/* Legal content card container - Light Theme with subtle border and crisp shadows */}
        <div className="flex-grow bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-none text-slate-700">
            {children}
          </div>
        </div>
      </div>

      {/* Persistent Footer (kept standard to align with the rest of the application's global layout) */}
      <div className="relative z-10 border-t border-slate-200/60 bg-brand-dark">
        <Footer />
      </div>
    </div>
  );
}
