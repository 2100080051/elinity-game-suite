# The Hidden Question

A fast‑paced deduction game: one secret questioner, everyone else asks yes/no questions to tease out the hidden query. The AI drops hints after misses.

## Run

- Copy `.env.local` from another app in this monorepo (contains OPENROUTER_API_KEY and OPENROUTER_MODEL).
- Install deps and run:

```sh
npm install
npm run dev
```

Open http://localhost:3061

## Notes
- Unique corkboard/sticky-notes theme; no reused styles from other games.
- In-memory store (non-persistent). Good for local play.
- 20s timer UI only; it won’t auto-submit.
