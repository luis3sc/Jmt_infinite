'use client'

import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ImageIcon, Video } from 'lucide-react'

interface UploadTypeSelectorProps {
  onSelect: (type: 'photo' | 'video') => void
}

const OPTIONS = [
  {
    type: 'photo' as const,
    icon: ImageIcon,
    title: 'Foto',
    subtitle: 'JPG/PNG',
    description: 'Sube una imagen. La convertiremos en video.',
    gradient: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/30 hover:border-violet-400/60',
    iconBg: 'bg-violet-500/20 text-violet-300',
    badge: 'bg-violet-500/10 text-violet-300 border-violet-400/20',
  },
  {
    type: 'video' as const,
    icon: Video,
    title: 'Video',
    subtitle: 'MP4/MOV',
    description: 'Sube tu video. Lo optimizaremos a 7 segundos.',
    gradient: 'from-primary/20 to-blue-500/10',
    border: 'border-primary/30 hover:border-primary/60',
    iconBg: 'bg-primary/20 text-primary',
    badge: 'bg-primary/10 text-primary border-primary/20',
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 260 } },
}

export function UploadTypeSelector({ onSelect }: UploadTypeSelectorProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-2xl mx-auto py-2 md:py-4"
    >
      <motion.div variants={cardVariants} className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight leading-tight">
          ¿Qué tipo de{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 italic font-bold">
            material
          </span>{' '}
          subirás?
        </h2>
        <p className="text-muted-foreground text-[10px] sm:text-xs font-medium">
          Elige tu formato de campaña
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
        {OPTIONS.map(({ type, icon: Icon, title, subtitle, description, gradient, border, iconBg, badge }) => (
          <motion.button
            key={type}
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(type)}
            className={`group relative flex flex-col items-start gap-2.5 sm:gap-4 p-3 sm:p-5 rounded-2xl bg-gradient-to-br ${gradient} border ${border} backdrop-blur-xl text-left transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden`}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/3 rounded-2xl" />

            <div className={`p-1.5 sm:p-2.5 rounded-xl ${iconBg} w-fit`}>
              <Icon size={20} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">{title}</h3>
                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${badge}`}>
                  {subtitle}
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] sm:text-xs font-medium leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
              <span>Seleccionar</span>
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
