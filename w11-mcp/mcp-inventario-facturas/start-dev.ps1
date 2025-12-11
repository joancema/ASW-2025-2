Write-Host "🚀 Iniciando MCP Inventario..." -ForegroundColor Cyan
Write-Host ""

# Iniciar Backend en nueva ventana
Write-Host "✅ Iniciando Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/backend; npm run start:dev"

# Esperar 4 segundos
Start-Sleep -Seconds 4

# Iniciar MCP Server en nueva ventana
Write-Host "✅ Iniciando MCP Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/mcp-server; npm run dev"

# Esperar 4 segundos
Start-Sleep -Seconds 4

# Iniciar API Gateway en nueva ventana
Write-Host "✅ Iniciando API Gateway..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/api-gateway; npm run start:dev"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ Todos los servicios iniciados" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "Backend:     http://localhost:3002" -ForegroundColor Cyan
Write-Host "MCP Server:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "API Gateway: http://localhost:3000" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
