# Myth Builder

A premium Next.js app in the Elinity suite. A friendly AI narrator guides players to craft collaborative legends, then archives them in the Book of Legends. Designed with REST endpoints so other apps can orchestrate the flow.

## Features
- Home with Begin Myth, Share & Remix, Book of Legends
- Play: world intro → character draft → story rounds → climax → archive
- Legends Book: grid of saved myths (in-memory + localStorage)
- Robust server fallbacks when OpenRouter is unavailable

## Endpoints
- POST /api/world → { name, theme, intro }
- POST /api/character → body { type, text, world? } → { type, text, note }
- POST /api/round → body { world, characters, rounds, player } → { text }
- POST /api/climax → body { world, characters, rounds } → { climax, moral }
- POST /api/archive → body Legend → persisted Legend
- GET /api/legends → Legend[]
- GET /api/legends/:id → Legend
- DELETE /api/legends/:id → { ok }

Legend model (server):
- { id, title, world, authors[], characters[], rounds[{round,text,votes}], climax, moral, createdAt }

## Env
Create `.env.local`:
```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-oss-20b:free
NEXT_PUBLIC_APP_URL=http://localhost:3041
```

## Run
```powershell
npm install
npm run dev
```
Open http://localhost:3041

## Integration notes
- Orchestrators can drive the experience by calling the endpoints in sequence.
- Storage is in-memory (ephemeral) server-side, with optional browser localStorage on the client. Swap in a DB later without changing the API surface.