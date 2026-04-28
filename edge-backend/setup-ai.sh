#!/bin/bash

echo "Starting AfyaLens Edge AI Setup..."

# 1. Install Ollama if not present
if ! command -v ollama &> /dev/null
then
    echo "Ollama not found. Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "Ollama is already installed."
fi

# 2. Start Ollama in the background if it's not running
echo "Starting Ollama server..."
ollama serve >/dev/null 2>&1 &
sleep 5 # Wait for server to boot

# 3. Pull Gemma models
echo "Pulling 'gemma' Instruct model (this may take a few minutes depending on connection)..."
ollama pull gemma

echo "Pulling 'nomic-embed-text' for local vector embeddings..."
# nomic-embed-text is highly efficient for local RAG
ollama pull nomic-embed-text

echo "Local Edge AI setup complete."
echo "Ollama is running locally on port 11434 with Gemma and Nomic embeddings ready!"
