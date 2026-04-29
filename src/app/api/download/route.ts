import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoUrl = searchParams.get('url')
  const fileName = searchParams.get('filename') || 'video.mp4'

  if (!videoUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const response = await fetch(videoUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`)
    }

    // Proxy the response headers and body
    const headers = new Headers()
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4')
    
    // We can also proxy the content length if available
    const contentLength = response.headers.get('Content-Length')
    if (contentLength) {
      headers.set('Content-Length', contentLength)
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Download proxy error:', error)
    return NextResponse.json({ error: 'Failed to download video' }, { status: 500 })
  }
}
