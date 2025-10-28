import { useState } from 'react'
import axios from 'axios'

export default function Home(){
  const [step, setStep] = useState('setup') // setup | building | interpretation
  const [theme, setTheme] = useState('')
  const [customTheme, setCustomTheme] = useState('')
  const [images, setImages] = useState([])
  const [mosaic, setMosaic] = useState(Array(20).fill(null))
  const [interpretation, setInterpretation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [draggedImage, setDraggedImage] = useState(null)

  const themeOptions = [
    'Fantasy & Magic',
    'Dreams & Surrealism',
    'Nostalgia & Memories',
    'Sci-Fi & Future',
    'Nature & Wilderness',
    'Urban & City Life',
    'Emotions & Abstract',
    'Custom'
  ]

  const startGame = async () => {
    const selectedTheme = theme === 'Custom' ? customTheme : theme
    if(!selectedTheme.trim()) return
    
    setLoading(true)
    try{
      const res = await axios.post('/api/generate_images', { theme: selectedTheme.trim() })
      setImages(res.data.images || [])
      setStep('building')
    }catch(err){
      console.error('generate_images error:', err)
    }finally{
      setLoading(false)
    }
  }

  const handleDragStart = (e, imageUrl) => {
    setDraggedImage(imageUrl)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e, index) => {
    e.preventDefault()
    if(draggedImage){
      const newMosaic = [...mosaic]
      newMosaic[index] = draggedImage
      setMosaic(newMosaic)
      setDraggedImage(null)
    }
  }

  const removeFromMosaic = (index) => {
    const newMosaic = [...mosaic]
    newMosaic[index] = null
    setMosaic(newMosaic)
  }

  const lockBoard = async () => {
    const filledImages = mosaic.filter(img => img !== null)
    if(filledImages.length === 0){
      alert('Add at least one image to the mosaic!')
      return
    }

    setLoading(true)
    try{
      const res = await axios.post('/api/interpret_mosaic', { 
        theme: theme === 'Custom' ? customTheme : theme,
        mosaic: filledImages,
        total_slots: mosaic.length,
        filled_count: filledImages.length
      })
      setInterpretation(res.data)
      setStep('interpretation')
    }catch(err){
      console.error('interpret_mosaic error:', err)
    }finally{
      setLoading(false)
    }
  }

  const resetGame = () => {
    setStep('setup')
    setTheme('')
    setCustomTheme('')
    setImages([])
    setMosaic(Array(20).fill(null))
    setInterpretation(null)
  }

  const shuffleImages = async () => {
    const selectedTheme = theme === 'Custom' ? customTheme : theme
    setLoading(true)
    try{
      const res = await axios.post('/api/generate_images', { theme: selectedTheme, regenerate: true })
      setImages(res.data.images || [])
    }catch(err){
      console.error('shuffle error:', err)
    }finally{
      setLoading(false)
    }
  }

  const filledCount = mosaic.filter(img => img !== null).length

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="elinity-badge">ELINITY</div>
      
      {/* SETUP */}
      {step === 'setup' && (
        <div className="max-w-2xl mx-auto glass card-shadow rounded-3xl p-8 text-white text-center">
          <h1 className="text-5xl font-extrabold mb-3">🎨 Mood Mosaic</h1>
          <p className="text-lg mb-8 text-white/80">Co-create a visual moodboard and discover your collective vibe</p>
          
          <div className="space-y-4">
            <select 
              className="w-full px-4 py-3 rounded-xl" 
              value={theme} 
              onChange={e => setTheme(e.target.value)}
            >
              <option value="">Select a theme...</option>
              {themeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {theme === 'Custom' && (
              <input 
                className="w-full px-4 py-3 rounded-xl" 
                placeholder="Enter custom theme..." 
                value={customTheme} 
                onChange={e => setCustomTheme(e.target.value)}
              />
            )}

            <button 
              onClick={startGame} 
              disabled={loading || !theme || (theme === 'Custom' && !customTheme.trim())}
              className="w-full py-3 rounded-xl font-semibold btn-primary disabled:opacity-50"
            >
              {loading ? 'Generating Images...' : '✨ Start Creating'}
            </button>
          </div>
        </div>
      )}

      {/* BUILDING */}
      {step === 'building' && (
        <div className="max-w-7xl mx-auto">
          <div className="glass card-shadow rounded-3xl p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">Building Your Mosaic</h1>
                <p className="text-white/70">Theme: {theme === 'Custom' ? customTheme : theme}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-300">{filledCount} / 20</div>
                <div className="text-sm text-white/70">Images Placed</div>
              </div>
            </div>

            {/* Mosaic Grid */}
            <div className="mosaic-grid mb-6">
              {mosaic.map((img, i) => (
                <div 
                  key={i}
                  className={`mosaic-slot ${img ? 'filled' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                >
                  {img ? (
                    <>
                      <img src={img} alt={`Mosaic ${i}`} className="mosaic-image" />
                      <div className="remove-btn" onClick={() => removeFromMosaic(i)}>×</div>
                    </>
                  ) : (
                    <div className="text-white/30 text-2xl">+</div>
                  )}
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={lockBoard} 
                disabled={loading || filledCount === 0}
                className="px-6 py-3 rounded-xl font-semibold btn-primary disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : '🔒 Lock Board & Interpret'}
              </button>
              <button 
                onClick={shuffleImages} 
                disabled={loading}
                className="px-6 py-3 rounded-xl font-semibold btn-secondary disabled:opacity-50"
              >
                🔄 Shuffle Images
              </button>
              <button 
                onClick={() => setMosaic(Array(20).fill(null))}
                className="px-6 py-3 rounded-xl font-semibold btn-danger"
              >
                🗑️ Clear Mosaic
              </button>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="glass card-shadow rounded-3xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">🖼️ Image Gallery</h2>
            <p className="text-white/70 mb-4">Drag images to the mosaic above</p>
            <div className="image-gallery">
              {images.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  alt={`Image ${i}`}
                  className="gallery-image"
                  draggable
                  onDragStart={(e) => handleDragStart(e, img)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTERPRETATION */}
      {step === 'interpretation' && interpretation && (
        <div className="max-w-4xl mx-auto glass card-shadow rounded-3xl p-8 text-white">
          <h1 className="text-4xl font-extrabold mb-6 text-center">✨ Your Collective Vibe</h1>
          
          <div className="interpretation">
            <h3 className="text-2xl font-bold mb-3">🎭 Mood Analysis</h3>
            <p className="text-lg mb-6 text-white/90 leading-relaxed">{interpretation.mood_description}</p>

            {interpretation.dominant_themes && interpretation.dominant_themes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2">🌟 Dominant Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {interpretation.dominant_themes.map((theme, i) => (
                    <span key={i} className="px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full text-sm">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {interpretation.emotional_reflection && (
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2">💭 Emotional Reflection</h4>
                <p className="text-white/90 leading-relaxed">{interpretation.emotional_reflection}</p>
              </div>
            )}

            {interpretation.story_suggestion && (
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2">📖 Story Possibilities</h4>
                <p className="text-white/90 leading-relaxed">{interpretation.story_suggestion}</p>
              </div>
            )}

            {interpretation.replay_suggestions && interpretation.replay_suggestions.length > 0 && (
              <div>
                <h4 className="text-xl font-semibold mb-2">🎲 Try Next</h4>
                <ul className="space-y-1">
                  {interpretation.replay_suggestions.map((suggestion, i) => (
                    <li key={i} className="text-white/80">• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <button onClick={resetGame} className="px-8 py-3 rounded-xl font-semibold btn-primary">
              🎨 Create Another Mosaic
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
