# Test logowania z pelna diagnostyka
param(
    [string]$password = "TestPass123!"
)

$body = @{
    identity = "test@pricelss.pl"
    password = $password
} | ConvertTo-Json

Write-Host "=== TEST LOGOWANIA ===" -ForegroundColor Yellow
Write-Host "URL: https://api.pricelss.pl/api/collections/users/auth-with-password" -ForegroundColor Cyan
Write-Host "Body:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Green
Write-Host "===================" -ForegroundColor Yellow

try {
    # Użyj Invoke-RestMethod dla lepszej obsługi JSON
    $response = Invoke-RestMethod -Uri "https://api.pricelss.pl/api/collections/users/auth-with-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        
        # Spróbuj odczytać szczegóły błędu
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorDetails = $reader.ReadToEnd()
            Write-Host "Error details:" -ForegroundColor Yellow
            Write-Host $errorDetails -ForegroundColor Red
        } catch {
            Write-Host "Cannot read error details" -ForegroundColor Yellow
        }
    }
} 