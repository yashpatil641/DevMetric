"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        href: "/team",
        label: "Team",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        href: "/evaluate",
        label: "Evaluate",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        ),
    },
    {
        href: "/reports",
        label: "Reports",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <span className="sidebar-logo">D</span>
                <span className="sidebar-title">DevMetric</span>
                <span className="sidebar-badge">Pro</span>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <span className="sidebar-nav-label">Navigation</span>
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            {/* <div className="sidebar-footer">
                <span className="sidebar-footer-text">
                    Next.js · Go · Gemini
                </span>
            </div> */}
        </aside>
    );
}
