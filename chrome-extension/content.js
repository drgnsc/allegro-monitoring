// Allegro Position Monitor - Content Script
// Odpowiedzialny za wykrywanie i parsowanie pozycji produktów na stronach Allegro

class AllegroContentParser {
    constructor() {
        this.isActive = false;
        this.isScanning = false;
        this.autoScanEnabled = false;
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
                'div[data-role="offer"]'
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
                'span[data-testid="price"]',
                '.price',
                '.offer-price',
                'span[class*="price"]'
            ],
            sellerName: [
                'span[data-testid="seller-name"]',
                '.seller-name',
                'a[data-testid="seller-link"]',
                '[data-testid="seller-info"] a'
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
            
            // Załaduj ustawienia
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
        }
    }

    isAllegroListingPage() {
        const url = window.location.href;
        return url.includes('allegro.pl') && 
               (url.includes('/listing') || url.includes('/kategoria/'));
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['autoScanEnabled']);
            this.autoScanEnabled = result.autoScanEnabled || false;
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
                throw new Error(saveResult.error || 'Błąd zapisywania danych');
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
        // Spróbuj różnych selektorów
        for (const selector of this.selectors.productContainers) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`Found ${elements.length} products using selector: ${selector}`);
                return Array.from(elements);
            }
        }
        
        console.log('No products found with any selector');
        return [];
    }

    async parseProducts() {
        const productElements = this.findProductElements();
        const products = [];
        
        // Ogranicz do pierwszych 10 produktów - jeszcze mniej żeby nie triggerować anti-bot
        const limitedElements = productElements.slice(0, 10);
        
        console.log(`Parsing ${limitedElements.length} products slowly...`);
        
        // POWOLI parsuj produkty z opóźnieniami
        for (let i = 0; i < limitedElements.length; i++) {
            try {
                // Opóźnienie między każdym produktem 500ms-1.5s
                if (i > 0) {
                    await this.randomDelay(500, 1500);
                }
                
                const product = this.parseProductElement(limitedElements[i], i + 1);
                if (product) {
                    products.push(product);
                }
                
                // Co 3 produkty - symuluj scroll
                if ((i + 1) % 3 === 0) {
                    await this.simulateHumanScrolling();
                }
                
            } catch (error) {
                console.warn(`Error parsing product at position ${i + 1}:`, error);
            }
        }
        
        console.log(`Parsed ${products.length} products successfully`);
        return products;
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
        
        const price = this.extractText(element, this.selectors.productPrice);
        const seller = this.extractText(element, this.selectors.sellerName);
        const sponsored = false; // Już odfiltrowane wyżej
        
        if (!title || title.trim().length === 0) {
            console.warn(`No title found for product at position ${position}`);
            return null;
        }

        return {
            position: position,
            title: title.trim(),
            price: price ? price.trim() : null,
            seller: seller ? seller.trim() : null,
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