"use client";

import { useState, useEffect, useCallback } from "react";
import { evaluateUser, EvaluationResult } from "@/lib/api";
import { saveEvaluation, isOnTeam, addEmployee } from "@/lib/store";
import ScoreRing from "@/components/ScoreRing";
import StatCard from "@/components/StatCard";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`skeleton ${className}`} />;
}

function Loading() {
    return (
        <div className="loading-card">
            <div className="loading-header">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="loading-meta">
                    <Skeleton className="h-3.5 w-36 mb-2" />
                    <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="w-20 h-20 rounded-full" />
            </div>
            <Skeleton className="h-px w-full mb-6" />
            <div className="loading-lines">
                <Skeleton className="h-2.5 w-full mb-2" />
                <Skeleton className="h-2.5 w-11/12 mb-2" />
                <Skeleton className="h-2.5 w-3/4" />
            </div>
            <div className="loading-stats">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
            <div className="loading-pulse-text">
                <span>Analyzing repository activity</span>
                <span className="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                </span>
            </div>
        </div>
    );
}

export default function EvaluatePage() {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EvaluationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [animScore, setAnimScore] = useState(0);
    const [onTeam, setOnTeam] = useState(false);

    useEffect(() => {
        if (!result) { setAnimScore(0); return; }
        const target = result.impact_score;
        let cur = 0;
        const step = Math.max(8, Math.floor(1600 / target));
        const t = setInterval(() => {
            cur++;
            setAnimScore(cur);
            if (cur >= target) clearInterval(t);
        }, step);
        return () => clearInterval(t);
    }, [result]);

    useEffect(() => {
        if (result) {
            setOnTeam(isOnTeam(result.username));
        }
    }, [result]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;
        setLoading(true); setError(null); setResult(null);
        try {
            const res = await evaluateUser(username);
            saveEvaluation(res);
            setResult(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [username]);

    const handleAddToTeam = () => {
        if (result) {
            addEmployee(result.username);
            setOnTeam(true);
        }
    };

    const years = result
        ? new Date().getFullYear() - new Date(result.profile.created_at).getFullYear()
        : 0;

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div className="page-eyebrow">
                    <span className="page-eyebrow-line" />
                    <span className="page-eyebrow-text">Quick Evaluate</span>
                </div>
                <h1 className="page-title">
                    Developer <em>Impact Score</em>
                </h1>
                <p className="page-subtitle">
                    Enter a GitHub username to generate an AI-driven analysis of public activity and open source contribution.
                </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSubmit} className="input-group" style={{ marginBottom: 32, animation: "fade-up 0.4s var(--ease-out) 0.08s both" }}>
                <div className="input-wrap">
                    <span className="input-prefix">@</span>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="username"
                        disabled={loading}
                        id="github-username-input"
                        className="input"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !username.trim()}
                    id="generate-evaluation-btn"
                    className="btn-primary"
                >
                    {loading ? "Analyzing…" : "Analyze →"}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="error-box">
                    <svg style={{ marginTop: 1, flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && <Loading />}

            {/* Result */}
            {result && !loading && (
                <div style={{ animation: "scale-in 0.4s var(--ease-out) both" }}>
                    {/* Profile header */}
                    <div className="profile-header">
                        {result.profile.avatar_url && (
                            <img src={result.profile.avatar_url} alt={result.profile.login} className="avatar" />
                        )}
                        <div className="profile-info">
                            <h2 className="profile-name">{result.profile.name || result.username}</h2>
                            <a
                                href={`https://github.com/${result.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="profile-handle"
                            >
                                @{result.username}
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M7 17L17 7M7 7h10v10" />
                                </svg>
                            </a>
                            {result.profile.bio && <p className="profile-bio">{result.profile.bio}</p>}
                        </div>
                        <ScoreRing score={animScore} />
                    </div>

                    {/* Add to team */}
                    {!onTeam && (
                        <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border)", animation: "fade-up 0.3s var(--ease-out) both" }}>
                            <button onClick={handleAddToTeam} className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                                Add to Team
                            </button>
                        </div>
                    )}
                    {onTeam && (
                        <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#34d399", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                On your team
                            </span>
                        </div>
                    )}

                    {/* Stats */}
                    <div style={{ padding: "28px 0 8px" }}>
                        <p className="section-label">Profile Statistics</p>
                        <div className="stats-grid">
                            <StatCard label="Repos" value={result.profile.public_repos} index={0} />
                            <StatCard label="Followers" value={result.profile.followers} index={1} />
                            <StatCard label="Following" value={result.profile.following} index={2} />
                            <StatCard label="Experience" value={years} suffix={years === 1 ? "yr" : "yrs"} index={3} />
                        </div>
                    </div>

                    {/* AI Summary */}
                    <div className="summary-section">
                        <p className="section-label">AI Analysis</p>
                        <p className="summary-text">{result.performance_summary}</p>
                    </div>

                    {/* Meta */}
                    <div className="result-meta">
                        <div className="meta-score">
                            <span className="meta-score-num">{result.impact_score}</span>
                            <span className="meta-score-denom">/ 100</span>
                        </div>
                        <span className="meta-date">
                            {new Date(result.evaluated_at).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                            })}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
