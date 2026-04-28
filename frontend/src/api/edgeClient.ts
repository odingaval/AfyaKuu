// src/api/edgeClient.ts
// This client connects the PWA directly to the local Edge Go server without any internet requirements.

const EDGE_API_BASE = process.env.REACT_APP_EDGE_API || 'http://localhost:8080/api';

export interface DiagnosticResponse {
  possible_diagnosis: string;
  explanation: string;
  confidence_level: string;
  next_steps_per_protocol: string;
  citation: string;
  error?: string;
}

/**
 * Sends symptoms to local llama.cpp/Ollama-backed Go API for Offline Diagnosis
 */
export async function getLocalDiagnosis(symptoms: string): Promise<DiagnosticResponse> {
  try {
    const res = await fetch(`${EDGE_API_BASE}/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ symptoms })
    });

    if (!res.ok) {
      throw new Error(`Edge API returned status ${res.status}`);
    }

    const data = await res.json();
    return data as DiagnosticResponse;
  } catch (err) {
    console.error("Local Diagnosis Failed:", err);
    return {
      possible_diagnosis: "Unknown",
      explanation: "Unable to reach local Edge AI.",
      confidence_level: "0%",
      next_steps_per_protocol: "Check if Edge API and Ollama are running locally.",
      citation: "System",
      error: (err as Error).message
    };
  }
}

/**
 * Virtual Training: Send Chat Message to Local Gemma Agent
 */
export async function sendLocalTrainingMessage(message: string): Promise<any> {
    try {
        const res = await fetch(`${EDGE_API_BASE}/train/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        return await res.json();
    } catch (err) {
        console.error("Local Training Chat Failed:", err);
        return { reply: "Connection to Local Trainer failed." };
    }
}
