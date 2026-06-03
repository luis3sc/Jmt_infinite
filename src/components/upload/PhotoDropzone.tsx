import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'
import { ImageIcon, MousePointer2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buttonVariants, buttonSizes } from '@/components/ui/Button'

interface PhotoDropzoneProps {
  onFile: (file: File) => void
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

export function PhotoDropzone({ onFile }: PhotoDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const code = rejectedFiles[0].errors[0]?.code
      if (code === 'file-invalid-type') {
        alert('Solo se aceptan imágenes JPG o PNG. Si tienes un video, vuelve y selecciona "Video".')
      } else if (code === 'file-too-large') {
        alert('La imagen supera el límite de 100 MB.')
      }
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    onFile(file)
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 100 * 1024 * 1024,
    maxFiles: 1,
  })

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setSelectedFile(null)
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!preview ? (
          /* Separate motion wrapper from getRootProps div to avoid Framer Motion / react-dropzone onDrag type collision */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative flex flex-col items-center justify-center gap-fluid-sm rounded-card border-2 border-dashed p-fluid-lg md:p-fluid-xl cursor-pointer transition-all duration-300 select-none",
                isDragActive
                  ? 'border-upload/80 bg-upload/10 scale-[1.01]'
                  : 'border-border/60 bg-background/30 hover:border-upload/40 hover:bg-upload/5'
              )}
            >
              <input {...getInputProps()} />
              <div className={cn(
                "p-fluid-sm rounded-card transition-colors",
                isDragActive ? 'bg-upload/20' : 'bg-muted/40'
              )}>
                <ImageIcon size={36} className={isDragActive ? 'text-upload' : 'text-muted-foreground'} strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-fluid-3xs">
                <p className="font-bold text-fluid-sm">
                  {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra tu imagen aquí'}
                </p>
                <p className="text-muted-foreground text-fluid-xs">
                  O haz click para seleccionar · JPG o PNG · Máx. 100 MB
                </p>
              </div>
              {!isDragActive && (
                <div className={cn(
                  buttonVariants.outline,
                  buttonSizes.lg,
                  "inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer group"
                )}>
                  <MousePointer2 size={14} className="text-primary" />
                  <span className="text-muted-foreground group-hover:text-foreground">Seleccionar imagen</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative rounded-card overflow-hidden border border-upload/30 bg-black aspect-video"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-fluid-xs left-fluid-xs right-fluid-xs flex items-center justify-between">
              <div className="flex items-center gap-fluid-2xs text-white">
                <ImageIcon size={14} />
                <span className="text-fluid-xs font-bold truncate max-w-[180px]">
                  {selectedFile?.name}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile() }}
                className="p-1.5 rounded-button-sm bg-black/60 text-white hover:bg-black/80 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
