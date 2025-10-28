# Character Swap

Role-play game where players swap personalities and act out scenarios. AI moderates and scores humor, empathy, and consistency.

## Env
Create `.env.local` in this folder:

```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=minimax/minimax-m2:free
```

## Run

```powershell
npm install
npm run dev
```

## API
- POST `/api/session` { players[] } => { session }
- GET `/api/session/[id]` => { session }
- POST `/api/session/[id]/submit` { player_id, text } => { session }
- POST `/api/session/[id]/score` => { session, feedback_markdown, result }
- POST `/api/session/[id]/next` => { session }

All AI calls go through OpenRouter only. JSON parsing is sanitized and strict.
