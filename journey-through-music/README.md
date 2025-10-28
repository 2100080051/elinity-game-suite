# Journey through Music

A meditative, music-driven sandbox. Paste a playlist (optional), pick a mood, and watch a living canvas evolve with gentle narration and suggestions.

## Tech
- Next.js 14 (pages router) + React 18
- Tailwind CSS for subtle ambient UI
- Optional AI via OpenRouter with safe local fallback

## Env
Create `.env.local` (you can copy from any existing app in this suite) or use the example:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Without a key, the app gracefully uses a local generator.

## Run
- Install deps in this folder
- Dev: next dev
- Build: next build; Start: next start -p 3073

## API
- POST /api/session/start { playlistUrl, mood }
- GET  /api/session/[id]
- POST /api/session/[id]/tick
- POST /api/session/[id]/command { command }
- GET  /api/state
