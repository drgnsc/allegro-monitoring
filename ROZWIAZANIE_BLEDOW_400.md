# 🔧 Rozwiązanie błędów 400 Bad Request przy dodawaniu słów kluczowych

## ⚡ Szybka diagnoza
1. W aplikacji web kliknij **🔍 Schemat** (na stronie słów kluczowych)
2. Sprawdź wynik:
   - ✅ "Ma pole userId: TAK" → wszystko OK
   - ❌ "Ma pole userId: NIE" → baza potrzebuje aktualizacji

## 🚀 Szybkie rozwiązanie

### Krok 1: Backup bazy produkcyjnej
- Idź na: https://api.pricelss.pl/_/
- Collections → Export collections → zapisz jako backup

### Krok 2: Aktualizuj schemat
**Opcja A - Import kompletny (szybkie, ale usuwa dane):**
- Collections → Import collections
- Wybierz: `backend/collections-schema.json`
- Import → Utwórz nowe konto użytkownika

**Opcja B - Dodaj pole ręcznie (zachowuje dane):**
- Collections → keywords → Settings
- Fields → Add field:
  - Name: `userId`
  - Type: Relation to `users`
  - Required: Yes

### Krok 3: Sprawdź
- Kliknij **🔍 Schemat** ponownie
- Powinno pokazać ✅ "Ma pole userId: TAK"
- Spróbuj dodać słowo kluczowe

## 📖 Pełna instrukcja
Zobacz: `backend/update-production-schema.md`

## 💡 Dlaczego ten problem występuje?
Kod został zaktualizowany by wymagać `userId` dla bezpieczeństwa, ale baza produkcyjna ma stary schemat bez tego pola.

---
**Rozwiązanie napisane przez asystenta AI - 2025** 