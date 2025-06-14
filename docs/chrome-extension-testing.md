# Chrome Extension Testing Guide

## 1. Load Extension in Developer Mode

### Kroki instalacji:

1. **Otwórz Chrome Extensions**
   - Wejdź na `chrome://extensions/`
   - Lub kliknij Menu → More tools → Extensions

2. **Włącz Developer Mode**
   - Przełącz przełącznik "Developer mode" w prawym górnym rogu

3. **Załaduj unpacked extension**
   - Kliknij "Load unpacked"
   - Wybierz folder `chrome-extension/`
   - Extension powinien pojawić się na liście

4. **Sprawdź installation**
   - Extension "Allegro Position Monitor" powinien być widoczny
   - Ikona extension powinna pojawić się w pasku narzędzi Chrome

## 2. Test Basic Functionality

### Test 1: Popup Interface
1. Kliknij ikonę extension w pasku narzędzi
2. Powinieneś zobaczyć:
   - Formularz logowania
   - Status "Rozłączony"
   - Modern design zgodny z mockupami

### Test 2: PocketBase Connection
1. W popup wypełnij:
   - Email: `test@allegro-monitor.com`
   - Password: `test123!`
2. Kliknij "Zaloguj się"
3. Sprawdź w Developer Tools:
   - Console powinien pokazać komunikaty o połączeniu
   - Brak błędów sieciowych

### Test 3: Allegro Page Detection
1. Przejdź na: https://allegro.pl/listing?string=laptop
2. Otwórz Developer Tools (F12)
3. W Console sprawdź:
   - Komunikat: "Allegro listing page detected"
   - Brak błędów JavaScript

### Test 4: Manual Scan
1. Na stronie Allegro z wynikami wyszukiwania
2. Kliknij ikonę extension → "Skanuj teraz"
3. Sprawdź:
   - Status zmienia się na "Skanowanie..."
   - Po chwili status pokazuje liczbę produktów
   - Brak błędów w console

## 3. Debugging & Development Tools

### Chrome Developer Tools
1. **Extension Popup Debug:**
   - Kliknij prawym na ikonę extension → "Inspect popup"
   - Debuguj popup.js w otwartym DevTools

2. **Background Script Debug:**
   - Idź do `chrome://extensions/`
   - Kliknij "background page" przy naszej extension
   - Debuguj background.js

3. **Content Script Debug:**
   - Na stronie Allegro otwórz DevTools (F12)
   - Content script jest widoczny w Sources tab

### Console Messages
Sprawdź czy widzisz te komunikaty:

**Background Script:**
```
Allegro Monitor Background Service Worker initialized
Login successful
Scan data saved successfully: [recordId]
```

**Content Script:**
```
Allegro Content Parser initialized
Allegro listing page detected
Starting position scan...
Found X products using selector: [selector]
Scan completed: X products found
```

**Popup:**
```
Initializing Allegro Monitor Popup...
Popup initialized successfully
```

## 4. Common Issues & Solutions

### Issue: Extension not loading
- **Solution:** Sprawdź czy wszystkie pliki są w folderze chrome-extension/
- **Check:** manifest.json jest poprawny JSON

### Issue: "Rozłączony" status
- **Solution:** Sprawdź czy PocketBase działa na localhost:8090
- **Check:** Otwórz http://localhost:8090/api/health

### Issue: No products found
- **Solution:** Sprawdź selektory CSS w content.js
- **Debug:** W DevTools sprawdź strukturę DOM Allegro

### Issue: Login errors
- **Solution:** Sprawdź czy user istnieje w PocketBase
- **Check:** Panel admin PocketBase → users collection

## 5. Performance Testing

### Memory Usage
1. Otwórz `chrome://system/`
2. Sprawdź memory usage extension
3. Powinno być < 50MB

### Network Requests
1. DevTools → Network tab
2. Wykonaj scan na Allegro
3. Sprawdź requests do localhost:8090

### CPU Usage
1. DevTools → Performance tab
2. Record podczas scanowania
3. Sprawdź czy brak długich tasków

## 6. Test Scenarios

### Scenario 1: Full Workflow
1. Zainstaluj extension
2. Zaloguj się do PocketBase
3. Przejdź na Allegro listing
4. Wykonaj manual scan
5. Sprawdź dane w PocketBase admin panel

### Scenario 2: Auto-Scan
1. Włącz auto-scan w popup
2. Nawiguj między różnymi Allegro listings
3. Sprawdź czy auto-scan działa

### Scenario 3: Error Handling
1. Wyłącz PocketBase server
2. Spróbuj zeskanować
3. Sprawdź error handling

## 7. Success Criteria

Extension jest gotowy do dalszego development gdy:

- ✅ Popup ładuje się bez błędów
- ✅ Można zalogować się do PocketBase  
- ✅ Allegro pages są automatycznie wykrywane
- ✅ Manual scan parsuje produkty (min 5 produktów)
- ✅ Dane zapisują się do PocketBase
- ✅ UI pokazuje status i feedback
- ✅ Brak critical errors w console

## Next Phase

Po pozytywnych testach przechodzimy do **Fazy 2: Web Dashboard Development**. 