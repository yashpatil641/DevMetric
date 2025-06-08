"use client";

export default function StatCard({
    label,
    value,
    suffix,
    index = 0,
}: {
    label: string;
    value: string | number;
    suffix?: string;
    index?: number;
}) {
    return (
        <div
            className="stat-card"
            style={{ animationDelay: `${0.3 + index * 0.07}s` }}
        >
            <span className="stat-label">{label}</span>
            <span className="stat-value">
                {value}
                {suffix && <span className="stat-suffix">{suffix}</span>}
            </span>
        </div>
    );
}
