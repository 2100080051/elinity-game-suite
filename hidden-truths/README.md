# Hidden Truths

A social deduction party game where ElinityAI disguises each player's private answer as a riddle, poem, or art prompt, and everyone guesses whose truth is whose.

## Tech
- Next.js 14 + React 18
- Tailwind CSS
- OpenRouter (JSON-enforced) for poetic encoding

## Environment
Create a `.env.local` file with your OpenRouter credentials (these override `.env.example`):

```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openai/gpt-oss-20b:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1/chat/completions
NEXT_PUBLIC_APP_URL=http://localhost:3030
```

## Run

```
npm install
npm run dev
# http://localhost:3030
```

## Gameplay Flow
1. Title: add players and start a round.
2. Question: each player answers privately.
3. Encoding: AI disguises answers into riddles/poems/art prompts.
4. Guessing: guess whose truth is whose (optional timer).
5. Reveal: unveil owners and recap with warmth.

## Notes
- Rounds are saved to `hidden_truths_rounds.json` via `POST /api/rounds` (ignored by git).
- Styling uses a dreamy indigo→violet theme with soft gold accents and sparkles.
