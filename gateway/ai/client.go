// Package ai provides a client for the Python AI evaluation service.
package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"devmetric-gateway/models"
)

// CallService sends the GitHub data to the Python AI microservice and returns
// the structured evaluation result.
func CallService(payload models.AnalyzeRequest) (*models.AnalyzeResponse, error) {
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

	var result models.AnalyzeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding AI response: %w", err)
	}
	return &result, nil
}
