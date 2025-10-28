import { useEffect, useMemo, useRef, useState } from 'react'

const ROLES = [
  { key: 'planner', label: 'Planner', icon: '🧠' },
  { key: 'hacker', label: 'Hacker', icon: '💻' },
  { key: 'driver', label: 'Driver', icon: '🚗' },
  { key: 'disguiser', label: 'Disguiser', icon: '🎭' },
  { key: 'demo', label: 'Demolitionist', icon: '💣' },
]

export default function Home({ sound }){
  const [stage, setStage] = useState('title') // title | roles | briefing | planning | execution | twist | debrief
  const [players, setPlayers] = useState([{ name: 'You', role: null }])
  const [mission, setMission] = useState(null)
  const [chat, setChat] = useState([])
  const [plan, setPlan] = useState('')
  const [log, setLog] = useState([])
  const [tension, setTension] = useState(10) // 0-100
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  // simple effects: loop tension during execution/twist
  useEffect(() => {
    const t = sound?.tensionRef?.current
    if(!t) return
    if(stage === 'execution' || stage === 'twist'){ if(sound?.soundOn){ t.play().catch(()=>{}) } }
    else { try{ t.pause(); t.currentTime = 0 }catch{} }
  }, [stage, sound])

  useEffect(() => {
    const h = sound?.heartRef?.current
    if(!h) return
    if(countdown > 0 && sound?.soundOn){ h.play().catch(()=>{}) }
    else { try{ h.pause(); h.currentTime = 0 }catch{} }
  }, [countdown, sound])

  async function callHeist(action, payload){
    setLoading(true)
    try{
      const res = await fetch('/api/heist', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, payload }) })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || 'API error')
      return data
    }catch(e){ console.error(e); return null } finally{ setLoading(false) }
  }

  async function startHeist(){
    const data = await callHeist('mission')
    if(data){ setMission(data); setStage('roles') }
  }

  function selectRole(i, role){ setPlayers(p => { const c=[...p]; c[i] = { ...c[i], role }; return c }) }
  function addPlayer(){ setPlayers(p => [...p, { name: `Player ${p.length+1}`, role: null }]) }
  function removePlayer(i){ setPlayers(p => p.filter((_,idx)=> idx!==i)) }

  async function beginBrief(){
    const payload = { players, mission }
    const data = await callHeist('brief', payload)
    if(data){ setChat([{ role:'ai', text: data.intro }]); setStage('briefing') }
  }

  async function submitPlan(){
    if(!plan.trim()) return
    setChat(c => [...c, { role:'me', text: plan }])
    const payload = { mission, players, plan }
    const data = await callHeist('plan', payload)
    if(data){
      setChat(c => [...c, { role:'ai', text: data.response }])
      setStage('execution'); setCountdown(0)
    }
  }

  async function act(action){
    const payload = { mission, players, action }
    const data = await callHeist('act', payload)
    if(data){
      setChat(c => [...c, { role:'ai', text: data.narration }])
      setLog(l => [...l, `Action: ${action} → ${data.outcome}`])
      setTension(t => Math.min(100, Math.max(0, t + (data.tensionDelta||0))))
      if(data.next === 'twist'){ setStage('twist'); setCountdown(10) }
      else if(data.next === 'escape'){ setStage('twist'); setCountdown(8) }
    }
  }

  async function resolveTwist(){
    const payload = { mission, players, tension }
    const data = await callHeist('twist', payload)
    if(data){
      setChat(c => [...c, { role:'ai', text: data.twist }])
      setStage('execution')
    }
  }

  async function debrief(){
    const payload = { mission, players, log, tension }
    const data = await callHeist('debrief', payload)
    if(data){ setChat([{ role:'ai', text: data.summary }]); setStage('debrief') }
  }

  useEffect(() => {
    if(countdown <= 0) return
    const t = setInterval(()=> setCountdown(s => s>0? s-1 : 0), 1000)
    return () => clearInterval(t)
  }, [countdown])

  return (
    <div className="space-y-6">
      {stage === 'title' && (
        <div className="card vault slide-in text-center">
          <h1 className="font-display text-3xl sm:text-4xl neon">⚡ ElinityAI Presents: The AI Heist</h1>
          <p className="mt-2 text-white/80">Plan. Execute. Escape. Together.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button className="btn-primary" onClick={startHeist}>{loading? 'Loading…':'Start Heist'}</button>
            <button className="btn-ghost" onClick={startHeist}>Choose Roles</button>
            <button className="btn-ghost" onClick={()=> alert('How to Play: Pick roles. Plan your approach. React to challenges. Survive the twist. Escape and debrief. Keep it cinematic!')}>How to Play</button>
          </div>
        </div>
      )}

      {stage === 'roles' && (
        <div className="card slide-in">
          <div className="text-sm text-white/70">Mission Brief</div>
          <div className="mt-1 font-tech text-lg">{mission?.name || '—'} · {mission?.location} · Objective: {mission?.objective} · Difficulty: {mission?.difficulty}</div>
          <div className="mt-3 grid sm:grid-cols-2 gap-4">
            <div className="card">
              <div className="text-white/80 font-semibold">Choose Roles</div>
              <div className="mt-2 space-y-2">
                {players.map((p,i)=> (
                  <div key={i} className="flex items-center gap-2">
                    <input className="input flex-1" value={p.name} onChange={e=> setPlayers(ps => { const c=[...ps]; c[i].name = e.target.value; return c })} />
                    <select className="input w-48" value={p.role||''} onChange={e=> selectRole(i, e.target.value)}>
                      <option value="">— Pick role —</option>
                      {ROLES.map(r => <option key={r.key} value={r.key}>{r.icon} {r.label}</option>)}
                    </select>
                    <button className="btn-ghost" onClick={()=> removePlayer(i)}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button className="btn-ghost" onClick={addPlayer}>+ Add Player</button>
                <button className="btn-ghost" onClick={()=> setPlayers(ps => ps.map((p,j) => ({...p, role: p.role || ROLES[j%ROLES.length].key })))}>Auto-fill roles</button>
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-white/70">Tip</div>
              <div className="mt-1">Smart plans lower risk. Risky plans raise tension — and rewards.</div>
              <div className="mt-2 text-sm text-white/70">Alert Meter</div>
              <div className="meter w-full mt-1"><span style={{ width: `${tension}%` }} /></div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={beginBrief}>{loading? 'Loading…':'Begin Briefing'}</button>
          </div>
        </div>
      )}

      {stage === 'briefing' && (
        <div className="card slide-in">
          <div className="text-sm text-white/70">Briefing</div>
          <div className="mt-1 whitespace-pre-line">{chat.map((m,i)=>(<div key={i}>{m.text}</div>))}</div>
          <div className="mt-4">
            <div className="text-sm text-white/70">Your plan</div>
            <input className="input" placeholder="Roof vents, staff disguise, or brute-force gate?" value={plan} onChange={e=> setPlan(e.target.value)} />
            <div className="mt-2">
              <button className="btn-primary" onClick={submitPlan}>Submit Plan</button>
            </div>
          </div>
        </div>
      )}

      {stage === 'execution' && (
        <div className="card slide-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/70">Execution</div>
              <div className="text-white/90">Respond to challenges. Keep the meter low.</div>
            </div>
            <div className="w-48">
              <div className="meter"><span style={{ width: `${tension}%` }} /></div>
            </div>
          </div>
          <div className="mt-3 log">{log.join('\n')}</div>
          <div className="mt-3 grid sm:grid-cols-2 md:grid-cols-4 gap-2">
            {['Fight','Hack','Distract','Negotiate'].map(a => (
              <button key={a} className="btn-ghost" onClick={()=> act(a)}>{a}</button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={()=> setStage('twist')}>Trigger Twist</button>
            <button className="btn-ghost" onClick={debrief}>Debrief Now</button>
          </div>
        </div>
      )}

      {stage === 'twist' && (
        <div className="card slide-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/70">Twist & Escape</div>
              <div className="text-white/90">Unexpected turns. Decide fast.</div>
            </div>
            <div className="flex items-center gap-3">
              {countdown>0 && <div className="badge-soft">⏳ {countdown}s</div>}
              <div className="w-40"><div className="meter"><span style={{ width: `${tension}%` }} /></div></div>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn-primary" onClick={resolveTwist}>Resolve Twist</button>
            <button className="btn-ghost ml-2" onClick={debrief}>Go to Debrief</button>
          </div>
        </div>
      )}

      {stage === 'debrief' && (
        <div className="card slide-in">
          <div className="text-sm text-white/70">Debrief</div>
          <div className="mt-1 whitespace-pre-line">{chat.map((m,i)=>(<div key={i}>{m.text}</div>))}</div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={()=> { setStage('title'); setPlayers([{ name:'You', role:null }]); setLog([]); setTension(10); setPlan(''); setMission(null) }}>New Heist</button>
            <button className="btn-ghost" onClick={()=> setStage('roles')}>Choose Roles</button>
          </div>
        </div>
      )}
    </div>
  )
}
