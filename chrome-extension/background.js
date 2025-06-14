// Allegro Position Monitor - Background Script (Service Worker)
// Odpowiedzialny za autentykację, synchronizację danych i komunikację z PocketBase

class AllegroMonitorBackground {
    constructor() {
        this.pocketbaseUrl = 'http://localhost:8090'; // Będzie zmieniony na produkcyjny URL
        this.pb = null;
        this.isAuthenticated = false;
        this.currentUser = null;
        
        this.init();
    }

    init() {
        console.log('Allegro Monitor Background Service Worker initialized');
        
        // Nasłuchuj wiadomości od popup i content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Dla asynchronicznych odpowiedzi
        });
        
        // Nasłuchuj instalacji/uruchomienia
        chrome.runtime.onInstalled.addListener(() => {
            this.handleExtensionInstalled();
        });
        
        chrome.runtime.onStartup.addListener(() => {
            this.handleExtensionStartup();
        });
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'login':
                    const loginResult = await this.handleLogin(message.email, message.password);
                    sendResponse(loginResult);
                    break;
                
                case 'logout':
                    const logoutResult = await this.handleLogout();
                    sendResponse(logoutResult);
                    break;
                
                case 'saveScanData':
                    const saveResult = await this.saveScanData(message.data);
                    sendResponse(saveResult);
                    break;
                
                case 'getRecentScans':
                    const scansResult = await this.getRecentScans(message.limit);
                    sendResponse(scansResult);
                    break;
                
                case 'setAutoScan':
                    const autoScanResult = await this.setAutoScan(message.enabled);
                    sendResponse(autoScanResult);
                    break;
                    
                case 'checkAuth':
                    const authResult = await this.checkAuthentication();
                    sendResponse(authResult);
                    break;
                
                default:
                    console.log('Unknown action:', message.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Message handling error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleLogin(email, password) {
        try {
            console.log('Attempting login for:', email);
            
            // Użyj fetch API zamiast PocketBase SDK (dla service worker)
            const response = await fetch(`${this.pocketbaseUrl}/api/collections/users/auth-with-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identity: email,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Błąd logowania');
            }

            const authData = await response.json();
            
            // Zapisz dane uwierzytelniania
            await chrome.storage.local.set({
                auth_token: authData.token,
                user_data: authData.record,
                auth_expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dni
            });

            this.isAuthenticated = true;
            this.currentUser = authData.record;
            
            console.log('Login successful');
            
            return {
                success: true,
                user: authData.record,
                token: authData.token
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleLogout() {
        try {
            // Wyczyść dane uwierzytelniania
            await chrome.storage.local.remove(['auth_token', 'user_data', 'auth_expires']);
            
            this.isAuthenticated = false;
            this.currentUser = null;
            
            console.log('Logout successful');
            
            return { success: true };
            
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async saveScanData(scanData) {
        try {
            // Sprawdź autentykację
            const authCheck = await this.checkAuthentication();
            if (!authCheck.success) {
                throw new Error('Nie jesteś zalogowany');
            }

            // Dodaj userId do danych
            const dataToSave = {
                ...scanData,
                userId: this.currentUser.id
            };

            console.log('Saving scan data:', dataToSave);

            // Wyślij dane do PocketBase
            const response = await fetch(`${this.pocketbaseUrl}/api/collections/positions/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(dataToSave)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Błąd zapisywania danych');
            }

            const savedRecord = await response.json();
            
            console.log('Scan data saved successfully:', savedRecord.id);
            
            // Zapisz w lokalnym cache dla szybkiego dostępu
            await this.updateLocalCache(savedRecord);
            
            return {
                success: true,
                recordId: savedRecord.id
            };

        } catch (error) {
            console.error('Save scan data error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getRecentScans(limit = 5) {
        try {
            // Sprawdź autentykację
            const authCheck = await this.checkAuthentication();
            if (!authCheck.success) {
                throw new Error('Nie jesteś zalogowany');
            }

            // Pobierz ostatnie skany z lokalnego cache
            const cachedScans = await this.getLocalCachedScans();
            if (cachedScans.length > 0) {
                return {
                    success: true,
                    scans: cachedScans.slice(0, limit)
                };
            }

            // Jeśli brak cache, pobierz z serwera
            const response = await fetch(
                `${this.pocketbaseUrl}/api/collections/positions/records?` +
                `filter=userId="${this.currentUser.id}"&` +
                `sort=-created&` +
                `perPage=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${await this.getAuthToken()}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Błąd pobierania danych');
            }

            const data = await response.json();
            const scans = data.items.map(record => ({
                id: record.id,
                keyword: record.keyword,
                timestamp: record.created,
                productsCount: record.products?.length || 0,
                url: record.url
            }));

            // Zaktualizuj cache
            await this.updateLocalScanCache(scans);

            return {
                success: true,
                scans: scans
            };

        } catch (error) {
            console.error('Get recent scans error:', error);
            return {
                success: false,
                error: error.message,
                scans: []
            };
        }
    }

    async setAutoScan(enabled) {
        try {
            await chrome.storage.local.set({ autoScanEnabled: enabled });
            
            console.log('Auto-scan setting updated:', enabled);
            
            return { success: true };
            
        } catch (error) {
            console.error('Set auto-scan error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkAuthentication() {
        try {
            const result = await chrome.storage.local.get(['auth_token', 'user_data', 'auth_expires']);
            
            if (!result.auth_token || !result.user_data) {
                this.isAuthenticated = false;
                this.currentUser = null;
                return { success: false, error: 'Brak danych uwierzytelniania' };
            }

            // Sprawdź czy token nie wygasł
            if (result.auth_expires && Date.now() > result.auth_expires) {
                // Token wygasł, wyczyść dane
                await chrome.storage.local.remove(['auth_token', 'user_data', 'auth_expires']);
                this.isAuthenticated = false;
                this.currentUser = null;
                return { success: false, error: 'Token wygasł' };
            }

            this.isAuthenticated = true;
            this.currentUser = result.user_data;

            return {
                success: true,
                user: result.user_data,
                token: result.auth_token
            };

        } catch (error) {
            console.error('Check authentication error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAuthToken() {
        const result = await chrome.storage.local.get(['auth_token']);
        return result.auth_token;
    }

    async updateLocalCache(scanRecord) {
        try {
            // Pobierz istniejący cache
            const result = await chrome.storage.local.get(['recent_scans_cache']);
            let cache = result.recent_scans_cache || [];
            
            // Dodaj nowy rekord na początek
            const newScan = {
                id: scanRecord.id,
                keyword: scanRecord.keyword,
                timestamp: scanRecord.created,
                productsCount: scanRecord.products?.length || 0,
                url: scanRecord.url
            };
            
            cache.unshift(newScan);
            
            // Zachowaj tylko ostatnie 20 rekordów
            cache = cache.slice(0, 20);
            
            // Zapisz zaktualizowany cache
            await chrome.storage.local.set({ recent_scans_cache: cache });
            
        } catch (error) {
            console.error('Update local cache error:', error);
        }
    }

    async getLocalCachedScans() {
        try {
            const result = await chrome.storage.local.get(['recent_scans_cache']);
            return result.recent_scans_cache || [];
        } catch (error) {
            console.error('Get local cached scans error:', error);
            return [];
        }
    }

    async updateLocalScanCache(scans) {
        try {
            await chrome.storage.local.set({ recent_scans_cache: scans });
        } catch (error) {
            console.error('Update local scan cache error:', error);
        }
    }

    async handleExtensionInstalled() {
        console.log('Extension installed');
        
        // Ustaw domyślne ustawienia
        await chrome.storage.local.set({
            autoScanEnabled: false,
            first_run: true
        });
    }

    async handleExtensionStartup() {
        console.log('Extension startup');
        
        // Sprawdź autentykację przy starcie
        await this.checkAuthentication();
    }
}

// Inicjalizuj background service
new AllegroMonitorBackground(); 