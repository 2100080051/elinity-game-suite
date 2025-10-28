# Creative Duel Arena

A competitive, fast-paced creative battle. Each round, ElinityAI drops a new prompt; players respond; AI judges on originality, style, and wit. Live leaderboard, fun rivalry.

## Tech
- Next.js 14 (pages router) + React 18
- Tailwind CSS neon arena theme
- Optional AI via OpenRouter; local fallback judging if no key

## Env
Create `.env.local` with your OpenRouter key, or copy from another app in this suite (recommended for consistency). See `.env.local.example` for fields.

## Run
- Install deps in this folder
- Dev: next dev
- Build: next build; Start: next start -p 3075

## API
- POST /api/start_game { players: string[] }
- POST /api/generate_prompt { id }
- POST /api/submit_entry { id, playerId, entry }
- POST /api/evaluate_round { id }
- GET  /api/state?id=...
- POST /api/end_game { id }
