# 🏰 AI Adventure Dungeon — Explore, Improvise, Survive

Fantasy co-op storytelling RPG with ElinityAI as your playful Dungeon Master. Each run generates unique rooms, creatures, and twists.

## Setup

1. Copy `.env.example` → `.env.local` and set:
   - `OPENROUTER_API_KEY=...`
   - `OPENROUTER_MODEL=openai/gpt-oss-20b:free`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3027`
2. Install & run:

```
npm install
npm run dev
```

Visit http://localhost:3027

## Features
- Premium glass UI with gradient headings and torch ambience
- Ambient audio toggle and on-screen dice visual for luck rolls
- Theme selector (ruins, ice temple, forest labyrinth, clockwork citadel)
- Keyboard shortcuts: 1–5 to trigger quick actions
- Continue last run with local JSON persistence

## API
- `POST /api/dungeon`
  - `start` → `{ intro }`
  - `floor` → `{ title, theme, rooms[] }`
  - `act` → `{ narration, stats, rooms?, finished?, roll }`
  - `status` → `{ tick }`
  - `end` → `{ summary }`
- `GET/POST /api/run` → load/save last run JSON

Responses enforce JSON via `response_format` and robust parsing; fallbacks included.
