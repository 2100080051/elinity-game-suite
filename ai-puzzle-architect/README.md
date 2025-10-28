# AI Puzzle Architect

On-demand word, image, or logic puzzles with adaptive difficulty. Single or group play.

## Run

1. Create `.env.local` in this folder with:

```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=minimax/minimax-m2:free
```

2. Install and start

```powershell
npm install
npm run dev
```

## API

- POST `/api/generate` { type, difficulty_preference, mode?, players?, session_id? }
  - => { session, puzzle }
- GET `/api/puzzle?id=...`
  - => { puzzle, session }
- POST `/api/submit` { player_id, puzzle_id, answer }
  - => { result, feedback_markdown }
- POST `/api/next` { session_id, last_result, fallback }
  - => { session, puzzle }

All AI calls route through OpenRouter; no local fallbacks.
