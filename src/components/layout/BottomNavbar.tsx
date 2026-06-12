"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map, FileText, ShoppingCart, ShoppingBag, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/lib/utils";

// Module-level cache to persist state synchronously across client-side page transitions
let cachedUser: any = undefined;
let cachedRole: string | null = null;
let hasInitialized = false;

export default function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(
    cachedUser !== undefined ? cachedUser : null
  );
  const [role, setRole] = useState<string | null>(
    cachedUser !== undefined ? cachedRole : null
  );
  const [isLoading, setIsLoading] = useState(!hasInitialized);

  // Cart Store states
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);

  // Exclude routes where bottom nav shouldn't show (e.g. login, signup, checkout)
  const excludedPrefixes = [
    "/login",
    "/signup",
    "/checkout",
    "/order-success",
    "/success",
    "/gestor",
    "/unauthorized"
  ];
  
  const shouldHide = excludedPrefixes.some((prefix) => pathname?.startsWith(prefix)) || pathname === "/";

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let initialized = false;

    const fetchRole = async (userId: string) => {
      if (typeof window !== "undefined") {
        try {
          const cachedRoleStr = sessionStorage.getItem(`user_role_${userId}`);
          if (cachedRoleStr !== null) {
            cachedRole = cachedRoleStr || null;
            if (isMounted) {
              setRole(cachedRoleStr || null);
            }
            return;
          }
        } catch (e) {
          console.warn("sessionStorage read failed", e);
        }
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        
        const resolvedRole = profile?.role ?? "";
        cachedRole = resolvedRole || null;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(`user_role_${userId}`, resolvedRole);
            sessionStorage.setItem("jmt_cached_role", resolvedRole);
          } catch (e) {
            console.warn("sessionStorage write failed", e);
          }
        }

        if (isMounted) {
          setRole(resolvedRole || null);
        }
      } catch (err) {
        console.warn("Error fetching user role for bottom nav:", err);
      }
    };

    const init = async () => {
      // Synchronously check sessionStorage for cached user/role first to prevent delay on mount
      if (typeof window !== "undefined" && !hasInitialized) {
        try {
          const cachedUserStr = sessionStorage.getItem("jmt_cached_user");
          const cachedRoleStr = sessionStorage.getItem("jmt_cached_role");
          if (cachedUserStr) {
            const parsedUser = JSON.parse(cachedUserStr);
            cachedUser = parsedUser;
            cachedRole = cachedRoleStr || null;
            hasInitialized = true;
            if (isMounted) {
              setUser(parsedUser);
              setRole(cachedRoleStr || null);
              setIsLoading(false);
            }
          }
        } catch (e) {
          console.warn("Error reading synchronous cache in init:", e);
        }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          cachedUser = currentUser;

          if (currentUser) {
            if (typeof window !== "undefined") {
              try {
                sessionStorage.setItem("jmt_cached_user", JSON.stringify(currentUser));
              } catch (e) {
                console.warn(e);
              }
            }

            let cachedRoleStr = null;
            if (typeof window !== "undefined") {
              try {
                cachedRoleStr = sessionStorage.getItem(`user_role_${currentUser.id}`);
              } catch (e) {
                console.warn("sessionStorage read failed", e);
              }
            }
            if (cachedRoleStr !== null) {
              cachedRole = cachedRoleStr || null;
              setRole(cachedRoleStr || null);
            } else {
              fetchRole(currentUser.id);
            }
          } else {
            cachedRole = null;
            setRole(null);
            if (typeof window !== "undefined") {
              try {
                sessionStorage.removeItem("jmt_cached_user");
                sessionStorage.removeItem("jmt_cached_role");
              } catch (e) {
                console.warn(e);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error initializing bottom nav auth:", err);
      } finally {
        if (isMounted) {
          hasInitialized = true;
          initialized = true;
          setIsLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        cachedUser = currentUser;

        if (currentUser) {
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("jmt_cached_user", JSON.stringify(currentUser));
            } catch (e) {
              console.warn(e);
            }
          }
          fetchRole(currentUser.id);
        } else {
          cachedRole = null;
          setRole(null);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("jmt_cached_user");
              sessionStorage.removeItem("jmt_cached_role");
            } catch (e) {
              console.warn(e);
            }
          }
        }

        if (initialized) {
          return;
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (shouldHide || isLoading) return null;

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const isGestor = role === "gestor" || role === "admin";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[200] bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="h-16 flex items-center justify-around px-2">
        {user ? (
          // REGISTERED USER (5 Tabs)
          <>
            {/* 1. Explorar */}
            <Link
              href="/map"
              onClick={() => setIsCartOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all",
                pathname === "/map" && !isCartOpen
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Map size={20} className={cn(pathname === "/map" && !isCartOpen && "stroke-[2.5]")} />
              <span className="text-[10px] font-semibold">Explorar</span>
            </Link>

            {/* 2. Cotizaciones */}
            <Link
              href="/dashboard/quotes"
              onClick={() => setIsCartOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all",
                pathname === "/dashboard/quotes" && !isCartOpen
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText size={20} className={cn(pathname === "/dashboard/quotes" && !isCartOpen && "stroke-[2.5]")} />
              <span className="text-[10px] font-semibold">Cotizaciones</span>
            </Link>

            {/* 3. Campañas (Cart) */}
            <button
              onClick={handleCartClick}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all relative",
                isCartOpen
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <ShoppingCart size={20} className={cn(isCartOpen && "stroke-[2.5]")} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white ring-2 ring-card animate-in scale-in">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">Campañas</span>
            </button>

            {/* 4. Mis Pedidos */}
            <Link
              href="/dashboard/orders"
              onClick={() => setIsCartOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all",
                pathname === "/dashboard/orders" && !isCartOpen
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShoppingBag size={20} className={cn(pathname === "/dashboard/orders" && !isCartOpen && "stroke-[2.5]")} />
              <span className="text-[10px] font-semibold">Mis pedidos</span>
            </Link>

            {/* 5. Mi Perfil */}
            <Link
              href={isGestor ? "/gestor" : "/dashboard"}
              onClick={() => setIsCartOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all",
                pathname === "/dashboard" && !isCartOpen
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User size={20} className={cn(pathname === "/dashboard" && !isCartOpen && "stroke-[2.5]")} />
              <span className="text-[10px] font-semibold">Mi perfil</span>
            </Link>
          </>
        ) : (
          // UNREGISTERED USER (3 Tabs: Explorar, Campañas, Ingresar)
          <>
            {/* 1. Explorar */}
            <Link
              href="/map"
              onClick={() => setIsCartOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center w-20 h-full gap-1 transition-all",
                pathname === "/map" && !isCartOpen
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Map size={20} className={cn(pathname === "/map" && !isCartOpen && "stroke-[2.5]")} />
              <span className="text-[10px] font-semibold">Explorar</span>
            </Link>

            {/* 2. Campañas (Cart) */}
            <button
              onClick={handleCartClick}
              className={cn(
                "flex flex-col items-center justify-center w-20 h-full gap-1 transition-all relative",
                isCartOpen
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <ShoppingCart size={20} className={cn(isCartOpen && "stroke-[2.5]")} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white ring-2 ring-card animate-in scale-in">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">Campañas</span>
            </button>

            {/* 3. Ingresar */}
            <Link
              href="/login"
              onClick={() => setIsCartOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center w-20 h-full gap-1 transition-all",
                pathname === "/login"
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User size={20} className={cn(pathname === "/login" && "stroke-[2.5]")} />
              <span className="text-[10px] font-semibold">Ingresar</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
