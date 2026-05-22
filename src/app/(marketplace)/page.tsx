import Image from "next/image";
import { SearchForm } from "@/components/home/SearchForm";
import { AnimatedHeroTitle } from "@/components/home/AnimatedHeroTitle";

export default function HomePage() {
  return (
    <main className="relative min-h-[100dvh] bg-brand-dark flex flex-col items-center justify-center overflow-hidden px-6 py-12 md:py-24">
      {/* Background decorations for depth */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[120px] opacity-40" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md md:max-w-5xl mx-auto flex flex-col items-center">
        {/* Hero Text */}
        <div className="text-center mb-12 w-full space-y-6">
          <AnimatedHeroTitle />

        </div>

        {/* Search Component */}
        <SearchForm />
      </div>
    </main>
  );
}
