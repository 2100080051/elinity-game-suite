# 🧠 Mind Meld — How Aligned Are You?

A fast, lighthearted guessing game hosted by ElinityAI. Players guess what the other person would choose in a category; matches score points, partials earn half.

## Setup

1. Copy `.env.example` to `.env.local` and set:
   - `OPENROUTER_API_KEY=...`
   - `OPENROUTER_MODEL=openai/gpt-oss-20b:free`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3025`
2. Install & run:

```
npm install
npm run dev
```

Visit http://localhost:3025

## API
- `POST /api/mindmeld`
  - `action: "category"` → `{ category }`
  - `action: "judge"` → `{ match, partial, points, reaction }`
  - `action: "summary"` → `{ title, summary }`

The server enforces JSON and has sensible fallbacks.
