"use client";

/* ═══════════════ Score Ring ═══════════════ */

export default function ScoreRing({
    score,
    size = 140,
}: {
    score: number;
    size?: number;
}) {
    const sw = 3;
    const r = (size - sw * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 100);

    const accent =
        score >= 75
            ? "#34d399"
            : score >= 50
                ? "#60a5fa"
                : score >= 25
                    ? "#fbbf24"
                    : "#f87171";

    const label =
        score >= 75
            ? "Excellent"
            : score >= 50
                ? "Good"
                : score >= 25
                    ? "Average"
                    : "Needs Work";

    return (
        <div
            className="score-ring-wrap"
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                style={{ transform: "rotate(-90deg)" }}
                aria-hidden="true"
            >
                {Array.from({ length: 20 }).map((_, i) => {
                    const angle = (i / 20) * 2 * Math.PI - Math.PI / 2;
                    const x1 = size / 2 + (r - 8) * Math.cos(angle);
                    const y1 = size / 2 + (r - 8) * Math.sin(angle);
                    const x2 = size / 2 + (r - 4) * Math.cos(angle);
                    const y2 = size / 2 + (r - 4) * Math.sin(angle);
                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth={i % 5 === 0 ? 1.5 : 0.75}
                        />
                    );
                })}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={sw}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={sw}
                    strokeLinecap="butt"
                    stroke={accent}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{
                        transition: "stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)",
                    }}
                />
            </svg>
            <div className="score-ring-inner">
                <span className="score-number" style={{ color: accent }}>
                    {score}
                </span>
                <span className="score-label">{label}</span>
            </div>
        </div>
    );
}
