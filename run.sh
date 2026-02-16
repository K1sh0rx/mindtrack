#!/bin/bash

echo "====================================="
echo " Starting MindTrack "
echo "====================================="

# -------------------------
# START OLLAMA IF NOT RUNNING
# -------------------------
if ! pgrep -x "ollama" > /dev/null
then
    echo "🚀 Starting Ollama..."
    ollama serve &
    sleep 5
else
    echo "✅ Ollama already running"
fi

# -------------------------
# START BACKEND
# -------------------------
cd backend
source venv/bin/activate

if ! lsof -i:8000 > /dev/null
then
    echo "🚀 Starting FastAPI Backend..."
    uvicorn main:app --reload &
    sleep 3
else
    echo "✅ Backend already running"
fi

cd ..

# -------------------------
# START FRONTEND
# -------------------------
cd frontend

if ! lsof -i:5173 > /dev/null
then
    echo "🚀 Starting Vite Frontend..."
    npm run dev &
else
    echo "✅ Frontend already running"
fi

cd ..

echo "====================================="
echo " System Running "
echo " Backend  → http://localhost:8000"
echo " Frontend → http://localhost:5173"
echo "====================================="
