# 📖 Journey Journal

A serene, story-like journaling game for friends, couples, or groups. ElinityAI guides reflective prompts and weaves entries into a poetic chapter each session.

## Setup

1. Copy `.env.example` to `.env.local` and set:
   - `OPENROUTER_API_KEY=...`
   - `OPENROUTER_MODEL=openai/gpt-oss-20b:free`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3024`
2. Install & run:

```
npm install
npm run dev
```

Visit http://localhost:3024

## API
- `POST /api/journey` actions:
  - `start` → `{ title, intro, prompts[] }`
  - `summarize` → `{ summary }`
  - `recap` → `{ recap }`
- `GET /api/chapters` → `{ chapters: [...] }`
- `POST /api/chapters` → save chapter payload

## Data
- Chapters are saved to `journey_journal.json` in the app root during local dev (gitignored). On stateless hosts, prefer client storage or an external DB.
