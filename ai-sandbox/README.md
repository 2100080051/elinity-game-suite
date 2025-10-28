# 🧪 The AI Sandbox

An open-ended, rule-based creative simulation. Define your theme, style, and rules; ElinityAI evolves the sandbox with actions, rule changes, and emergent shifts.

## Setup

1. Copy `.env.example` to `.env.local` and set:
   - `OPENROUTER_API_KEY=...`
   - `OPENROUTER_MODEL=openai/gpt-oss-20b:free`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3026`
2. Install & run:

```
npm install
npm run dev
```

Visit http://localhost:3026

## API
- `POST /api/sandbox`
  - `setup` → `{ summary, confirmed }`
  - `init` → `{ state, suggestions[] }`
  - `evolve` → `{ state, suggestions[] }`
  - `change_rule` → `{ note, state, suggestions[] }`
  - `describe` → `{ description }`
  - `suggest` → `{ suggestions[] }`
  - `summarize` → `{ summary, snapshot }`
- `GET/POST /api/state` → load/save sandbox state

Server enforces JSON and includes fallbacks to keep UX smooth.
