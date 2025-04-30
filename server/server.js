// server.js
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import puppeteer from 'puppeteer'
import autoExtractRouter from './api/autoExtract.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// 1) HTML Fetch Proxy: cheerio 등으로 파싱 전에 순수 HTML을 가져올 때 사용
app.get('/api/fetch-html', async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).json({ error: 'Missing url parameter' })
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!response.ok) {
      throw new Error(`Fetch failed ${response.status}`)
    }
    const text = await response.text()
    return res.json({ text })
  } catch (err) {
    console.error('fetch-html error', err)
    return res.status(500).json({ error: err.message })
  }
})

// 2) Naver Place 크롤링 (Puppeteer)
app.get('/api/naver-place', async (req, res) => {
  const name = req.query.name
  if (!name) return res.status(400).json({ error: 'Missing name parameter' })
  let browser = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.goto(
      `https://search.naver.com/search.naver?query=${encodeURIComponent(name)}`,
      { waitUntil: 'networkidle2' }
    )
    const link = await page.evaluate(() => {
      const sel = document.querySelector('a.place_bluelink, a.tit, a[href*="map.naver.com"]')
      return sel?.href || ''
    })
    await browser.close()
    if (link) return res.json({ url: link })
    else return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('naver-place error', err)
    if (browser) await browser.close()
    return res.status(500).json({ error: err.message })
  }
})

// 3) AutoExtract: ReviewNote JSON API 우선, 그 외 HTML 파싱
app.use('/api', autoExtractRouter)

app.listen(PORT, () => {
  console.log(`✅ Server listening at http://localhost:${PORT}`)
})
