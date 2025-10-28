import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'life_swap_journal.json')

function ensureFile() {
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]', 'utf-8')
}

export default function handler(req, res) {
  ensureFile()

  if (req.method === 'GET') {
    try {
      const content = fs.readFileSync(FILE, 'utf-8')
      const data = JSON.parse(content)
      return res.status(200).json(data)
    } catch (e) {
      return res.status(200).json([])
    }
  }

  if (req.method === 'POST') {
    try {
      const content = fs.readFileSync(FILE, 'utf-8')
      const data = JSON.parse(content)
      data.push(req.body)
      fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to write journal' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
