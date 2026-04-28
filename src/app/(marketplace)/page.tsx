import Image from "next/image";
import { SearchForm } from "@/components/home/SearchForm";

export default function HomePage() {
  return (
    <main className="relative min-h-[100dvh] bg-background flex flex-col items-center justify-center overflow-hidden px-6 py-12 md:py-24">
      {/* Background decorations for depth */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] opacity-60 mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] bg-[#0e162b] rounded-full blur-[120px] opacity-40 mix-blend-screen" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] opacity-30 mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-md md:max-w-5xl mx-auto flex flex-col items-center">
        {/* Hero Text */}
        <div className="text-center mb-12 w-full space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-foreground">
            El poder de tu marca <br className="hidden md:block" />
            <span className="text-primary italic font-serif">en todo el Perú.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-[45ch] mx-auto font-medium">
            Encuentra, reserva y gestiona tus campañas en los mejores paneles digitales del país.
          </p>
        </div>

        {/* Search Component */}
        <SearchForm />
      </div>
    </main>
  );
}
