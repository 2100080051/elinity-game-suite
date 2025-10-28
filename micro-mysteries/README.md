# 🕵️ Micro-Mysteries

**Solve It If You Can!**

A short-form, AI-generated detective game where players become sleuths trying to crack mini-mysteries in 5–10 minutes.

## 🎮 Game Description

Each round, ElinityAI sets up a compact mystery scene — a missing item, a suspicious guest, a strange event — and then roleplays as the "witness" or suspect.

Players must interrogate, ask clever questions, and deduce what really happened before revealing their final theory.

The AI then confirms whether the players' deduction is correct and delivers a clever wrap-up — sometimes witty, sometimes surprising.

**Every case is unique, ensuring endless replay value and fast fun for groups or solo detectives!**

## 🎨 Features

- **AI-Generated Mysteries**: Each case is unique and solvable
- **Interactive Interrogation**: Ask the witness anything you want
- **Quick-Ask Buttons**: Fast-track common questions
- **Witty AI Responses**: Clues mixed with red herrings
- **Instant Reveals**: Find out if you cracked the case
- **Beautiful Detective Noir UI**: Vintage parchment meets modern design

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- An API key from either:
  - [Groq](https://console.groq.com/) (recommended - faster)
  - [OpenRouter](https://openrouter.ai/)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   
   Create a `.env` file in the root directory:
   ```bash
   # Use Groq (recommended)
   GROQ_API_KEY=your_groq_api_key_here
   
   # OR use OpenRouter
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3019](http://localhost:3019)

## 🎯 How to Play

1. **Start a Mystery**: Click "Start New Mystery" to generate a unique case
2. **Interrogate**: Ask the witness questions using quick buttons or custom queries
3. **Gather Clues**: Listen carefully - clues are mixed with distractions!
4. **Submit Theory**: Write your deduction and reveal the solution
5. **Get Verdict**: Find out if you solved it and see the real answer
6. **Play Again**: Each mystery is different!

## 🎨 Design & Themes

**Visual Style:**
- Vintage detective noir aesthetic
- Amber/navy color palette
- Parchment-style cards
- Magnifying glass hover effects
- Dramatic reveal animations

**Mystery Genres:**
- Everyday mysteries (missing phone, broken window)
- Comedic (who ate the last donut?)
- Whimsical (time-travel accident in 3020)
- Classic noir (mysterious letter, late-night theft)

## 🤖 AI System

**Powered by ElinityAI**, the game master uses advanced language models to:
- Generate unique mysteries every time
- Roleplay as witnesses with vivid personalities
- Provide fair, solvable puzzles with subtle clues
- Deliver witty reveals and satisfying conclusions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS + Custom CSS
- **AI**: Groq API or OpenRouter
- **Model**: Llama 3.1 70B

## 📝 API Endpoints

- `POST /api/start_mystery` - Generate a new mystery
- `POST /api/ask_question` - Ask the witness a question
- `POST /api/reveal_solution` - Submit guess and get verdict

## 🎮 Game Modes

- **Solo Detective**: Solve cases on your own
- **Group Investigation**: Work together to crack the mystery
- **Speed Runs**: How fast can you solve 5 mysteries?

## 🔧 Configuration

Edit `package.json` to change the port:
```json
"scripts": {
  "dev": "next dev -p 3019"
}
```

## 🎭 Created By

**ElinityAI** - Making AI-powered social games fun and accessible!

---

**Ready to crack the case, detective?** 🔍✨
