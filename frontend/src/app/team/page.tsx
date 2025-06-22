"use client";

import { useState, useEffect, useCallback } from "react";
import { getTeam, addEmployee, removeEmployee, getLatestEvaluation, saveEvaluation, TeamMember, StoredEvaluation } from "@/lib/store";
import { evaluateUser } from "@/lib/api";
import Link from "next/link";

function scoreColor(score: number) {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#60a5fa";
    if (score >= 25) return "#fbbf24";
    return "#f87171";
}

export default function TeamPage() {
    const [mounted, setMounted] = useState(false);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [newUsername, setNewUsername] = useState("");
    const [evals, setEvals] = useState<Map<string, StoredEvaluation>>(new Map());
    const [evaluating, setEvaluating] = useState<Set<string>>(new Set());
    const [bulkEvaluating, setBulkEvaluating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshData = useCallback(() => {
        const t = getTeam();
        setTeam(t);
        const evalMap = new Map<string, StoredEvaluation>();
        t.forEach((m) => {
            const ev = getLatestEvaluation(m.username);
            if (ev) evalMap.set(m.username.toLowerCase(), ev);
        });
        setEvals(evalMap);
    }, []);

    useEffect(() => {
        setMounted(true);
        refreshData();
    }, [refreshData]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim()) return;
        const clean = newUsername.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/+$/, "");
        addEmployee(clean);
        setNewUsername("");
        refreshData();
    };

    const handleRemove = (username: string) => {
        removeEmployee(username);
        refreshData();
    };

    const handleEvaluate = async (username: string) => {
        setEvaluating((prev) => new Set(prev).add(username));
        setError(null);
        try {
            const result = await evaluateUser(username);
            saveEvaluation(result);
            refreshData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to evaluate");
        } finally {
            setEvaluating((prev) => {
                const next = new Set(prev);
                next.delete(username);
                return next;
            });
        }
    };

    const handleBulkEvaluate = async () => {
        setBulkEvaluating(true);
        setError(null);
        for (const member of team) {
            try {
                setEvaluating((prev) => new Set(prev).add(member.username));
                const result = await evaluateUser(member.username);
                saveEvaluation(result);
                refreshData();
            } catch {
                // continue to next employee
            } finally {
                setEvaluating((prev) => {
                    const next = new Set(prev);
                    next.delete(member.username);
                    return next;
                });
            }
        }
        setBulkEvaluating(false);
    };

    if (!mounted) return null;

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div className="page-eyebrow">
                    <span className="page-eyebrow-line" />
                    <span className="page-eyebrow-text">Team Management</span>
                </div>
                <h1 className="page-title">
                    Your <em>Team</em>
                </h1>
                <p className="page-subtitle">
                    Add employees by their GitHub username. Evaluate them individually or all at once.
                </p>
            </div>

            {/* Add Form */}
            <form onSubmit={handleAdd} className="input-group" style={{ marginBottom: 24, animation: "fade-up 0.4s var(--ease-out) 0.06s both" }}>
                <div className="input-wrap">
                    <span className="input-prefix">@</span>
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="github-username"
                        className="input"
                        id="add-employee-input"
                    />
                </div>
                <button type="submit" className="btn-primary" disabled={!newUsername.trim()} id="add-employee-btn">
                    Add to Team
                </button>
            </form>

            {error && (
                <div className="error-box">
                    <svg style={{ marginTop: 1, flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Bulk Actions */}
            {team.length > 0 && (
                <div style={{ display: "flex", gap: 12, marginBottom: 24, animation: "fade-up 0.4s var(--ease-out) 0.1s both" }}>
                    <button
                        className="btn-secondary"
                        onClick={handleBulkEvaluate}
                        disabled={bulkEvaluating}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                    >
                        {bulkEvaluating ? (
                            <>
                                <span className="spinner" />
                                Evaluating All…
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Evaluate All ({team.length})
                            </>
                        )}
                    </button>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-4)", alignSelf: "center", letterSpacing: "0.04em" }}>
                        {team.length} member{team.length !== 1 ? "s" : ""}
                    </span>
                </div>
            )}

            {/* Team Grid */}
            {team.length > 0 ? (
                <div className="employee-grid" style={{ animation: "fade-up 0.4s var(--ease-out) 0.14s both" }}>
                    {team.map((member) => {
                        const ev = evals.get(member.username.toLowerCase());
                        const isEvaluating = evaluating.has(member.username);

                        if (ev) {
                            return (
                                <div key={member.username} className="employee-card" style={{ animationDelay: "0s" }}>
                                    <Link
                                        href={`/employee/${member.username}`}
                                        style={{ textDecoration: "none", color: "inherit" }}
                                    >
                                        <div className="employee-card-top">
                                            <img src={ev.profile.avatar_url} alt={member.username} className="employee-avatar" />
                                            <div className="employee-info">
                                                <span className="employee-name">{ev.profile.name || member.username}</span>
                                                <span className="employee-handle">@{member.username}</span>
                                            </div>
                                            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: scoreColor(ev.impact_score), letterSpacing: "-0.02em" }}>
                                                {ev.impact_score}
                                            </span>
                                        </div>
                                    </Link>
                                    <div className="employee-card-bottom">
                                        <span className="employee-meta">
                                            Evaluated {new Date(ev.evaluated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                className="employee-eval-btn"
                                                onClick={() => handleEvaluate(member.username)}
                                                disabled={isEvaluating}
                                                style={{ fontSize: "0.6rem", padding: "4px 10px", height: "auto" }}
                                            >
                                                {isEvaluating ? "…" : "Re-evaluate"}
                                            </button>
                                            <button className="employee-remove-btn" onClick={() => handleRemove(member.username)}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Not evaluated yet
                        return (
                            <div key={member.username} className="employee-card employee-card--pending">
                                <div className="employee-card-top">
                                    <div className="employee-avatar-placeholder">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                    <div className="employee-info">
                                        <span className="employee-name">@{member.username}</span>
                                        <span className="employee-handle">Not yet evaluated</span>
                                    </div>
                                </div>
                                <div className="employee-card-bottom">
                                    <button
                                        className="employee-eval-btn"
                                        onClick={() => handleEvaluate(member.username)}
                                        disabled={isEvaluating}
                                    >
                                        {isEvaluating ? (
                                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span className="spinner" /> Analyzing…
                                            </span>
                                        ) : (
                                            "Evaluate →"
                                        )}
                                    </button>
                                    <button className="employee-remove-btn" onClick={() => handleRemove(member.username)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <h3 className="empty-title">No team members yet</h3>
                    <p className="empty-text">
                        Add your first team member by entering their GitHub username above.
                    </p>
                </div>
            )}
        </>
    );
}
