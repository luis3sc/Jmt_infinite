'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WORDS = [
  'mensaje personalizado',
  'momento especial',
  'anuncio de negocio',
  'perfil de redes'
]

export function AnimatedHeroTitle() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => prevIndex + 1)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  // Defensive safety: guarantee we never render undefined and support infinite strictly increasing index
  const currentWord = WORDS[index % WORDS.length] || WORDS[0] || ''

  return (
    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-white text-center">
      Comparte tu
      <br />
      <span className="relative block h-[1.2em] sm:h-[1.2em] md:h-[1.3em] overflow-hidden py-1">
        <AnimatePresence>
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 25, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -25, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 mx-auto w-fit text-primary italic font-serif"
          >
            {currentWord}
          </motion.span>
        </AnimatePresence>
      </span>
      <span>en nuestros paneles.</span>
    </h1>
  )
}
