// Allegro Position Monitor - Content Script
// Odpowiedzialny za wykrywanie i parsowanie pozycji produktów na stronach Allegro

class AllegroContentParser {
    constructor() {
        this.isActive = false;
        this.isScanning = false;
        this.autoScanEnabled = false;
        this.positionLimit = 10; // Domyślnie 10 pozycji
        this.currentUrl = window.location.href;
        this.lastScanData = null;
        this.lastScanTime = 0; // Timestamp ostatniego skanu - zapobieganie zbyt częstemu skanowaniu
        
        // Selektory CSS dla różnych elementów Allegro
        this.selectors = {
            // Różne warianty selektorów produktów - TYLKO ORGANICZNE (nie sponsorowane)
            productContainers: [
                'h2:has(a[href*="/oferta/"]:not([href*="/events/clicks"]))',    // Desktop H2 struktura 
                'a[href*="/oferta/"]:not([href*="/events/clicks"])',           // Direct links
                'article[data-analytics-view-custom-index]',
                'div[data-testid="listing-item"]',
                'article[data-role="offer"]',
                'div[data-role="offer"]',
                'div[data-testid="listing-item-container"]',
                'div[class*="listing-item"]',
                'div[class*="offer-item"]',
                'section[data-testid="listing-item"]',
                'div[data-analytics-view-value]'
            ],
            productTitle: [
                // Tytuł jest bezpośrednio w linku
                'a[href*="/oferta/"]',
                'h2 a',
                'h3 a', 
                'a[data-testid="offer-title"]',
                '.offer-title'
            ],
            productPrice: [
                // Nowe selektory bazowane na przykładzie użytkownika
                'span[class*="mli8_k4"]',                          // Główny kontener ceny
                'span[class*="msa3_z4"]',                          // Alternatywny kontener
                'span[class*="m9qz_yo"]',                          // Jeszcze jeden kontener
                'span[class*="mgmw_qw"]',                          // I kolejny
                'span:has(span[class*="mgn2_19"]):has(span[class*="m9qz_yq"])',  // Span zawierający grosze i "zł"
                'span[class*="mgn2_27"]',                          // Kolejne klasy z przykładu
                'span[class*="mgn2_30"]',                          // Jeszcze jedna z przykładu
                // Oryginalne selektory
                'span[data-testid="price"]',
                'span[data-price-currency]',
                '.price',
                '.offer-price',
                'span[class*="price"]',
                'span[class*="Price"]',
                'div[data-testid="price-container"] span',
                '[data-testid="price-value"]',
                'span[aria-label*="Cena"]',
                'span[aria-label*="zł"]'
            ],
            sellerName: [
                // Nowe selektory bazowane na przykładzie użytkownika
                'a[href*="/uzytkownik/"][class*="mgmw_wo"]',        // Główny selektor sprzedawcy z Allegro
                'a[href*="/uzytkownik/"][class*="mli8_k4"]',        // Alternatywny selektor
                'a[href*="/uzytkownik/"][class*="mqen_m6"]',        // Kolejny selektor
                // Oryginalne selektory
                'a[href*="/uzytkownik/"]',
                'span[data-testid="seller-name"]',
                '.seller-name',
                'a[data-testid="seller-link"]',
                '[data-testid="seller-info"] a',
                'span[class*="seller"]',
                'span[class*="Seller"]',
                'div[data-testid="seller"] span',
                'div[data-testid="seller"] a',
                '.seller a',
                'span[aria-label*="Sprzedawca"]'
            ],
            brandName: [
                // Selektory dla producenta/marki bazowane na przykładzie użytkownika
                'span[class*="mgmw_wo"][class*="mvrt_8"]',          // Główny selektor marki z Allegro
                'span[class*="mgmw_wo"]:not([class*="mli8_k4"])',  // Span z mgmw_wo ale bez mli8_k4 (bo to cena)
                // Ogólne selektory marki
                'span[data-testid="brand"]',
                'span[data-testid="manufacturer"]',
                '.brand',
                '.manufacturer',
                'span[class*="brand"]',
                'span[class*="Brand"]'
            ],
            sponsoredIndicator: [
                '[data-testid="sponsored-badge"]',
                '.sponsored',
                '[data-analytics-interaction-label="sponsored"]',
                'span[title*="promowane"]',
                'span[title*="Sponsored"]'
            ]
        };
        
        this.init();
    }

    async init() {
        console.log('Allegro Content Parser initialized');
        
        // Sprawdź czy to strona z listingami
        if (this.isAllegroListingPage()) {
            this.isActive = true;
            console.log('Allegro listing page detected');
            
            // Załaduj ustawienia ZAWSZE na początku
            await this.loadSettings();
            
            // Nasłuchuj wiadomości z popup
            this.setupMessageListener();
            
            // Sprawdź auto-scan
            if (this.autoScanEnabled) {
                // Opóźnij auto-scan o 5-10 sekund, żeby strona się załadowała i nie wyglądać jak bot
                const delay = 5000 + Math.random() * 5000;
                setTimeout(() => {
                    this.performScan();
                }, delay);
            }
            
            // Nasłuchuj zmian URL (SPA navigation)
            this.setupUrlChangeListener();
            
            // WYMUSZENIE: Przeładuj ustawienia po 2 sekundach (na wypadek gdy storage nie był gotowy)
            setTimeout(async () => {
                await this.loadSettings();
                console.log(`FORCED RELOAD: Position limit is now: ${this.positionLimit}`);
            }, 2000);
        }
    }

    isAllegroListingPage() {
        const url = window.location.href;
        return url.includes('allegro.pl') && 
               (url.includes('/listing') || url.includes('/kategoria/'));
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['autoScanEnabled', 'positionLimit']);
            this.autoScanEnabled = result.autoScanEnabled || false;
            this.positionLimit = result.positionLimit || 10;
            console.log(`Settings loaded: autoScan=${this.autoScanEnabled}, positionLimit=${this.positionLimit}`);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'scanPositions':
                    this.handleScanRequest(sendResponse);
                    return true; // Asynchronous response
                
                case 'getPageInfo':
                    sendResponse({
                        success: true,
                        isAllegroListing: this.isAllegroListingPage(),
                        url: window.location.href,
                        keyword: this.extractKeywordFromUrl()
                    });
                    break;
                
                case 'updateSettings':
                    if (message.settings) {
                        if (typeof message.settings.positionLimit === 'number') {
                            this.positionLimit = message.settings.positionLimit;
                            console.log(`Position limit updated to: ${this.positionLimit}`);
                        }
                        if (typeof message.settings.autoScanEnabled === 'boolean') {
                            this.autoScanEnabled = message.settings.autoScanEnabled;
                        }
                    }
                    sendResponse({ success: true });
                    break;
                    
                default:
                    console.log('Unknown message:', message);
            }
        });
    }

    setupUrlChangeListener() {
        // Wykryj zmiany URL w SPA
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                this.currentUrl = url;
                
                if (this.isAllegroListingPage() && this.autoScanEnabled) {
                    // DUŻE opóźnienie po zmianie URL - 15-30 sekund!
                    const delay = 15000 + Math.random() * 15000;
                    console.log(`Auto-scan scheduled in ${Math.round(delay/1000)} seconds`);
                    setTimeout(() => {
                        this.performScan();
                    }, delay);
                }
            }
        }).observe(document, { subtree: true, childList: true });
    }

    async handleScanRequest(sendResponse) {
        try {
            const result = await this.performScan();
            sendResponse(result);
        } catch (error) {
            console.error('Scan error:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async performScan() {
        if (this.isScanning) {
            console.log('Scan already in progress');
            return { success: false, error: 'Skanowanie już w toku' };
        }
        
        // Sprawdź czy nie skanuje zbyt często (minimum 60 sekund między skanami)
        const now = Date.now();
        const timeSinceLastScan = now - this.lastScanTime;
        const minInterval = 60000; // 60 sekund
        
        if (timeSinceLastScan < minInterval) {
            const remainingTime = Math.ceil((minInterval - timeSinceLastScan) / 1000);
            console.log(`Scan cooldown: ${remainingTime} seconds remaining`);
            return { 
                success: false, 
                error: `Poczekaj jeszcze ${remainingTime} sekund przed następnym skanem` 
            };
        }

        this.isScanning = true;
        this.lastScanTime = now;
        
        try {
            console.log('Starting SLOW human-like scan...');
            
            // Początkowa pauza jak prawdziwy użytkownik
            await this.simulateHumanPause();
            
            // Symuluj wstępne scrollowanie przed skanem
            await this.simulateHumanScrolling();
            
            // Poczekaj na załadowanie strony (bardzo powoli)
            await this.waitForPageLoad();
            
            // Kolejna ludzka pauza przed parsowaniem
            await this.simulateHumanPause();
            
            // Sparsuj produkty bardzo powoli
            const products = await this.parseProducts();
            
            if (products.length === 0) {
                throw new Error('Nie znaleziono produktów na tej stronie');
            }
            
            // Finalna pauza przed wysłaniem danych
            await this.randomDelay(2000, 5000);

            // Przygotuj dane do wysłania
            const scanData = {
                url: this.currentUrl,
                keyword: this.extractKeywordFromUrl(),
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
                products: products,
                productsCount: products.length
            };

            // Wyślij dane do background script
            const saveResult = await chrome.runtime.sendMessage({
                action: 'saveScanData',
                data: scanData
            });

            if (!saveResult.success) {
                // Improved error handling with more specific messages
                let errorMessage = saveResult.error || 'Błąd zapisywania danych';
                
                if (errorMessage.includes('collection')) {
                    errorMessage = 'Błąd bazy danych: Sprawdź czy PocketBase jest uruchomiony i kolekcje są utworzone. Odśwież rozszerzenie i spróbuj ponownie.';
                } else if (errorMessage.includes('auth') || errorMessage.includes('login')) {
                    errorMessage = 'Sesja wygasła. Otwórz popup rozszerzenia i zaloguj się ponownie.';
                } else if (errorMessage.includes('fetch') || errorMessage.includes('połączenia')) {
                    errorMessage = 'Błąd połączenia z serwerem. Sprawdź połączenie internetowe i czy serwer API jest dostępny.';
                }
                
                throw new Error(errorMessage);
            }

            this.lastScanData = scanData;
            
            console.log(`Scan completed: ${products.length} products found`);
            
            return {
                success: true,
                productsCount: products.length,
                keyword: scanData.keyword,
                timestamp: scanData.timestamp
            };
            
        } catch (error) {
            console.error('Scan failed:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isScanning = false;
        }
    }

    async waitForPageLoad() {
        // SYMULUJ PRAWDZIWEGO UŻYTKOWNIKA - bardzo powoli!
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30; // 30 sekund max
            
            const checkProducts = async () => {
                attempts++;
                
                // Symuluj scrollowanie co kilka sekund
                if (attempts % 3 === 0) {
                    await this.simulateHumanScrolling();
                }
                
                // Symuluj ruch myszy co kilka prób
                if (attempts % 5 === 0) {
                    this.simulateMouseMovement();
                }
                
                const products = this.findProductElements();
                if (products.length > 0) {
                    console.log(`Products found after ${attempts} attempts, waiting extra time...`);
                    // DUŻE opóźnienie 8-15 sekund po znalezieniu produktów
                    setTimeout(resolve, 8000 + Math.random() * 7000);
                } else if (attempts >= maxAttempts) {
                    console.log('Max attempts reached, proceeding anyway...');
                    resolve();
                } else {
                    // Zwiększone opóźnienie między próbami
                    setTimeout(checkProducts, 1000 + Math.random() * 2000); // 1-3 sekundy
                }
            };
            
            // Pierwsze sprawdzenie po 2-5 sekund
            setTimeout(checkProducts, 2000 + Math.random() * 3000);
        });
    }

    findProductElements() {
        const elements = [];
        
        // Pierwsza strategia: znajdź H2 i idź do kontenera produktu
        const h2Elements = document.querySelectorAll('h2:has(a[href*="/oferta/"]:not([href*="/events/clicks"]))');
        console.log(`Found ${h2Elements.length} H2 elements with product links`);
        
        if (h2Elements.length > 0) {
            // Dla każdego H2, znajdź jego kontener produktu (rodzica)
            h2Elements.forEach(h2 => {
                // Sprawdź różne poziomy rodziców aż znajdziesz kontener z cenami
                let container = h2;
                let level = 0;
                const maxLevels = 5;
                
                while (container && level < maxLevels) {
                    // Sprawdź czy ten kontener ma cenę
                    const hasPrice = container.querySelector('span[class*="mli8_k4"], span[class*="msa3_z4"], span[class*="m9qz_yo"], span[class*="mgmw_qw"]');
                    
                    if (hasPrice && container !== h2) {
                        elements.push(container);
                        return; // Znaleziono kontener z ceną
                    }
                    
                    container = container.parentElement;
                    level++;
                }
                
                // Fallback: użyj rodzica 3 poziomy wyżej
                const fallbackContainer = h2.parentElement?.parentElement?.parentElement;
                if (fallbackContainer && !elements.includes(fallbackContainer)) {
                    elements.push(fallbackContainer);
                }
            });
            
            console.log(`Found ${elements.length} product containers from H2 elements`);
            if (elements.length > 0) {
                return elements;
            }
        }
        
        // Fallback: użyj oryginalnych selektorów
        for (const selector of this.selectors.productContainers) {
            const found = document.querySelectorAll(selector);
            console.log(`Found ${found.length} products using selector: ${selector}`);
            
            if (found.length > 0) {
                elements.push(...found);
                break;
            }
        }
        
        console.log('No products found with any selector');
        return elements;
    }

    async parseProducts() {
        const productElements = this.findProductElements();
        const products = [];
        
        // Użyj positionLimit zamiast stałej wartości 10
        const limitedElements = productElements.slice(0, this.positionLimit);
        
        console.log(`Parsing ${limitedElements.length} products slowly (limit: ${this.positionLimit})...`);
        
        // Oblicz opóźnienia bazowane na liczbie pozycji
        const delayMultiplier = this.calculateDelayMultiplier(this.positionLimit);
        const baseMinDelay = 500;
        const baseMaxDelay = 1500;
        
        // POWOLI parsuj produkty z opóźnieniami
        for (let i = 0; i < limitedElements.length; i++) {
            try {
                // Skalowane opóźnienie między każdym produktem
                if (i > 0) {
                    const minDelay = baseMinDelay * delayMultiplier;
                    const maxDelay = baseMaxDelay * delayMultiplier;
                    await this.randomDelay(minDelay, maxDelay);
                }
                
                const product = this.parseProductElement(limitedElements[i], i + 1);
                if (product) {
                    products.push(product);
                }
                
                // Skalowane scrollowanie - więcej dla większych limitów
                const scrollFrequency = this.positionLimit <= 10 ? 3 : 
                                      this.positionLimit <= 20 ? 2 : 1;
                
                if ((i + 1) % scrollFrequency === 0) {
                    await this.simulateHumanScrolling();
                }
                
                // Dodatkowe pauzy dla większych limitów
                if (this.positionLimit > 20 && (i + 1) % 10 === 0) {
                    console.log(`Extra pause after ${i + 1} products...`);
                    await this.simulateHumanPause();
                }
                
            } catch (error) {
                console.warn(`Error parsing product at position ${i + 1}:`, error);
            }
        }
        
        console.log(`Parsed ${products.length} products successfully`);
        return products;
    }

    calculateDelayMultiplier(positionLimit) {
        // Skaluj opóźnienia bazując na liczbie pozycji
        if (positionLimit <= 10) {
            return 1.0; // Normalne opóźnienia
        } else if (positionLimit <= 20) {
            return 1.5; // +50% opóźnień
        } else if (positionLimit <= 30) {
            return 2.0; // +100% opóźnień
        } else {
            return 2.5; // +150% opóźnień
        }
    }

    parseProductElement(element, position) {
        let title = null;
        let url = null;
        
        // Sprawdź czy to link bezpośredni
        if (element.matches('a[href*="/oferta/"]')) {
            url = element.href;
            title = element.textContent || element.innerText;
        }
        // Sprawdź czy to H2 z linkiem wewnątrz (Desktop struktura)
        else if (element.matches('h2')) {
            const linkElement = element.querySelector('a[href*="/oferta/"]');
            if (linkElement) {
                url = linkElement.href;
                title = linkElement.textContent || linkElement.innerText;
            }
        }
        // Standardowe parsowanie dla innych przypadków
        else {
            title = this.extractText(element, this.selectors.productTitle);
            const linkElement = element.querySelector('a[href*="/oferta/"]');
            url = linkElement ? linkElement.href : null;
        }
        
        // ODRZUĆ SPONSOROWANE - sprawdź URL
        if (!url || !url.includes('/oferta/') || url.includes('/events/clicks')) {
            // console.log('Pomijam sponsorowaną ofertę:', url);
            return null;
        }
        
        const price = this.extractPrice(element);
        const seller = this.extractSeller(element);
        const brand = this.extractBrand(element);
        const rating = this.extractRating(element);
        const sponsored = false; // Już odfiltrowane wyżej
        
        // DEBUG: Log selectors that work/don't work
        if (!price) {
            console.log(`No price found for position ${position}. Element:`, element);
            console.log('Available price-related elements:');
            element.querySelectorAll('*').forEach(el => {
                if (el.textContent && (el.textContent.includes('zł') || el.textContent.includes(',') && /\d/.test(el.textContent))) {
                    console.log('  Potential price element:', el.tagName, el.className, el.textContent.trim());
                }
            });
        }
        
        if (!seller) {
            console.log(`No seller found for position ${position}. Element:`, element);
            console.log('Available link elements:', element.querySelectorAll('a'));
        }
        
        if (!brand) {
            console.log(`No brand found for position ${position}. Element:`, element);
            console.log('Available brand-related elements:');
            element.querySelectorAll('span').forEach(el => {
                if (el.textContent && el.textContent.trim().length > 1 && el.textContent.trim().length < 50) {
                    console.log('  Potential brand element:', el.tagName, el.className, el.textContent.trim());
                }
            });
        }
        
        if (!title || title.trim().length === 0) {
            console.warn(`No title found for product at position ${position}`);
            return null;
        }

        return {
            position: position,
            title: title.trim(),
            price: price ? price.trim() : null,
            seller: seller ? seller.trim() : null,
            brand: brand ? brand.trim() : null,
            rating: rating ? rating.trim() : null,
            sponsored: sponsored,
            url: url
        };
    }

    extractText(element, selectors) {
        for (const selector of selectors) {
            const target = element.querySelector(selector);
            if (target) {
                return target.textContent || target.innerText || '';
            }
        }
        return null;
    }

    extractPrice(element) {
        // Specjalna funkcja do parsowania ceny Allegro
        const priceSelectors = this.selectors.productPrice;
        
        for (const selector of priceSelectors) {
            const target = element.querySelector(selector);
            if (target) {
                let priceText = target.textContent || target.innerText || '';
                
                // Czyść cenę z niepotrzebnych znaków i spacji
                priceText = priceText.replace(/\s+/g, ' ').trim();
                
                // Sprawdź czy zawiera "zł" lub ma format ceny
                if (priceText.includes('zł') || /\d+[,\.]\d+/.test(priceText)) {
                    console.log(`Found price with selector "${selector}": "${priceText}"`);
                    return priceText;
                }
            }
        }
        
        return null;
    }

    extractBrand(element) {
        // Specjalna funkcja do parsowania marki/producenta
        const brandSelectors = this.selectors.brandName;
        
        for (const selector of brandSelectors) {
            const target = element.querySelector(selector);
            if (target) {
                let brandText = target.textContent || target.innerText || '';
                brandText = brandText.trim();
                
                // Sprawdź czy to prawdopodobnie marka (nie jest to cena, objętość, rating lub długi tekst)
                if (brandText && 
                    !brandText.includes('zł') && 
                    !brandText.includes('%') && 
                    !brandText.includes('ml') &&        // Wyklucz objętości
                    !brandText.includes('l') &&         // Wyklucz litry  
                    !brandText.includes('g') &&         // Wyklucz gramy
                    !brandText.includes('kg') &&        // Wyklucz kilogramy
                    !/^\d+$/.test(brandText) &&         // Wyklucz same cyfry
                    !/^\d+[,\.]\d+$/.test(brandText) && // Wyklucz ratingi jak "4,85", "4,63"
                    !/^\d+[\s,\.]\d*\s*(ml|l|g|kg)$/i.test(brandText) && // Wyklucz "500 ml", "1,5 l" etc.
                    !brandText.match(/^[0-9,\.]+$/) &&  // Wyklucz strings składające się tylko z cyfr i przecinków
                    brandText.length > 1 && 
                    brandText.length < 50 &&
                    isNaN(parseFloat(brandText.replace(',', '.')))) { // Wyklucz wszystko co można sparsować jako liczba
                    console.log(`Found brand with selector "${selector}": "${brandText}"`);
                    return brandText;
                }
            }
        }
        
        return null;
    }

    extractRating(element) {
        // Specjalna funkcja do parsowania ratingu/oceny produktu
        const ratingSelectors = [
            // Użyj tych samych selektorów co dla marki, ale filtruj tylko ratingi
            'span[class*="mgmw_wo"][class*="mvrt_8"]',
            'span[class*="mgmw_wo"]:not([class*="mli8_k4"])',
            // Dodatkowe selektory dla ratingów
            'span[class*="rating"]',
            'span[class*="score"]',
            'span[aria-label*="ocena"]',
            'span[title*="ocena"]'
        ];
        
        for (const selector of ratingSelectors) {
            const target = element.querySelector(selector);
            if (target) {
                let ratingText = target.textContent || target.innerText || '';
                ratingText = ratingText.trim();
                
                // Sprawdź czy to prawdopodobnie rating (liczba z przecinkiem między 1-5)
                if (ratingText && 
                    /^\d[,\.]\d+$/.test(ratingText) &&  // Format "4,85", "4.85"
                    !ratingText.includes('zł') &&
                    !ratingText.includes('ml') &&
                    !ratingText.includes('g')) {
                    
                    const ratingValue = parseFloat(ratingText.replace(',', '.'));
                    if (ratingValue >= 1 && ratingValue <= 5) {
                        console.log(`Found rating with selector "${selector}": "${ratingText}"`);
                        return ratingText;
                    }
                }
            }
        }
        
        return null;
    }

    extractSeller(element) {
        // Specjalna funkcja do parsowania sprzedawcy
        const sellerSelectors = this.selectors.sellerName;
        
        for (const selector of sellerSelectors) {
            const target = element.querySelector(selector);
            if (target) {
                let sellerText = target.textContent || target.innerText || '';
                sellerText = sellerText.trim();
                
                // Wyczyść rating z nazwy sprzedawcy (np. "OPERUM - 99,4%" -> "OPERUM")
                sellerText = sellerText.replace(/\s*-\s*\d+[,\.]\d*%.*$/, '');
                sellerText = sellerText.replace(/\s*\(\d+\).*$/, ''); // Usuń (liczba) na końcu
                
                if (sellerText && sellerText.length > 1) {
                    console.log(`Found seller with selector "${selector}": "${sellerText}"`);
                    return sellerText;
                }
            }
        }
        
        // Fallback: sprawdź wszystkie linki w kontenerze
        const allLinks = element.querySelectorAll('a');
        for (const link of allLinks) {
            const href = link.href;
            const text = link.textContent?.trim();
            
            // Sprawdź czy to link do sprzedawcy
            if (href && href.includes('/uzytkownik/') && text && text.length > 1) {
                let sellerText = text.replace(/\s*-\s*\d+[,\.]\d*%.*$/, '');
                console.log(`Found seller via fallback: "${sellerText}"`);
                return sellerText;
            }
        }
        
        return null;
    }

    isSponsored(element) {
        // Sprawdź czy produkt jest sponsorowany
        for (const selector of this.selectors.sponsoredIndicator) {
            if (element.querySelector(selector)) {
                return true;
            }
        }
        
        // Sprawdź dodatkowe wskaźniki sponsorowania
        const text = element.textContent.toLowerCase();
        return text.includes('promowane') || 
               text.includes('sponsored') || 
               text.includes('reklama');
    }

    // === HUMAN SIMULATION FUNCTIONS ===
    
    async randomDelay(minMs, maxMs) {
        const delay = minMs + Math.random() * (maxMs - minMs);
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    async simulateHumanScrolling() {
        return new Promise((resolve) => {
            const scrollSteps = 3 + Math.floor(Math.random() * 5); // 3-8 kroków
            let currentStep = 0;
            
            const performScroll = () => {
                if (currentStep >= scrollSteps) {
                    resolve();
                    return;
                }
                
                // Losowe scrollowanie w dół lub górę
                const scrollAmount = 100 + Math.random() * 300; // 100-400px
                const scrollDirection = Math.random() > 0.8 ? -1 : 1; // 80% w dół, 20% w górę
                
                window.scrollBy({
                    top: scrollAmount * scrollDirection,
                    behavior: 'smooth'
                });
                
                currentStep++;
                // Opóźnienie między scrollami 200-800ms
                setTimeout(performScroll, 200 + Math.random() * 600);
            };
            
            performScroll();
        });
    }
    
    simulateMouseMovement() {
        // Symuluj ruch myszy przez dispatch event
        const event = new MouseEvent('mousemove', {
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * window.innerHeight,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }
    
    async simulateHumanPause() {
        // Losowa pauza jak prawdziwy użytkownik - 2-8 sekund  
        const pauseTime = 2000 + Math.random() * 6000;
        console.log(`Human-like pause: ${Math.round(pauseTime/1000)} seconds`);
        await this.randomDelay(pauseTime, pauseTime);
    }

    extractKeywordFromUrl() {
        try {
            const url = new URL(this.currentUrl);
            
            // Sprawdź różne parametry URL
            const searchParams = [
                'string',      // główny parametr wyszukiwania
                'q',          // alternatywny parametr
                'search',     // inny wariant
                'query'       // jeszcze inny wariant
            ];
            
            for (const param of searchParams) {
                const value = url.searchParams.get(param);
                if (value) {
                    return decodeURIComponent(value);
                }
            }
            
            // Sprawdź path dla kategorii
            const pathMatch = url.pathname.match(/\/kategoria\/(.+?)(?:\/|$)/);
            if (pathMatch) {
                return pathMatch[1].replace(/-/g, ' ');
            }
            
            // Fallback - wyciągnij z tytułu strony
            const title = document.title;
            if (title.includes(' - ')) {
                return title.split(' - ')[0];
            }
            
            return 'nieznane';
        } catch (error) {
            console.error('Error extracting keyword:', error);
            return 'nieznane';
        }
    }
}

// Inicjalizuj parser gdy DOM jest gotowy
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AllegroContentParser();
    });
} else {
    new AllegroContentParser();
} 