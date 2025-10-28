# Emotion Labyrinth (Node Edition)

A minimalist Node + Express implementation (no React) of Emotion Labyrinth.

## Quick start (Windows PowerShell)

1. Create your env file (optional for offline mode):

   - Copy `.env.example` to `.env` and add your OpenRouter key/model

2. Install deps and run:

```powershell
cd "c:\Users\nabhi\Downloads\elinity game suite\emotion-labyrinth-node"
npm install
npm run dev
```

Then open http://localhost:3035

If 3035 is busy, set `PORT=3036` in `.env` and re-run.

## Env variables

- OPENROUTER_API_KEY=your_openrouter_key
- OPENROUTER_MODEL=gpt-4o-mini (example) or another OpenRouter-supported model
- PORT=3035

## Notes

- Buttons show a quick loading state to avoid the “late” feeling.
- If no env key is set, the app uses an offline fallback narrative with varied artifacts by emotion.
- When the server starts, it logs whether AI is ON or OFF. Look for a line like:
   - `AI: ON (model=gpt-4o-mini)` or `AI: OFF (using offline fallback)`
