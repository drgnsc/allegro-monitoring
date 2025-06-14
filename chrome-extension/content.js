// Allegro Position Monitor - Content Script
// Odpowiedzialny za wykrywanie i parsowanie pozycji produktów na stronach Allegro

class AllegroContentParser {
    constructor() {
        this.isActive = false;
        this.isScanning = false;
        this.autoScanEnabled = false;
        this.currentUrl = window.location.href;
        this.lastScanData = null;
        
        // Selektory CSS dla różnych elementów Allegro
        this.selectors = {
            // Różne warianty selektorów produktów (Allegro czasem zmienia strukturę)
            productContainers: [
                'article[data-analytics-view-custom-index]',
                'div[data-testid="listing-item"]',
                'article[data-role="offer"]',
                'div[data-role="offer"]',
                'a[href*="/oferta/"]'
            ],
            productTitle: [
                'h2 a',
                'h3 a', 
                'a[data-testid="offer-title"]',
                '.offer-title',
                'a[href*="/oferta/"] h2',
                'a[href*="/oferta/"] h3'
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
                // Opóźnij auto-scan o 2 sekundy, żeby strona się załadowała
                setTimeout(() => {
                    this.performScan();
                }, 2000);
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
                    // Opóźnij scan po zmianie URL
                    setTimeout(() => {
                        this.performScan();
                    }, 3000);
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

        this.isScanning = true;
        
        try {
            console.log('Starting position scan...');
            
            // Poczekaj na załadowanie strony
            await this.waitForPageLoad();
            
            // Sparsuj produkty
            const products = this.parseProducts();
            
            if (products.length === 0) {
                throw new Error('Nie znaleziono produktów na tej stronie');
            }

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
        // Poczekaj na załadowanie produktów
        return new Promise((resolve) => {
            const checkProducts = () => {
                const products = this.findProductElements();
                if (products.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkProducts, 500);
                }
            };
            
            // Maksymalnie 10 sekund oczekiwania
            setTimeout(() => resolve(), 10000);
            checkProducts();
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

    parseProducts() {
        const productElements = this.findProductElements();
        const products = [];
        
        productElements.forEach((element, index) => {
            try {
                const product = this.parseProductElement(element, index + 1);
                if (product) {
                    products.push(product);
                }
            } catch (error) {
                console.warn(`Error parsing product at position ${index + 1}:`, error);
            }
        });
        
        return products;
    }

    parseProductElement(element, position) {
        // Parsuj pojedynczy element produktu
        const title = this.extractText(element, this.selectors.productTitle);
        const price = this.extractText(element, this.selectors.productPrice);
        const seller = this.extractText(element, this.selectors.sellerName);
        const sponsored = this.isSponsored(element);
        
        // Znajdź link do oferty
        const linkElement = element.querySelector('a[href*="/oferta/"]') || 
                          element.closest('a[href*="/oferta/"]');
        const url = linkElement ? linkElement.href : null;
        
        if (!title) {
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