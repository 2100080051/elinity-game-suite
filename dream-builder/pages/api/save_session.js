export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { worldState, chat } = req.body

  // Create session snapshot (JSON string)
  const snapshot = JSON.stringify(worldState || {}, null, 2)
  
  return res.status(200).json({ snapshot, message: 'Session saved! Copy the snapshot to resume later.' })
}
