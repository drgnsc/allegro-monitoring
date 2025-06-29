@echo off
echo 🔧 Pakowanie Chrome Extension dla Windows...

:: Sprawdź czy istnieje folder chrome-extension
if not exist "chrome-extension" (
    echo ❌ Błąd: Folder chrome-extension nie istnieje!
    pause
    exit /b 1
)

:: Sprawdź czy istnieje Chrome
set "CHROME_PATH=%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_PATH%" (
    set "CHROME_PATH=%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe"
)
if not exist "%CHROME_PATH%" (
    echo ❌ Błąd: Chrome nie został znaleziony!
    echo Spróbuj zainstalować Chrome lub użyj ręcznego pakowania.
    pause
    exit /b 1
)

:: Utwórz folder releases jeśli nie istnieje
if not exist "releases" mkdir releases

:: Usuń poprzednie wersje
if exist "releases\chrome-extension.crx" del "releases\chrome-extension.crx"
if exist "releases\chrome-extension.pem" del "releases\chrome-extension.pem"

echo 📦 Pakowanie extension...

:: Pakuj extension
"%CHROME_PATH%" --pack-extension=chrome-extension --pack-extension-key=chrome-extension.pem

:: Przenieś spakowane pliki
if exist "chrome-extension.crx" (
    move "chrome-extension.crx" "releases\"
    echo ✅ Sukces! Plik chrome-extension.crx został utworzony w folderze releases/
) else (
    echo ❌ Błąd podczas pakowania!
    pause
    exit /b 1
)

if exist "chrome-extension.pem" (
    move "chrome-extension.pem" "releases\"
    echo 🔑 Klucz prywatny zapisany w releases/chrome-extension.pem
)

:: Utwórz instrukcje instalacji
echo 📋 Tworzenie instrukcji instalacji...
(
echo 📦 Allegro Position Monitor - Chrome Extension
echo.
echo 🚀 Instrukcja instalacji:
echo.
echo 1. Pobierz plik chrome-extension.crx
echo 2. Otwórz Chrome i przejdź do chrome://extensions/
echo 3. Włącz "Developer mode" ^(tryb deweloperski^)
echo 4. Przeciągnij plik .crx do okna Chrome Extensions
echo 5. Potwierdź instalację
echo.
echo 🔧 Alternatywnie - instalacja z folderu:
echo 1. Pobierz i rozpakuj cały projekt
echo 2. Chrome → Extensions → "Load unpacked"
echo 3. Wybierz folder chrome-extension/
echo.
echo 📞 W przypadku problemów sprawdź dokumentację projektu.
echo.
echo Wersja: %date% %time%
) > "releases\INSTALACJA.txt"

echo.
echo ✨ Gotowe! Pliki w folderze releases/:
echo   📦 chrome-extension.crx
echo   🔑 chrome-extension.pem ^(zachowaj w bezpiecznym miejscu^)
echo   📋 INSTALACJA.txt
echo.
pause 