'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'
import { ImageIcon, Upload, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
        alert('La imagen supera el límite de 20 MB.')
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
    maxSize: 20 * 1024 * 1024,
    maxFiles: 1,
  })

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setSelectedFile(null)
  }

  return (
    <div className="space-y-3">
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
              className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 md:p-14 cursor-pointer transition-all duration-300 select-none
                ${isDragActive
                  ? 'border-violet-400/80 bg-violet-500/10 scale-[1.01]'
                  : 'border-border/60 bg-background/30 hover:border-violet-400/40 hover:bg-violet-500/5'
                }`}
            >
              <input {...getInputProps()} />
              <div className={`p-4 rounded-2xl transition-colors ${isDragActive ? 'bg-violet-500/20' : 'bg-muted/40'}`}>
                <ImageIcon size={36} className={isDragActive ? 'text-violet-400' : 'text-muted-foreground'} strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-sm">
                  {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra tu imagen aquí'}
                </p>
                <p className="text-muted-foreground text-xs">
                  O haz click para seleccionar · JPG o PNG · Máx. 20 MB
                </p>
              </div>
              {!isDragActive && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/60 border border-border text-xs font-bold text-muted-foreground">
                  <Upload size={13} />
                  Seleccionar imagen
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
            className="relative rounded-2xl overflow-hidden border border-violet-400/30 bg-black aspect-video"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <ImageIcon size={14} />
                <span className="text-xs font-bold truncate max-w-[180px]">
                  {selectedFile?.name}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile() }}
                className="p-1.5 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-all"
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
