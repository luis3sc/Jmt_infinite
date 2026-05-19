/** @type {import('next').NextConfig} */
// Force dev server reload to detect newly created route groups and design-system page
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-4951180469144594abaab94c53f99a18.r2.dev',
      },
    ],
  },
  serverExternalPackages: ['fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe'],

  // Required for ffmpeg.wasm (SharedArrayBuffer) — scoped to /order-success only
  // Checkout (/checkout) is not affected, so Culqi iframes work normally.
  // /ffmpeg-worker.js also needs COEP so the Worker script itself puede cargarse
  // bajo el contexto cross-origin-isolated de /order-success.
  async headers() {
    return [
      {
        // COOP se mantiene por seguridad (aísla el contexto de navegación)
        // COEP se eliminó: ya no se usa FFmpeg.wasm (SharedArrayBuffer),
        // y COEP bloqueaba los videos de R2 con ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep
        source: '/order-success/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        // Archivos ESM del worker en /ffmpeg/ necesitan CORP
        source: '/ffmpeg/:path*',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        // ffmpeg-core.js necesita CORP
        source: '/ffmpeg-core.js',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        // ffmpeg-core.wasm necesita CORP
        source: '/ffmpeg-core.wasm',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig;
