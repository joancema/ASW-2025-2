#!/bin/bash

echo "🚀 Iniciando MCP Inventario..."
echo ""

# Iniciar Backend
cd apps/backend && npm run start:dev &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# Esperar 4 segundos
sleep 4

# Iniciar MCP Server
cd ../mcp-server && npm run dev &
MCP_PID=$!
echo "✅ MCP Server iniciado (PID: $MCP_PID)"

# Esperar 4 segundos
sleep 4

# Iniciar API Gateway
cd ../api-gateway && npm run start:dev &
GATEWAY_PID=$!
echo "✅ API Gateway iniciado (PID: $GATEWAY_PID)"

echo ""
echo "============================================"
echo "✅ Todos los servicios iniciados"
echo "============================================"
echo "Backend:     http://localhost:3002"
echo "MCP Server:  http://localhost:3001"
echo "API Gateway: http://localhost:3000"
echo "============================================"
echo ""
echo "Para detener todos los servicios:"
echo "kill $BACKEND_PID $MCP_PID $GATEWAY_PID"
echo ""

# Esperar a que los procesos terminen
wait
