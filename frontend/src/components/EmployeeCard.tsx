"use client";

import Link from "next/link";
import ScoreRing from "./ScoreRing";
import { StoredEvaluation } from "@/lib/store";

export default function EmployeeCard({
    evaluation,
    showRemove,
    onRemove,
}: {
    evaluation: StoredEvaluation | null;
    username: string;
    showRemove?: boolean;
    onRemove?: () => void;
}) {
    if (!evaluation) return null;

    const { username, profile, impact_score, evaluated_at } = evaluation;

    return (
        <Link
            href={`/employee/${username}`}
            className="employee-card"
            style={{ textDecoration: "none" }}
        >
            <div className="employee-card-top">
                <img
                    src={profile.avatar_url}
                    alt={username}
                    className="employee-avatar"
                />
                <div className="employee-info">
                    <span className="employee-name">
                        {profile.name || username}
                    </span>
                    <span className="employee-handle">@{username}</span>
                </div>
                <ScoreRing score={impact_score} size={64} />
            </div>
            <div className="employee-card-bottom">
                <span className="employee-meta">
                    Last evaluated{" "}
                    {new Date(evaluated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    })}
                </span>
                {showRemove && onRemove && (
                    <button
                        className="employee-remove-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemove();
                        }}
                    >
                        Remove
                    </button>
                )}
            </div>
        </Link>
    );
}

/** Card shown when employee hasn't been evaluated yet */
export function EmployeePendingCard({
    username,
    onEvaluate,
    onRemove,
    isEvaluating,
}: {
    username: string;
    onEvaluate: () => void;
    onRemove?: () => void;
    isEvaluating?: boolean;
}) {
    return (
        <div className="employee-card employee-card--pending">
            <div className="employee-card-top">
                <div className="employee-avatar-placeholder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <div className="employee-info">
                    <span className="employee-name">@{username}</span>
                    <span className="employee-handle">Not yet evaluated</span>
                </div>
            </div>
            <div className="employee-card-bottom">
                <button
                    className="employee-eval-btn"
                    onClick={onEvaluate}
                    disabled={isEvaluating}
                >
                    {isEvaluating ? "Analyzing…" : "Evaluate →"}
                </button>
                {onRemove && (
                    <button
                        className="employee-remove-btn"
                        onClick={onRemove}
                    >
                        Remove
                    </button>
                )}
            </div>
        </div>
    );
}
