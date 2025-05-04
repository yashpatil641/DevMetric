package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

// ---------- types ----------

// GitHubProfile holds selected fields from the GitHub Users API.
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

// GitHubEvent is a minimal representation of an event from the Events API.
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

// ---------- globals ----------

var firestoreClient *firestore.Client

// ---------- helpers ----------

func fetchJSON(url string, target interface{}) error {
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("HTTP GET %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("GitHub API %s returned %d: %s", url, resp.StatusCode, string(body))
	}
	return json.NewDecoder(resp.Body).Decode(target)
}

func callAIService(payload AnalyzeRequest) (*AnalyzeResponse, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	aiURL := os.Getenv("AI_SERVICE_URL")
	if aiURL == "" {
		aiURL = "http://localhost:8000"
	}

	resp, err := http.Post(aiURL+"/analyze", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("calling AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("AI service returned %d: %s", resp.StatusCode, string(errBody))
	}

	var result AnalyzeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding AI response: %w", err)
	}
	return &result, nil
}

func saveToFirestore(ctx context.Context, record EvaluationRecord) error {
	if firestoreClient == nil {
		log.Println("⚠ Firestore client is nil – skipping save (no credentials configured)")
		return nil
	}
	_, _, err := firestoreClient.Collection("evaluations").Add(ctx, record)
	return err
}

// ---------- handlers ----------

func handleEvaluate(c *gin.Context) {
	username := c.Query("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username query parameter is required"})
		return
	}

	// 1. Fetch GitHub profile
	var profile GitHubProfile
	if err := fetchJSON(fmt.Sprintf("https://api.github.com/users/%s", username), &profile); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to fetch GitHub profile", "details": err.Error()})
		return
	}

	// 2. Fetch recent events
	var events []GitHubEvent
	if err := fetchJSON(fmt.Sprintf("https://api.github.com/users/%s/events?per_page=30", username), &events); err != nil {
		log.Printf("Warning: could not fetch events for %s: %v", username, err)
		events = []GitHubEvent{} // non-fatal
	}

	// 3. Call the Python AI service
	aiReq := AnalyzeRequest{
		Username: username,
		Profile:  profile,
		Events:   events,
	}
	aiResp, err := callAIService(aiReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI analysis failed", "details": err.Error()})
		return
	}

	// 4. Build the evaluation record
	record := EvaluationRecord{
		Username:           username,
		Profile:            profile,
		Events:             events,
		ImpactScore:        aiResp.ImpactScore,
		PerformanceSummary: aiResp.PerformanceSummary,
		EvaluatedAt:        time.Now().UTC().Format(time.RFC3339),
	}

	// 5. Persist to Firestore
	if err := saveToFirestore(c.Request.Context(), record); err != nil {
		log.Printf("Firestore save error: %v", err)
		// Still return the result even if persistence fails
	}

	c.JSON(http.StatusOK, record)
}

// ---------- main ----------

func main() {
	_ = godotenv.Load()

	// Firebase / Firestore setup
	credPath := os.Getenv("FIREBASE_CREDENTIALS_PATH")
	if credPath != "" {
		ctx := context.Background()
		opt := option.WithCredentialsFile(credPath)
		app, err := firebase.NewApp(ctx, nil, opt)
		if err != nil {
			log.Fatalf("Failed to initialise Firebase: %v", err)
		}
		fc, err := app.Firestore(ctx)
		if err != nil {
			log.Fatalf("Failed to create Firestore client: %v", err)
		}
		firestoreClient = fc
		defer firestoreClient.Close()
		log.Println("✓ Firestore client initialised")
	} else {
		log.Println("⚠ FIREBASE_CREDENTIALS_PATH not set – Firestore persistence disabled")
	}

	r := gin.Default()

	// CORS – allow the Next.js frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/api/evaluate", handleEvaluate)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("🚀 Gateway listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
