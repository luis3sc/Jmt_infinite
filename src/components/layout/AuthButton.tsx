"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut, LayoutDashboard, ChevronDown, ShoppingBag, Clapperboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface AuthButtonProps {
  mode?: "desktop" | "mobile";
  initialRole?: string | null;
}

export default function AuthButton({ mode = "desktop", initialRole }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(initialRole ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isGestor = role === 'gestor' || role === 'admin';

  useEffect(() => {
    const supabase = createClient();

    const fetchRole = async (userId: string) => {
      // Only fetch role from DB if it wasn't provided by the server
      if (initialRole !== undefined) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      setRole(profile?.role ?? null);
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await fetchRole(currentUser.id);
      setIsLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) setRole(null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
    router.push("/");
  };

  if (isLoading) {
    return mode === "mobile" ? (
      <div className="w-16 h-full flex flex-col items-center justify-center gap-1">
        <div className="w-5 h-5 bg-muted animate-pulse rounded-full" />
        <div className="w-8 h-2 bg-muted animate-pulse rounded-full" />
      </div>
    ) : (
      <div className="h-9 w-24 bg-muted animate-pulse rounded-input" />
    );
  }

  if (mode === "mobile") {
    const mobileHref = !user ? "/login" : isGestor ? "/gestor" : "/dashboard/orders";
    const mobileLabel = !user ? "Ingresar" : isGestor ? "Gestión" : "Mis Pedidos";
    const MobileIcon = isGestor ? Clapperboard : User;
    return (
      <Link
        href={mobileHref}
        className="flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <MobileIcon size={20} className={user ? "text-foreground" : ""} />
        <span className="text-[10px] font-medium">{mobileLabel}</span>
      </Link>
    );
  }

  return user ? (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 md:pl-3 md:pr-4 md:h-11 bg-muted border border-border text-muted-foreground rounded-button-sm md:rounded-input transition-all hover:bg-muted/80 group cursor-pointer"
      >
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-foreground flex items-center justify-center text-background shadow-sm overflow-hidden flex-shrink-0">
          <User size={16} />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-tight opacity-70 leading-none mb-0.5">Mi Cuenta</span>
          <span className="text-xs md:text-sm font-black text-foreground truncate max-w-[80px] md:max-w-[120px] leading-none">
            {user.email?.split("@")[0]}
          </span>
        </div>
        <ChevronDown size={14} className={cn("transition-transform duration-200 opacity-50", isOpen && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-64 bg-card border border-border rounded-button-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border bg-muted/40">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Bienvenido</p>
                <p className="text-sm font-bold text-foreground truncate">{user.email}</p>
              </div>

              <div className="p-2.5 space-y-1.5">
                {isGestor ? (
                  <Link
                    href="/gestor"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 text-sm font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-input transition-all group cursor-pointer"
                  >
                    <div className="p-2 bg-amber-500/10 rounded-button-sm group-hover:bg-amber-500/20 transition-colors">
                      <Clapperboard size={18} />
                    </div>
                    Panel de Gestión
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/dashboard/orders"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-input transition-all group cursor-pointer"
                    >
                      <div className="p-2 bg-muted rounded-button-sm group-hover:bg-muted/80 group-hover:text-foreground transition-colors">
                        <ShoppingBag size={18} />
                      </div>
                      Mis Pedidos
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-input transition-all group cursor-pointer"
                    >
                      <div className="p-2 bg-muted rounded-button-sm group-hover:bg-muted/80 group-hover:text-foreground transition-colors">
                        <LayoutDashboard size={18} />
                      </div>
                      Panel de Control
                    </Link>
                  </>
                )}

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full h-auto p-0 flex items-center justify-start gap-3 px-3.5 py-3 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-input transition-all group cursor-pointer"
                >
                  <div className="p-2 bg-red-500/10 rounded-button-sm group-hover:bg-red-500/20 transition-colors">
                    <LogOut size={18} />
                  </div>
                  Cerrar Sesión
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  ) : (
    <div className="flex items-center">
      <motion.div >
        <Link
          href="/login"
          className="flex items-center gap-2 px-3.5 py-2 md:px-5 md:h-11 text-xs md:text-sm font-black text-white bg-primary hover:bg-primary/90 border-none rounded-button-sm md:rounded-input transition-all shadow-sm group cursor-pointer"
        >
          <User size={16} className="text-white" />
          <span>INGRESAR</span>
        </Link>
      </motion.div>
    </div>
  );
}
