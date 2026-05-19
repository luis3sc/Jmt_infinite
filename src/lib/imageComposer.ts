/**
 * imageComposer.ts
 * Composición de imagen: crop recortado + marco PNG encima → Blob final.
 * Usa el Canvas API nativo — sin dependencias externas.
 */

/**
 * Recorte de área en píxeles de la imagen original.
 * Compatible con el formato que devuelve react-easy-crop.
 */
export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Genera la imagen recortada y escala al tamaño del panel.
 * Opcionalmente superpone un marco PNG con transparencia.
 *
 * @param imageSrc    - ObjectURL o data URL de la imagen original
 * @param pixelCrop   - Área recortada en píxeles (del Cropper)
 * @param frameSrc    - ObjectURL del marco PNG (null = sin marco)
 * @param targetWidth - Ancho final en píxeles (ej. 1920)
 * @param targetHeight - Alto final en píxeles (ej. 1080)
 * @returns Promise<Blob> de la imagen compuesta en PNG
 */
export async function composeImage(
  imageSrc: string,
  pixelCrop: PixelCrop,
  frameSrc: string | null,
  targetWidth: number = 1280,
  targetHeight: number = 720
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  // 1. Cargar y dibujar la imagen recortada
  const img = await loadImage(imageSrc)
  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    targetWidth, targetHeight
  )

  // 2. Superponer marco PNG (si existe)
  if (frameSrc) {
    const frame = await loadImage(frameSrc)
    ctx.drawImage(frame, 0, 0, targetWidth, targetHeight)
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Error al generar la imagen compuesta.'))
    }, 'image/png')
  })
}

/** Helper: carga un elemento <img> a partir de una URL */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Aplicar crossOrigin solo para URLs de dominios distintos al origen actual
    // Los paths /assets/... son same-origin: no necesitan crossOrigin
    try {
      if (src.startsWith('http') || src.startsWith('https')) {
        const url = new URL(src)
        if (url.origin !== window.location.origin) {
          img.crossOrigin = 'anonymous'
        }
      }
      // blob: y /assets/... son same-origin — no se toca crossOrigin
    } catch (_) {
      // Si falla el parseo, ignoramos
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`))
    img.src = src
  })
}
