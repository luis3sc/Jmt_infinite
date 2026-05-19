"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Palette,
  Sliders,
  Type,
  Layout,
  MessageSquare,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  Eye,
  EyeOff,
  Settings,
  X,
  RefreshCw,
  Copy,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Info,
  UploadCloud,
  Image as ImageIcon,
  Crop,
  Expand
} from "lucide-react";

// Import custom upload/media components
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { FrameSelector, AVAILABLE_FRAMES, type Frame } from "@/components/upload/FrameSelector";
import { PhotoCropEditor } from "@/components/upload/PhotoCropEditor";
import { composeImage } from "@/lib/imageComposer";

// Import custom atomic UI components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog, DialogVariant } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/Card";

// Datasets for Fluid Spacing & Typography Showcase
const spacingScale = [
  { token: "fluid-3xs", min: "0.25rem (4px)", max: "0.375rem (6px)", pref: "0.4vw", css: "clamp(0.25rem, 0.4vw, 0.375rem)", minRem: 0.25, maxRem: 0.375, prefVw: 0.4, baseRem: 0, desc: "Micro-márgenes y gaps densos de detalle" },
  { token: "fluid-2xs", min: "0.375rem (6px)", max: "0.5rem (8px)", pref: "0.6vw", css: "clamp(0.375rem, 0.6vw, 0.5rem)", minRem: 0.375, maxRem: 0.5, prefVw: 0.6, baseRem: 0, desc: "Separación fina entre etiquetas y textos pequeños" },
  { token: "fluid-xs", min: "0.5rem (8px)", max: "0.75rem (12px)", pref: "0.8vw", css: "clamp(0.5rem, 0.8vw, 0.75rem)", minRem: 0.5, maxRem: 0.75, prefVw: 0.8, baseRem: 0, desc: "Gaps en formularios y cards estrechas" },
  { token: "fluid-sm", min: "0.75rem (12px)", max: "1rem (16px)", pref: "1.2vw", css: "clamp(0.75rem, 1.2vw, 1rem)", minRem: 0.75, maxRem: 1, prefVw: 1.2, baseRem: 0, desc: "Paddings internos y márgenes secundarios" },
  { token: "fluid-md", min: "1rem (16px)", max: "1.5rem (24px)", pref: "1.8vw", css: "clamp(1rem, 1.8vw, 1.5rem)", minRem: 1, maxRem: 1.5, prefVw: 1.8, baseRem: 0, desc: "Espaciado estándar entre secciones de tarjetas" },
  { token: "fluid-lg", min: "1.5rem (24px)", max: "2.25rem (36px)", pref: "2.5vw", css: "clamp(1.5rem, 2.5vw, 2.25rem)", minRem: 1.5, maxRem: 2.25, prefVw: 2.5, baseRem: 0, desc: "Márgenes de secciones principales y hero containers" },
  { token: "fluid-xl", min: "2rem (32px)", max: "3rem (48px)", pref: "3.5vw", css: "clamp(2rem, 3.5vw, 3rem)", minRem: 2, maxRem: 3, prefVw: 3.5, baseRem: 0, desc: "Paddings externos de páginas y separadores amplios" },
  { token: "fluid-2xl", min: "3rem (48px)", max: "4.5rem (72px)", pref: "5vw", css: "clamp(3rem, 5vw, 4.5rem)", minRem: 3, maxRem: 4.5, prefVw: 5, baseRem: 0, desc: "Gaps monumentales en layouts tipo grid ultra-widescreen" },
  { token: "fluid-3xl", min: "4.5rem (72px)", max: "6.75rem (108px)", pref: "8vw", css: "clamp(4.5rem, 8vw, 6.75rem)", minRem: 4.5, maxRem: 6.75, prefVw: 8, baseRem: 0, desc: "Espaciados hero masivos al principio/fin de páginas" }
];

const typographyScale = [
  { token: "text-fluid-2xs", min: "0.6rem (9.6px)", max: "0.72rem (11.5px)", css: "clamp(0.6rem, 0.3vw + 0.55rem, 0.72rem)", minRem: 0.6, maxRem: 0.72, prefVw: 0.3, baseRem: 0.55, desc: "Metadatos y leyendas ultra compactas" },
  { token: "text-fluid-xs", min: "0.7rem (11.2px)", max: "0.8rem (12.8px)", css: "clamp(0.7rem, 0.4vw + 0.6rem, 0.8rem)", minRem: 0.7, maxRem: 0.8, prefVw: 0.4, baseRem: 0.6, desc: "Descripciones cortas y labels de formularios" },
  { token: "text-fluid-sm", min: "0.8rem (12.8px)", max: "0.95rem (15.2px)", css: "clamp(0.8rem, 0.5vw + 0.65rem, 0.95rem)", minRem: 0.8, maxRem: 0.95, prefVw: 0.5, baseRem: 0.65, desc: "Subtítulos compactos y texto de botones" },
  { token: "text-fluid-base", min: "0.95rem (15.2px)", max: "1.1rem (17.6px)", css: "clamp(0.95rem, 0.6vw + 0.8rem, 1.1rem)", minRem: 0.95, maxRem: 1.1, prefVw: 0.6, baseRem: 0.8, desc: "Texto de párrafo estándar (Body)" },
  { token: "text-fluid-lg", min: "1.1rem (17.6px)", max: "1.3rem (20.8px)", css: "clamp(1.1rem, 0.8vw + 0.9rem, 1.3rem)", minRem: 1.1, maxRem: 1.3, prefVw: 0.8, baseRem: 0.9, desc: "Destacados y subtítulos secundarios" },
  { token: "text-fluid-xl", min: "1.3rem (20.8px)", max: "1.6rem (25.6px)", css: "clamp(1.3rem, 1.2vw + 1rem, 1.6rem)", minRem: 1.3, maxRem: 1.6, prefVw: 1.2, baseRem: 1, desc: "Títulos de tarjetas e introducciones" },
  { token: "text-fluid-2xl", min: "1.6rem (25.6px)", max: "2.1rem (33.6px)", css: "clamp(1.6rem, 1.8vw + 1.1rem, 2.1rem)", minRem: 1.6, maxRem: 2.1, prefVw: 1.8, baseRem: 1.1, desc: "Títulos medianos y secciones destacadas" },
  { token: "text-fluid-3xl", min: "2.1rem (33.6px)", max: "2.8rem (44.8px)", css: "clamp(2.1rem, 2.5vw + 1.3rem, 2.8rem)", minRem: 2.1, maxRem: 2.8, prefVw: 2.5, baseRem: 1.3, desc: "Encabezados principales de tarjetas y popups" },
  { token: "text-fluid-4xl", min: "2.8rem (44.8px)", max: "3.8rem (60.8px)", css: "clamp(2.8rem, 3.5vw + 1.6rem, 3.8rem)", minRem: 2.8, maxRem: 3.8, prefVw: 3.5, baseRem: 1.6, desc: "Títulos de banners principales (H1)" },
  { token: "text-fluid-5xl", min: "3.8rem (60.8px)", max: "5.2rem (83.2px)", css: "clamp(3.8rem, 4.5vw + 2rem, 5.2rem)", minRem: 3.8, maxRem: 5.2, prefVw: 4.5, baseRem: 2, desc: "Encabezados hero monumentales o estadísticas masivas" }
];

export default function DesignSystemPage() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = React.useState<string>("all");

  // State controls for interactive Button playground
  const [btnLoading, setBtnLoading] = React.useState<boolean>(false);
  const [btnDisabled, setBtnDisabled] = React.useState<boolean>(false);

  // State controls for interactive Form components
  const [inputValue, setInputValue] = React.useState<string>("");
  const [inputError, setInputError] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [checkboxChecked, setCheckboxChecked] = React.useState<boolean>(false);
  const [selectValue, setSelectValue] = React.useState<string>("lima");

  // State controls for Dialog variants
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [dialogVariant, setDialogVariant] = React.useState<DialogVariant>("default");
  const [dialogTitle, setDialogTitle] = React.useState<string>("Visualización de Panel");
  const [dialogDesc, setDialogDesc] = React.useState<string>("Información técnica y reservación");

  // State for simulated Skeleton loading sequence
  const [skeletonLoading, setSkeletonLoading] = React.useState<boolean>(false);
  const [skeletonData, setSkeletonData] = React.useState<any | null>({
    name: "Panel Digital - JMT Vía Expresa",
    location: "Av. Paseo de la República Cdra. 35, San Isidro",
    views: "1.2M vistas / mes",
    price: "$2,400 / mes",
    status: "Disponible"
  });

  // State for token copy feedbacks
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  // State controls for Upload and Custom Media components
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoStep, setPhotoStep] = React.useState<'crop' | 'frame' | 'result'>('crop');
  const [photoObjectUrl, setPhotoObjectUrl] = React.useState<string>("/assets/images/auth-bg.png");
  const [selectedFrame, setSelectedFrame] = React.useState<Frame>(AVAILABLE_FRAMES[0]);
  const [croppedArea, setCroppedArea] = React.useState<any | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = React.useState<string | null>(null);
  const [composedPreviewUrl, setComposedPreviewUrl] = React.useState<string | null>(null);
  const [isComposing, setIsComposing] = React.useState<boolean>(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);

  // Spacing & Typography Fluid Showcase states
  const [simulatedWidth, setSimulatedWidth] = React.useState<number>(800);
  const [fluidText, setFluidText] = React.useState<string>("JMT Media - Publicidad de Alto Impacto");

  // Helper to compute HSL fluid clamps in local JS for simulator sandbox
  const computeFluidPx = (minRem: number, maxRem: number, preferredVw: number, baseRem: number, width: number) => {
    const minPx = minRem * 16;
    const maxPx = maxRem * 16;
    const prefPx = (preferredVw * (width / 100)) + (baseRem * 16);
    const result = Math.max(minPx, Math.min(prefPx, maxPx));
    return `${result.toFixed(1)}px`;
  };

  // Categories definition
  const categories = [
    { id: "all", label: "Ver Todo", icon: Layout },
    { id: "brand", label: "Colores y Marca", icon: Palette },
    { id: "buttons", label: "Botones", icon: Sparkles },
    { id: "forms", label: "Formularios", icon: Sliders },
    { id: "cards", label: "Tarjetas y Badges", icon: Type },
    { id: "overlays", label: "Modales (Dialog)", icon: MessageSquare },
    { id: "uploads", label: "Carga & Media", icon: UploadCloud },
    { id: "fluid", label: "Espaciado & Tipografía Fluida", icon: Expand },
  ];

  // Helper to copy text to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  // Helper to open dialog with specific variant
  const triggerDialog = (variant: DialogVariant, title: string, desc: string) => {
    setDialogVariant(variant);
    setDialogTitle(title);
    setDialogDesc(desc);
    setDialogOpen(true);
  };

  // Trigger simulated loader sequence
  const triggerSkeletonLoading = () => {
    setSkeletonLoading(true);
    setTimeout(() => {
      setSkeletonLoading(false);
    }, 2000);
  };

  // Colors tokens dataset
  const colorTokens = [
    { name: "Primary (JMT Blue)", class: "bg-primary", textClass: "text-white", value: "hsl(221.2, 83.2%, 53.3%)", variable: "--primary", hex: "#1D4ED8" },
    { name: "Brand Dark", class: "bg-brand-dark", textClass: "text-white", value: "hsl(224, 50%, 11%)", variable: "--brand-dark", hex: "#0E162B" },
    { name: "Brand Blue", class: "bg-brand-blue", textClass: "text-white", value: "hsl(223, 38%, 17%)", variable: "--brand-blue", hex: "#1A233A" },
    { name: "Card Background", class: "bg-card border border-border", textClass: "text-foreground", value: "hsl(0, 0%, 97.5%)", variable: "--card", hex: "#F9F9F9" },
    { name: "Muted Elements", class: "bg-muted", textClass: "text-muted-foreground", value: "hsl(0, 0%, 94%)", variable: "--muted", hex: "#F0F0F0" },
    { name: "Foreground Text", class: "bg-foreground", textClass: "text-background", value: "hsl(0, 0%, 10%)", variable: "--foreground", hex: "#1A1A1A" },
  ];

  return (
    <main className="relative min-h-screen bg-background text-foreground pb-fluid-xl pt-fluid-lg px-fluid-sm select-none max-w-7xl mx-auto overflow-hidden">
      {/* Decorative gradient light overlays */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[-15%] w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 space-y-fluid-lg">
        {/* Banner/Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/40 pb-fluid-md space-y-fluid-xs md:space-y-0">
          <div className="space-y-fluid-3xs">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-fluid-2xs font-bold tracking-wider uppercase">
              <Sparkles className="h-3 w-3" />
              <span>JMT Design System v1.1</span>
            </div>
            <h1 className="text-fluid-4xl font-black tracking-tight leading-[1.1]">
              Laboratorio de <span className="text-primary italic font-serif">Componentes</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium text-fluid-base">
              Explora, prueba e interactúa con el catálogo de componentes atómicos y moléculas personalizadas de la plataforma. Diseñados para una portabilidad total e implementaciones visualmente premium.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-sm text-xs font-semibold"
              onClick={() => handleCopy("src/components/ui/")}
            >
              <Copy className="mr-2 h-3 w-3" />
              Copiar Ruta UI
            </Button>
            <Button
              variant="default"
              size="sm"
              className="rounded-full shadow-md text-xs font-semibold"
              onClick={() => triggerDialog("default", "Cómo importar", "Sigue estos sencillos pasos para usar componentes UI en otros proyectos.")}
            >
              Guía de Reuso
            </Button>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center overflow-x-auto no-scrollbar pb-3 border-b border-border/20 space-x-2 sticky top-[72px] bg-background/80 backdrop-blur-md z-30 py-2 -mx-4 px-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-250 cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.03]"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-border/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* --- SECTION: BRANDING & COLORS --- */}
        {(activeTab === "all" || activeTab === "brand") && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Identidad Visual & Paleta HSL</h2>
                <p className="text-xs text-muted-foreground">Colores globales e interactivos declarados en globals.css.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {colorTokens.map((token) => (
                <Card key={token.variable} className="hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className={`h-24 ${token.class} flex items-end p-4 relative`}>
                    <button
                      onClick={() => handleCopy(token.value)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/10"
                      title="Copiar HSL"
                    >
                      {copiedToken === token.value ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <span className={`text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded backdrop-blur-md border ${
                      token.textClass === "text-white" ? "bg-black/25 border-white/10 text-white" : "bg-white/40 border-black/10 text-foreground"
                    }`}>
                      {token.hex}
                    </span>
                  </div>
                  <CardHeader className="p-4 space-y-1">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      {token.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono select-all font-medium text-muted-foreground flex items-center justify-between">
                      <span>{token.variable}</span>
                      <span className="text-[10px] text-primary hover:underline cursor-pointer" onClick={() => handleCopy(token.value)}>
                        {copiedToken === token.value ? "¡Copiado!" : "Copiar HSL"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* --- SECTION: BUTTONS --- */}
        {(activeTab === "all" || activeTab === "buttons") && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Botón Atómico (Button)</h2>
                <p className="text-xs text-muted-foreground">Componente interactivo con estados de micro-animación en hover/tap.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls panel */}
              <Card className="lg:col-span-1 border border-border/60">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-base font-bold">Laboratorio de Estados</CardTitle>
                  <CardDescription className="text-xs">Manipula los interruptores para testear los estados del botón en tiempo real.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Carga Activa (isLoading)</span>
                    <Checkbox
                      checked={btnLoading}
                      onChange={(e) => setBtnLoading(e.target.checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Deshabilitar Botón (disabled)</span>
                    <Checkbox
                      checked={btnDisabled}
                      onChange={(e) => setBtnDisabled(e.target.checked)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 p-4 justify-between text-[11px] text-muted-foreground border-t">
                  <span>Animado con Framer Motion</span>
                  <span className="font-mono text-primary">src/components/ui/Button.tsx</span>
                </CardFooter>
              </Card>

              {/* Showcase variants grid */}
              <Card className="lg:col-span-2 p-6 space-y-8">
                {/* Variants row */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Variantes de Estilo</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default" isLoading={btnLoading} disabled={btnDisabled}>Default</Button>
                    <Button variant="secondary" isLoading={btnLoading} disabled={btnDisabled}>Secondary</Button>
                    <Button variant="outline" isLoading={btnLoading} disabled={btnDisabled}>Outline</Button>
                    <Button variant="destructive" isLoading={btnLoading} disabled={btnDisabled}>Destructive</Button>
                    <Button variant="ghost" isLoading={btnLoading} disabled={btnDisabled}>Ghost</Button>
                    <Button variant="link" isLoading={btnLoading} disabled={btnDisabled}>Link</Button>
                  </div>
                </div>

                {/* Sizes row */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Escalas de Tamaño</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="default" size="sm" isLoading={btnLoading} disabled={btnDisabled}>Pequeño (sm)</Button>
                    <Button variant="default" size="default" isLoading={btnLoading} disabled={btnDisabled}>Medio (default)</Button>
                    <Button variant="default" size="lg" isLoading={btnLoading} disabled={btnDisabled}>Grande (lg)</Button>
                    <Button variant="outline" size="icon" isLoading={btnLoading} disabled={btnDisabled} className="rounded-full">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Micro-interactions */}
                <div className="bg-muted/40 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                  <span className="text-xs font-medium text-muted-foreground">¿Quieres probar la animación elástica el clic?</span>
                  <Button variant="default" className="rounded-full shadow-lg shadow-primary/20 bg-primary w-full md:w-auto" size="sm">
                    Pulsar para probar <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            </div>
          </motion.section>
        )}

        {/* --- SECTION: FORM INPUTS --- */}
        {(activeTab === "all" || activeTab === "forms") && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Formularios & Campos de Entrada</h2>
                <p className="text-xs text-muted-foreground">Controles estandarizados con variantes de focus, deshabilitados y error.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Text fields card */}
              <Card className="p-6 space-y-6">
                <h3 className="text-base font-bold flex items-center justify-between border-b pb-3 border-border/40">
                  <span>Campos de Texto e Inputs</span>
                  <span className="text-[11px] font-mono text-muted-foreground">Input.tsx / Textarea.tsx</span>
                </h3>

                <div className="space-y-4">
                  {/* Default Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Input Estándar</label>
                    <Input
                      placeholder="Escribe algo aquí..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    {inputValue && (
                      <p className="text-[11px] text-primary font-medium flex items-center">
                        <CheckCircle className="mr-1 h-3 w-3" /> Valor reactivo: <strong className="ml-1 text-foreground">{inputValue}</strong>
                      </p>
                    )}
                  </div>

                  {/* Password Input with interactive button inside */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Input con Icono Interno</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña del gestor"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error input toggleable */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Input con Error de Validación</label>
                      <button
                        onClick={() => setInputError(!inputError)}
                        className="text-[10px] text-primary font-semibold hover:underline"
                      >
                        Alternar Error
                      </button>
                    </div>
                    <Input
                      placeholder="ejemplo@jmtmedia.com.pe"
                      className={cn(inputError && "border-red-500 ring-red-500/20 focus-visible:ring-red-500")}
                    />
                    {inputError && (
                      <p className="text-[11px] text-red-500 font-semibold flex items-center">
                        <AlertTriangle className="mr-1 h-3 w-3" /> El correo ingresado no es válido.
                      </p>
                    )}
                  </div>

                  {/* Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Área de Mensaje (Textarea)</label>
                    <Textarea placeholder="Indica detalles de la campaña publicitaria..." />
                  </div>
                </div>
              </Card>

              {/* Selection and Toggle controls card */}
              <Card className="p-6 space-y-6">
                <h3 className="text-base font-bold flex items-center justify-between border-b pb-3 border-border/40">
                  <span>Selección y Selectores</span>
                  <span className="text-[11px] font-mono text-muted-foreground">Select.tsx / Checkbox.tsx</span>
                </h3>

                <div className="space-y-6">
                  {/* Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Menú Desplegable (Select)</label>
                    <Select
                      value={selectValue}
                      onChange={(e) => setSelectValue(e.target.value)}
                    >
                      <option value="lima">Lima Metropolitana</option>
                      <option value="arequipa">Arequipa</option>
                      <option value="trujillo">Trujillo</option>
                      <option value="cusco">Cusco</option>
                    </Select>
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Ciudad seleccionada: <strong className="text-primary capitalize">{selectValue}</strong>
                    </p>
                  </div>

                  {/* Custom animated Checkbox */}
                  <div className="space-y-3 bg-muted/30 rounded-xl p-4 border">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-wider block">Checkbox Molecule</label>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms-check"
                        checked={checkboxChecked}
                        onChange={(e) => setCheckboxChecked(e.target.checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="terms-check"
                          className="text-xs font-bold cursor-pointer select-none text-foreground"
                        >
                          Acepto recibir cotizaciones personalizadas
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          Se te enviará un PDF consolidado de paneles digitales a tu dirección.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border/40 pt-3 flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Estado del Checkbox:</span>
                      <Badge variant={checkboxChecked ? "default" : "secondary"} className="rounded-md font-bold">
                        {checkboxChecked ? "ACTIVADO" : "DESACTIVADO"}
                      </Badge>
                    </div>
                  </div>

                  {/* Disabled inputs showcase */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Controles Deshabilitados</label>
                    <div className="flex space-x-3 items-center">
                      <Input placeholder="Bloqueado" disabled className="w-1/2" />
                      <Select disabled className="w-1/2">
                        <option>No disponible</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>
        )}

        {/* --- SECTION: CARDS & BADGES --- */}
        {(activeTab === "all" || activeTab === "cards") && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Type className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Tarjetas, Skeletons & Badges</h2>
                <p className="text-xs text-muted-foreground">Layouts modulares y elementos de etiquetado/carga.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Badges and tags showcase */}
              <Card className="lg:col-span-1 p-6 space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold border-b pb-3 border-border/40 flex items-center justify-between">
                    <span>Etiquetas (Badges)</span>
                    <span className="text-[11px] font-mono text-muted-foreground">Badge.tsx</span>
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="default">Primary Badge</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>
                <div className="bg-muted/40 p-4 rounded-xl space-y-2 border">
                  <h5 className="text-[11px] font-black uppercase text-muted-foreground">Uso Técnico</h5>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Los Badges se utilizan típicamente para estados de paneles (Disponible, Ocupado), tipos de paneles (Led, Impreso) y formatos comerciales.
                  </p>
                </div>
              </Card>

              {/* Skeletons simulated loader */}
              <Card className="lg:col-span-2 p-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-3 border-border/40">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold">Animación de Carga (Skeletons)</h3>
                    <p className="text-[11px] text-muted-foreground">Simula una petición de API para ver el Shimmer del esqueleto.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full shadow-sm text-xs font-bold"
                    onClick={triggerSkeletonLoading}
                    disabled={skeletonLoading}
                  >
                    <RefreshCw className={cn("mr-2 h-3.5 w-3.5", skeletonLoading && "animate-spin")} />
                    Simular Carga
                  </Button>
                </div>

                {skeletonLoading ? (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                    </div>
                    <div className="space-y-2 border-t pt-4">
                      <Skeleton className="h-4 w-full animate-pulse" />
                      <Skeleton className="h-4 w-[85%] animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg">
                        JMT
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{skeletonData.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                          {skeletonData.location}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-border/40 pt-4 flex flex-wrap gap-4 text-xs font-bold justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Impacto:</span>
                        <span className="text-foreground">{skeletonData.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Costo Comercial:</span>
                        <span className="text-primary">{skeletonData.price}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </motion.section>
        )}

        {/* --- SECTION: DIALOG / MODALS --- */}
        {(activeTab === "all" || activeTab === "overlays") && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Capas Superpuestas & Modales (Dialog)</h2>
                <p className="text-xs text-muted-foreground">Nuestra molécula unificada para overlays. Animaciones integradas, Esc, Click outside y Scroll lock.</p>
              </div>
            </div>

            <Card className="overflow-hidden border border-border/60">
              <div className="p-6 md:p-8 bg-muted/15 flex flex-col md:flex-row md:items-center justify-between border-b space-y-4 md:space-y-0">
                <div className="space-y-2">
                  <Badge variant="default" className="rounded-md font-bold uppercase tracking-wider text-[9px] bg-indigo-600 text-white">
                    Molécula Centralizada
                  </Badge>
                  <h3 className="text-lg font-black leading-none">Laboratorio de Modal Dialog</h3>
                  <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                    Soporta 3 layouts predefinidos adaptándose dinámicamente de cajones inferiores (bottom-sheets) para móviles a modales modulares en escritorios.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100 flex items-center">
                  <Info className="mr-1.5 h-3.5 w-3.5" />
                  No bloquea layouts manuales repetitivos
                </div>
              </div>

              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Variant 1: Default */}
                <div className="border border-border/50 rounded-xl p-4 bg-card/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <h4 className="font-bold text-sm">Default (Modal Estándar)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      El modal clásico flotante. Tamaño medio acotado, bordes redondeados y centrado absoluto. Ideal para confirmaciones y pequeñas alertas.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold"
                    onClick={() => triggerDialog("default", "Confirmación de Compra", "Paso intermedio para validar tus créditos de anunciante.")}
                  >
                    Probar Default Modal
                  </Button>
                </div>

                {/* Variant 2: Bottom Sheet */}
                <div className="border border-border/50 rounded-xl p-4 bg-card/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center font-bold text-xs">
                      02
                    </div>
                    <h4 className="font-bold text-sm">Bottom Sheet (Cajón Móvil)</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Se desliza desde abajo cubriendo el 85% de la pantalla en móviles, y se comporta como modal centrado en desktop. **Ideal para checkouts y formularios extensos**.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold"
                    onClick={() => triggerDialog("bottom-sheet", "Elige tu método de pago", "Paso final del checkout de reserva de panel publicitario.")}
                  >
                    Probar Bottom Sheet
                  </Button>
                </div>

                {/* Variant 3: Fullscreen Mobile */}
                <div className="border border-border/50 rounded-xl p-4 bg-card/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                      03
                    </div>
                    <h4 className="font-bold text-sm">Fullscreen Mobile</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ocupa el 100% de la pantalla del móvil con transiciones spring rápidas, y el 90% en desktop. Especial para visualizaciones a pantalla completa e imágenes.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold"
                    onClick={() => triggerDialog("fullscreen-mobile", "Detalle de Ubicación del Panel", "Ficha técnica completa y galería fotográfica de alta resolución.")}
                  >
                    Probar Fullscreen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* --- SECTION: UPLOAD & CUSTOM MEDIA --- */}
        {(activeTab === "all" || activeTab === "uploads") && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Componentes de Carga & Media</h2>
                <p className="text-xs text-muted-foreground">Flujos integrados de carga de archivos, recorte de imágenes en tiempo real y composición de marcos mediante Canvas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Composer Studio (8 cols) */}
              <Card className="lg:col-span-8 overflow-hidden border border-border/60 flex flex-col justify-between">
                <div className="p-6 bg-muted/15 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" />
                      <span>Estudio de Composición Client-Side</span>
                    </div>
                    <h3 className="text-base font-bold">Editor y Creador de Anuncios</h3>
                    <p className="text-xs text-muted-foreground">Recorta la imagen a 16:9, aplica un marco comercial y compón el resultado final.</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-card hover:bg-muted text-foreground px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-border shadow-sm">
                      <UploadCloud className="h-3.5 w-3.5 text-primary" />
                      <span>Subir Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPhotoFile(file);
                            setPhotoObjectUrl(URL.createObjectURL(file));
                            setPhotoStep('crop');
                            setCroppedArea(null);
                            setCroppedPreviewUrl(null);
                            setComposedPreviewUrl(null);
                          }
                        }}
                      />
                    </label>

                    {photoObjectUrl !== "/assets/images/auth-bg.png" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoObjectUrl("/assets/images/auth-bg.png");
                          setPhotoStep('crop');
                          setCroppedArea(null);
                          setCroppedPreviewUrl(null);
                          setComposedPreviewUrl(null);
                        }}
                      >
                        Restablecer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 min-h-[360px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {/* Step 1: Crop */}
                    {photoStep === 'crop' && (
                      <motion.div
                        key="step-crop"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        <PhotoCropEditor
                          imageSrc={photoObjectUrl}
                          aspectRatio={16 / 9}
                          onCropComplete={async (area) => {
                            setCroppedArea(area);
                            try {
                              // Generar el preview del recorte
                              const previewBlob = await composeImage(photoObjectUrl, area, null, 480, 270);
                              if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
                              setCroppedPreviewUrl(URL.createObjectURL(previewBlob));
                            } catch (e) {
                              console.error("Error al generar preview", e);
                            }
                            setPhotoStep('frame');
                          }}
                        />
                      </motion.div>
                    )}

                    {/* Step 2: Frame Selection */}
                    {photoStep === 'frame' && (
                      <motion.div
                        key="step-frame"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                      >
                        <FrameSelector
                          previewSrc={croppedPreviewUrl ?? photoObjectUrl}
                          selectedFrameId={selectedFrame.id}
                          onSelectFrame={setSelectedFrame}
                        />

                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                          <button
                            onClick={() => setPhotoStep('crop')}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center space-x-1"
                          >
                            <span>← Volver a recortar</span>
                          </button>

                          <Button
                            variant="default"
                            size="sm"
                            className="rounded-full shadow-md font-bold text-xs"
                            isLoading={isComposing}
                            onClick={async () => {
                              if (!croppedArea) return;
                              setIsComposing(true);
                              try {
                                const composedBlob = await composeImage(
                                  photoObjectUrl,
                                  croppedArea,
                                  selectedFrame.src || null,
                                  1280,
                                  720
                                );
                                if (composedPreviewUrl) URL.revokeObjectURL(composedPreviewUrl);
                                setComposedPreviewUrl(URL.createObjectURL(composedBlob));
                                setPhotoStep('result');
                              } catch (e) {
                                console.error("Error al componer imagen", e);
                                alert("Error al componer la imagen final");
                              } finally {
                                setIsComposing(false);
                              }
                            }}
                          >
                            Componer Imagen Final
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Result */}
                    {photoStep === 'result' && composedPreviewUrl && (
                      <motion.div
                        key="step-result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6 text-center"
                      >
                        <div className="space-y-2">
                          <div className="inline-flex items-center space-x-1.5 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>¡Composición Exitosa!</span>
                          </div>
                          <h4 className="font-bold text-sm">Arte Comercial Consolidado</h4>
                          <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            Canvas client-side ha renderizado el recorte de alta resolución y superpuesto el marco decorativo seleccionado a 1280×720 píxeles.
                          </p>
                        </div>

                        <div className="relative max-w-md mx-auto aspect-video rounded-2xl overflow-hidden border border-border/80 bg-black shadow-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={composedPreviewUrl}
                            alt="Imagen Compuesta"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs font-bold w-full sm:w-auto"
                            onClick={() => {
                              setPhotoStep('crop');
                              setCroppedArea(null);
                              setCroppedPreviewUrl(null);
                              setComposedPreviewUrl(null);
                            }}
                          >
                            Nueva Composición
                          </Button>

                          <a
                            href={composedPreviewUrl}
                            download={`anuncio-jmt-${selectedFrame.id}.png`}
                            className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-md w-full sm:w-auto transition-colors"
                          >
                            Descargar Arte PNG
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>

              {/* Right Column: Upload Dropzone & Specs (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* UploadDropzone Card */}
                <Card className="border border-border/60">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span>Carga Estándar</span>
                      <span className="text-[10px] font-mono text-muted-foreground">UploadDropzone</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Componente atómico para arrastrar y procesar archivos (video/imágenes).</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <UploadDropzone
                      file={uploadFile}
                      setFile={setUploadFile}
                    />

                    {uploadFile && (
                      <div className="bg-muted/40 rounded-xl p-3.5 border text-xs space-y-2">
                        <div className="flex justify-between font-semibold border-b border-border/40 pb-1.5 mb-1.5">
                          <span className="text-muted-foreground">Archivo Cargado:</span>
                          <span className="text-primary truncate max-w-[120px]" title={uploadFile.name}>{uploadFile.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tamaño:</span>
                          <span className="font-bold text-foreground">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Formato MIME:</span>
                          <span className="font-mono text-foreground">{uploadFile.type || "Desconocido"}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg mt-2"
                          onClick={() => setUploadFile(null)}
                        >
                          Remover Archivo
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Specs Box */}
                <Card className="border border-border/60 bg-gradient-to-br from-brand-blue to-brand-dark text-white">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-white/10 rounded-lg">
                        <Info className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider">Especificaciones JMT</span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-blue-100">
                      Todos los anuncios deben cumplir con el aspect ratio estricto de <strong className="text-white">16:9</strong> para garantizar una correcta visualización en pantallas LED urbanas sin distorsión.
                    </p>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-[11px] border-b border-white/10 pb-1.5">
                        <span className="text-blue-200">Resolución Óptima</span>
                        <span className="font-mono font-bold">1280 × 720 px</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] border-b border-white/10 pb-1.5">
                        <span className="text-blue-200">Duración Estándar</span>
                        <span className="font-mono font-bold">7 Segundos</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-blue-200">Frecuencia de Cuadros</span>
                        <span className="font-mono font-bold">30 FPS</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.section>
        )}

        {/* --- SECTION: FLUID SPACING & TYPOGRAPHY SHOWCASE --- */}
        {(activeTab === "all" || activeTab === "fluid") && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-fluid-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Expand className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Sistema de Escalas Fluidas Dinámicas</h2>
                <p className="text-xs text-muted-foreground">Paddings, Margins y Tipografías inteligentes calculadas mediante clamp HSL sin breakpoints manuales.</p>
              </div>
            </div>

            {/* Viewport Resizer Simulator Sandbox */}
            <Card className="overflow-hidden border border-border/60">
              <div className="p-6 md:p-8 bg-muted/15 border-b space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" />
                      <span>Simulador Interactivo de Viewport</span>
                    </div>
                    <h3 className="text-base font-bold">Laboratorio de Redimensión en Tiempo Real</h3>
                    <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                      Arrastra el control deslizante para ajustar el ancho del dispositivo simulado. Observa cómo los espaciados, gaps y tamaños de letra del anuncio LED se expanden y contraen de forma fluida y continua sin cortes abruptos.
                    </p>
                  </div>

                  <div className="bg-background border border-border p-4 rounded-2xl shadow-sm space-y-2 w-full md:w-80">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">Ancho del Viewport:</span>
                      <span className="text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">{simulatedWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={320}
                      max={1440}
                      step={10}
                      value={simulatedWidth}
                      onChange={(e) => setSimulatedWidth(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase">
                      <span>Móvil (320px)</span>
                      <span>Tablet (768px)</span>
                      <span>Desktop (1440px)</span>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 bg-muted/5 flex items-center justify-center min-h-[420px] overflow-hidden relative">
                {/* Visual dotted matrix grid inside sandbox backplate */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

                {/* Simulated frame */}
                <motion.div
                  style={{ width: `${simulatedWidth}px` }}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-background border border-border/80 rounded-2xl shadow-2xl overflow-hidden relative z-10 max-w-full"
                >
                  {/* Simulated Device Top Bar */}
                  <div className="bg-muted/40 border-b border-border/60 px-4 py-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground select-none">
                    <span className="font-mono">https://jmt.com/billboard/preview</span>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                  </div>

                  {/* Simulated App Screen */}
                  <div
                    style={{
                      padding: computeFluidPx(1, 1.5, 1.8, 0, simulatedWidth), // fluid-md spacing
                      gap: computeFluidPx(1, 1.5, 1.8, 0, simulatedWidth)      // fluid-md gap
                    }}
                    className="flex flex-col"
                  >
                    {/* Simulated Header banner */}
                    <div
                      style={{
                        padding: computeFluidPx(0.75, 1, 1.2, 0, simulatedWidth), // fluid-sm padding
                        gap: computeFluidPx(0.5, 0.75, 0.8, 0, simulatedWidth),   // fluid-xs gap
                        borderRadius: "12px"
                      }}
                      className="bg-gradient-to-br from-brand-blue to-brand-dark text-white relative overflow-hidden"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                      <span
                        style={{
                          fontSize: computeFluidPx(0.6, 0.72, 0.3, 0.55, simulatedWidth) // fluid-2xs font
                        }}
                        className="font-black uppercase tracking-widest text-blue-400 block"
                      >
                        PROPUESTA COMERCIAL - JMT INFINITE
                      </span>
                      <h4
                        style={{
                          fontSize: computeFluidPx(1.3, 1.6, 1.2, 1, simulatedWidth) // fluid-xl font
                        }}
                        className="font-black tracking-tight leading-tight"
                      >
                        Pantalla Digital Premium Vía Expresa
                      </h4>
                    </div>

                    {/* Simulated Content Body */}
                    <div
                      style={{
                        gap: computeFluidPx(0.75, 1, 1.2, 0, simulatedWidth) // fluid-sm gap
                      }}
                      className="grid grid-cols-1 md:grid-cols-2"
                    >
                      {/* Image Mock */}
                      <div className="aspect-video relative bg-muted rounded-xl overflow-hidden border border-border/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/assets/images/auth-bg.png"
                          alt="Billboard preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-green-500 text-white font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider shadow">
                          Disponible
                        </div>
                      </div>

                      {/* Details Text and Stats Mock */}
                      <div
                        style={{
                          gap: computeFluidPx(0.5, 0.75, 0.8, 0, simulatedWidth) // fluid-xs gap
                        }}
                        className="flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <h5
                            style={{
                              fontSize: computeFluidPx(0.8, 0.95, 0.5, 0.65, simulatedWidth) // fluid-sm font
                            }}
                            className="font-bold text-foreground"
                          >
                            Av. Paseo de la República Cdra. 35, San Isidro
                          </h5>
                          <p
                            style={{
                              fontSize: computeFluidPx(0.7, 0.8, 0.4, 0.6, simulatedWidth) // fluid-xs font
                            }}
                            className="text-muted-foreground leading-relaxed"
                          >
                            Ubicado en el corazón financiero de Lima. Cobertura inmejorable con tráfico vehicular constante las 24 horas del día.
                          </p>
                        </div>

                        {/* Price & Action button */}
                        <div
                          style={{
                            paddingTop: computeFluidPx(0.5, 0.75, 0.8, 0, simulatedWidth) // fluid-xs spacing
                          }}
                          className="flex items-center justify-between border-t border-border/40"
                        >
                          <div>
                            <span
                              style={{
                                fontSize: computeFluidPx(0.6, 0.72, 0.3, 0.55, simulatedWidth) // fluid-2xs font
                              }}
                              className="text-muted-foreground uppercase block font-bold"
                            >
                              Inversión Estimada
                            </span>
                            <span
                              style={{
                                fontSize: computeFluidPx(1.1, 1.3, 0.8, 0.9, simulatedWidth) // fluid-lg font
                              }}
                              className="font-black text-primary"
                            >
                              $2,400 <span className="text-[10px] text-muted-foreground font-medium">/ mes</span>
                            </span>
                          </div>
                          
                          <Button
                            style={{
                              fontSize: computeFluidPx(0.7, 0.8, 0.4, 0.6, simulatedWidth), // fluid-xs font
                              padding: `${computeFluidPx(0.375, 0.5, 0.6, 0, simulatedWidth)} ${computeFluidPx(0.75, 1, 1.2, 0, simulatedWidth)}` // fluid-2xs and fluid-sm
                            }}
                            className="rounded-full shadow bg-primary text-white font-bold hover:bg-primary/90 hover:scale-[1.03] transition-all"
                          >
                            Reservar Panel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>

            {/* Technical visualizer columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spacing Scales visualizer */}
              <Card className="p-6 space-y-6">
                <h3 className="text-base font-bold flex items-center justify-between border-b pb-3 border-border/40">
                  <span>Escalas de Espaciado (Spacing System)</span>
                  <span className="text-[11px] font-mono text-muted-foreground">Paddings, Margins & Gaps</span>
                </h3>

                <div className="space-y-4">
                  {spacingScale.map((space) => (
                    <div key={space.token} className="p-3 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl border border-border/40 flex items-center justify-between gap-4">
                      <div className="space-y-1 max-w-[60%]">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-primary">{space.token}</span>
                          <button
                            onClick={() => handleCopy(space.token)}
                            className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                          >
                            {copiedToken === space.token ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-normal">{space.desc}</p>
                        <p className="text-[9px] font-mono text-indigo-600 select-all font-semibold break-all bg-indigo-50/50 p-1 rounded border border-indigo-100/40">{space.css}</p>
                      </div>

                      <div className="flex flex-col items-end space-y-1.5 shrink-0">
                        {/* Spacing bar visualizer using standard Tailwind token */}
                        <div className="h-6 bg-primary/20 rounded-md border border-primary/30 flex items-center justify-center relative overflow-hidden group w-32">
                          <div
                            style={{ width: `var(--spacing-${space.token})` }}
                            className="h-full bg-primary/80 transition-all duration-300"
                          />
                        </div>
                        <span className="text-[10px] font-mono font-black uppercase text-muted-foreground">
                          {space.min.split(" ")[0]} → {space.max.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Typography scale visualizer */}
              <Card className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-border/40 gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold">Escala de Tipografías (Fluid Typography)</h3>
                    <p className="text-[11px] text-muted-foreground">Tamaños adaptativos desde leyendas a hero headlines.</p>
                  </div>
                  <Input
                    placeholder="Escribe para probar..."
                    value={fluidText}
                    onChange={(e) => setFluidText(e.target.value)}
                    className="max-w-[200px] h-8 text-xs rounded-lg"
                  />
                </div>

                <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1 no-scrollbar">
                  {typographyScale.map((font) => (
                    <div key={font.token} className="p-4 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl border border-border/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-primary">{font.token}</span>
                          <button
                            onClick={() => handleCopy(font.token)}
                            className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                          >
                            {copiedToken === font.token ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          {font.min.split(" ")[0]} → {font.max.split(" ")[0]}
                        </span>
                      </div>

                      {/* Display live typography preview using Tailwind CSS fluid font sizes */}
                      <p className={cn("font-bold text-foreground tracking-tight leading-tight py-1 transition-all break-words", font.token)}>
                        {fluidText}
                      </p>

                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-muted-foreground">{font.desc}</span>
                        <span className="text-indigo-600 font-mono select-all bg-indigo-50/50 p-1 rounded border border-indigo-100/40">{font.css}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.section>
        )}
      </div>

      {/* --- RENDER ACTIVE LAB DIALOG --- */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogTitle}
        description={dialogDesc}
        variant={dialogVariant}
        className={cn(
          dialogVariant === "bottom-sheet" && "md:max-w-xl",
          dialogVariant === "default" && "sm:max-w-md"
        )}
      >
        <div className="p-6 space-y-6">
          {/* Sample informative header inside modal */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start space-x-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-bold text-xs text-foreground">Comportamiento Responsivo</h5>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Estás visualizando la variante <strong className="text-primary font-mono">{dialogVariant}</strong>. En pantallas de escritorio se adapta de forma fluida para preservar la ergonomía del usuario.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Ficha de Panel Digital</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold">
              <div className="border border-border/40 p-3 rounded-lg bg-muted/10 space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase">Formato</span>
                <span className="text-foreground">Pantalla Led Outdoor</span>
              </div>
              <div className="border border-border/40 p-3 rounded-lg bg-muted/10 space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase">Resolución</span>
                <span className="text-foreground">1024 x 768 píxeles</span>
              </div>
              <div className="border border-border/40 p-3 rounded-lg bg-muted/10 space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase">Iluminación</span>
                <span className="text-foreground">Smart Auto-dimming</span>
              </div>
              <div className="border border-border/40 p-3 rounded-lg bg-muted/10 space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase">Operativo</span>
                <span className="text-green-500">24 horas activado</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Comentario del Anunciante</label>
              <Textarea placeholder="Indica alguna observación opcional..." className="h-16 text-xs" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="w-full sm:w-auto text-xs rounded-full font-bold"
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setDialogOpen(false);
                alert("¡Simulación completada con éxito!");
              }}
              className="w-full sm:w-auto text-xs rounded-full font-bold shadow-md"
            >
              Confirmar Operación
            </Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
