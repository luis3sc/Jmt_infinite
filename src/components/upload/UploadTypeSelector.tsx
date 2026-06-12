'use client'

import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ImageIcon, Video } from 'lucide-react'

interface UploadTypeSelectorProps {
  onSelect: (type: 'photo' | 'video') => void
  userType?: string
}

const getOptions = (userType?: string) => {
  let photoDescription = 'Sube una imagen. La convertiremos en video.'
  let videoDescription = 'Sube tu video. Lo optimizaremos a 7 segundos.'

  if (userType === 'entrepreneur') {
    photoDescription = 'Sube la imagen publicitaria o el logo de tu negocio. Lo adaptaremos para la pantalla gigante.'
    videoDescription = 'Sube el video o spot promocional de tu negocio. Lo ajustaremos al formato ideal.'
  } else if (userType === 'influencer') {
    photoDescription = 'Sube la foto o banner de tus redes sociales. Lo adaptaremos para que se vea genial.'
    videoDescription = 'Sube tu clip o video. Lo optimizaremos para que destaque en la calle.'
  } else {
    photoDescription = 'Sube una foto con tu mensaje o saludo especial. La adaptaremos para la pantalla gigante.'
    videoDescription = 'Sube tu video. Lo optimizaremos a 7 segundos.'
  }

  return [
    {
      type: 'photo' as const,
      icon: ImageIcon,
      title: 'Foto',
      subtitle: 'JPG/PNG',
      description: photoDescription,
    },
    {
      type: 'video' as const,
      icon: Video,
      title: 'Video',
      subtitle: 'MP4/MOV',
      description: videoDescription,
    },
  ]
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 260 } },
}

export function UploadTypeSelector({ onSelect, userType }: UploadTypeSelectorProps) {
  const options = getOptions(userType)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 md:gap-6 w-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
        {options.map(({ type, icon: Icon, title, subtitle, description }) => (
          <motion.button
            key={type}
            variants={cardVariants}
            whileHover={{ y: -2 }}
            onClick={() => onSelect(type)}
            className="group relative flex flex-col items-start gap-2.5 sm:gap-4 p-3 sm:p-5 rounded-card bg-card border border-border hover:border-primary text-left transition-all duration-300 "
          >
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/3 rounded-card" />

            <div className="p-1.5 sm:p-2.5 rounded-input bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300 w-fit">
              <Icon size={20} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">{title}</h3>
                <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-badge border border-border/80 bg-muted/40 text-muted-foreground group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                  {subtitle}
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] sm:text-xs font-medium leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors duration-300">
              <span>Seleccionar</span>
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
