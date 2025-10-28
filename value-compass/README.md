# Value Compass

A discovery game around personal values and philosophies.

## How to run locally

1. Install dependencies:
```bash
npm install
```

2. Start the dev server:
```bash
npm run dev
```

3. Open http://localhost:3001 in your browser.

## API Endpoints

- `POST /api/next_dilemma` - AI poses a new dilemma
- `POST /api/submit_answers` - Submit both players' answers, get AI comparison
- `POST /api/end_game` - Get final summary and alignment visualization

## Environment Variables

Create `.env.local`:
```
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=groq/compound
```
