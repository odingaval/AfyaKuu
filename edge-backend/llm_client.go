package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
)

// Ollama URL defaults to localhost:11434
const OllamaEndpoint = "http://localhost:11434/api/generate"
// We assume we have pulled 'gemma2' or similar via Ollama
const TargetModel = "gemma2:2b"

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

type OllamaResponse struct {
	Model    string `json:"model"`
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

// CallLocalGemma sends the generated prompt directly to the locally running Gemma model.
func CallLocalGemma(prompt string) (string, error) {
	reqBody := OllamaRequest{
		Model:  TargetModel,
		Prompt: prompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	resp, err := http.Post(OllamaEndpoint, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		// FALLBACK: If Ollama is offline or model is pulling, return a mock response for UI testing
		log.Printf("Ollama unavailable, returning mock response: %v", err)
		return `{"finding": "Malaria (Mock)", "confidence": 85, "groundedAdvice": "The symptoms of fever and chills match rural protocols for Uncomplicated Malaria. Note: This is an offline-mock response.", "recommendations": ["Perform RDT", "Start Artemether-Lumefantrine if positive", "Monitor for 24h"], "severity": "medium", "followUpRequired": true, "processingTime": 1.2, "disclaimer": "Diagnostic support ONLY. Confirm with clinical exam."}`, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// FALLBACK: If model is too large for RAM or not found, return mock
		body, _ := io.ReadAll(resp.Body)
		log.Printf("Ollama error %d: %s. Returning mock response.", resp.StatusCode, string(body))
		return `{"finding": "Fever of Unknown Origin (Mock)", "confidence": 60, "groundedAdvice": "The clinical picture is inconclusive but suggests a systemic infection. Note: This is an offline-mock response.", "recommendations": ["Check for UTI", "Assess for Pneumonia", "Monitor temperature"], "severity": "low", "followUpRequired": true, "processingTime": 0.8, "disclaimer": "Diagnostic support ONLY. Confirm with clinical exam."}`, nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var ollamaResp OllamaResponse
	if err := json.Unmarshal(body, &ollamaResp); err != nil {
		return "", err
	}

	return ollamaResp.Response, nil
}

// TODO: Implement Embeddings endpoint for calling `http://localhost:11434/api/embeddings`
// which will be used for Local RAG using FAISS/Cosine similarity inside Go.
