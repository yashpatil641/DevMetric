// Package handler contains the HTTP handlers for the gateway API.
package handler

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"devmetric-gateway/ai"
	"devmetric-gateway/github"
	"devmetric-gateway/models"
	"devmetric-gateway/store"
)

// Evaluate returns a gin handler that scrapes GitHub data, runs the AI
// analysis, persists the result, and responds with the full evaluation.
func Evaluate(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.Query("username")
		if username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username query parameter is required"})
			return
		}

		// 1. Scrape GitHub profile from the HTML page
		profile, err := github.ScrapeProfile(username)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to fetch GitHub profile", "details": err.Error()})
			return
		}

		// 2. Scrape recent events from the public Atom feed
		events, err := github.ScrapeEvents(username)
		if err != nil {
			log.Printf("Warning: could not fetch events for %s: %v", username, err)
			events = []models.GitHubEvent{} // non-fatal
		}

		// 3. Call the Python AI service
		aiReq := models.AnalyzeRequest{
			Username: username,
			Profile:  profile,
			Events:   events,
		}
		aiResp, err := ai.CallService(aiReq)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "AI analysis failed", "details": err.Error()})
			return
		}

		// 4. Build the evaluation record
		record := models.EvaluationRecord{
			Username:           username,
			Profile:            profile,
			Events:             events,
			ImpactScore:        aiResp.ImpactScore,
			PerformanceSummary: aiResp.PerformanceSummary,
			EvaluatedAt:        time.Now().UTC().Format(time.RFC3339),
		}

		// 5. Persist to Firestore
		if err := s.Save(c.Request.Context(), record); err != nil {
			log.Printf("Firestore save error: %v", err)
		}

		c.JSON(http.StatusOK, record)
	}
}
