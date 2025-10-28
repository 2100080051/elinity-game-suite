# The Long Journey

A serialized, weekly epic RPG guided by Elinity AI. Each chapter includes a short recap, a vivid new world intro, 3 challenges, and 2–3 allies. Your actions (Accept/Decline) drive narrated outcomes and update a strict JSON session state you can integrate elsewhere.

## Tech
- Next.js 14 (pages router), React 18, Tailwind CSS (aurora/brass theme)
- OpenRouter API for AI (API-only; no offline fallbacks)
- In-memory HMR-safe store (no database yet)

## Environment
Create `.env.local` in this folder with:

```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=openai/gpt-oss-20b:free
# Optional image provider (not enabled by default)
# IMAGE_PROVIDER=openai|stability|replicate
# OPENAI_API_KEY=
# STABILITY_API_KEY=
# REPLICATE_API_TOKEN=
```

Restart the dev server after editing env vars.

## Run

```
npm install
npm run dev
# open http://localhost:3047
```

## API

All responses are JSON. Errors include `{ error }` and appropriate HTTP status codes.

- POST `/api/sessions`
  - Starts a new session/chapter.
  - Body: `{ "title"?: string, "notes"?: string }`
  - Returns: `{ id, chapter_title, recap_markdown, world_markdown, challenges[], allies[], state{}, createdAt, updatedAt }`

- GET `/api/sessions`
  - Lists session timelines: `{ sessions: Array<{ id, createdAt, updatedAt, chapters[] }> }`

- GET `/api/sessions/:id`
  - Snapshot: `{ id, createdAt, updatedAt, chapters, lastMarkdown, state }`

- POST `/api/sessions/:id/progress`
  - Progress with an action (e.g., `"ACCEPT: Cross the crystal bridge"`).
  - Body: `{ action: string }`
  - Returns: `{ id, narration_markdown, state{}, chapter_complete, chapters[], updatedAt }`

## UI
- Home: Project intro and CTAs (Start Chapter, Timeline)
- Play: Recap, world intro, challenges (Accept/Decline), allies, and a session log; posts to progress API
- Timeline: Lists sessions and their chapter summaries; links to snapshot API

## Notes
- API-only: If `OPENROUTER_API_KEY` or model is missing, APIs return 500 with a clear message.
- Strict JSON: If the model includes noise, the server attempts one reformat pass. Persistent failure yields 422.
- Images: Not enabled by default; `lib/image.js` returns 501 until configured.
