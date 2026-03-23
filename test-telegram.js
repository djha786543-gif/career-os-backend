/**
 * Quick test — sends a sample Telegram alert to DJ without needing DB or server.
 * Run: node test-telegram.js
 */
const https = require('https')
const path  = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID_DJ

if (!TOKEN || !CHAT_ID) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID_DJ in .env')
  process.exit(1)
}

const sampleJobs = [
  {
    title: 'Manager, IT Audit & SOX Compliance',
    org:   'Goldman Sachs ⭐',
    loc:   'New York, US',
    sector:'banking',
    score: 5,
    url:   'https://careers.goldmansachs.com/jobs/example',
  },
  {
    title: 'Senior IT Audit Manager — Cloud Risk',
    org:   'Amazon Web Services ⭐',
    loc:   'Seattle, US',
    sector:'tech-cloud',
    score: 5,
    url:   'https://amazon.jobs/example',
  },
  {
    title: 'IT Governance & GRC Manager',
    org:   'EY India GDS',
    loc:   'Bangalore, India',
    sector:'big4',
    score: 4,
    url:   'https://careers.ey.com/example',
  },
]

function esc(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}

const jobLines = sampleJobs.map((j, i) => [
  `*${i + 1}\\. ${esc(j.title)}*`,
  `🏢 ${esc(j.org)} · ${esc(j.loc)}`,
  `🏷 ${esc(j.sector)} · Score: ${j.score}`,
  `[Apply →](${j.url})`,
].join('\n')).join('\n\n')

const today = new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
const msg = [
  `🚀 *Career OS — 3 new matches for DJ* \\(test\\)`,
  `_IT Audit · SOX · Cloud Risk · GRC · Manager\\+_`,
  `_${esc(today)}_`,
  `✅ 2 from Tier\\-1 orgs`,
  '',
  jobLines,
].join('\n')

const body = JSON.stringify({
  chat_id: CHAT_ID,
  text: msg,
  parse_mode: 'MarkdownV2',
  disable_web_page_preview: true,
})

const req = https.request({
  hostname: 'api.telegram.org',
  path: `/bot${TOKEN}/sendMessage`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let data = ''
  res.on('data', c => data += c)
  res.on('end', () => {
    const parsed = JSON.parse(data)
    if (parsed.ok) {
      console.log('✅ Test message sent successfully!')
    } else {
      console.error('❌ Telegram error:', parsed.description)
    }
  })
})

req.on('error', e => console.error('❌ Network error:', e.message))
req.write(body)
req.end()
