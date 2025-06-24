"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getEvaluationsForUser, saveEvaluation, isOnTeam, addEmployee, removeEmployee } from "@/lib/store";
import { evaluateUser, EvaluationResult } from "@/lib/api";
import ScoreRing from "@/components/ScoreRing";
import StatCard from "@/components/StatCard";

function scoreColor(score: number) {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#60a5fa";
    if (score >= 25) return "#fbbf24";
    return "#f87171";
}

export default function EmployeeDetailPage() {
    const { username } = useParams<{ username: string }>();

    const [mounted, setMounted] = useState(false);
    const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
    const [latest, setLatest] = useState<EvaluationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [animScore, setAnimScore] = useState(0);
    const [onTeam, setOnTeam] = useState(false);

    const refreshData = useCallback(() => {
        const evals = getEvaluationsForUser(username);
        const sorted = evals.sort(
            (a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
        );
        setEvaluations(sorted);
        setLatest(sorted[0] || null);
        setOnTeam(isOnTeam(username));
    }, [username]);

    useEffect(() => {
        setMounted(true);
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        if (!latest) { setAnimScore(0); return; }
        const target = latest.impact_score;
        let cur = 0;
        const step = Math.max(8, Math.floor(1600 / target));
        const t = setInterval(() => {
            cur++;
            setAnimScore(cur);
            if (cur >= target) clearInterval(t);
        }, step);
        return () => clearInterval(t);
    }, [latest]);

    const handleEvaluate = async () => {
        setLoading(true); setError(null);
        try {
            const result = await evaluateUser(username);
            saveEvaluation(result);
            refreshData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Evaluation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTeam = () => {
        if (onTeam) {
            removeEmployee(username);
        } else {
            addEmployee(username);
        }
        setOnTeam(!onTeam);
    };

    if (!mounted) return null;

    const years = latest
        ? new Date().getFullYear() - new Date(latest.profile.created_at).getFullYear()
        : 0;

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div className="page-eyebrow">
                    <span className="page-eyebrow-line" />
                    <span className="page-eyebrow-text">Employee Detail</span>
                </div>
                <h1 className="page-title">
                    @{username}
                </h1>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28, animation: "fade-up 0.4s var(--ease-out) 0.06s both" }}>
                <button
                    className="btn-primary"
                    onClick={handleEvaluate}
                    disabled={loading}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                    {loading ? (
                        <><span className="spinner" /> Evaluating…</>
                    ) : (
                        <>{evaluations.length > 0 ? "Re-evaluate" : "Evaluate Now"} →</>
                    )}
                </button>
                <button
                    className="btn-secondary"
                    onClick={handleToggleTeam}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                    {onTeam ? (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            On Team
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add to Team
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="error-box">
                    <svg style={{ marginTop: 1, flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Latest Result */}
            {latest && (
                <div style={{ animation: "fade-up 0.4s var(--ease-out) 0.1s both" }}>
                    <div className="detail-profile">
                        <img src={latest.profile.avatar_url} alt={username} className="detail-avatar" />
                        <div style={{ flex: 1 }}>
                            <h2 className="detail-name">{latest.profile.name || username}</h2>
                            <a
                                href={`https://github.com/${username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="detail-handle"
                            >
                                @{username}
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M7 17L17 7M7 7h10v10" />
                                </svg>
                            </a>
                            {latest.profile.bio && <p className="detail-bio">{latest.profile.bio}</p>}
                        </div>
                        <ScoreRing score={animScore} />
                    </div>

                    {/* Stats */}
                    <div style={{ padding: "28px 0 8px" }}>
                        <p className="section-label">Profile Statistics</p>
                        <div className="stats-grid">
                            <StatCard label="Repos" value={latest.profile.public_repos} index={0} />
                            <StatCard label="Followers" value={latest.profile.followers} index={1} />
                            <StatCard label="Following" value={latest.profile.following} index={2} />
                            <StatCard label="Experience" value={years} suffix={years === 1 ? "yr" : "yrs"} index={3} />
                        </div>
                    </div>

                    {/* AI Summary */}
                    <div className="summary-section">
                        <p className="section-label">AI Analysis</p>
                        <p className="summary-text">{latest.performance_summary}</p>
                    </div>
                </div>
            )}

            {/* No data yet */}
            {!latest && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <h3 className="empty-title">No evaluation data</h3>
                    <p className="empty-text">
                        Click &quot;Evaluate Now&quot; to run the first AI-powered analysis for this developer.
                    </p>
                </div>
            )}

            {/* Evaluation History */}
            {evaluations.length > 1 && (
                <div className="history-section">
                    <p className="section-label">Evaluation History</p>
                    {evaluations.map((ev, i) => (
                        <div
                            key={`${ev.evaluated_at}-${i}`}
                            className="history-item"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <span className="history-score" style={{ color: scoreColor(ev.impact_score) }}>
                                {ev.impact_score}
                            </span>
                            <span className="history-summary">{ev.performance_summary}</span>
                            <span className="history-date">
                                {new Date(ev.evaluated_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
