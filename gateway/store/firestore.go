// Package store manages persistence of evaluation records to Firestore.
package store

import (
	"context"
	"log"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"

	"devmetric-gateway/models"
)

// Store wraps a Firestore client for saving evaluation records.
type Store struct {
	client *firestore.Client
}

// New initialises a Firestore-backed Store using the given credentials file.
// Returns nil (not an error) when credPath is empty, allowing the app to run
// without persistence.
func New(credPath string) *Store {
	if credPath == "" {
		log.Println("⚠ FIREBASE_CREDENTIALS_PATH not set – Firestore persistence disabled")
		return nil
	}

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

	log.Println("✓ Firestore client initialised")
	return &Store{client: fc}
}

// Save persists an evaluation record to the "evaluations" collection.
// If the Store is nil (no credentials), the call is a no-op.
func (s *Store) Save(ctx context.Context, record models.EvaluationRecord) error {
	if s == nil || s.client == nil {
		log.Println("⚠ Firestore client is nil – skipping save")
		return nil
	}
	_, _, err := s.client.Collection("evaluations").Add(ctx, record)
	return err
}

// Close shuts down the Firestore client connection.
func (s *Store) Close() {
	if s != nil && s.client != nil {
		s.client.Close()
	}
}
