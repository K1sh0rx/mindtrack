#!/bin/bash

echo "====================================="
echo " Stopping MindTrack "
echo "====================================="

# -----------------------------
# Kill Backend (uvicorn)
# -----------------------------
echo "🔴 Stopping Backend..."
pkill -f "uvicorn main:app" 2>/dev/null

# -----------------------------
# Kill Vite
# -----------------------------
echo "🔴 Stopping Frontend..."
pkill -f "vite" 2>/dev/null

sleep 1

echo "✅ Processes stopped."

# -----------------------------
# HARD CLEAN MODE
# -----------------------------
if [[ "$1" == "--clean" ]]; then
    echo ""
    echo "🧹 CLEAN MODE ENABLED"
    echo "Removing venv + node_modules..."

    if [ -d "backend/venv" ]; then
        rm -rf backend/venv
        echo "🗑️  backend/venv removed"
    fi

    if [ -d "frontend/node_modules" ]; then
        rm -rf frontend/node_modules
        echo "🗑️  frontend/node_modules removed"
    fi

    if [ -f "frontend/package-lock.json" ]; then
        rm -f frontend/package-lock.json
        echo "🗑️  package-lock.json removed"
    fi

    if [ -f "frontend/bun.lockb" ]; then
        rm -f frontend/bun.lockb
        echo "🗑️  bun.lockb removed"
    fi

    echo "✅ Hard reset complete."
fi

echo "====================================="
echo " MindTrack stopped "
echo "====================================="
