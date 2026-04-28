package main

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type DiagnoseRequest struct {
	Symptoms    string `json:"symptoms"`
	Query       string `json:"query"` // Support alternative input name
	ImageBase64 string `json:"imageBase64"`
}

type TrainingCase struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	SystemPrompt string   `json:"systemPrompt"`
	Protocols    []string `json:"protocols"`
}

var TrainingCases = map[string]TrainingCase{
	"malaria_01": {
		ID:    "malaria_01",
		Title: "Fever in Taita Taveta",
		Description: "A 28-year-old farmer presenting with severe fatigue and intermittent high fever.",
		SystemPrompt: "You are a 28-year-old farmer named Juma. You feel very sick with chills and a 'fire' in your head (fever). You are worried about your maize crop. Speak simply and stay in character. Never mention JSON or diagnostics.",
		Protocols: []string{"Malaria Protocol 2024", "Febrile Illness Triage"},
	},
	"pneumonia_child": {
		ID:    "pneumonia_child",
		Title: "Pediatric Respiratory Distress",
		Description: "A mother brings her 3-year-old child who has a persistent cough and 'fast breathing'.",
		SystemPrompt: "You are Mama Otieno. Your small son is very ill. He is breathing very fast like he is running. You are very scared and keep asking the nurse if he will be okay. Stay in character.",
		Protocols: []string{"IMCI Pneumonia Guidelines", "Pediatric Triage"},
	},
}

func handleDiagnose(c *fiber.Ctx) error {
	var req DiagnoseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid format"})
	}

	// Support both 'symptoms' and 'query' fields from legacy Genkit frontend
	symptoms := req.Symptoms
	if symptoms == "" {
		symptoms = req.Query
	}

	// 1. RAG Retrieval: Search the local FAISS/Cosine Similarity index
	retrievedContext := RetrieveContext(symptoms, 2)

	// 2. Format Prompt for Gemma 4
	prompt := fmt.Sprintf(`
<system>
You are the AfyaLens Diagnostic Assistant for rural clinics. 
Rely ONLY on the provided context. Give a structured diagnostic hypothesis.
Context: %s
</system>
<user>
Symptoms: %s
Output a JSON object with these EXACT fields:
"finding": (string), 
"confidence": (number 0-100), 
"groundedAdvice": (string explanation), 
"recommendations": (array of strings), 
"severity": (one of: low, medium, high, critical),
"followUpRequired": (boolean)
</user>`, retrievedContext, symptoms)

	// 3. Call Local LLM Engine (Ollama + Gemma 4)
	response, err := CallLocalGemma(prompt)
	if err != nil {
		// Log gracefully, fallback gracefully
		return c.Status(500).JSON(fiber.Map{
			"error": "Local inference engine unavailable. Ensure Ollama is running.",
			"details": err.Error(),
		})
	}

	// 4. Robust JSON extraction (handles models that add trailing text)
	start := strings.Index(response, "{")
	end := strings.LastIndex(response, "}")
	if start != -1 && end != -1 && end > start {
		response = response[start : end+1]
	}
	response = strings.TrimSpace(response)

	// 5. Store session to SQLite for audit (Implementation stubbed)
	// db.Exec("INSERT INTO sessions...")

	// 6. Return response to Edge PWA
	c.Set("Content-Type", "application/json")
	return c.SendString(response)
}

type TrainChatRequest struct {
	Message string `json:"message"`
}

func handleStartTraining(c *fiber.Ctx) error {
	// In production, insert a new training session in SQLite and return session ID
	return c.JSON(fiber.Map{"message": "Virtual Training started! Ready for offline simulation."})
}

func handleTrainChat(c *fiber.Ctx) error {
	var req struct {
		Message string `json:"message"`
		CaseID  string `json:"caseId"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid format"})
	}

	tCase, ok := TrainingCases[req.CaseID]
	if !ok {
		tCase = TrainingCases["malaria_01"] // Default
	}

	prompt := fmt.Sprintf(`
<system>
%s
ACTUAL PATIENT INSTRUCTIONS:
- Speak as a person, not an AI.
- Use simple language.
- DO NOT use JSON, tags, or structured data.
- Response should be 1-3 sentences maximum.
</system>
<user>%s</user>`, tCase.SystemPrompt, req.Message)

	response, err := CallLocalGemma(prompt)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Trainer Offline."})
	}

	return c.JSON(fiber.Map{"reply": strings.TrimSpace(response)})
}

func handleEvaluateTraining(c *fiber.Ctx) error {
	var req struct {
		History []Message `json:"history"`
		Notes   string    `json:"notes"`
		CaseID  string    `json:"caseId"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid format"})
	}

	tCase := TrainingCases[req.CaseID]
	
	// Construct evaluation prompt
	prompt := fmt.Sprintf(`
<system>
You are a Senior Medical Supervisor. Evaluate the nurse's performance in the following simulation.
Case: %s
Protocols to check: %v
Nurse's Notes: %s
</system>
<user>
Conversation History:
%v

Provide a JSON evaluation:
{
  "score": (0-100),
  "feedback": (string),
  "missedSteps": (array of strings),
  "strengths": (array of strings)
}
</user>`, tCase.Title, tCase.Protocols, req.Notes, req.History)

	evaluation, err := CallLocalGemma(prompt)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Evaluation engine failed."})
	}

	// Extract JSON
	start := strings.Index(evaluation, "{")
	end := strings.LastIndex(evaluation, "}")
	if start != -1 && end != -1 {
		evaluation = evaluation[start : end+1]
	}

	return c.SendString(evaluation)
}

type Message struct {
	Text   string `json:"text"`
	Sender string `json:"sender"`
}

