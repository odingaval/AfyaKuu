# 🩺 AfyaLens: Gemma 4 Offline-First Refactor Plan

This document outlines the strategic pivot of the **AfyaLens** system from a cloud-dependent architecture to a highly robust, local-first, **Gemma 4-powered Edge AI application** designed for low-resource rural healthcare settings.

## 1. Updated Architecture Diagram (Text-Based)

```text
       [ Mobile-First PWA (React/Vite) ]
           (Served locally to Mobile/Tablet)
                        |
                        | (Local REST & WebSockets)
                        v
    +-----------------------------------------------+
    |            Local Go Backend API               |
    |  (Single Binary, High Concurrency, Low Mem)   |
    +---+-------------------+-------------------+---+
        |                   |                   |
        v                   v                   v
+---------------+   +----------------+   +-------------------+
| SQLite        |   | Local FAISS/   |   | Inference Engine  |
| (Structured   |   | ChromaDB       |   | (llama.cpp /      |
| Data & State) |   | (RAG Vectors)  |   | Ollama)           |
+---------------+   +----------------+   +---------+---------+
        |                   |                      |
  Patient Data         MoH Protocols               v
  Agent Context        Malaria Guides    [ Gemma 4 (Instruct)]
  Session Logs         Tool Configs      [ Local Embeddings  ]
                                         [ Light Vision Model]
```

## 2. Detailed Component Breakdown

* **Frontend (React PWA)**: A Progressive Web App that works entirely offline using Service Workers. Served from the local Go backend. Contains two primary workflows: **Diagnostic Co-Pilot** and **Virtual Case Trainer**.
* **Backend (Golang API)**: Chosen for its negligible cold-start time, single static binary deployment, and low RAM usage. It orchestrates the flow, handles API endpoints (`/diagnose`, `/train`, `/chat`), and manages database connections.
* **Inference Engine (llama.cpp / Ollama)**: Runs quantized versions (e.g., 4-bit or 8-bit GGUF) of **Gemma 4 Instruct**, allowing it to execute smoothly on edge laptops (such as a standard field laptop or mini-PC with 4-8GB RAM and CPU only).
* **Local RAG Store (FAISS / Local Chroma)**: Holds embedding representations of vetted medical text, primarily focusing on local Ministry of Health (MoH) malaria guidelines. Embeddings are generated using a local embedding model.
* **Vision Fallback (ONNX/TFLite)**: If Gemma 4 multimodal is too heavy for CPU, an ultra-lightweight local object detection model (MobileNet) analyzes blood smear images, outputting structured text (e.g., "Parasitemia detected: Plasmodium falciparum, 40% confidence"), which is injected into the Gemma 4 prompt.

## 3. Data Flow (Step-by-Step)

### A. Diagnostic Flow
1. **Input**: Healthcare Worker (HCW) inputs patient symptoms (and optionally uploads an image/blood smear).
2. **Vision (If Image Uploaded)**: Local MobileNet model interprets image → outputs structured text finding.
3. **Retrieval**: Go backend sanitizes the combined text (symptoms + visual finding) and queries the Local FAISS vector store.
4. **Context Injection**: Relevant WHO/MoH protocols are extracted.
5. **Generation**: Go backend structures a prompt combining the user input, the RAG context, and the system persona, then calls the local Gemma 4 endpoint.
6. **Output**: Gemma 4 explicitly formats a structured response providing a possible explanation, confidence score, and specific protocol-based next steps. Response is displayed in the UI with citations.

### B. Training Flow
1. **Initialization**: HCW selects a training module. The Go backend fetches a "Scenario Template" from SQLite.
2. **Simulation**: Gemma 4 is prompted to act as a simulated patient. 
3. **Interaction**: HCW asks questions. Gemma 4 responds dynamically but stays strictly within the bounds of the hidden case parameters.
4. **Tool Use**: When the HCW "orders" a lab test, Gemma 4 outputs a JSON tool call (`{ "action": "fetch_lab", "test": "rdt" }`). Go backend intercepts this, resolves it using SQLite, and feeds the result back to Gemma.
5. **Evaluation**: Once HCW makes a diagnosis, Gemma 4 evaluates the accuracy based on the optimal MoH protocol from RAG.

## 4. Prompt Design

### A. Diagnostic Agent Prompt
```text
<system>
You are the AfyaLens Diagnostic Assistant, an AI co-pilot for rural healthcare workers. 
Your purpose is to provide structured diagnostic hypotheses based STRICTLY on the provided medical protocols. 
DO NOT act as a definitive doctor. ALWAYS state your confidence level and provide the RAG source citation.
If the symptoms match a critical emergency, advise immediate referral.

<context>
{RAG_RETRIEVED_MOH_PROTOCOLS}
</context>
</system>

<user>
Symptoms: {USER_INPUT_SYMPTOMS}
Lab Findings: {LOCAL_VISION_MODEL_OUTPUT}

Provide a JSON response containing: 
"possible_diagnosis", "explanation", "confidence_level", "next_steps_per_protocol", "citation".
</user>
```

### B. Training Agent Prompt
```text
<system>
You are an interactive simulated patient for healthcare training. 
Your profile is: {PATIENT_PROFILE_JSON}. You only know your symptoms, not the medical terms. 
When the doctor (user) asks you questions, answer truthfully according to your profile. 
If the user requests a lab test, output EXACTLY this function call format: 
<call_lab>{"test_name": "requested_test"}</call_lab>
</system>
```

## 5. Database Schema (SQLite)

* `patients`
  * `id` (UUID), `age` (Int), `gender` (Text), `visit_date` (Date)
* `sessions` (For Logging/Audit)
  * `id` (UUID), `patient_id` (UUID), `input_text` (Text), `model_output` (Text), `timestamp` (DateTime)
* `case_templates` (For Training Agent)
  * `id` (UUID), `title` (Text), `difficulty` (Int), `underlying_truth` (JSON)
* `training_logs`
  * `id` (UUID), `user_id` (Text), `case_id` (UUID), `score` (Int), `feedback` (Text)

## 6. RAG Implementation Plan

1. **Information Ingestion (One-time, offline preparation)**:
   - Compile MoH and WHO PDF guidelines for Malaria and common local illnesses.
   - Use a script chunking text into 500-word segments.
   - Run segments through a local sentence-transformer embedding model.
   - Store vectors and metadata (File name, Page number, Section) in FAISS.
2. **Retrieval**:
   - Go backend receives input, runs local embedding, calculates Cosine Similarity in FAISS, and fetches the top 3 highest-scoring chunks.
   - These 3 chunks are embedded in the `<context>` XML block in the prompt.

## 7. Deployment Strategy

* **Target Hardware**: Intel NUC, locally operated Raspberry Pi 5, or a donated entry-level laptop.
* **Packaging**: 
  - Entire system is containerized via **Docker Compose**:
    1. Container A: Go Backend + FAISS + React Static Files 
    2. Container B: Ollama (hosting Gemma 4 and Embeddings)
* **Installation**: Field deployment involves copying a USB drive containing the Docker images, model weights (`.gguf`), and a startup bash script (`./start-afyalens.sh`). No internet required for provisioning.

## 8. Demo Strategy (CRITICAL FOR HACKATHON)

**The 3-Minute Impact Demo Narrative:**

* **Setup (0:00-0:30)**: Physically disable the WiFi on the presentation laptop. Emphasize: *"We are now in a clinic in rural Kenya. The power is on via solar, but internet is entirely down. We have a patient presenting with high fever."*
* **The Diagnostic Run (0:30-1:30)**: 
  - Type symptoms into the AfyaLens UI. 
  - Show the rapid generation speed of locally quantized Gemma 4. 
  - **Highlight Safety**: Point out the explicit citation to the Kenyan MoH Malaria protocol retrieved via Local RAG, and the confidence score mechanism protecting against hallucination.
* **The Training Mode (1:30-2:30)**: 
  - Switch tabs to the Virtual Case Trainer.
  - Interact naturally with the simulated patient (Gemma 4). 
  - Type "I'd like to order a Rapid Diagnostic Test for Malaria". Show the system pausing, interpreting the intent via implicit function calling, querying the local SQLite DB for the test results, and informing the HCW of a positive RDT.
* **Closing (2:30-3:00)**: Show how all interactions are securely logged in SQLite for future auditing by senior doctors when back in connectivity. Emphasize that Gemma 4's lightweight power enables world-class AI on edge devices, democratizing MedTech.
