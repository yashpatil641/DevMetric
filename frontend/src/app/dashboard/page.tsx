"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTeam, getTeamStats, getLatestEvaluation, StoredEvaluation } from "@/lib/store";

function scoreColor(score: number) {
  if (score >= 75) return "#34d399";
  if (score >= 50) return "#60a5fa";
  if (score >= 25) return "#fbbf24";
  return "#f87171";
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof getTeamStats> | null>(null);
  const [teamEvals, setTeamEvals] = useState<(StoredEvaluation | null)[]>([]);

  useEffect(() => {
    setMounted(true);
    const s = getTeamStats();
    setStats(s);
    const team = getTeam();
    setTeamEvals(team.map((m) => getLatestEvaluation(m.username)));
  }, []);

  if (!mounted) return null;

  const team = getTeam();

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-eyebrow">
          <span className="page-eyebrow-line" />
          <span className="page-eyebrow-text">Dashboard</span>
        </div>
        <h1 className="page-title">
          Team <em>Overview</em>
        </h1>
        <p className="page-subtitle">
          Track your team&apos;s developer impact at a glance. Add employees, run evaluations, and generate reports.
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="dashboard-stats">
          <div className="dash-stat">
            <span className="dash-stat-label">Team Size</span>
            <span className="dash-stat-value">{stats.teamSize}</span>
            <span className="dash-stat-sub">
              {stats.evaluatedCount} evaluated
            </span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Avg Score</span>
            <span className="dash-stat-value" style={{ color: stats.avgScore ? scoreColor(stats.avgScore) : "var(--text-3)" }}>
              {stats.avgScore || "—"}
            </span>
            <span className="dash-stat-sub">out of 100</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Top Performer</span>
            <span className="dash-stat-value" style={{ fontSize: "1.2rem" }}>
              {stats.topPerformer
                ? stats.topPerformer.profile.name || `@${stats.topPerformer.username}`
                : "—"}
            </span>
            {stats.topPerformer && (
              <span className="dash-stat-sub" style={{ color: "#34d399" }}>
                Score: {stats.topPerformer.impact_score}
              </span>
            )}
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Needs Attention</span>
            <span className="dash-stat-value" style={{ fontSize: "1.2rem" }}>
              {stats.bottomPerformer && stats.teamSize > 1
                ? stats.bottomPerformer.profile.name || `@${stats.bottomPerformer.username}`
                : "—"}
            </span>
            {stats.bottomPerformer && stats.teamSize > 1 && (
              <span className="dash-stat-sub" style={{ color: "#f87171" }}>
                Score: {stats.bottomPerformer.impact_score}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, animation: "fade-up 0.4s var(--ease-out) 0.1s both" }}>
        <Link href="/team" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Manage Team
        </Link>
        <Link href="/evaluate" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Quick Evaluate
        </Link>
        <Link href="/reports" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Reports
        </Link>
      </div>

      {/* Recent Evaluations */}
      <div style={{ animation: "fade-up 0.4s var(--ease-out) 0.15s both" }}>
        <p className="section-label">Recent Evaluations</p>

        {stats && stats.recentEvaluations.length > 0 ? (
          <div className="activity-list">
            {stats.recentEvaluations.map((ev, i) => (
              <Link
                key={`${ev.username}-${ev.evaluated_at}-${i}`}
                href={`/employee/${ev.username}`}
                className="activity-item"
              >
                <img
                  src={ev.profile.avatar_url}
                  alt={ev.username}
                  className="activity-avatar"
                />
                <div className="activity-info">
                  <span className="activity-name">
                    {ev.profile.name || ev.username}
                  </span>
                  <span className="activity-handle">@{ev.username}</span>
                </div>
                <span
                  className="activity-score"
                  style={{ color: scoreColor(ev.impact_score) }}
                >
                  {ev.impact_score}
                </span>
                <span className="activity-date">
                  {new Date(ev.evaluated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="empty-title">No evaluations yet</h3>
            <p className="empty-text">
              Start by adding team members and running your first evaluation.
            </p>
          </div>
        )}
      </div>

      {/* Team Roster Preview */}
      {team.length > 0 && (
        <div style={{ marginTop: 32, animation: "fade-up 0.4s var(--ease-out) 0.2s both" }}>
          <p className="section-label">Team Members</p>
          <div className="employee-grid">
            {team.map((m, i) => {
              const ev = teamEvals[i];
              return (
                <Link
                  key={m.username}
                  href={`/employee/${m.username}`}
                  className="employee-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="employee-card-top">
                    {ev ? (
                      <img
                        src={ev.profile.avatar_url}
                        alt={m.username}
                        className="employee-avatar"
                      />
                    ) : (
                      <div className="employee-avatar-placeholder">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                    <div className="employee-info">
                      <span className="employee-name">
                        {ev ? (ev.profile.name || m.username) : `@${m.username}`}
                      </span>
                      <span className="employee-handle">
                        {ev ? `@${m.username}` : "Not evaluated"}
                      </span>
                    </div>
                    {ev && (
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "1.4rem",
                          color: scoreColor(ev.impact_score),
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {ev.impact_score}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}