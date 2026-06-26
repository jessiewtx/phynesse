# Phynesse OpenAI proxy (Cloudflare Worker)

A tiny Worker that keeps your OpenAI key **server-side**. The app POSTs a
chat-completions body to this Worker; the Worker adds the `Authorization` header
(from an encrypted secret) and forwards it to OpenAI. The key is never in the
browser bundle.

## One-time deploy

From this `worker/` folder:

```bash
# 1. Log in to Cloudflare (opens a browser; free account, no card needed)
npx wrangler login

# 2. Store your OpenAI key as an encrypted secret (paste it when prompted)
npx wrangler secret put OPENAI_API_KEY

# 3. Deploy
npx wrangler deploy
```

`wrangler deploy` prints a URL like:

```
https://phynesse-openai-proxy.<your-subdomain>.workers.dev
```

That URL **is** the chat-completions endpoint. Give it to the app by setting, in
the project root `.env.local`:

```
VITE_OPENAI_PROXY_URL=https://phynesse-openai-proxy.<your-subdomain>.workers.dev
```

Then rebuild + redeploy the site (`npm run build` && `firebase deploy --only hosting`).

## Notes

- The Worker only accepts requests from the site's own origins (see
  `ALLOWED_ORIGINS` in `src/index.js`). Add a custom domain there if you get one.
- To rotate the key later: `npx wrangler secret put OPENAI_API_KEY` again.
- Local dev can keep using `VITE_OPENAI_API_KEY` in `.env` (direct, no proxy).
