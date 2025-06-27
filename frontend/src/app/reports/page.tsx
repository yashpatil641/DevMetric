"use client";

import { useState, useEffect } from "react";
import { getTeam, getLatestEvaluation, getAllEvaluations, StoredEvaluation } from "@/lib/store";

function scoreColor(score: number) {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#60a5fa";
    if (score >= 25) return "#fbbf24";
    return "#f87171";
}

export default function ReportsPage() {
    const [mounted, setMounted] = useState(false);
    const [leaderboard, setLeaderboard] = useState<StoredEvaluation[]>([]);
    const [totalEvals, setTotalEvals] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setMounted(true);

        const team = getTeam();
        const evals: StoredEvaluation[] = [];
        team.forEach((m) => {
            const ev = getLatestEvaluation(m.username);
            if (ev) evals.push(ev);
        });
        evals.sort((a, b) => b.impact_score - a.impact_score);
        setLeaderboard(evals);
        setTotalEvals(getAllEvaluations().length);
    }, []);

    const handleCopyReport = () => {
        if (leaderboard.length === 0) return;

        const lines = [
            "DevMetric Team Report",
            `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
            "",
            "Team Leaderboard:",
            "─────────────────────────────────────────",
            ...leaderboard.map((ev, i) => {
                const name = ev.profile.name || ev.username;
                return `${i + 1}. ${name} (@${ev.username}) — Score: ${ev.impact_score}/100`;
            }),
            "",
            "─────────────────────────────────────────",
            `Average Score: ${leaderboard.length > 0 ? Math.round(leaderboard.reduce((s, e) => s + e.impact_score, 0) / leaderboard.length) : 0}/100`,
            `Team Size: ${leaderboard.length}`,
            `Total Evaluations: ${totalEvals}`,
            "",
            "AI Summaries:",
            "─────────────────────────────────────────",
            ...leaderboard.map((ev) => {
                return `\n@${ev.username}:\n${ev.performance_summary}`;
            }),
        ];

        navigator.clipboard.writeText(lines.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!mounted) return null;

    const avgScore =
        leaderboard.length > 0
            ? Math.round(leaderboard.reduce((s, e) => s + e.impact_score, 0) / leaderboard.length)
            : 0;

    const maxScore = leaderboard.length > 0 ? leaderboard[0].impact_score : 100;

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div className="page-eyebrow">
                    <span className="page-eyebrow-line" />
                    <span className="page-eyebrow-text">Reports</span>
                </div>
                <h1 className="page-title">
                    Team <em>Report</em>
                </h1>
                <p className="page-subtitle">
                    A comparative overview of your team&apos;s developer impact scores.
                </p>
            </div>

            {/* Summary Stats */}
            {leaderboard.length > 0 && (
                <>
                    <div className="dashboard-stats" style={{ marginBottom: 24 }}>
                        <div className="dash-stat">
                            <span className="dash-stat-label">Evaluated</span>
                            <span className="dash-stat-value">{leaderboard.length}</span>
                            <span className="dash-stat-sub">team members</span>
                        </div>
                        <div className="dash-stat">
                            <span className="dash-stat-label">Avg Score</span>
                            <span className="dash-stat-value" style={{ color: scoreColor(avgScore) }}>
                                {avgScore}
                            </span>
                            <span className="dash-stat-sub">out of 100</span>
                        </div>
                        <div className="dash-stat">
                            <span className="dash-stat-label">Highest</span>
                            <span className="dash-stat-value" style={{ color: "#34d399" }}>
                                {leaderboard[0].impact_score}
                            </span>
                            <span className="dash-stat-sub">@{leaderboard[0].username}</span>
                        </div>
                        <div className="dash-stat">
                            <span className="dash-stat-label">Lowest</span>
                            <span className="dash-stat-value" style={{ color: "#f87171" }}>
                                {leaderboard[leaderboard.length - 1].impact_score}
                            </span>
                            <span className="dash-stat-sub">@{leaderboard[leaderboard.length - 1].username}</span>
                        </div>
                    </div>

                    {/* Export */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 28, animation: "fade-up 0.4s var(--ease-out) 0.08s both" }}>
                        <button
                            className="btn-secondary"
                            onClick={handleCopyReport}
                            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                        >
                            {copied ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    Copy Report
                                </>
                            )}
                        </button>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-4)", alignSelf: "center", letterSpacing: "0.04em" }}>
                            {totalEvals} total evaluation{totalEvals !== 1 ? "s" : ""} run
                        </span>
                    </div>

                    {/* Leaderboard */}
                    <div style={{ animation: "fade-up 0.4s var(--ease-out) 0.12s both" }}>
                        <p className="section-label">Leaderboard</p>
                        <div className="leaderboard">
                            {leaderboard.map((ev, i) => {
                                const rankClass =
                                    i === 0
                                        ? "leaderboard-rank--gold"
                                        : i === 1
                                            ? "leaderboard-rank--silver"
                                            : i === 2
                                                ? "leaderboard-rank--bronze"
                                                : "";

                                return (
                                    <div
                                        key={ev.username}
                                        className="leaderboard-item"
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                    >
                                        <span className={`leaderboard-rank ${rankClass}`}>
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <img
                                            src={ev.profile.avatar_url}
                                            alt={ev.username}
                                            className="leaderboard-avatar"
                                        />
                                        <div className="leaderboard-info">
                                            <span className="leaderboard-name">
                                                {ev.profile.name || ev.username}
                                            </span>
                                            <span className="leaderboard-handle">
                                                @{ev.username}
                                            </span>
                                        </div>
                                        <div className="leaderboard-score-bar">
                                            <div
                                                className="leaderboard-score-fill"
                                                style={{
                                                    width: `${(ev.impact_score / maxScore) * 100}%`,
                                                    background: scoreColor(ev.impact_score),
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="leaderboard-score-num"
                                            style={{ color: scoreColor(ev.impact_score) }}
                                        >
                                            {ev.impact_score}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Per-employee Summaries */}
                    <div style={{ marginTop: 32, animation: "fade-up 0.4s var(--ease-out) 0.18s both" }}>
                        <p className="section-label">AI Summaries</p>
                        {leaderboard.map((ev) => (
                            <div
                                key={ev.username}
                                style={{
                                    padding: "20px 0",
                                    borderBottom: "1px solid var(--border)",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                    <img src={ev.profile.avatar_url} alt={ev.username} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)" }} />
                                    <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--text-0)" }}>
                                        {ev.profile.name || ev.username}
                                    </span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-3)" }}>
                                        @{ev.username}
                                    </span>
                                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: scoreColor(ev.impact_score) }}>
                                        {ev.impact_score}
                                    </span>
                                </div>
                                <p style={{
                                    fontSize: "0.78rem",
                                    color: "var(--text-2)",
                                    lineHeight: 1.8,
                                    fontWeight: 300,
                                    paddingLeft: 20,
                                    borderLeft: "2px solid var(--border)",
                                }}>
                                    {ev.performance_summary}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Empty State */}
            {leaderboard.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <h3 className="empty-title">No report data</h3>
                    <p className="empty-text">
                        Add team members and evaluate them to see comparative reports and leaderboards.
                    </p>
                </div>
            )}
        </>
    );
}
