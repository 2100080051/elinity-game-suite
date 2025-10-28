export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'POST only'})
  
  const {state} = req.body
  if(!state) return res.status(400).json({error:'state required'})

  return res.json(state)
}
