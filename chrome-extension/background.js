// Allegro Position Monitor - Background Script (Service Worker)
// Odpowiedzialny za autentykację, synchronizację danych i komunikację z PocketBase

class AllegroMonitorBackground {
    constructor() {
        this.pocketbaseUrl = 'http://localhost:8090'; // Będzie zmieniony na produkcyjny URL
        this.pb = null;
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Queue processing state
        this.queueUrls = [];
        this.currentQueueIndex = 0;
        this.isQueueRunning = false;
        this.queueStartTime = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Allegro Monitor Background Service Worker initialized');
        
        // Keep service worker alive during queue processing
        this.setupServiceWorkerKeepAlive();
        
        // Test if background script is running
        setTimeout(() => {
            console.log('⏰ Background script is alive after 5 seconds');
        }, 5000);
        
        // Nasłuchuj wiadomości od popup i content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            // Używamy async/await wrapper
            (async () => {
                await this.handleMessage(message, sender, sendResponse);
            })();
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
        console.log('📨 Received message:', message.action);
        
        try {
            switch (message.action) {
                case 'login':
                    const loginResult = await this.handleLogin(message.email, message.password, message.serverUrl);
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
                
                case 'updateSettings':
                    const settingsResult = await this.updateSettings(message.settings);
                    sendResponse(settingsResult);
                    break;
                
                case 'startQueue':
                    const queueStartResult = await this.startQueueProcessing(message.urls, message.positionLimit);
                    sendResponse(queueStartResult);
                    break;
                
                case 'stopQueue':
                    const queueStopResult = await this.stopQueueProcessing();
                    sendResponse(queueStopResult);
                    break;
                
                case 'getQueueStatus':
                    const queueStatusResult = await this.getQueueStatus();
                    sendResponse(queueStatusResult);
                    break;
                
                case 'keepAlive':
                    // Service worker keep-alive ping
                    sendResponse({ success: true, timestamp: Date.now() });
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

    async handleLogin(email, password, serverUrl = null) {
        try {
            console.log('Attempting login for:', email);
            
            // Update server URL if provided
            if (serverUrl) {
                this.pocketbaseUrl = serverUrl;
                console.log('Updated server URL to:', this.pocketbaseUrl);
            }
            
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
                server_url: this.pocketbaseUrl,
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
            await chrome.storage.local.remove(['auth_token', 'user_data', 'auth_expires', 'server_url']);
            
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
            if (!authCheck.success || !authCheck.isAuthenticated) {
                throw new Error('Nie jesteś zalogowany');
            }

            // Dodaj userId do danych
            const dataToSave = {
                ...scanData,
                userId: this.currentUser.id
            };

            console.log('Saving scan data:', dataToSave);

            // Wyślij dane do PocketBase z lepszą obsługą błędów
            const response = await fetch(`${this.pocketbaseUrl}/api/collections/positions/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(dataToSave)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                
                // Handle specific PocketBase errors
                if (response.status === 400 && errorData?.message?.includes('collection')) {
                    throw new Error('Błąd konfiguracji bazy danych. Sprawdź czy PocketBase jest uruchomiony i kolekcje są utworzone.');
                }
                
                if (response.status === 401) {
                    // Token expired or invalid - clear auth
                    await this.handleLogout();
                    throw new Error('Sesja wygasła. Zaloguj się ponownie.');
                }
                
                if (response.status === 403) {
                    throw new Error('Brak uprawnień do zapisywania danych.');
                }
                
                throw new Error(errorData?.message || `Błąd serwera (${response.status})`);
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
            
            // Provide more specific error messages
            let errorMessage = error.message;
            
            if (error.message.includes('fetch')) {
                errorMessage = 'Błąd połączenia z serwerem. Sprawdź czy PocketBase jest uruchomiony.';
            }
            
            return {
                success: false,
                error: errorMessage
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

    async updateSettings(settings) {
        try {
            // Zapisz ustawienia w storage
            await chrome.storage.local.set(settings);
            
            console.log('Settings updated:', settings);
            
            // Wyślij ustawienia do wszystkich aktywnych content scriptów
            const tabs = await chrome.tabs.query({ url: 'https://allegro.pl/*' });
            
            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateSettings',
                        settings: settings
                    });
                    console.log(`Settings sent to tab ${tab.id}`);
                } catch (error) {
                    // Ignoruj błędy - content script może nie być załadowany
                    console.log(`Could not send settings to tab ${tab.id}:`, error.message);
                }
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('Update settings error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkAuthentication() {
        try {
            const result = await chrome.storage.local.get(['auth_token', 'user_data', 'auth_expires', 'server_url']);
            
            // Restore server URL if saved
            if (result.server_url) {
                this.pocketbaseUrl = result.server_url;
            }
            
            if (!result.auth_token || !result.user_data) {
                this.isAuthenticated = false;
                this.currentUser = null;
                return { 
                    success: false, 
                    isAuthenticated: false,
                    error: 'Brak danych uwierzytelniania' 
                };
            }

            // Sprawdź czy token nie wygasł
            if (result.auth_expires && Date.now() > result.auth_expires) {
                // Token wygasł, wyczyść dane
                await chrome.storage.local.remove(['auth_token', 'user_data', 'auth_expires', 'server_url']);
                this.isAuthenticated = false;
                this.currentUser = null;
                return { 
                    success: false, 
                    isAuthenticated: false,
                    error: 'Token wygasł' 
                };
            }

            this.isAuthenticated = true;
            this.currentUser = result.user_data;

            return {
                success: true,
                isAuthenticated: true,
                user: result.user_data,
                token: result.auth_token
            };

        } catch (error) {
            console.error('Check authentication error:', error);
            this.isAuthenticated = false;
            this.currentUser = null;
            return {
                success: false,
                isAuthenticated: false,
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

    // ======== QUEUE PROCESSING METHODS ========

    async startQueueProcessing(urls, positionLimit = 10) {
        try {
            if (this.isQueueRunning) {
                return { success: false, error: 'Kolejka już działa' };
            }

            if (!urls || urls.length === 0) {
                return { success: false, error: 'Brak URL-i do przetworzenia' };
            }

            // Check authentication
            const authCheck = await this.checkAuthentication();
            if (!authCheck.success || !authCheck.isAuthenticated) {
                return { success: false, error: 'Nie jesteś zalogowany' };
            }

            // Initialize queue
            this.queueUrls = urls.filter(url => url && url.includes('allegro.pl'));
            this.currentQueueIndex = 0;
            this.isQueueRunning = true;
            this.queueStartTime = Date.now();

            console.log(`Starting queue processing: ${this.queueUrls.length} URLs, ${positionLimit} positions each`);

            // Start processing (don't wait for completion)
            this.processQueueInBackground(positionLimit);

            return { 
                success: true, 
                totalUrls: this.queueUrls.length,
                message: 'Kolejka rozpoczęta' 
            };

        } catch (error) {
            console.error('Start queue error:', error);
            return { success: false, error: error.message };
        }
    }

    async stopQueueProcessing() {
        try {
            if (!this.isQueueRunning) {
                return { success: false, error: 'Kolejka nie działa' };
            }

            this.isQueueRunning = false;
            console.log(`Queue stopped at ${this.currentQueueIndex}/${this.queueUrls.length}`);

            return { 
                success: true, 
                processed: this.currentQueueIndex,
                total: this.queueUrls.length,
                message: 'Kolejka zatrzymana' 
            };

        } catch (error) {
            console.error('Stop queue error:', error);
            return { success: false, error: error.message };
        }
    }

    async getQueueStatus() {
        return {
            success: true,
            isRunning: this.isQueueRunning,
            currentIndex: this.currentQueueIndex,
            totalUrls: this.queueUrls.length,
            currentUrl: this.queueUrls[this.currentQueueIndex] || null,
            startTime: this.queueStartTime
        };
    }

    async processQueueInBackground(positionLimit) {
        while (this.isQueueRunning && this.currentQueueIndex < this.queueUrls.length) {
            const currentUrl = this.queueUrls[this.currentQueueIndex];
            
            try {
                console.log(`🚀 Processing URL ${this.currentQueueIndex + 1}/${this.queueUrls.length}: ${currentUrl}`);
                
                // Navigate to URL in active tab - try multiple methods
                let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                
                // Fallback 1: Any tab in current window
                if (tabs.length === 0) {
                    console.log('No active tab in current window, trying any tab in current window...');
                    tabs = await chrome.tabs.query({ currentWindow: true });
                }
                
                // Fallback 2: Any tab at all
                if (tabs.length === 0) {
                    console.log('No tabs in current window, trying any tab...');
                    tabs = await chrome.tabs.query({});
                }
                
                if (tabs.length === 0) {
                    throw new Error('Brak dostępnych kart');
                }
                
                const tab = tabs[0];
                console.log(`📋 Found active tab ${tab.id}, current URL: ${tab.url}`);
                
                // Update tab URL
                console.log(`🌐 Navigating to: ${currentUrl}`);
                await chrome.tabs.update(tab.id, { url: currentUrl });
                
                // Wait for page to load
                console.log(`⏳ Waiting for page to load...`);
                await this.waitForPageLoad(tab.id);
                console.log(`✅ Page loaded successfully`);
                
                // Send settings to content script
                console.log(`⚙️ Sending settings: positionLimit=${positionLimit}`);
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSettings',
                    settings: { positionLimit: positionLimit }
                });
                
                // Wait a bit for settings to apply
                console.log(`⏱️ Waiting 2s for settings to apply...`);
                await this.delay(2000);
                console.log(`✅ Settings applied`);
                
                
                // Perform scan
                console.log(`Sending scan message to tab ${tab.id}...`);
                const result = await chrome.tabs.sendMessage(tab.id, { 
                    action: 'scanPositions' 
                });
                
                console.log(`Scan result for ${currentUrl}:`, result);
                
                if (!result) {
                    throw new Error('No response from content script');
                }
                
                if (!result.success) {
                    throw new Error(result.error || 'Scan failed');
                }
                
                console.log(`✅ URL ${this.currentQueueIndex + 1} completed successfully`);
                
                // Notify any listening popups about the result (before incrementing index)
                this.notifyQueueProgress(currentUrl, result);
                
                this.currentQueueIndex++;
                
                // Wait between URLs (1-2 minutes for safety - shorter to avoid service worker timeout)
                if (this.isQueueRunning && this.currentQueueIndex < this.queueUrls.length) {
                    const waitTime = 60000 + Math.random() * 60000; // 1-2 minutes
                    console.log(`⏸️ Waiting ${Math.round(waitTime/1000)}s before next URL (${this.currentQueueIndex + 1}/${this.queueUrls.length})...`);
                    await this.delay(waitTime);
                    console.log(`⏰ Wait completed, proceeding to next URL...`);
                } else if (this.currentQueueIndex >= this.queueUrls.length) {
                    console.log(`🎉 All URLs processed! Queue completed.`);
                }
                
            } catch (error) {
                console.error(`Queue processing error for ${currentUrl}:`, error);
                this.notifyQueueProgress(currentUrl, { success: false, error: error.message });
                this.currentQueueIndex++;
                
                // Continue with next URL after error
                if (this.isQueueRunning && this.currentQueueIndex < this.queueUrls.length) {
                    await this.delay(10000); // Short delay after error
                }
            }
        }
        
        // Queue finished
        if (this.isQueueRunning) {
            this.isQueueRunning = false;
            console.log('Queue processing completed');
            this.notifyQueueComplete();
        }
    }

    async waitForPageLoad(tabId) {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds max
            
            const checkLoading = () => {
                chrome.tabs.get(tabId, (tab) => {
                    if (chrome.runtime.lastError) {
                        console.error('Tab access error:', chrome.runtime.lastError);
                        resolve();
                        return;
                    }
                    
                    if (tab.status === 'complete' || attempts >= maxAttempts) {
                        // Additional delay for content to settle
                        setTimeout(resolve, 3000);
                    } else {
                        attempts++;
                        setTimeout(checkLoading, 1000);
                    }
                });
            };
            
            checkLoading();
        });
    }

    async delay(ms) {
        // Log every 30 seconds during long delays to keep service worker alive
        if (ms > 30000) {
            const startTime = Date.now();
            const endTime = startTime + ms;
            
            const pingInterval = setInterval(() => {
                const remaining = Math.max(0, endTime - Date.now());
                if (remaining > 0) {
                    console.log(`⏳ Still waiting... ${Math.round(remaining/1000)}s remaining`);
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000);
            
            return new Promise(resolve => {
                setTimeout(() => {
                    clearInterval(pingInterval);
                    resolve();
                }, ms);
            });
        } else {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    setupServiceWorkerKeepAlive() {
        // Keep service worker alive by pinging every 20 seconds
        setInterval(() => {
            if (this.isQueueRunning) {
                console.log('🔄 Service worker keep-alive ping during queue processing');
                // Create a dummy port to keep service worker active
                chrome.runtime.sendMessage({action: 'keepAlive'}).catch(() => {
                    // Ignore errors - this is just to keep SW alive
                });
            }
        }, 20000); // Every 20 seconds
    }

    notifyQueueProgress(url, result) {
        const message = {
            action: 'queueProgress',
            url: url,
            result: result,
            index: this.currentQueueIndex,
            total: this.queueUrls.length
        };
        
        console.log('📢 Sending queue progress notification:', message);
        
        // Try to notify any open popups about progress
        chrome.runtime.sendMessage(message).catch((error) => {
            console.log('No popup listening for queue progress:', error.message);
        });
    }

    notifyQueueComplete() {
        chrome.runtime.sendMessage({
            action: 'queueComplete',
            processed: this.currentQueueIndex,
            total: this.queueUrls.length
        }).catch(() => {
            // Ignore errors if no popup is listening
        });
    }
}

// Inicjalizuj background service
new AllegroMonitorBackground(); 