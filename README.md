# Allegro Position Monitor

Wtyczka Chrome do monitorowania pozycji produktów na Allegro.pl z dashboardem webowym.

## 📋 Opis projektu

Allegro Position Monitor to rozwiązanie składające się z:
- **Chrome Extension** - automatyczne wykrywanie i parsowanie pozycji produktów na Allegro
- **Web Dashboard** - interfejs do przeglądania, analizowania i eksportowania danych
- **Backend API** - PocketBase do przechowywania danych i zarządzania użytkownikami

## 🚀 Status implementacji

### ✅ Faza 0: Setup & Przygotowanie (UKOŃCZONE)
- [x] Struktura folderów projektu
- [x] Inicjalizacja Git repository
- [x] Manifest.json Chrome Extension
- [x] Podstawowy interfejs popup (HTML/CSS/JS)
- [x] Content script do parsowania Allegro
- [x] Background script do komunikacji z PocketBase
- [x] Konfiguracja gitignore

### 🔄 Faza 1: Core Extension Development (W TRAKCIE)
- [ ] Lokalne środowisko PocketBase
- [ ] Testowanie podstawowych funkcji
- [ ] Integracja z Chrome Developer Mode
- [ ] Debugging i optymalizacja

### ⏳ Faza 2: Web Dashboard Development (PLANOWANE)
- [ ] Interfejs logowania
- [ ] Dashboard do przeglądania danych
- [ ] System wyszukiwania i filtrowania
- [ ] Eksport CSV z analizą trendów

### ⏳ Faza 3: Deployment & Integration (PLANOWANE)
- [ ] Deployment PocketBase na Railway
- [ ] Deployment dashboard na Vercel
- [ ] Konfiguracja produkcyjna
- [ ] Testy end-to-end

## 🛠️ Technologie

- **Chrome Extension**: Vanilla JavaScript, Manifest V3
- **Backend**: PocketBase (SQLite + REST API)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Hosting**: Railway.app (backend), Vercel (dashboard)
- **IDE**: Cursor

## 📁 Struktura projektu

```
allegro-monitor/
├── chrome-extension/          # Wtyczka Chrome
│   ├── manifest.json         # Konfiguracja extension
│   ├── popup.html/css/js     # Interfejs popup
│   ├── content.js            # Parser stron Allegro
│   ├── background.js         # Service worker
│   └── icons/                # Ikonki wtyczki
├── web-dashboard/            # Dashboard webowy
├── backend/                  # Konfiguracja PocketBase
├── docs/                     # Dokumentacja
└── README.md                 # Ten plik
```

## 🎯 Następne kroki

1. **Setup PocketBase lokalnie**
   ```bash
   # Pobierz PocketBase
   # Skonfiguruj collections (users, positions)
   # Uruchom lokalny serwer
   ```

2. **Test Chrome Extension**
   ```bash
   # Załaduj extension w Chrome Developer Mode
   # Przetestuj na stronach Allegro
   # Sprawdź komunikację z PocketBase
   ```

3. **Rozpocznij development dashboardu**
   ```bash
   # Setup struktura web-dashboard
   # Implementuj interfejs logowania
   # Dodaj funkcje przeglądania danych
   ```

## 📖 Dokumentacja

- [PRD - Product Requirements Document](allegro_monitor_prd.md)
- [Tech Stack Document](tech_stack_document.md)
- [Implementation Plan](implementation_plan.md)

## 🔧 Development

### Lokalne uruchomienie
1. Sklonuj repozytorium
2. Zainstaluj PocketBase
3. Skonfiguruj Chrome Extension w trybie deweloperskim
4. Uruchom lokalny serwer PocketBase

### Testowanie
1. Otwórz Chrome DevTools
2. Przejdź na stronę Allegro z wynikami wyszukiwania
3. Kliknij ikonę extension
4. Przetestuj funkcje skanowania

## 📞 Kontakt

Projekt realizowany jako wtyczka wewnętrzna dla zespołu e-commerce.

---

**Aktualizacja**: Aktualnie w fazie implementacji podstawowych funkcji Chrome Extension. 