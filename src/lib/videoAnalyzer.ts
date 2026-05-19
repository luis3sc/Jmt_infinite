/**
 * videoAnalyzer.ts
 * Detecta metadata de video (dimensiones, duración, aspect ratio)
 * usando el elemento <video> nativo del browser — sin librerías externas.
 */

export interface VideoMetadata {
  width: number
  height: number
  duration: number
  /** ratio = width / height, ej. 1.78 para 16:9 */
  aspectRatio: number
}

/**
 * Analiza el archivo de video y retorna sus metadatos.
 * Usa el decodificador nativo del browser, así que es instantáneo.
 */
export function analyzeVideoFile(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true

    video.onloadedmetadata = () => {
      const width = video.videoWidth
      const height = video.videoHeight
      const duration = video.duration
      URL.revokeObjectURL(video.src)
      resolve({
        width,
        height,
        duration,
        aspectRatio: height > 0 ? width / height : 0,
      })
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('No se pudo leer el video. El formato puede no ser compatible con tu navegador.'))
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Verifica si el aspect ratio del video es compatible con el del panel.
 * Usa un umbral del 20% de tolerancia para cubrir variaciones menores.
 */
export function isAspectRatioCompatible(
  videoRatio: number,
  panelRatio: number,
  threshold: number = 0.20
): boolean {
  if (panelRatio === 0) return true
  return Math.abs(videoRatio - panelRatio) / panelRatio <= threshold
}

/** Formato legible del aspect ratio, ej. "16:9" */
export function formatAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const d = gcd(width, height)
  return `${width / d}:${height / d}`
}
