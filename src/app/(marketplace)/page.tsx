import Image from "next/image";
import { SearchForm } from "@/components/home/SearchForm";

export default function HomePage() {
  return (
    <main className="relative min-h-[100dvh] bg-background flex flex-col items-center justify-center overflow-hidden px-4 py-12 md:py-24">
      {/* Background decorations for depth */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0e162b] rounded-full blur-3xl opacity-50 mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        {/* Hero Text */}
        <div className="text-center mb-10 w-full">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-none text-foreground mb-4">
            Encuentra el panel perfecto.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[40ch] mx-auto">
            Explora nuestro inventario digital DOOH, selecciona las fechas y reserva en minutos.
          </p>
        </div>

        {/* Search Component */}
        <SearchForm />
      </div>
    </main>
  );
}
