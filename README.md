# 🔍 Allegro Position Monitor

**Kompletny system monitoringu pozycji produktów na Allegro.pl**

## 📋 Opis projektu

System składa się z trzech komponentów:
- **Chrome Extension** - automatyczne zbieranie danych o pozycjach produktów
- **PocketBase Backend** - baza danych i API
- **Web Dashboard** - panel zarządzania i analiza danych

## ✨ Funkcje

### 🔌 Chrome Extension
- Automatyczne sprawdzanie pozycji produktów na Allegro
- Queue system dla wielu URL jednocześnie
- Rozpoznawanie produktów sponsorowanych
- Eksport danych do bazy

### 📊 Web Dashboard  
- **Projekt** - masowy import słów kluczowych z CSV
- **Reports** - analiza zebranych danych z eksportem CSV
- **Latest Results** - przeglądanie najnowszych wyników
- System cache dla wydajności

### 🛠️ PocketBase Backend
- Lightweight SQLite database
- REST API
- Autoryzacja użytkowników
- Real-time updates

## 🚀 Instalacja

### 1. Backend (PocketBase)

```bash
cd backend
# Windows:
.\pocketbase.exe serve --dev
# Linux/Mac:
./pocketbase serve --dev
```

Backend dostępny na: http://localhost:8090

### 2. Web Dashboard

```bash
cd web-dashboard
npm install
npm run dev
```

Dashboard dostępny na: http://localhost:3001

### 3. Chrome Extension

1. Otwórz Chrome → Extensions → Developer mode
2. Kliknij "Load unpacked"
3. Wybierz folder `chrome-extension/`
4. Extension zostanie załadowane

## 📁 Struktura projektu

```
allegro-monitoring/
├── chrome-extension/     # Wtyczka Chrome
├── backend/             # PocketBase + schema
├── web-dashboard/       # React dashboard
├── docs/               # Dokumentacja
└── README.md
```

## 🎯 Workflow użytkowania

1. **Przygotuj słowa kluczowe:**
   - Dashboard → Projekt → Import CSV
   - Format: `słowo_kluczowe,typ_dopasowania,wartość`

2. **Generuj URL:**
   - Dashboard automatycznie generuje listę URL Allegro
   - Skopiuj do schowka lub eksportuj

3. **Zbieraj dane:**
   - Otwórz Chrome Extension
   - Wklej URL i uruchom queue
   - Dane automatycznie trafiają do bazy

4. **Analizuj wyniki:**
   - Dashboard → Reports → analiza danych
   - Dashboard → Latest Results → szczegóły

## 🔧 Konfiguracja CSV

### Format pliku:
```csv
wosk samochodowy,title,Turtle Wax
wosk do auta,brand,Meguiars  
oferta specjalna,url,https://allegro.pl/oferta/123456
```

### Typy dopasowania:
- `title` - nazwa produktu
- `brand` - marka produktu  
- `url` - konkretny adres URL

## 📈 Status projektu

### ✅ Ukończone
- [x] Chrome Extension z queue system
- [x] PocketBase backend z collections
- [x] Web Dashboard z 3 zakładkami
- [x] Import/export CSV
- [x] System cache
- [x] Autoryzacja użytkowników

### 🚧 W trakcie
- [ ] Deployment na zewnętrzny serwer
- [ ] GitHub repository setup
- [ ] Pakowanie extension do dystrybucji

### 🔮 Planowane
- [ ] Harmonogram automatycznych sprawdzeń
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Multi-user support

## 🎁 Releases

Spakowane wersje Chrome Extension będą dostępne w sekcji [Releases](../../releases).

## 📞 Support

W przypadku problemów:
1. Sprawdź logi w console przeglądarki (F12)
2. Sprawdź czy PocketBase jest uruchomiony (port 8090)
3. Sprawdź czy Dashboard działa (port 3001)

## 🔒 Bezpieczeństwo

- Wszystkie dane przechowywane lokalnie
- Autoryzacja przez PocketBase
- Brak zewnętrznych dependencies w extension

## 📝 Changelog

### v1.0.0 (Aktualna)
- Pełny workflow import → monitoring → analiza
- Chrome Extension z queue
- Dashboard z masowym importem CSV
- PocketBase backend z relations

---

**Projekt w aktywnym rozwoju** 🚀 