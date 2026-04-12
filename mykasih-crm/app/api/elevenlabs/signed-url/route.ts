import { NextResponse } from 'next/server'

export async function GET() {
  const agentId = process.env.ELEVENLABS_AGENT_ID
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!agentId || !apiKey) {
    console.error('[Signed URL] Missing env: ELEVENLABS_AGENT_ID or ELEVENLABS_API_KEY')
    return NextResponse.json(
      { error: 'Voice agent not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: { 'xi-api-key': apiKey },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error('[Signed URL] ElevenLabs error:', response.status, text)
      return NextResponse.json(
        { error: 'ElevenLabs refused signed URL request' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ signedUrl: data.signed_url })
  } catch (err) {
    console.error('[Signed URL] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
