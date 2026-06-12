"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Phone, Lock, LogOut, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ProfileClientProps {
  initialProfile: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export default function ProfileClient({ initialProfile }: ProfileClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordSuccess("¡Contraseña actualizada con éxito!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Error al actualizar la contraseña.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.signOut();

      // Clear sessionStorage role cache
      if (typeof window !== "undefined") {
        try {
          const keys = Object.keys(sessionStorage);
          keys.forEach(key => {
            if (key.startsWith("user_role_")) {
              sessionStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.warn("Error clearing sessionStorage", e);
        }
      }

      router.refresh();
      // Use window.location.href to force a clean reload on redirect
      window.location.href = "/login";
    } catch (err) {
      console.error("Error logging out:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8 pb-16">
      {/* Profile Card */}
      <div className="relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="">
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
              Datos Personales
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Información registrada en tu cuenta.
            </p>
          </div>

          <div className="space-y-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                <User size={12} className="text-muted-foreground" />
                Nombre Completo
              </label>
              <div className="px-4 py-3 bg-muted/40 border border-border/50 rounded-input text-sm font-semibold text-foreground">
                {initialProfile.fullName || "No especificado"}
              </div>
            </div>

            {/* Correo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                <Mail size={12} className="text-muted-foreground" />
                Correo Electrónico
              </label>
              <div className="px-4 py-3 bg-muted/40 border border-border/50 rounded-input text-sm font-semibold text-foreground select-all">
                {initialProfile.email}
              </div>
            </div>

            {/* Teléfono */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                <Phone size={12} className="text-muted-foreground" />
                Número de Teléfono
              </label>
              <div className="px-4 py-3 bg-muted/40 border border-border/50 rounded-input text-sm font-semibold text-foreground">
                {initialProfile.phone || "No especificado"}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
      </div>


      {/* Logout Action */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          disabled={isLoggingOut}
          onClick={handleLogout}
          className="w-full md:w-auto md:min-w-[200px] border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 py-4 rounded-button shadow-sm"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
