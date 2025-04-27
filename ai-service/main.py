"""
DevMetric AI Microservice
─────────────────────────
Receives raw GitHub data, feeds it to Gemini via LangChain,
and returns a structured developer evaluation.
"""

import json
import os
import re

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

# ────────────────── Pydantic models ──────────────────

class GitHubProfile(BaseModel):
    login: str = ""
    name: str | None = None
    public_repos: int = 0
    followers: int = 0
    following: int = 0
    created_at: str = ""
    bio: str | None = None

class GitHubEvent(BaseModel):
    type: str = ""
    repo: Any = None
    created_at: str = ""

class AnalyzeRequest(BaseModel):
    username: str
    profile: GitHubProfile
    events: list[GitHubEvent] = []

class EvaluationResult(BaseModel):
    impact_score: int = Field(..., ge=1, le=100, description="Developer impact score from 1 to 100")
    performance_summary: str = Field(..., description="Qualitative paragraph of feedback")

# ────────────────── LangChain setup ──────────────────

SYSTEM_PROMPT = """You are a senior engineering manager at a top-tier tech company.
You are evaluating a developer based on their public GitHub activity data.

Analyze the raw data provided and produce a JSON object with exactly two keys:
- "impact_score": an integer from 1 to 100 representing the developer's overall impact and productivity.
- "performance_summary": a short paragraph (3-5 sentences) of qualitative feedback covering strengths, areas for improvement, and notable patterns.

Consider these factors:
• Number of public repositories (quantity and breadth)
• Follower and following counts (community impact)
• Account age (experience level)
• Recent event types and frequency (PushEvent, PullRequestEvent, CreateEvent, etc.)
• Diversity of activity across repos
• Consistency and recency of contributions

Be fair, constructive, and data-driven. DO NOT inflate scores. A score of 50 is average.
Return ONLY the JSON object, no extra text."""

HUMAN_PROMPT = """Here is the GitHub data for user "{username}":

## Profile
{profile_json}

## Recent Events (last 30)
{events_json}

Provide your evaluation as a JSON object."""

def build_chain():
    """Build the LangChain evaluation chain."""
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0.4,
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", HUMAN_PROMPT),
    ])
    parser = JsonOutputParser(pydantic_object=EvaluationResult)
    return prompt | llm | parser

chain = build_chain()

# ────────────────── FastAPI app ──────────────────

app = FastAPI(
    title="DevMetric AI Service",
    description="Evaluates developer productivity using LLM analysis of GitHub data.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=EvaluationResult)
async def analyze(data: AnalyzeRequest):
    """Analyze GitHub data and return a developer evaluation."""
    if not os.getenv("GOOGLE_API_KEY"):
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not configured")

    # Prepare readable JSON strings for the prompt
    profile_dict = data.profile.model_dump()
    events_summary = []
    for e in data.events[:30]:
        repo_name = ""
        if isinstance(e.repo, dict):
            repo_name = e.repo.get("name", "")
        elif isinstance(e.repo, str):
            repo_name = e.repo
        events_summary.append({
            "type": e.type,
            "repo": repo_name,
            "created_at": e.created_at,
        })

    try:
        result = await chain.ainvoke({
            "username": data.username,
            "profile_json": json.dumps(profile_dict, indent=2),
            "events_json": json.dumps(events_summary, indent=2),
        })

        # Validate and clamp score
        score = int(result.get("impact_score", 50))
        score = max(1, min(100, score))

        summary = result.get("performance_summary", "No summary available.")

        return EvaluationResult(
            impact_score=score,
            performance_summary=summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
