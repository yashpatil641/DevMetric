// Package models defines the shared data types used across the gateway.
package models

import "encoding/json"

// GitHubProfile holds selected fields scraped from the GitHub profile page.
type GitHubProfile struct {
	Login       string `json:"login"`
	Name        string `json:"name"`
	PublicRepos int    `json:"public_repos"`
	Followers   int    `json:"followers"`
	Following   int    `json:"following"`
	CreatedAt   string `json:"created_at"`
	Bio         string `json:"bio"`
	AvatarURL   string `json:"avatar_url"`
}

// GitHubEvent is a minimal representation of an event parsed from the Atom feed.
type GitHubEvent struct {
	Type      string          `json:"type"`
	Repo      json.RawMessage `json:"repo"`
	CreatedAt string          `json:"created_at"`
}

// AnalyzeRequest is sent to the Python AI service.
type AnalyzeRequest struct {
	Username string        `json:"username"`
	Profile  GitHubProfile `json:"profile"`
	Events   []GitHubEvent `json:"events"`
}

// AnalyzeResponse is returned by the Python AI service.
type AnalyzeResponse struct {
	ImpactScore        int    `json:"impact_score"`
	PerformanceSummary string `json:"performance_summary"`
}

// EvaluationRecord is the document saved to Firestore and returned to the client.
type EvaluationRecord struct {
	Username           string        `json:"username"`
	Profile            GitHubProfile `json:"profile"`
	Events             []GitHubEvent `json:"events"`
	ImpactScore        int           `json:"impact_score"`
	PerformanceSummary string        `json:"performance_summary"`
	EvaluatedAt        string        `json:"evaluated_at"`
}
