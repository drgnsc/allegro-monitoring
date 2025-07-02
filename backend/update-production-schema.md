# Aktualizacja schematu bazy produkcyjnej - Rozwiązanie błędów 400

## Problem
Jeśli widzisz błędy **400 Bad Request** przy dodawaniu słów kluczowych, prawdopodobnie baza produkcyjna ma stary schemat bez pola `userId`.

## Sprawdzenie problemu
1. W aplikacji web, na stronie "Projekty i słowa kluczowe", kliknij przycisk **🔍 Schemat**
2. Sprawdź czy wyświetla się:
   - ✅ **Ma pole userId: TAK** - wszystko OK
   - ❌ **Ma pole userId: NIE** - trzeba zaktualizować schemat

## Rozwiązanie - Aktualizacja schematu produkcyjnego

### Opcja 1: Import pełnego schematu (UWAGA: Usuwa istniejące dane!)

1. **Backup danych** (ważne!):
   - Idź na https://api.pricelss.pl/_/
   - Zaloguj się
   - Collections → Export collections
   - Zapisz jako `backup-before-update.json`

2. **Import nowego schematu**:
   - Nadal w Collections
   - Import collections
   - Wybierz plik: `collections-schema.json`
   - ⚠️ **Zaznacz "Delete missing collections"** jeśli chcesz czyste importowanie
   - Kliknij Import

3. **Utwórz ponownie konto użytkownika**:
   - Collections → users → New record
   - Wpisz email i hasło
   - Zapisz

### Opcja 2: Manualna aktualizacja (zachowuje dane)

1. **Idź na panel admin**: https://api.pricelss.pl/_/

2. **Aktualizuj kolekcję keywords**:
   - Collections → keywords → ⚙️ Settings
   - Fields → ➕ Add field
   - **Dodaj pole userId**:
     - Name: `userId`
     - Type: `Relation`
     - Required: ✅ Tak
     - Collection: `users`
     - Cascade delete: ✅ Tak
     - Min select: 1
     - Max select: 1
   - Save changes

3. **Dodaj reguły API**:
   - API Rules tab:
     - List: `userId = @request.auth.id`
     - View: `userId = @request.auth.id`
     - Create: `@request.auth.id != ""`
     - Update: `userId = @request.auth.id`
     - Delete: `userId = @request.auth.id`

4. **Aktualizuj istniejące rekordy** (jeśli są):
   - Collections → keywords → wybierz każdy rekord
   - Ustaw pole userId na swojego użytkownika
   - Zapisz

### Opcja 3: Migracja z danymi

1. **Wykonaj backup lokalnie**:
   ```powershell
   cd backend
   .\export-data.ps1
   ```

2. **Zaimportuj schemat** (jak w opcji 1)

3. **Importuj dane z backupu**:
   - Użyj CSV z folderu `exported-data`
   - W aplikacji web: Import masowy z CSV

## Weryfikacja
Po aktualizacji sprawdź ponownie przyciskiem **🔍 Schemat** - powinno pokazać:
- ✅ **Ma pole userId: TAK**
- ✅ **Ma pole projectId: TAK**

## Testowanie
Spróbuj dodać testowe słowo kluczowe - powinno działać bez błędów 400.

---

**Uwaga**: Zalecam opcję 2 (manualna aktualizacja) jeśli masz już dane w bazie produkcyjnej. 