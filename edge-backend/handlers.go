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
	var req TrainChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid format"})
	}

	// Dynamic persona injected as a hidden patient template
	// Normally fetched from SQLite `training_cases` table
	systemPrompt := `
<system>
You are playing the role of an interactive simulated patient from rural Kenya.
Your hidden profile: A 28-year-old farmer presenting with severe fatigue, intermittent high fever, and chills for the past 4 days.
You DO NOT know medical terminology.
If the doctor (user) asks to run an RDT for Malaria, ONLY output: <call_lab>{"test_name": "rdt_malaria"}</call_lab>
</system>`

	prompt := fmt.Sprintf("%s\n<user>%s</user>", systemPrompt, req.Message)

	response, err := CallLocalGemma(prompt)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Trainer Offline."})
	}

	// 1. Evaluate function/tool calls locally
	if strings.Contains(response, "<call_lab>") {
		// Mock local tool resolution without internet
		// e.g. "We parsed <call_lab> and queried SQLite for lab result for this patient case."
		response = "[SYSTEM NOTIFICATION: Lab Result Returned - RDT Malaria: POSITIVE_PF]\nPatient: I just got my results back doctor, what does it say?"
	}

	return c.JSON(fiber.Map{"reply": strings.TrimSpace(response)})
}

