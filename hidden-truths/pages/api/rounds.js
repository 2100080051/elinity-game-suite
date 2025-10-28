import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'hidden_truths_rounds.json')

export default async function handler(req, res){
  try{
    if(req.method === 'POST'){
      const round = req.body || {}
      const arr = readAll()
      arr.push({ ...round, savedAt: new Date().toISOString() })
      fs.writeFileSync(FILE, JSON.stringify(arr, null, 2))
      return res.status(200).json({ ok: true })
    }
    if(req.method === 'GET'){
      return res.status(200).json(readAll())
    }
    return res.status(405).json({ error: 'Method not allowed' })
  }catch(e){
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}

function readAll(){
  if(!fs.existsSync(FILE)) return []
  try{ return JSON.parse(fs.readFileSync(FILE, 'utf8')) }catch{ return [] }
}
