import { fetchInsightContent } from '../lib/insightContent.js'

export default async function handler(req, res) {
  const { slug, url } = req.query

  const result = await fetchInsightContent({ slug, url })

  if (result.status === 200) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    return res.status(200).json({ content: result.content })
  }

  return res.status(result.status).json({
    error: result.error,
    detail: result.detail,
  })
}
