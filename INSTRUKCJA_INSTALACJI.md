# 🎯 Allegro Position Monitor - Instrukcja instalacji

## 📋 Co robimy?
Wtyczka Chrome do monitorowania pozycji produktów na Allegro - automatycznie zbiera dane o pozycjach wyszukiwania i wysyła do centralnej bazy danych.

## 🚀 Instalacja wtyczki Chrome

### Metoda 1: Z folderu (Zalecana)
1. **Pobierz i rozpakuj** folder `chrome-extension`
2. **Otwórz Chrome** → wpisz `chrome://extensions/` w pasku adresu
3. **Włącz "Developer mode"** (przełącznik w prawym górnym rogu)
4. **Kliknij "Load unpacked"** (Załaduj rozpakowane)
5. **Wybierz folder** `chrome-extension`
6. ✅ **Gotowe!** Wtyczka jest zainstalowana

### Metoda 2: Z pliku .crx (jeśli dostępny)
1. **Pobierz plik** `chrome-extension.crx`
2. **Otwórz Chrome** → `chrome://extensions/`
3. **Włącz "Developer mode"**
4. **Przeciągnij plik .crx** do okna Chrome
5. **Potwierdź instalację**

## 🔧 Pierwsze uruchomienie

1. **Kliknij ikonę wtyczki** (obok paska adresu)
2. **Podaj dane logowania**:
   - Email: `test@pricelss.pl` 
   - Hasło: `TestPass123!`
   - Server URL: `https://api.pricelss.pl` (już wypełnione)
3. **Kliknij "Zaloguj"**

## 📊 Jak używać?

1. **Wejdź na Allegro** i wyszukaj coś (np. "iphone")
2. **Kliknij ikonę wtyczki** 
3. **Wybierz/wpisz słowo kluczowe** które chcesz monitorować
4. **Kliknij "Rozpocznij skanowanie"**
5. **Wtyczka automatycznie** zbierze pozycje wszystkich produktów na stronie
6. **Dane trafiają** do systemu monitoringu na `https://api.pricelss.pl`

## 🎯 Panel monitoringu
Wszystkie zebrane dane możesz przeglądać w panelu: **[Link będzie dostępny wkrótce]**

## 📞 Problemy?
- Sprawdź czy jesteś zalogowany w wtyczce
- Upewnij się że serwer API jest dostępny
- W razie problemów skontaktuj się z administratorem

---
**Wersja:** 1.0 | **Data:** 30.06.2025 