package main

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func initDB() {
	var err error
	// Use local sqlite file
	db, err = sql.Open("sqlite3", "./afyalens-local.db")
	if err != nil {
		log.Fatal("Failed to connect to SQLite:", err)
	}

	// Setup initial tables for offline logging and training cases
	createTablesQuery := `
	CREATE TABLE IF NOT EXISTS patients (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		age INTEGER,
		gender TEXT,
		visit_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		patient_id INTEGER,
		input_text TEXT,
		model_output TEXT,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS training_cases (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT,
		difficulty INTEGER,
		case_state JSON
	);
	`

	_, err = db.Exec(createTablesQuery)
	if err != nil {
		log.Fatal("Failed to run create tables:", err)
	}

	log.Println("Local SQLite DB Initialized Successfully.")
}
