export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const closing = 'The veil closes for now. May your paths be guided by code and constellations.'
  return res.status(200).json({ closing })
}
