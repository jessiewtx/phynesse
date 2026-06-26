/**
 * Phynesse OpenAI proxy (Cloudflare Worker).
 *
 * Keeps the OpenAI API key server-side: the browser POSTs a chat-completions
 * body here, the Worker injects `Authorization: Bearer <secret>` and forwards it
 * to OpenAI. The key (env.OPENAI_API_KEY) is an encrypted Worker secret and is
 * never sent to or visible in the client.
 *
 * Abuse guards (best-effort for a class project):
 *  - Only allows requests from our own site origins (CORS allowlist).
 *  - Only forwards a whitelisted set of fields.
 *  - Caps the message payload size.
 */

const ALLOWED_ORIGINS = new Set([
  'https://phynesse-wpe.web.app',
  'https://phynesse-wpe.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
])

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MAX_MESSAGES_BYTES = 20000

function corsHeaders(origin) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://phynesse-wpe.web.app'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, cors)
    }
    // Block requests from origins that aren't our site.
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: 'Forbidden origin' }, 403, cors)
    }
    if (!env.OPENAI_API_KEY) {
      return json({ error: 'Proxy is missing OPENAI_API_KEY secret' }, 500, cors)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, cors)
    }

    const messages = Array.isArray(body.messages) ? body.messages : []
    if (JSON.stringify(messages).length > MAX_MESSAGES_BYTES) {
      return json({ error: 'Payload too large' }, 413, cors)
    }

    // Only forward the fields we expect — don't let callers set arbitrary params.
    const payload = {
      model: typeof body.model === 'string' ? body.model : 'gpt-4o-mini',
      messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.6,
      ...(body.response_format ? { response_format: body.response_format } : {}),
    }

    let upstream
    try {
      upstream = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      })
    } catch {
      return json({ error: 'Upstream request failed' }, 502, cors)
    }

    const text = await upstream.text()
    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  },
}
