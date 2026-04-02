import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fetchInsightContent } from './lib/insightContent.js'

function insightApiDevPlugin() {
  return {
    name: 'insight-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = req.url ? new URL(req.url, 'http://localhost') : null

        if (!requestUrl || req.method !== 'GET' || requestUrl.pathname !== '/api/article') {
          next()
          return
        }

        const slug = requestUrl.searchParams.get('slug') ?? undefined
        const url = requestUrl.searchParams.get('url') ?? undefined
        const result = await fetchInsightContent({ slug, url })

        res.statusCode = result.status
        res.setHeader('Content-Type', 'application/json; charset=utf-8')

        if (result.status === 200) {
          res.end(JSON.stringify({ content: result.content }))
          return
        }

        res.end(JSON.stringify({ error: result.error, detail: result.detail }))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), insightApiDevPlugin()],
})
