/* ═══════════════════════════════════════════════════════════
   DevMetric — Local Store
   localStorage-backed persistence for team & evaluation data.
   ═══════════════════════════════════════════════════════════ */

import { EvaluationResult } from "./api";

// ── Keys ──
const TEAM_KEY = "devmetric_team";
const EVALS_KEY = "devmetric_evaluations";

// ── Types ──
export interface TeamMember {
    username: string;     // GitHub handle
    addedAt: string;      // ISO timestamp
}

export interface StoredEvaluation extends EvaluationResult {
    // EvaluationResult already has evaluated_at, username, profile, etc.
}

// ── Team Management ──

export function getTeam(): TeamMember[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(TEAM_KEY) || "[]");
    } catch {
        return [];
    }
}

export function addEmployee(username: string): TeamMember[] {
    const team = getTeam();
    const clean = username.trim().toLowerCase();
    if (team.some((m) => m.username.toLowerCase() === clean)) return team;

    const updated = [
        ...team,
        { username: clean, addedAt: new Date().toISOString() },
    ];
    localStorage.setItem(TEAM_KEY, JSON.stringify(updated));
    return updated;
}

export function removeEmployee(username: string): TeamMember[] {
    const team = getTeam().filter(
        (m) => m.username.toLowerCase() !== username.toLowerCase()
    );
    localStorage.setItem(TEAM_KEY, JSON.stringify(team));
    return team;
}

export function isOnTeam(username: string): boolean {
    return getTeam().some(
        (m) => m.username.toLowerCase() === username.trim().toLowerCase()
    );
}

// ── Evaluation History ──

export function getAllEvaluations(): StoredEvaluation[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(EVALS_KEY) || "[]");
    } catch {
        return [];
    }
}

export function getEvaluationsForUser(username: string): StoredEvaluation[] {
    return getAllEvaluations().filter(
        (e) => e.username.toLowerCase() === username.toLowerCase()
    );
}

export function getLatestEvaluation(
    username: string
): StoredEvaluation | null {
    const evals = getEvaluationsForUser(username);
    if (evals.length === 0) return null;
    return evals.sort(
        (a, b) =>
            new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
    )[0];
}

export function saveEvaluation(result: EvaluationResult): void {
    const all = getAllEvaluations();
    all.push(result);
    localStorage.setItem(EVALS_KEY, JSON.stringify(all));
}

// ── Aggregate Helpers ──

export function getTeamStats() {
    const team = getTeam();
    const evaluations = getAllEvaluations();

    const latestByUser = new Map<string, StoredEvaluation>();
    for (const e of evaluations) {
        const key = e.username.toLowerCase();
        const existing = latestByUser.get(key);
        if (
            !existing ||
            new Date(e.evaluated_at).getTime() >
            new Date(existing.evaluated_at).getTime()
        ) {
            latestByUser.set(key, e);
        }
    }

    const teamEvals = team
        .map((m) => latestByUser.get(m.username.toLowerCase()))
        .filter(Boolean) as StoredEvaluation[];

    const scores = teamEvals.map((e) => e.impact_score);
    const avgScore =
        scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

    const sorted = [...teamEvals].sort(
        (a, b) => b.impact_score - a.impact_score
    );

    return {
        teamSize: team.length,
        evaluatedCount: teamEvals.length,
        avgScore,
        topPerformer: sorted[0] || null,
        bottomPerformer: sorted[sorted.length - 1] || null,
        recentEvaluations: [...evaluations]
            .sort(
                (a, b) =>
                    new Date(b.evaluated_at).getTime() -
                    new Date(a.evaluated_at).getTime()
            )
            .slice(0, 8),
    };
}
