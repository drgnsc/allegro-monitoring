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
- [x] Instrukcje setup PocketBase
- [x] Konfiguracja collections schema
- [x] Dokumentacja testowania extension
- [ ] Instalacja i uruchomienie PocketBase
- [ ] Testowanie extension w Chrome Developer Mode
- [ ] Debugging i optymalizacja parsowania

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

## 🎯 Następne kroki (Faza 1)

1. **Setup PocketBase**
   - Pobierz PocketBase z: https://github.com/pocketbase/pocketbase/releases/v0.28.3
   - Rozpakuj do `/backend/`
   - Uruchom: `./pocketbase serve`
   - Skonfiguruj collections według `/backend/collections-schema.json`

2. **Test Chrome Extension**
   - Załaduj extension w Chrome Developer Mode (`chrome://extensions/`)
   - Wybierz folder `/chrome-extension/`
   - Przetestuj zgodnie z `/docs/chrome-extension-testing.md`

3. **Debugging & Optymalizacja**
   - Sprawdź parsowanie produktów Allegro
   - Zweryfikuj komunikację z PocketBase  
   - Optymalizuj selektory CSS

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