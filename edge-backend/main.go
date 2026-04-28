package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// Initialize Local SQLite Database
	initDB()

	// Setup Fiber App
	app := fiber.New(fiber.Config{
		AppName: "AfyaKuu Edge API v1",
	})
	
	// Initialize Local RAG System over HTTP local embeddings
	InitRAG()

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New()) // Allow local PWA to connect

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "offline_mode": true})
	})

	// API Routes
	api := app.Group("/api")
	
	// Diagnostic Agent Endpoints
	api.Post("/diagnose", handleDiagnose)
	api.Post("/diagnostic/analyze", handleDiagnose) // Match frontend expectation
	
	// Virtual Training Agent Endpoints
	api.Post("/train/start", handleStartTraining)
	api.Post("/train/chat", handleTrainChat)

	// Graceful Shutdown
	go func() {
		if err := app.Listen(":8080"); err != nil {
			log.Panic(err)
		}
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("Gracefully shutting down edge server...")
	_ = app.Shutdown()
}
