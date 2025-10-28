# AI Escape Room

Co‑op, AI‑driven puzzle‑solving with a dynamic locked‑room scenario and a live countdown.

## Features
- API‑only AI via OpenRouter (no offline fallbacks)
- Create/Join rooms, live timer, clue ledger, hints, points
- Strict JSON parsing for answer validation; clear errors on failure
- Optional ambient image (no placeholders)

## Environment
Create `.env.local` with:

```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=openai/gpt-oss-20b:free
# Optional image generation provider
# IMAGE_PROVIDER=openai|stability|replicate
# OPENAI_API_KEY=...
# STABILITY_API_KEY=...
# REPLICATE_API_TOKEN=...
```

## Endpoints
- POST /api/rooms → create room
- GET /api/rooms → list rooms (Saved Plays)
- POST /api/rooms/join → { id }
- GET /api/rooms/[id] → room snapshot (scenario, time_left, clues, points)
- POST /api/rooms/[id]/clue → adds a single‑line clue
- POST /api/rooms/[id]/hint → returns a gentle hint
- POST /api/rooms/[id]/answer → evaluates answer; returns narration (text)

## Run
- Install deps, run dev on port 3045