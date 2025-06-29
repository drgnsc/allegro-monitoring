#!/bin/bash

echo "🔧 Pakowanie Chrome Extension dla Linux/Mac..."

# Sprawdź czy istnieje folder chrome-extension
if [ ! -d "chrome-extension" ]; then
    echo "❌ Błąd: Folder chrome-extension nie istnieje!"
    exit 1
fi

# Znajdź Chrome
CHROME_PATH=""
if [ -f "/usr/bin/google-chrome" ]; then
    CHROME_PATH="/usr/bin/google-chrome"
elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [ -f "/usr/bin/chromium-browser" ]; then
    CHROME_PATH="/usr/bin/chromium-browser"
else
    echo "❌ Błąd: Chrome/Chromium nie został znaleziony!"
    echo "Spróbuj zainstalować Chrome lub użyj ręcznego pakowania."
    exit 1
fi

# Utwórz folder releases jeśli nie istnieje
mkdir -p releases

# Usuń poprzednie wersje
rm -f releases/chrome-extension.crx
rm -f releases/chrome-extension.pem

echo "📦 Pakowanie extension..."

# Pakuj extension
"$CHROME_PATH" --pack-extension=chrome-extension --pack-extension-key=chrome-extension.pem

# Przenieś spakowane pliki
if [ -f "chrome-extension.crx" ]; then
    mv chrome-extension.crx releases/
    echo "✅ Sukces! Plik chrome-extension.crx został utworzony w folderze releases/"
else
    echo "❌ Błąd podczas pakowania!"
    exit 1
fi

if [ -f "chrome-extension.pem" ]; then
    mv chrome-extension.pem releases/
    echo "🔑 Klucz prywatny zapisany w releases/chrome-extension.pem"
fi

# Utwórz instrukcje instalacji
echo "📋 Tworzenie instrukcji instalacji..."
cat > releases/INSTALACJA.txt << EOF
📦 Allegro Position Monitor - Chrome Extension

🚀 Instrukcja instalacji:

1. Pobierz plik chrome-extension.crx
2. Otwórz Chrome i przejdź do chrome://extensions/
3. Włącz "Developer mode" (tryb deweloperski)
4. Przeciągnij plik .crx do okna Chrome Extensions
5. Potwierdź instalację

🔧 Alternatywnie - instalacja z folderu:
1. Pobierz i rozpakuj cały projekt
2. Chrome → Extensions → "Load unpacked"
3. Wybierz folder chrome-extension/

📞 W przypadku problemów sprawdź dokumentację projektu.

Wersja: $(date)
EOF

echo ""
echo "✨ Gotowe! Pliki w folderze releases/:"
echo "  📦 chrome-extension.crx"
echo "  🔑 chrome-extension.pem (zachowaj w bezpiecznym miejscu)"
echo "  📋 INSTALACJA.txt"
echo "" 