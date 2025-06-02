/* ═══════════════════════════════════════════════════════════
   DevMetric — API Client
   Centralized functions for talking to the Go gateway.
   ═══════════════════════════════════════════════════════════ */

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

export interface GitHubProfile {
    login: string;
    name: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    bio: string | null;
    avatar_url: string;
}

export interface EvaluationResult {
    username: string;
    profile: GitHubProfile;
    impact_score: number;
    performance_summary: string;
    evaluated_at: string;
}

/**
 * Evaluate a single GitHub user via the gateway.
 */
export async function evaluateUser(username: string): Promise<EvaluationResult> {
    const clean = username
        .trim()
        .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
        .replace(/\/+$/, "");

    const res = await fetch(
        `${GATEWAY_URL}/api/evaluate?username=${encodeURIComponent(clean)}`
    );

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || `Server returned ${res.status}`);
    }

    return res.json();
}
