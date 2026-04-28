# **🩺 AfyaLens: AI-Powered Diagnostics and Training for Rural African Healthcare**

## **🌟 Project Overview**

**AfyaLens** is a multi-agent capstone project designed to address the critical gaps in specialized diagnostics and continuous professional development (STEM Education) for **Healthcare Workers (HCWs)** in remote African clinics. Leveraging Google's Generative AI and Agentic frameworks, AfyaLens functions as a crucial **co-pilot** to improve the speed and accuracy of diagnosis for visually confirmed diseases, such as **Malaria**.

### **Project Guardrail Compliance**

| Guardrail | Compliance Feature |
| :---- | :---- |
| **African Growth Focus** | Addresses critical challenges in **MedTech** (diagnostic accuracy) and **STEM Education** (continuous training) in underserved African communities. |
| **Innovative Tech Use** | Integrates **Genkit**, **ADK**, and **Vertex AI** into a unified, modular, and scalable system. |
| **Sustainability** | Built on scalable, cloud-native (Cloud Run) services and provides a cost-effective, continuous learning platform. |

## **System Architecture and Core Components**

The AfyaLens system is defined by two specialized AI agents that communicate through a modular, API-driven architecture.

### **1\. The Diagnostic Analyst Agent (Genkit \+ Vertex AI)**

**Function:** Provides real-time, image-based diagnostic support and grounds the resulting advice in official medical protocols.

| Technology | Role in AfyaLens |
| :---- | :---- |
| **Vertex AI (Custom Model)** | Hosts the specialized **Vision Model** trained to analyze uploaded images (e.g., blood smears, skin lesions). Returns a structured diagnosis and confidence score. |
| **Genkit** | **Orchestrates the entire flow.** Defines the **Retrieval-Augmented Generation (RAG)** pipeline, which ensures the final treatment recommendation is strictly based on indexed, local treatment guidelines, preventing large language model (LLM) hallucinations. |
| **Gemini (via Vertex AI)** | Used by the Genkit RAG to process the query, retrieve context, and generate the final, grounded prescription advice. |

### **2\. The Virtual Case Trainer Agent (ADK)**

**Function:** Delivers continuous, interactive **STEM education** through simulated patient case studies.

| Technology | Role in AfyaLens |
| :---- | :---- |
| **ADK (Agent Development Kit)** | The core framework used to build the stateful, conversational agent. Manages the logic for generating patient scenarios, tracking the HCW's responses, and providing personalized, evaluative feedback. |
| **FastAPI/Python** | Serves the ADK agent logic as a simple, high-performance API endpoint, enabling easy integration with the mobile/web interface. |

## **Getting Started (Testing Instructions)**

The prototype is designed to run locally using the Genkit Dev UI and a simple Python server for the ADK agent, demonstrating cross-technology integration.

### **Prerequisites**

* **Python 3.9+** (for ADK)  
* **Node.js 18+** (for Genkit)  
* **Google Cloud CLI (`gcloud`)**  
* **A Google Cloud Project** with **Vertex AI API** enabled.

### **1\. Setup & Authentication**

1. **Clone the Repository:**  
2. Bash  
3.   
4. **Authentication:** Run `gcloud auth application-default login` to enable both Genkit and ADK to access your Vertex AI services.  
5. **Install Dependencies:**  
   1. **Genkit (TypeScript):** `npm install`  
   2. **ADK (Python):** `pip install -r requirements.txt` (ensure virtual environment is active)

### **2\. Running the Core Agents**

#### **A. Diagnostic Analyst Agent (Genkit)**

This starts the Genkit backend, hosting the RAG and the mock Vertex AI classification tool.

Bash

* The **Genkit Developer UI** will be available at: `http://localhost:3400/`.  
* **Testing:** Use the Dev UI to execute the `diagnosticAnalysisFlow` with a sample text query and a **Base64-encoded image** (or placeholder) to view the flow trace and RAG grounding in real-time.

#### **B. Virtual Case Trainer Agent (ADK)**

This starts the Python server hosting the ADK Training Agent.

* The ADK service will be running at `http://localhost:8000/`.  
* **Testing:** Use a tool like **curl** or **Postman** to send a sample `POST` request to the `/chat` endpoint to initiate a conversation with the trainer.

---

