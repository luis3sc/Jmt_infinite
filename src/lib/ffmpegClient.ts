/**
 * ffmpegClient.ts
 * Singleton de FFmpeg.wasm — carga los binarios una sola vez y los reutiliza.
 * El procesamiento ocurre en el dispositivo del usuario (browser-side).
 *
 * NOTA Turbopack: Se usa classWorkerURL apuntando a /ffmpeg-worker.js (public/)
 * para evitar el error "Cannot find module as expression is too dynamic".
 * Turbopack no puede analizar `new Worker(new URL("./worker.js", import.meta.url))`
 * dentro de node_modules, pero sí acepta un URL absoluto ya conocido en build time.
 */
import { FFmpeg } from '@ffmpeg/ffmpeg'

// Implementación manual de fetchFile (sin @ffmpeg/util para evitar imports dinámicos)
async function fetchFile(fileOrBlob: File | Blob | string): Promise<Uint8Array> {
  if (typeof fileOrBlob === 'string') {
    const res = await fetch(fileOrBlob)
    const buf = await res.arrayBuffer()
    return new Uint8Array(buf)
  }
  const buf = await fileOrBlob.arrayBuffer()
  return new Uint8Array(buf)
}

let ffmpegInstance: FFmpeg | null = null
let isLoading = false
let loadingPromise: Promise<FFmpeg> | null = null
let currentProgressCallback: ((progress: number, time: number) => void) | null = null

/** Carga e inicializa el singleton de FFmpeg.wasm */
export async function getFFmpeg(
  onProgress?: (progress: number, time: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    currentProgressCallback = onProgress || null
    return ffmpegInstance
  }

  // Reutilizar promise en curso para evitar múltiples cargas simultáneas
  if (loadingPromise) {
    currentProgressCallback = onProgress || null
    return loadingPromise
  }

  isLoading = true
  loadingPromise = (async () => {
    ffmpegInstance = new FFmpeg()
    currentProgressCallback = onProgress || null

    ffmpegInstance.on('log', ({ message }) => {
      console.log('[ffmpeg]', message)
    })

    ffmpegInstance.on('progress', ({ progress, time }) => {
      if (currentProgressCallback) {
        currentProgressCallback(progress, time)
      }
    })

    try {
      const origin = window.location.origin
      const workerURL = `${origin}/ffmpeg/worker.js`
      const coreURL = `${origin}/ffmpeg-core.js`
      const wasmURL = `${origin}/ffmpeg-core.wasm`
      console.log('[ffmpeg] Iniciando load con worker:', workerURL)

      await ffmpegInstance.load({
        // classWorkerURL: apunta a los archivos ESM de @ffmpeg/ffmpeg copiados a public/ffmpeg/.
        // Al ser una URL absoluta, new URL(classWorkerURL, import.meta.url) la devuelve
        // tal cual — Turbopack nunca analiza estos archivos porque están en /public/.
        // El worker.js original sí sabe manejar importScripts() Y import() dinámico
        // sin que Turbopack interfiera.
        classWorkerURL: workerURL,
        coreURL,
        wasmURL,
      })
      console.log('[ffmpeg] load() completado exitosamente')

    } catch (err) {
      console.error('FFmpeg load error:', err)
      ffmpegInstance = null
      loadingPromise = null
      throw err
    } finally {
      isLoading = false
    }

    return ffmpegInstance
  })()

  return loadingPromise
}

/**
 * Convierte una imagen estática (PNG/JPEG) en un video MP4 de duración fija.
 */
export async function imageToVideo(
  imageBlob: Blob,
  durationSeconds: number = 7,
  panelWidth: number = 1280,
  panelHeight: number = 720,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg((progress, time) => {
    if (onProgress) {
      if (progress > 0 && progress <= 1) {
        onProgress(Math.round(progress * 100))
      } else if (time && time > 0) {
        const calculated = Math.min(100, Math.round((time / (durationSeconds * 1_000_000)) * 100))
        onProgress(calculated)
      }
    }
  })

  await ffmpeg.writeFile('input.png', await fetchFile(imageBlob))

  await ffmpeg.exec([
    '-loop', '1',
    '-framerate', '25',
    '-i', 'input.png',
    '-t', String(durationSeconds),
    '-vf', `scale=${panelWidth}:${panelHeight}:force_original_aspect_ratio=decrease,pad=${panelWidth}:${panelHeight}:(ow-iw)/2:(oh-ih)/2`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    'output.mp4',
  ])

  const raw = await ffmpeg.readFile('output.mp4')
  const buf = raw instanceof Uint8Array
    ? raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
    : (raw as unknown as ArrayBuffer)

  await ffmpeg.deleteFile('input.png').catch(() => null)
  await ffmpeg.deleteFile('output.mp4').catch(() => null)

  return new Blob([new Uint8Array(buf as ArrayBuffer)], { type: 'video/mp4' })
}

/**
 * Recorta y redimensiona un video a los specs del panel (7s, resolución del panel).
 */
export async function processVideo(
  videoFile: File,
  panelWidth: number = 1280,
  panelHeight: number = 720,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const durationSeconds = 7
  const ffmpeg = await getFFmpeg((progress, time) => {
    if (onProgress) {
      if (progress > 0 && progress <= 1) {
        onProgress(Math.round(progress * 100))
      } else if (time && time > 0) {
        const calculated = Math.min(100, Math.round((time / (durationSeconds * 1_000_000)) * 100))
        onProgress(calculated)
      }
    }
  })

  const ext = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4'
  await ffmpeg.writeFile(`input.${ext}`, await fetchFile(videoFile))

  await ffmpeg.exec([
    '-i', `input.${ext}`,
    '-t', String(durationSeconds),
    '-vf', `scale=${panelWidth}:${panelHeight}:force_original_aspect_ratio=decrease,pad=${panelWidth}:${panelHeight}:(ow-iw)/2:(oh-ih)/2`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-an', // REMOVE AUDIO channel (DOOH standards)
    '-r', '25',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    'output.mp4',
  ])

  const raw = await ffmpeg.readFile('output.mp4')
  const buf = raw instanceof Uint8Array
    ? raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
    : (raw as unknown as ArrayBuffer)

  await ffmpeg.deleteFile(`input.${ext}`).catch(() => null)
  await ffmpeg.deleteFile('output.mp4').catch(() => null)

  return new Blob([new Uint8Array(buf as ArrayBuffer)], { type: 'video/mp4' })
}
