#!/bin/bash

# Kill background processes on exit
trap "kill 0" EXIT

#echo "Starting Django Backend..."
#python server/manage.py runserver 8000 &

echo "Starting Local MCP Host (FastAPI)..."
export PYTHONPATH=$(pwd)
python -m mcp_host.main &

echo "Starting Frontend..."
cd prompt_fill
npm run dev &

wait
