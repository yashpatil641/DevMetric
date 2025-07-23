"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ─── Decorative floating geometry ─── */
function FloatingShapes() {
  return (
    <div className="landing-shapes" aria-hidden="true">
      <svg className="landing-shape landing-shape--1" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="80" stroke="rgba(245,158,11,0.12)" strokeWidth="1" />
        <circle cx="100" cy="100" r="60" stroke="rgba(245,158,11,0.07)" strokeWidth="1" />
        <circle cx="100" cy="100" r="40" stroke="rgba(245,158,11,0.04)" strokeWidth="1" />
      </svg>
      <svg className="landing-shape landing-shape--2" viewBox="0 0 120 120" fill="none">
        <rect x="10" y="10" width="100" height="100" rx="4" stroke="rgba(96,165,250,0.08)" strokeWidth="1" transform="rotate(15 60 60)" />
        <rect x="25" y="25" width="70" height="70" rx="3" stroke="rgba(96,165,250,0.05)" strokeWidth="1" transform="rotate(30 60 60)" />
      </svg>
      <svg className="landing-shape landing-shape--3" viewBox="0 0 160 160" fill="none">
        <polygon points="80,10 150,150 10,150" stroke="rgba(52,211,153,0.07)" strokeWidth="1" />
        <polygon points="80,40 130,130 30,130" stroke="rgba(52,211,153,0.04)" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ─── Animated metric counter ─── */
function AnimCounter({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(12, Math.floor(duration / target));
    const t = setInterval(() => {
      cur++;
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, step);
    return () => clearInterval(t);
  }, [target, duration]);
  return <>{val}</>;
}

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "AI-Powered Analysis",
    desc: "Gemini evaluates commit patterns, code quality, and open-source contribution signals from public GitHub data.",
    accent: "var(--amber)",
    dimAccent: "var(--amber-dim)",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Team Tracking",
    desc: "Build rosters, compare performance across sprints, and surface top contributors and those needing support.",
    accent: "var(--blue)",
    dimAccent: "var(--blue-dim)",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Impact Reports",
    desc: "Leaderboards, historical score timelines, and exportable summaries — ready for standups and reviews.",
    accent: "var(--green)",
    dimAccent: "var(--green-dim)",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Enter a GitHub Handle",
    desc: "Type any public GitHub username into the evaluator.",
  },
  {
    num: "02",
    title: "AI Crunches the Data",
    desc: "Gemini analyzes repos, commits, PRs, and community engagement.",
  },
  {
    num: "03",
    title: "Review the Score",
    desc: "Get an impact score out of 100 with a detailed performance narrative.",
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="landing">
      <FloatingShapes />

      {/* ══════ NAV BAR ══════ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-brand">
            <span className="sidebar-logo">D</span>
            <span className="landing-brand-text">DevMetric</span>
          </Link>
          <div className="landing-nav-links">
            <Link href="/dashboard" className="landing-nav-link">Dashboard</Link>
            <Link href="/evaluate" className="landing-nav-cta">
              Try It Now →
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-eyebrow">
            <span className="landing-hero-eyebrow-dot" />
            <span>AI-DRIVEN DEVELOPER INTELLIGENCE</span>
          </div>

          <h1 className="landing-hero-title">
            Measure Developer<br />
            <em>Impact</em>
          </h1>

          <p className="landing-hero-sub">
            DevMetric analyzes public GitHub activity with Gemini AI to generate
            quantified impact scores, performance narratives, and team-level
            insights — in seconds.
          </p>

          <div className="landing-hero-actions">
            <Link href="/evaluate" className="landing-btn-primary" id="hero-cta-btn">
              Start Evaluating →
            </Link>
            <Link href="/dashboard" className="landing-btn-ghost" id="hero-dashboard-btn">
              Open Dashboard
            </Link>
          </div>

          {/* Hero stats strip */}
          <div className="landing-hero-stats">
            <div className="landing-hero-stat">
              <span className="landing-hero-stat-val">
                <AnimCounter target={100} />
              </span>
              <span className="landing-hero-stat-label">Impact Score Range</span>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <span className="landing-hero-stat-val">3</span>
              <span className="landing-hero-stat-label">Microservices</span>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <span className="landing-hero-stat-val">&lt;30s</span>
              <span className="landing-hero-stat-label">Analysis Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section className="landing-features">
        <div className="landing-section-inner">
          <div className="landing-section-eyebrow">
            <span className="page-eyebrow-line" />
            <span className="page-eyebrow-text">Capabilities</span>
          </div>
          <h2 className="landing-section-title">
            Everything You Need to <em>Quantify</em> Dev Output
          </h2>
          <div className="landing-features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="landing-feature-card"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div
                  className="landing-feature-icon"
                  style={{ background: f.dimAccent, color: f.accent }}
                >
                  {f.icon}
                </div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section className="landing-how">
        <div className="landing-section-inner">
          <div className="landing-section-eyebrow">
            <span className="page-eyebrow-line" />
            <span className="page-eyebrow-text">How It Works</span>
          </div>
          <h2 className="landing-section-title">
            Three Steps to <em>Insight</em>
          </h2>
          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className="landing-step"
                style={{ animationDelay: `${0.12 + i * 0.1}s` }}
              >
                <span className="landing-step-num">{s.num}</span>
                <div className="landing-step-body">
                  <h3 className="landing-step-title">{s.title}</h3>
                  <p className="landing-step-desc">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="landing-step-connector" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA FOOTER ══════ */}
      <section className="landing-cta">
        <div className="landing-section-inner" style={{ textAlign: "center" }}>
          <h2 className="landing-cta-title">
            Ready to See Your Team&apos;s <em>True Impact</em>?
          </h2>
          <p className="landing-cta-sub">
            Start with a single GitHub username. No sign-up required.
          </p>
          <Link href="/evaluate" className="landing-btn-primary landing-btn-lg">
            Get Started — It&apos;s Free →
          </Link>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      {/* <footer className="landing-footer">
        <div className="landing-section-inner landing-footer-inner">
          <span className="landing-footer-brand">
            <span className="sidebar-logo" style={{ width: 24, height: 24, fontSize: "0.8rem" }}>D</span>
            DevMetric
          </span>
          <span className="landing-footer-copy">
            Next.js · Go · Gemini — Built for engineering managers
          </span>
        </div>
      </footer> */}
    </div>
  );
}