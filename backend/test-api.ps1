# Test API logowania
$body = @{
    identity = "test@pricelss.pl"
    password = "TestPass123!"
} | ConvertTo-Json

Write-Host "Sending data:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "https://api.pricelss.pl/api/collections/users/auth-with-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $response.Content -ForegroundColor White
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        try {
            $errorContent = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorContent)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error body: $errorBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Cannot read error content" -ForegroundColor Yellow
        }
    }
} 