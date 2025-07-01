# Test różnych endpointów uwierzytelniania
$body = @{
    identity = "test@pricelss.pl"
    password = "NowePaslo123!"
} | ConvertTo-Json

$endpoints = @(
    "https://api.pricelss.pl/api/collections/users/auth-with-password",
    "https://api.pricelss.pl/api/admins/auth-with-password",
    "https://api.pricelss.pl/api/collections/_pb_users_auth_/auth-with-password"
)

foreach ($endpoint in $endpoints) {
    Write-Host "=== TESTING ENDPOINT ===" -ForegroundColor Yellow
    Write-Host "URL: $endpoint" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri $endpoint -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 2) -ForegroundColor White
        break
    } catch {
        Write-Host "FAILED: $($_.Exception.Response.StatusCode) - $($_.Exception.Message)" -ForegroundColor Red
        
        # Spróbuj odczytać szczegóły błędu
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorDetails = $reader.ReadToEnd()
            Write-Host "Details: $errorDetails" -ForegroundColor Yellow
        } catch {
            # Ignoruj błędy odczytu
        }
    }
    Write-Host ""
}

# Sprawdź też czy kolekcja users jest auth collection
Write-Host "=== CHECKING USERS COLLECTION TYPE ===" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://api.pricelss.pl/api/collections/users/records" -Method GET
    Write-Host "Users collection accessible (not auth collection)" -ForegroundColor Green
} catch {
    Write-Host "Users collection protected (might be auth collection)" -ForegroundColor Yellow
} 