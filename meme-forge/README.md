# Meme Forge

A light‑hearted, quick‑fire AI meme‑creation game. The AI supplies a prompt (image idea + seed phrase), players add captions, and the app renders meme images by overlaying text on a colorful prompt background. Everyone votes; the funniest wins; then loop to the next round.

## Stack
- Next.js 14 (pages router), React 18, Tailwind CSS (bold/playful theme)
- OpenRouter for AI prompt generation (API‑only)
- HMR‑safe in‑memory store (no database)

## Environment
Copy from a previous game or create `.env.local`:
```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=minimax/minimax-m2:free
```

## Run
```
npm install
npm run dev
# open http://localhost:3049
```

## API
- POST `/api/rounds` → `{ round_id, prompt{ image_idea, seed_phrase, thumb }, captions[], memes[], votes[], winner, markdown }`
- GET `/api/rounds` → `{ rounds: [{ id, createdAt, updatedAt, winner }] }`
- GET `/api/rounds/:id` → snapshot
- POST `/api/rounds/:id/caption` body `{ text, author? }` → appends caption, returns generated meme `{ id, caption_id, url }`
- POST `/api/rounds/:id/vote` body `{ meme_id, delta(±1), voter? }` → records a vote
- POST `/api/rounds/:id/finalize` → tallies votes, returns `{ winner, leaderboard[], markdown }`

Images are generated as SVG data URLs on the server (no external image provider needed).