# PocketBase Setup Instructions

## 1. Download PocketBase

Pobierz najnowszą wersję PocketBase (v0.28.3) dla Windows:

**Link do pobrania:** https://github.com/pocketbase/pocketbase/releases/download/v0.28.3/pocketbase_0.28.3_windows_amd64.zip

### Kroki:
1. Pobierz plik `pocketbase_0.28.3_windows_amd64.zip`
2. Rozpakuj archiwum do folderu `backend/`
3. Powinieneś otrzymać plik `pocketbase.exe`

## 2. First Run Setup

Po pobraniu i rozpakowaniu, uruchom PocketBase:

```bash
# W folderze backend/
./pocketbase serve
```

Pierwszym razem PocketBase:
- Utworzy folder `pb_data/` na dane
- Otworzy się automatycznie w przeglądarce na http://localhost:8090/_/
- Będzie wymagał utworzenia konta administratora

## 3. Admin Account Creation

Podczas pierwszego uruchomienia utworzysz:
- **Email:** `admin@allegro-monitor.com`
- **Password:** `secure123!` (lub dowolne bezpieczne hasło)

## 4. Collections Configuration

Po zalogowaniu do panelu administracyjnego, utworzysz dwie kolekcje:

### Collection: `users`
- **Type:** Auth collection
- **Fields:** (automatycznie tworzone dla auth)
  - id (auto)
  - email (auto)
  - password (auto, hidden)
  - created (auto)
  - updated (auto)

### Collection: `positions`
- **Type:** Base collection
- **Fields:**
  - `id` (text, auto)
  - `userId` (relation to users)
  - `url` (text, required)
  - `keyword` (text, required)
  - `date` (date, required)
  - `timestamp` (date, required)
  - `products` (json, required)
  - `created` (date, auto)
  - `updated` (date, auto)

## 5. API Rules Configuration

### users collection:
- **List/Search rule:** `` (empty - tylko admini)
- **View rule:** `id = @request.auth.id`
- **Create rule:** `` (empty - rejestracja przez API)
- **Update rule:** `id = @request.auth.id`
- **Delete rule:** `id = @request.auth.id`

### positions collection:
- **List/Search rule:** `userId = @request.auth.id`
- **View rule:** `userId = @request.auth.id`
- **Create rule:** `@request.auth.id != ""`
- **Update rule:** `userId = @request.auth.id`
- **Delete rule:** `userId = @request.auth.id`

## 6. Test User Account

Utwórz testowego użytkownika:
- **Email:** `test@allegro-monitor.com`
- **Password:** `test123!`

## 7. Verification

Po konfiguracji sprawdź:
- http://localhost:8090 - PocketBase działa
- http://localhost:8090/_/ - Panel admin
- http://localhost:8090/api/health - API health check

## Next Steps

Po skonfigurowaniu PocketBase:
1. Zaktualizuj URL w `chrome-extension/background.js` (http://localhost:8090)
2. Załaduj extension w Chrome Developer Mode
3. Przetestuj połączenie między extension a PocketBase 