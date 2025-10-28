import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'ai_improv_transcripts.json')

function ensure(){ if(!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]', 'utf-8') }

export default function handler(req,res){
  ensure()
  if(req.method==='GET'){
    try{
      const data = JSON.parse(fs.readFileSync(FILE,'utf-8'))
      return res.status(200).json(data)
    }catch{ return res.status(200).json([]) }
  }
  if(req.method==='POST'){
    try{
      const data = JSON.parse(fs.readFileSync(FILE,'utf-8'))
      data.push(req.body)
      fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
      return res.status(200).json({ ok:true })
    }catch(e){ return res.status(500).json({ error:'Failed to save transcript' }) }
  }
  return res.status(405).json({ error:'Method not allowed' })
}
