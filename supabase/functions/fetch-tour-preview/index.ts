import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function extractMeta(html: string, property: string): string | null {
  const re1 = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
    'i',
  )
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
    'i',
  )
  const m1 = html.match(re1)
  if (m1) return m1[1]
  const m2 = html.match(re2)
  if (m2) return m2[1]
  return null
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return m ? m[1].trim() : null
}

function guessPrice(html: string): string | null {
  const matches = html.match(/(\d[\d\s]{2,8})\s*Kč/g)
  if (!matches || matches.length === 0) return null
  return matches[0].replace(/\s/g, ' ').trim()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || !url.startsWith('http')) {
      return new Response(JSON.stringify({ error: 'Некорректная ссылка' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
    })

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          error: `Не удалось открыть страницу (${res.status})`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const html = await res.text()
    const title = extractMeta(html, 'og:title') || extractTitle(html) || null
    const image = extractMeta(html, 'og:image') || null
    const description = extractMeta(html, 'og:description') || null
    const priceGuess = guessPrice(html)

    return new Response(
      JSON.stringify({ title, image, description, priceGuess }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
