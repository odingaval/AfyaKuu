package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// We use 'nomic-embed-text' pulled locally via Ollama for lightweight CPU embeddings
const EmbedModel = "nomic-embed-text"
const OllamaEmbedEndpoint = "http://localhost:11434/api/embeddings"

// Document represents a piece of local medical knowledge
type Document struct {
	ID        string
	Text      string
	Embedding []float64
}

// Local in-memory store for Hackathon simplicity.
// In production, syncs with SQLite or Chroma.
var VectorDatabase []Document

type OllamaEmbedRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type OllamaEmbedResponse struct {
	Embedding []float64 `json:"embedding"`
}

// GetEmbedding calls local Ollama embeddings endpoint
func GetEmbedding(text string) ([]float64, error) {
	reqBody := OllamaEmbedRequest{
		Model:  EmbedModel,
		Prompt: text,
	}
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(OllamaEmbedEndpoint, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("local embedding failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("local embedding returned status %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var embedResp OllamaEmbedResponse
	if err := json.Unmarshal(body, &embedResp); err != nil {
		return nil, err
	}

	return embedResp.Embedding, nil
}

// InitRAG loads baseline protocols and external files into the vector DB
func InitRAG() {
	fmt.Println("Initializing Local RAG Vectors...")
	
	// 1. Load Hardcoded Baseline
	baseProtocols := []string{
		"MALARIA PROTOCOL: Uncomplicated malaria in adults presenting with fever and chills should be treated with Oral Artemether-Lumefantrine for 3 days. Recommend Paracetamol for fever.",
		"MALARIA PROTOCOL: Severe malaria presenting with altered consciousness, severe anemia, or jaundice requires immediate IV Artesunate or IM Artemether and immediate hospital referral.",
		"PNEUMONIA PROTOCOL (PEDIATRIC): Fast breathing (RR > 50 in 2-12 months, > 40 in 1-5 years) and chest indrawing indicate pneumonia. Treat with Oral Amoxicillin and monitor for 48 hours.",
	}

	for i, text := range baseProtocols {
		addDocumentToVectorDB(fmt.Sprintf("base_%d", i), text)
	}

	// 2. Load External Files from knowledge_base/
	knowledgeDir := "./knowledge_base"
	_ = os.MkdirAll(knowledgeDir, 0755)

	files, err := os.ReadDir(knowledgeDir)
	if err == nil {
		for _, file := range files {
			if !file.IsDir() && strings.HasSuffix(file.Name(), ".txt") {
				path := filepath.Join(knowledgeDir, file.Name())
				content, err := os.ReadFile(path)
				if err == nil {
					fmt.Printf("Loading external knowledge: %s\n", file.Name())
					addDocumentToVectorDB(file.Name(), string(content))
				}
			}
		}
	}

	fmt.Printf("Local RAG initialised with %d documents.\n", len(VectorDatabase))
}

func addDocumentToVectorDB(id string, text string) {
	emb, err := GetEmbedding(text)
	if err != nil {
		fmt.Printf("Warning: Could not embed document %s. Error: %v\n", id, err)
		return
	}
	VectorDatabase = append(VectorDatabase, Document{
		ID:        id,
		Text:      text,
		Embedding: emb,
	})
}

// cosineSimilarity measures the angle between two vectors
func cosineSimilarity(a, b []float64) float64 {
	var dot, normA, normB float64
	for i := range a {
		dot += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return dot / (math.Sqrt(normA) * math.Sqrt(normB))
}

// RetrieveContext finds the top-k most similar documents locally
func RetrieveContext(query string, topK int) string {
	queryEmb, err := GetEmbedding(query)
	if err != nil || len(VectorDatabase) == 0 {
		return "No specific local protocol found. Advise standard medical care."
	}

	type score struct {
		Index    int
		SimScore float64
	}
	var scores []score

	for i, doc := range VectorDatabase {
		sim := cosineSimilarity(queryEmb, doc.Embedding)
		scores = append(scores, score{Index: i, SimScore: sim})
	}

	// Sort descendingly
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].SimScore > scores[j].SimScore
	})

	var resultContext string
	for i := 0; i < topK && i < len(scores); i++ {
		// Only include context if the similarity implies basic relevance (hacky threshold)
		if scores[i].SimScore > 0.4 {
			resultContext += VectorDatabase[scores[i].Index].Text + "\n"
		}
	}

	if resultContext == "" {
		return "No relevant MoH protocol matched your query."
	}
	return resultContext
}
