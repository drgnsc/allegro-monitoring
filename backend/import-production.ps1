# Import Collections to Production PocketBase
Write-Host "=== PocketBase Production Import ===" -ForegroundColor Green
Write-Host "Target server: https://api.pricelss.pl" -ForegroundColor Cyan

Write-Host ""
Write-Host "Step 1: Backup current collections schema" -ForegroundColor Yellow
Write-Host "1. Go to: https://api.pricelss.pl/_/" -ForegroundColor White
Write-Host "2. Login with your admin credentials" -ForegroundColor White
Write-Host "3. Go to Collections -> Export collections" -ForegroundColor White
Write-Host "4. Save as backup.json (in case you need to rollback)" -ForegroundColor White

Write-Host ""
Write-Host "Step 2: Import new collections" -ForegroundColor Yellow
Write-Host "1. Still in Collections page" -ForegroundColor White
Write-Host "2. Click Import collections" -ForegroundColor White
Write-Host "3. Upload: collections-schema.json" -ForegroundColor White
Write-Host "4. Check Delete missing collections if you want clean import" -ForegroundColor Red
Write-Host "5. WARNING: This will delete existing data!" -ForegroundColor Red
Write-Host "6. Click Import" -ForegroundColor White

Write-Host ""
Write-Host "Step 3: Create first user account" -ForegroundColor Yellow
Write-Host "1. Go to Collections -> users" -ForegroundColor White
Write-Host "2. Click New record" -ForegroundColor White
Write-Host "3. Set email and password" -ForegroundColor White
Write-Host "4. Save" -ForegroundColor White

Write-Host ""
Write-Host "=== Opening Production Admin Panel ===" -ForegroundColor Green
Start-Process "https://api.pricelss.pl/_/"

Write-Host ""
Write-Host "Production admin panel opened" -ForegroundColor Green
Write-Host "File to import: collections-schema.json" -ForegroundColor Cyan 