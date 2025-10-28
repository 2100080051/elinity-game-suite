import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

export default function SharedPlaylistMaker(){
  const [gameState, setGameState] = useState('setup') // setup | building | final
  const [theme, setTheme] = useState('')
  const [customTheme, setCustomTheme] = useState('')
  const [session, setSession] = useState(null)
  const [chat, setChat] = useState([]) // {type:'ai'|'track'|'comment', content}
  const [trackTitle, setTrackTitle] = useState('')
  const [trackArtist, setTrackArtist] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [playlist, setPlaylist] = useState([]) // [{title, artist, player, comment}]
  const [finalData, setFinalData] = useState(null) // {title, moodDescription, artworkDescription, summary}
  const [isLoading, setIsLoading] = useState(false)

  const chatRef = useRef(null)

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chat])

  const themeOptions = [
    '🌃 Midnight Drives',
    '☀️ Summer 2025',
    '🎉 Celebration Energy',
    '🌧️ Rainy Day Vibes',
    '💭 Nostalgia Trip',
    '🧘 Chill & Focus',
    '💔 Heartbreak Soundtrack',
    '🔥 Chaos & Hype',
    '✨ Custom Theme'
  ]

  const startSession = async () => {
    const chosenTheme = theme === '✨ Custom Theme' ? customTheme.trim() : theme.replace(/^[^\s]+\s/, '')
    if (!chosenTheme) return alert('Pick or enter a theme')
    setIsLoading(true)
    try{
      const res = await axios.post('/api/start_session', { theme: chosenTheme })
      const { greeting, session: newSession } = res.data
      setSession(newSession)
      setChat([{ type:'ai', content: greeting }])
      setGameState('building')
    }catch(e){
      console.error(e)
      setSession({ theme: chosenTheme, tracks: [] })
      setChat([{ type:'ai', content: `Welcome to the Shared Playlist Maker. Let's build a soundtrack for ${chosenTheme}. Add your tracks below, and I'll weave them into one cohesive vibe.` }])
      setGameState('building')
    }finally{ setIsLoading(false) }
  }

  const addTrack = async () => {
    const t = trackTitle.trim()
    const a = trackArtist.trim()
    const p = playerName.trim() || 'Anon'
    if (!t || !a) return alert('Enter both track title and artist')

    setIsLoading(true)
    const newTrack = { title: t, artist: a, player: p }

    setChat(prev => [...prev, { type:'track', content: `${p} added: "${t}" by ${a}` }])

    try{
      const res = await axios.post('/api/add_track', {
        session,
        track: newTrack
      })
      const { comment, session: updated } = res.data
      setSession(updated)
      setPlaylist(prev => [...prev, { ...newTrack, comment }])
      setChat(prev => [...prev, { type:'comment', content: comment }])
    }catch(e){
      console.error(e)
      const fallback = 'That track adds a really cool layer to the vibe.'
      setPlaylist(prev => [...prev, { ...newTrack, comment: fallback }])
      setChat(prev => [...prev, { type:'comment', content: fallback }])
    }finally{
      setTrackTitle('')
      setTrackArtist('')
      setIsLoading(false)
    }
  }

  const generateFinalPlaylist = async () => {
    setIsLoading(true)
    try{
      const res = await axios.post('/api/generate_playlist', { session, playlist })
      const { playlistTitle, moodDescription, artworkDescription, summary } = res.data
      setFinalData({ title: playlistTitle, moodDescription, artworkDescription, summary })
      setGameState('final')
    }catch(e){
      console.error(e)
      setFinalData({
        title: `${session.theme} — The Soundtrack`,
        moodDescription: 'A beautifully curated blend of emotion and energy, captured in sound.',
        artworkDescription: 'Soft gradients of purple and teal, with neon lights reflecting on rain-soaked streets.',
        summary: 'This playlist feels like a late-night journey through memories and dreams.'
      })
      setGameState('final')
    }finally{ setIsLoading(false) }
  }

  const resetGame = () => {
    setGameState('setup')
    setTheme('')
    setCustomTheme('')
    setSession(null)
    setChat([])
    setPlaylist([])
    setFinalData(null)
    setTrackTitle('')
    setTrackArtist('')
    setPlayerName('')
  }

  // UI - Setup
  if (gameState === 'setup'){
    return (
      <div className="sound-wave min-h-screen flex items-center justify-center p-6">
         <div className="elinity-badge">ELINITY</div>
        <div className="glass-strong rounded-3xl p-10 max-w-2xl w-full relative z-10">
          <div className="text-center mb-6">
            <h1 className="playlist-title text-5xl">🎶 Shared Playlist Maker</h1>
            <div className="subtitle mt-2">Build Your Soundtrack Together</div>
            <div className="text-xs text-slate-400 mt-2">Powered by Elinity</div>
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-slate-200 mb-3">Choose Your Vibe:</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {themeOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setTheme(opt)}
                  className={`btn-secondary px-4 py-3 rounded-xl text-sm transition ${theme===opt ? 'border-teal-400 bg-teal-500/20' : ''}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {theme === '✨ Custom Theme' && (
              <input
                value={customTheme}
                onChange={e=>setCustomTheme(e.target.value)}
                className="input-box w-full"
                placeholder="Enter your custom vibe (e.g., 'Road Trip with Friends')"
              />
            )}
          </div>

          <button onClick={startSession} disabled={isLoading || !theme} className="btn-primary w-full py-4 rounded-xl text-lg disabled:opacity-50">
            {isLoading ? 'Starting Session…' : '🎧 Start Building Playlist'}
          </button>
        </div>
      </div>
    )
  }

  // UI - Building
  if (gameState === 'building'){
    return (
      <div className="sound-wave min-h-screen p-6">
         <div className="elinity-badge">ELINITY</div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Playlist Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="playlist-title text-3xl">Your Playlist</h2>
              <div className="theme-badge">{session?.theme || 'Vibe'}</div>
            </div>

            <div className="glass rounded-2xl p-6 min-h-[500px]">
              {playlist.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-400 italic">
                  No tracks yet. Add your first song to start building!
                </div>
              ) : (
                <div className="playlist-wrap">
                  {playlist.map((track, i) => (
                    <div key={i} className="track-card">
                      <div className="flex items-start gap-3">
                        <div className="track-num">{i+1}</div>
                        <div className="flex-1">
                          <div className="font-bold text-lg text-white">{track.title}</div>
                          <div className="text-sm text-slate-300 mb-2">{track.artist} • added by {track.player}</div>
                          {track.comment && <div className="text-sm text-teal-300 italic">"{track.comment}"</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={generateFinalPlaylist} disabled={playlist.length < 3 || isLoading} className="btn-generate px-6 py-3 rounded-xl font-bold disabled:opacity-50">
                {isLoading ? 'Generating…' : '🎨 Finalize & Generate Artwork'}
              </button>
              <button onClick={resetGame} className="btn-secondary px-6 py-3 rounded-xl">
                🔁 Start Over
              </button>
            </div>
          </div>

          {/* Chat & Add Track */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                <span className="neon-text">ElinityAI</span> — Vibe Conductor
              </h3>
              <div ref={chatRef} className="chat-feed">
                {chat.map((e,i) => {
                  if (e.type==='ai') return (<div key={i} className="mb-3 text-slate-200">{e.content}</div>)
                  if (e.type==='track') return (<div key={i} className="mb-2 font-semibold text-purple-300">🎵 {e.content}</div>)
                  if (e.type==='comment') return (<div key={i} className="mb-3 text-teal-200 italic text-sm">💬 {e.content}</div>)
                  return null
                })}
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-6">
              <div className="font-semibold text-slate-200 mb-3">Add a Track:</div>
              <div className="space-y-3">
                <input
                  value={playerName}
                  onChange={e=>setPlayerName(e.target.value)}
                  className="input-box w-full"
                  placeholder="Your Name (optional)"
                />
                <input
                  value={trackTitle}
                  onChange={e=>setTrackTitle(e.target.value)}
                  className="input-box w-full"
                  placeholder="Song Title"
                />
                <input
                  value={trackArtist}
                  onChange={e=>setTrackArtist(e.target.value)}
                  className="input-box w-full"
                  placeholder="Artist Name"
                />
              </div>

              <button onClick={addTrack} disabled={isLoading || !trackTitle.trim() || !trackArtist.trim()} className="btn-primary w-full py-3 rounded-xl mt-4 disabled:opacity-50">
                {isLoading ? 'Adding…' : '➕ Add to Playlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // UI - Final Playlist
  return (
    <div className="sound-wave min-h-screen p-6 flex items-center justify-center">
       <div className="elinity-badge">ELINITY</div>
      <div className="glass-strong rounded-3xl p-10 max-w-4xl w-full relative z-10">
        <div className="text-center mb-8">
          <h1 className="playlist-title text-5xl mb-4">{finalData?.title || 'Your Playlist'}</h1>
          <div className="theme-badge mb-6">{session?.theme}</div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Artwork */}
          <div className="artwork-box">
            <div className="text-center px-6 z-10 relative">
              <div className="text-xl font-bold mb-2">🎨 AI Artwork</div>
              <div className="text-sm text-slate-300 italic">{finalData?.artworkDescription || 'Generating artwork description…'}</div>
            </div>
          </div>

          {/* Vibe Summary */}
          <div className="space-y-4">
            <div className="vibe-summary">
              <div className="font-bold text-teal-300 mb-2">Mood:</div>
              <p className="text-slate-200">{finalData?.moodDescription || 'A beautiful journey through sound.'}</p>
            </div>

            <div className="vibe-summary">
              <div className="font-bold text-purple-300 mb-2">Vibe Story:</div>
              <p className="text-slate-200 italic">{finalData?.summary || 'This playlist feels like magic.'}</p>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="mb-8">
          <div className="font-bold text-xl text-slate-200 mb-4">📀 Tracklist ({playlist.length} songs)</div>
          <div className="space-y-2">
            {playlist.map((track, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="track-num">{i+1}</div>
                <div className="flex-1">
                  <div className="font-bold text-white">{track.title}</div>
                  <div className="text-sm text-slate-300">{track.artist} • {track.player}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button onClick={resetGame} className="btn-primary px-6 py-3 rounded-xl">
            🔁 Create New Playlist
          </button>
          <button className="btn-secondary px-6 py-3 rounded-xl">
            💾 Save Playlist
          </button>
        </div>
      </div>
    </div>
  )
}
