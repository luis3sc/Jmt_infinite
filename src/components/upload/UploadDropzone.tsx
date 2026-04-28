'use client'

import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, CheckCircle, FileVideo, Video, MousePointer2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UploadDropzoneProps {
  file: File | null
  setFile: (file: File | null) => void
}

export function UploadDropzone({ file, setFile }: UploadDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const droppedFile = acceptedFiles[0]
      if (droppedFile.size > 50 * 1024 * 1024) {
        alert("El archivo excede el tamaño máximo permitido de 50MB.")
        return
      }
      setFile(droppedFile)
    }
  }, [setFile])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/webm': ['.webm'],
      'video/mpeg': ['.mpeg', '.mpg'],
      'video/x-matroska': ['.mkv'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative group w-full rounded-lg md:rounded-lg border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-6 md:p-14 text-center overflow-hidden cursor-pointer min-h-[220px] md:min-h-[300px]
          ${isDragActive
            ? 'border-primary bg-primary/10 scale-[1.01] shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)]'
            : isDragReject 
            ? 'border-destructive bg-destructive/10'
            : 'border-border bg-background/40 backdrop-blur-md hover:bg-background/60 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5'
          } 
          ${file ? 'border-primary/30 bg-primary/[0.03]' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {/* Decorative Background for Dropzone */}
        <div className={`absolute inset-0 -z-10 transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.08)_0%,transparent_70%)]" />
        </div>

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div 
              key="file-selected"
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="space-y-6 flex flex-col items-center relative z-10"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center text-primary border border-primary/20">
                  <FileVideo size={42} strokeWidth={1.5} />
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2 text-white border-4 border-card shadow-lg"
                  >
                    <CheckCircle size={18} strokeWidth={3} />
                  </motion.div>
                </div>
              </div>
              
              <div className="space-y-2 text-center px-4">
                <p className="text-xl font-black text-foreground max-w-[320px] truncate">{file.name}</p>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 py-1 px-3 rounded-lg mx-auto w-fit">
                  <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>

              <div className="mt-4 px-8 py-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full text-[10px] font-black text-foreground uppercase tracking-[0.2em] group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-xl">
                Click o Arrastra para Reemplazar
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 flex flex-col items-center relative z-10"
            >
              <div className={`w-24 h-24 rounded-lg flex items-center justify-center transition-all duration-500 ${isDragActive ? 'bg-primary text-white scale-110 shadow-2xl shadow-primary/30' : 'bg-primary/10 text-primary group-hover:scale-105 group-hover:bg-primary/20 shadow-inner'}`}>
                <UploadCloud size={48} strokeWidth={1.5} />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  <span className="text-primary italic">Sube</span> tu material publicitario
                </h3>
                <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-2 mt-2 opacity-80">
                  <Video size={16} /> 720x1280 • MP4 • Máx 50MB
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-lg bg-card/50 backdrop-blur-sm border border-border shadow-sm group-hover:bg-muted group-hover:border-primary/20 text-xs font-bold uppercase tracking-widest transition-all duration-300">
                <MousePointer2 size={16} className="text-primary" />
                <span className="text-muted-foreground group-hover:text-foreground">Seleccionar Archivo</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
