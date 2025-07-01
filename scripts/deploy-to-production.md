# Instrukcja wdrożenia na serwer produkcyjny

## Krok 1: Zatwierdź zmiany lokalnie
```powershell
# W katalogu głównym projektu
git add .
git commit -m "Przełączenie web dashboard na produkcyjne API"
git push origin master
```

## Krok 2: Połącz się z serwerem przez SSH (PuTTY)
```bash
# Połącz się z serwerem przez PuTTY
# Host: twój_serwer.com
# User: twój_user
```

## Krok 3: Aktualizuj kod na serwerze
```bash
# Przejdź do katalogu z projektem
cd /ścieżka/do/twojego/projektu

# Pobierz najnowsze zmiany
git pull origin master

# Sprawdź czy są zmiany w dependencjach
cd web-dashboard
npm install

# Zbuduj produkcyjną wersję
npm run build

# Sprawdź czy build się udał
ls -la dist/
```

## Krok 4: Restart serwera web (jeśli potrzebny)
```bash
# Jeśli używasz PM2
pm2 restart allegro-dashboard

# Jeśli używasz systemctl
sudo systemctl restart nginx
sudo systemctl restart twoja-aplikacja

# Jeśli to zwykły hosting - skopiuj pliki z dist/ do public_html
```

## Krok 5: Test produkcyjny
Otwórz w przeglądarce:
- URL produkcyjny: `https://twoja-domena.com`
- Sprawdź czy połączenie pokazuje: `🔒 Połączenie: https://api.pricelss.pl`
- Zaloguj się kontem: `test@pricelss.pl` / `TestPass123!`

## Struktura katalogów na serwerze
```
/home/user/allegro-monitoring/
├── web-dashboard/
│   ├── dist/          # Zbudowane pliki produkcyjne
│   ├── src/           # Kod źródłowy
│   └── package.json
├── chrome-extension/  # Wtyczka Chrome
└── backend/          # PocketBase (jeśli hostowany osobno)
```

## Notatki
- API działa na: `https://api.pricelss.pl`
- Web dashboard będzie się łączył z tym API
- Wtyczka Chrome już jest skonfigurowana na to API
- Użytkownik testowy: `test@pricelss.pl` / `TestPass123!` 