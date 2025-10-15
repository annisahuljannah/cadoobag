#!/bin/bash

# Start backend and frontend in development mode

echo "🚀 Starting Cadoobag Development Servers..."
echo ""

# Kill any existing processes on ports 4000 and 3000
echo "🧹 Cleaning up existing processes..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo ""
echo "📦 Starting Backend (http://localhost:4000)..."
cd backend && pnpm dev &
BACKEND_PID=$!

echo ""
echo "🎨 Starting Frontend (http://localhost:3000)..."
cd frontend && pnpm dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "   Backend: http://localhost:4000 (PID: $BACKEND_PID)"
echo "   Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
