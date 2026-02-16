#!/bin/bash

echo "====================================="
echo " MindTrack Smart Setup (macOS) "
echo "====================================="

# -------------------------
# CHECK PYTHON
# -------------------------
if ! command -v python3 &> /dev/null
then
    echo "❌ Python3 not found. Install it first."
    exit
fi

# -------------------------
# BACKEND SETUP
# -------------------------
cd backend

# Create venv only if missing
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
else
    echo "✅ venv already exists — skipping"
fi

source venv/bin/activate

echo "📦 Installing backend requirements..."
pip install -r requirements.txt > /dev/null

cd ..

# -------------------------
# NODE CHECK
# -------------------------
if ! command -v npm &> /dev/null
then
    echo "❌ NodeJS not found. Install NodeJS first."
    exit
fi

# -------------------------
# FRONTEND SETUP
# -------------------------
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend packages..."
    npm install
else
    echo "✅ node_modules exists — skipping"
fi

cd ..

# -------------------------
# OLLAMA CHECK
# -------------------------
if ! command -v ollama &> /dev/null
then
    echo "❌ Ollama not installed!"
    echo "Install from https://ollama.ai"
    exit
fi

# Pull model only if missing
if ! ollama list | grep -q "llama3"
then
    echo "📦 Pulling LLM model..."
    ollama pull llama3
else
    echo "✅ LLM already downloaded — skipping"
fi

echo "====================================="
echo " Setup Complete "
echo "Run ./run.sh"
echo "====================================="
