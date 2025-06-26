#!/bin/bash

echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend server..."
cd src/app && npm run dev &
FRONTEND_PID=$!

echo "Both servers are running!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait