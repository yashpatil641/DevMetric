# DevMetric

DevMetric is an AI-powered developer productivity tool that evaluates public GitHub activity and generates quantified impact scores with detailed performance narratives. Built for engineering managers who want data-driven insight into their team's.

---

## Technologies Used

**Frontend**
- Next.js 16, React 19, TypeScript
- Tailwind CSS

**Gateway**
- Go, Gin framework
- Firebase / Firestore

**AI Service**
- Python, FastAPI
- LangChain, Google Gemini

---

## Architecture

```
┌───────────────┐   GET /api/evaluate   ┌──────────────┐   POST /analyze    ┌───────────────┐
│   Next.js     │ ───────────────────►  │  Go Gateway  │  ───────────────►  │  Python AI    │
│   Frontend    │ ◄───────────────────  │  (Gin)       │  ◄───────────────  │  Service      │
│               │    evaluation JSON    │              │   score + summary  │  (FastAPI)    │
└───────────────┘                       │ ┌──────────┐ │                    │               │
                                        │ │Firestore │ │                    │               │
                                        │ └──────────┘ │                    │  LangChain +  │
                                        └──────────────┘                    │  Gemini       │
                                                                            └───────────────┘
```

The frontend sends a username to the Go gateway, which fetches the user's GitHub profile and recent events, forwards the raw data to the Python AI service, receives a structured score and summary from Gemini, persists the result to Firestore, and returns the full evaluation to the frontend.

---

## Features

- **Impact Scoring** — Produces a 1–100 developer impact score calibrated so 50 is average, not inflated.
- **Performance Narratives** — Gemini writes a concise 3–5 sentence qualitative summary covering strengths, patterns, and areas for improvement.
- **Team Dashboard** — Track and compare multiple developers, surface top contributors, and identify who needs support.
- **Historical Tracking** — Every evaluation is stored in Firestore so you can view score changes over time.


---

## Installation

**1. AI Service**

```bash
cd ai-service
cp .env.example .env       # Add your GOOGLE_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload  
```

**2. Gateway**

```bash
cd gateway
cp .env.example .env       # Optionally set FIREBASE_CREDENTIALS_PATH
go run main.go             
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev                
```

**Environment Variables**

| Service | Variable | Description |
|---|---|---|
| AI Service | `GOOGLE_API_KEY` | Google AI Studio key for Gemini |
| AI Service | `GEMINI_MODEL` | Model name (default: `gemini-2.5-flash-lite`) |
| Gateway | `PORT` | Server port (default: `8080`) |
| Gateway | `AI_SERVICE_URL` | AI service URL (default: `http://localhost:8000`) |
| Gateway | `FIREBASE_CREDENTIALS_PATH` | Path to Firebase service-account JSON |

---

## How to Use

1. Open **https://dev-metric-jet.vercel.app** in your browser.
2. Navigate to the **Evaluate** page.
3. Enter any public GitHub username and submit.
4. DevMetric fetches the profile, sends it to Gemini, and returns an impact score with a performance summary within ~30 seconds.
5. Use the **Dashboard** to add multiple team members and compare their scores side by side.


