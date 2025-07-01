# Skrypt do eksportu danych z lokalnej bazy PocketBase do CSV
# Autor: M.O.
# Data: 2025-06-30

$PocketBaseUrl = "http://127.0.0.1:8090"
$ExportDir = "exported-data"

Write-Host "🚀 Rozpoczynam eksport danych z lokalnej bazy PocketBase..." -ForegroundColor Green

# Utwórz katalog eksportu jeśli nie istnieje
if (!(Test-Path $ExportDir)) {
    New-Item -ItemType Directory -Path $ExportDir | Out-Null
    Write-Host "📁 Utworzono katalog: $ExportDir" -ForegroundColor Yellow
}

# Funkcja do eksportu kolekcji
function Export-Collection {
    param(
        [string]$CollectionName,
        [string]$OutputFile
    )
    
    try {
        Write-Host "📊 Eksportuje kolekcję: $CollectionName..." -ForegroundColor Cyan
        
        $Response = Invoke-RestMethod -Uri "$PocketBaseUrl/api/collections/$CollectionName/records?perPage=500" -Method GET
        
        if ($Response.items -and $Response.items.Count -gt 0) {
            # Konwertuj do CSV
            $Response.items | Export-Csv -Path $OutputFile -NoTypeInformation -Encoding UTF8
            Write-Host "✅ Wyeksportowano $($Response.items.Count) rekordów do: $OutputFile" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Brak danych w kolekcji: $CollectionName" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Błąd podczas eksportu $CollectionName : $_" -ForegroundColor Red
    }
}

# Eksportuj wszystkie kolekcje
Write-Host "`n📋 Eksportuje kolekcje..." -ForegroundColor White

Export-Collection -CollectionName "users" -OutputFile "$ExportDir\users.csv"
Export-Collection -CollectionName "projects" -OutputFile "$ExportDir\projects.csv"  
Export-Collection -CollectionName "keywords" -OutputFile "$ExportDir\keywords.csv"
Export-Collection -CollectionName "positions" -OutputFile "$ExportDir\positions.csv"

Write-Host "`n🎉 Eksport zakończony!" -ForegroundColor Green
Write-Host "📁 Pliki CSV zostały zapisane w katalogu: $ExportDir" -ForegroundColor White

# Pokaż podsumowanie
Write-Host "`n📊 Podsumowanie:" -ForegroundColor White
Get-ChildItem $ExportDir -Filter "*.csv" | ForEach-Object {
    $LineCount = (Get-Content $_.FullName | Measure-Object -Line).Lines - 1  # -1 bo nagłówek
    Write-Host "   $($_.Name): $LineCount rekordów" -ForegroundColor Gray
}

Write-Host "`n💡 Możesz teraz otworzyć pliki CSV w Excel lub innym programie" -ForegroundColor Cyan
Write-Host "📍 Lokalizacja: $(Resolve-Path $ExportDir)" -ForegroundColor Gray 