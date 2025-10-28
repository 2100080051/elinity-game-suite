# Dream Battles

Turn one-line dream fragments into surreal, illustrated battle cards—and let Elinity AI narrate epic duels.

## Features
- API-only AI via OpenRouter (no offline fallbacks)
- Card generation from dream fragments (title + description JSON)
- Optional image generation via pluggable provider (no placeholders)
- Turn-based duels with plain-text narration and a winner header
- Leaderboard that awards 1 Dream Point per victory

## Environment
Create `.env.local` with:

```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=openai/gpt-oss-20b:free
# Optional image generation
# IMAGE_PROVIDER=openai|stability|replicate
# OPENAI_API_KEY=...
# STABILITY_API_KEY=...
# REPLICATE_API_TOKEN=...
```

If image provider is not configured, cards will be created without images (no mock).

## Endpoints
- POST /api/cards → { fragment, player } → 201 JSON card
- GET /api/cards → list cards
- GET /api/cards/[id] → get card
- DELETE /api/cards/[id] → delete card
- POST /api/battle/narrate → { a_id, b_id } → text/plain, first line `WINNER: <id>`
- POST /api/battle/score → { winner_id, winner_player } → JSON with current leaderboard
- GET /api/leaderboard → JSON standings

## Run
- Install deps
- Dev server on port 3043

## Notes
- All AI generations require valid API keys; failures return 4xx/5xx with clear errors.
- UIs do not fabricate content or images.