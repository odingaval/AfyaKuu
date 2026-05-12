# 🩺 AfyaKuu: Edge AI for Rural Healthcare

**AfyaKuu** is an offline-first, Privacy-Preserving AI Diagnostic & Training platform designed for healthcare workers in low-resource, disconnected environments. 

Powered by **Google Gemma 2**, AfyaKuu provides real-time clinical support and interactive nurse education without requiring a single byte of internet connectivity.

---

## 🚀 Key Features

### 1. 🧠 Gemma-Powered Diagnostics
*   **Offline Inference**: Uses `gemma2:2b` via Ollama for light-speed clinical reasoning on standard laptop hardware.
*   **Grounded in Protocols**: Every response is cross-referenced with local Ministry of Health (MoH) guidelines via a **Local RAG (Retrieval-Augmented Generation)** system.

### 2. 🎓 Virtual Case Trainer
*   **Interactive Simulation**: An AI-driven "patient simulator" that allows nurses to practice triage and diagnostic questioning.
*   **Skill Evaluation**: Practice identifying red flags for Malaria, TB, and Pneumonia in a safe, simulated environment.

### 3. 📚 Medical Library (Offline Cache)
*   **Dynamic Knowledge Base**: Nurses can browse and search clinical protocols.
*   **Edge Updates**: Simply drop a `.txt` file into the `knowledge_base` folder to update the entire team's diagnostic knowledge.

### 4. 🛡️ Privacy & Reliability
*   **Zero-Cloud dependency**: No patient data ever leaves the device.
*   **Edge-First**: Designed to run on a standard T480s (8GB RAM) laptop, making it viable for rural clinics.

---

## 🛠️ Tech Stack

*   **AI Engine**: [Ollama](https://ollama.com/) running `gemma2:2b` and `nomic-embed-text`.
*   **Backend**: Golang (Fiber Framework) — high performance and low memory footprint.
*   **Database**: SQLite (Local storage for diagnostic audits and RAG indexing).
*   **Frontend**: React (PWA ready) with Material UI (Modern Clinical Aesthetics).
*   **Vector Store**: Custom in-memory vector indexing for lightning-fast RAG retrieval.

---

## 🏗️ Architecture

1.  **Frontend (React)**: Professional NURSE Dashboard for triage and training.
2.  **Edge API (Go)**: Orchestrates RAG workflows and handles LLM communication.
3.  **Local Inference (Ollama)**: Serves the Gemma 2 model locally on port 11434.
4.  **Knowledge Base**: A directory of `.txt` protocols that the Go backend embeds on startup.

---

## 🏁 Quick Start (Hackathon Setup)

### Prerequisites
*   Install [Ollama](https://ollama.com/)
*   Install [Go](https://go.dev/)
*   Install [Node.js](https://nodejs.org/)

### 1. Pull the Models
```bash
ollama pull gemma2:2b
ollama pull nomic-embed-text
```

### 2. Run the Backend
```bash
cd edge-backend
go run .
```

### 3. Run the Frontend
```bash
cd frontend
npm install
npm start
```

---

## 🌍 Impact
In rural Kenya and similar regions, 1 in 3 patients receive a misdiagnosis due to limited access to specialists. AfyaLens puts a "Specialist in a Box" in every clinic, ensuring that even when the network is down, the quality of care remains high.

**AfyaKuu: Because health shouldn't depend on a signal.** 🩺📡
