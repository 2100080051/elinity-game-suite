# Cultural Exchange

An AI-powered interactive storytelling platform to explore and dramatize rituals, myths, and everyday practices from cultures around the world. Article-style, single-column UI; soft paper theme; bubbles for AI vs player; role deck; facts tooltips; learning flashcards.

## Stack
- Next.js 14 (pages router), React 18, Tailwind CSS (paper/ink/sky/gold palette)
- OpenRouter for AI (API-only)
- HMR-safe in-memory sessions

## Env
```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=minimax/minimax-m2:free
```

## Run
```
npm install
npm run dev
# http://localhost:3053
```

## API
- POST `/api/session` → start session; returns `{ id, culture, markdown, roles[] }`
- GET `/api/session/:id` → snapshot `{ session, markdown? }`
- POST `/api/session/:id/role` body `{ player_id, role }` → claim role; returns `{ session }`
- POST `/api/session/:id/turn` body `{ player_id, role, action_text }` → returns `{ turn_number, player_id, action_text, ai_response_text, markdown, session }`

Notes: AI returns Markdown sections (Hook, Roles, Player Turn, AI Adaptation, Learning Flashcard). Facts are accumulated and appear as tooltips on AI bubbles.