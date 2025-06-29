# Import Collections to PocketBase
# This script will create the necessary collections for Allegro Monitor

Write-Host "=== PocketBase Collections Import ===" -ForegroundColor Green

# Check if PocketBase is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8090/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ PocketBase is running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ PocketBase is not running. Please start it first with: .\pocketbase.exe serve" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Instructions for importing collections:" -ForegroundColor Yellow
Write-Host "1. Open PocketBase Admin Panel: http://localhost:8090/_/" -ForegroundColor White
Write-Host "2. Login with your admin credentials" -ForegroundColor White
Write-Host "3. Go to Collections" -ForegroundColor White
Write-Host "4. Click 'Import collections'" -ForegroundColor White
Write-Host "5. Select the file: collections-schema.json" -ForegroundColor White
Write-Host "6. Click Import" -ForegroundColor White

Write-Host ""
Write-Host "Alternatively, you can create collections manually:" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== Collection 1: users (auth) ===" -ForegroundColor Cyan
Write-Host "Type: Auth collection"
Write-Host "Name: users"
Write-Host "Fields: email (auto-created)"
Write-Host "API Rules:"
Write-Host "  - List: (empty)"
Write-Host "  - View: id = @request.auth.id"
Write-Host "  - Create: (empty)"
Write-Host "  - Update: id = @request.auth.id"
Write-Host "  - Delete: id = @request.auth.id"

Write-Host ""
Write-Host "=== Collection 2: positions (base) ===" -ForegroundColor Cyan
Write-Host "Type: Base collection"
Write-Host "Name: positions"
Write-Host "Fields:"
Write-Host "  - userId (relation to users, required)"
Write-Host "  - url (text, required, max 2000 chars)"
Write-Host "  - keyword (text, required, max 500 chars)"
Write-Host "  - date (date, required)"
Write-Host "  - timestamp (date, required)"
Write-Host "  - products (json, required, max 1MB)"
Write-Host "API Rules:"
Write-Host "  - List: userId = @request.auth.id"
Write-Host "  - View: userId = @request.auth.id"
Write-Host "  - Create: @request.auth.id != \"\""
Write-Host "  - Update: userId = @request.auth.id"
Write-Host "  - Delete: userId = @request.auth.id"

Write-Host ""
Write-Host "=== Opening Admin Panel ===" -ForegroundColor Green
Start-Process "http://localhost:8090/_/"

Write-Host "✓ Admin panel opened in browser" -ForegroundColor Green
Write-Host "Please follow the instructions above to import collections." -ForegroundColor Yellow 