// Package github provides functions to scrape public GitHub profile and activity data.
package github

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"devmetric-gateway/models"
)

// ---------- Atom feed XML types ----------

type atomFeed struct {
	XMLName xml.Name    `xml:"feed"`
	Entries []atomEntry `xml:"entry"`
}

type atomEntry struct {
	ID        string `xml:"id"`
	Title     string `xml:"title"`
	Published string `xml:"published"`
	Updated   string `xml:"updated"`
}

// ---------- HTTP helper ----------

// httpGet performs an HTTP GET with a browser-like User-Agent to avoid blocks.
func httpGet(url string) (*http.Response, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; DevMetric/1.0)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	return client.Do(req)
}

// ---------- Parsing helpers ----------

// parseCounter converts strings like "1.2k" or "11" to integers.
func parseCounter(s string) int {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ToLower(s)

	multiplier := 1.0
	if strings.HasSuffix(s, "k") {
		multiplier = 1000
		s = strings.TrimSuffix(s, "k")
	} else if strings.HasSuffix(s, "m") {
		multiplier = 1_000_000
		s = strings.TrimSuffix(s, "m")
	}

	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return int(f * multiplier)
}

// ---------- Profile scraping ----------

// ScrapeProfile scrapes the public GitHub profile page for user data.
func ScrapeProfile(username string) (models.GitHubProfile, error) {
	profileURL := fmt.Sprintf("https://github.com/%s", username)
	resp, err := httpGet(profileURL)
	if err != nil {
		return models.GitHubProfile{}, fmt.Errorf("fetching profile page: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return models.GitHubProfile{}, fmt.Errorf("GitHub user %q not found", username)
	}
	if resp.StatusCode != 200 {
		return models.GitHubProfile{}, fmt.Errorf("GitHub returned status %d for %s", resp.StatusCode, profileURL)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return models.GitHubProfile{}, fmt.Errorf("parsing HTML: %w", err)
	}

	profile := models.GitHubProfile{Login: username}

	// Name — <span itemprop="name">
	if name := doc.Find(`span[itemprop="name"]`).First().Text(); name != "" {
		profile.Name = strings.TrimSpace(name)
	}

	// Bio — <div class="p-note user-profile-bio"> or <div data-bio-text>
	if bio := doc.Find(`div.user-profile-bio, div[data-bio-text]`).First().Text(); bio != "" {
		profile.Bio = strings.TrimSpace(bio)
	}

	// Avatar — <img class="avatar avatar-user" src="...">
	if avatarSrc, exists := doc.Find(`img.avatar-user`).First().Attr("src"); exists {
		profile.AvatarURL = strings.Split(avatarSrc, "?")[0] + "?v=4"
	}

	// Repos — from the nav tabs
	doc.Find(`a.UnderlineNav-item, nav[aria-label="User profile"] a`).Each(func(_ int, s *goquery.Selection) {
		href, _ := s.Attr("href")
		if strings.Contains(strings.ToLower(href), "tab=repositories") {
			if ct := s.Find(".Counter").Text(); ct != "" {
				profile.PublicRepos = parseCounter(ct)
			}
		}
	})

	// Followers & Following — from the sidebar links
	doc.Find(`a[href*="tab=followers"], a[href*="tab=following"]`).Each(func(_ int, s *goquery.Selection) {
		href, _ := s.Attr("href")
		boldText := s.Find(`span.text-bold`).Text()
		if boldText == "" {
			return
		}
		count := parseCounter(boldText)
		hrefLower := strings.ToLower(href)
		if strings.Contains(hrefLower, "tab=followers") {
			profile.Followers = count
		} else if strings.Contains(hrefLower, "tab=following") {
			profile.Following = count
		}
	})

	// Created at — not in server-rendered HTML, so try a lightweight API call
	profile.CreatedAt = fetchCreatedAt(username)

	return profile, nil
}

// fetchCreatedAt tries the GitHub API for just the created_at field.
// Falls back gracefully to empty string if rate-limited.
func fetchCreatedAt(username string) string {
	client := &http.Client{Timeout: 5 * time.Second}
	apiURL := fmt.Sprintf("https://api.github.com/users/%s", username)
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return ""
	}
	req.Header.Set("User-Agent", "DevMetric/1.0")
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return ""
	}
	defer resp.Body.Close()
	var data struct {
		CreatedAt string `json:"created_at"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return ""
	}
	return data.CreatedAt
}

// ---------- Event scraping ----------

// inferEventType maps an Atom feed title to an API-style event type.
func inferEventType(title string) string {
	lower := strings.ToLower(title)
	switch {
	case strings.Contains(lower, "pushed"):
		return "PushEvent"
	case strings.Contains(lower, "created a tag"), strings.Contains(lower, "created a branch"),
		strings.Contains(lower, "created a repository"):
		return "CreateEvent"
	case strings.Contains(lower, "opened a pull request"):
		return "PullRequestEvent"
	case strings.Contains(lower, "closed a pull request"), strings.Contains(lower, "merged a pull request"):
		return "PullRequestEvent"
	case strings.Contains(lower, "opened an issue"):
		return "IssuesEvent"
	case strings.Contains(lower, "closed an issue"):
		return "IssuesEvent"
	case strings.Contains(lower, "commented"):
		return "IssueCommentEvent"
	case strings.Contains(lower, "forked"):
		return "ForkEvent"
	case strings.Contains(lower, "starred"):
		return "WatchEvent"
	case strings.Contains(lower, "released"):
		return "ReleaseEvent"
	case strings.Contains(lower, "deleted"):
		return "DeleteEvent"
	default:
		return "PublicEvent"
	}
}

var repoPattern = regexp.MustCompile(`(\S+/\S+)\s*$`)

func extractRepo(title string) string {
	matches := repoPattern.FindStringSubmatch(strings.TrimSpace(title))
	if len(matches) > 1 {
		return matches[1]
	}
	parts := strings.Fields(title)
	if len(parts) >= 2 {
		return parts[len(parts)-1]
	}
	return ""
}

// ScrapeEvents fetches the public Atom feed and converts entries to GitHubEvent structs.
func ScrapeEvents(username string) ([]models.GitHubEvent, error) {
	feedURL := fmt.Sprintf("https://github.com/%s.atom", username)
	resp, err := httpGet(feedURL)
	if err != nil {
		return nil, fmt.Errorf("fetching Atom feed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Atom feed returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading Atom feed: %w", err)
	}

	var feed atomFeed
	if err := xml.Unmarshal(body, &feed); err != nil {
		return nil, fmt.Errorf("parsing Atom XML: %w", err)
	}

	events := make([]models.GitHubEvent, 0, len(feed.Entries))
	for _, entry := range feed.Entries {
		eventType := inferEventType(entry.Title)
		repoName := extractRepo(entry.Title)

		if repoName != "" && !strings.Contains(repoName, "/") {
			repoName = username + "/" + repoName
		}

		repoJSON, _ := json.Marshal(map[string]string{"name": repoName})

		ts := entry.Published
		if ts == "" {
			ts = entry.Updated
		}

		events = append(events, models.GitHubEvent{
			Type:      eventType,
			Repo:      json.RawMessage(repoJSON),
			CreatedAt: ts,
		})
	}

	return events, nil
}
