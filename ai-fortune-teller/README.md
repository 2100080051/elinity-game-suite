# AI Fortune Teller

A whimsical daily oracle that reveals short, uplifting fortunes and a tiny follow-up insight. Built with Next.js, Tailwind CSS, and OpenRouter (with safe local fallbacks when no key is provided).

## Features
- Text-only Elinity branding with ambient starfield and crystal orb
- Share mood/situation/intention to tailor a brief fortune (1–3 lines)
- Ask a follow-up question for a concise clarification
- Save fortunes to an in-memory history for the session
- Works offline (local fallback fortunes) if no API key is configured

## Setup
1. Install dependencies:
```bash
npm install
```
2. Configure environment:
- Copy `.env.local.example` to `.env.local` and fill values (or reuse from another Elinity game).
- If no key is set, the app will use a safe, local fallback so you can still demo.

## Env Vars
- `OPENROUTER_API_KEY` – your OpenRouter key
- `OPENROUTER_MODEL` – optional, defaults to `openrouter/auto`
- `OPENROUTER_BASE_URL` – optional, defaults to `https://openrouter.ai/api/v1`

## Run
- Development (port 3077):
```bash
npm run dev
```
- Production:
```bash
npm run build
npm start
```

## Notes
- History is stored in-memory and resets when the server restarts.
- The oracle avoids sensitive advice by design and keeps responses short and kind.
