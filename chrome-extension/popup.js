// Allegro Position Monitor - Popup Script
// Główny plik obsługujący interfejs popup wtyczki

class AllegroMonitorPopup {
    constructor() {
        this.pb = null;
        this.currentUser = null;
        this.isInitialized = false;
        
        // Elementy DOM
        this.elements = {};
        
        this.init();
    }

    async init() {
        console.log('Initializing Allegro Monitor Popup...');
        
        // Pobierz elementy DOM
        this.getElements();
        
        // Dodaj event listenery
        this.attachEventListeners();
        
        // Sprawdź stan logowania
        await this.checkLoginStatus();
        
        this.isInitialized = true;
        console.log('Popup initialized successfully');
    }

    getElements() {
        // Login elements
        this.elements.loginSection = document.getElementById('loginSection');
        this.elements.loginForm = document.getElementById('loginForm');
        this.elements.emailInput = document.getElementById('email');
        this.elements.passwordInput = document.getElementById('password');
        this.elements.loginError = document.getElementById('loginError');
        
        // Main interface elements
        this.elements.mainSection = document.getElementById('mainSection');
        this.elements.userEmail = document.getElementById('userEmail');
        this.elements.logoutBtn = document.getElementById('logoutBtn');
        
        // Scan elements
        this.elements.scanStatusText = document.getElementById('scanStatusText');
        this.elements.manualScanBtn = document.getElementById('manualScanBtn');
        this.elements.autoScanToggle = document.getElementById('autoScanToggle');
        this.elements.recentScansList = document.getElementById('recentScansList');
        
        // Other elements
        this.elements.connectionStatus = document.getElementById('connectionStatus');
        this.elements.openDashboardBtn = document.getElementById('openDashboardBtn');
        this.elements.loadingSection = document.getElementById('loadingSection');
    }

    attachEventListeners() {
        // Login form
        this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Logout button
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Manual scan button
        this.elements.manualScanBtn.addEventListener('click', () => this.handleManualScan());
        
        // Auto-scan toggle
        this.elements.autoScanToggle.addEventListener('change', (e) => this.handleAutoScanToggle(e));
        
        // Open dashboard button
        this.elements.openDashboardBtn.addEventListener('click', () => this.openDashboard());
        
        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
        });
    }

    async checkLoginStatus() {
        try {
            // Pobierz dane z Chrome Storage
            const result = await chrome.storage.local.get(['auth_token', 'user_data']);
            
            if (result.auth_token && result.user_data) {
                this.currentUser = result.user_data;
                this.showMainInterface();
                this.updateConnectionStatus(true);
                await this.loadRecentScans();
                await this.loadSettings();
            } else {
                this.showLoginForm();
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            this.showLoginForm();
            this.updateConnectionStatus(false);
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = this.elements.emailInput.value.trim();
        const password = this.elements.passwordInput.value;
        
        if (!email || !password) {
            this.showError('Proszę wypełnić wszystkie pola');
            return;
        }

        this.showLoading();
        this.hideError();

        try {
            // Wyślij request do background script
            const response = await chrome.runtime.sendMessage({
                action: 'login',
                email: email,
                password: password
            });

            if (response.success) {
                this.currentUser = response.user;
                this.showMainInterface();
                this.updateConnectionStatus(true);
                await this.loadRecentScans();
                await this.loadSettings();
            } else {
                this.showError(response.error || 'Błąd logowania');
                this.showLoginForm();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Błąd połączenia z serwerem');
            this.showLoginForm();
        }
    }

    async handleLogout() {
        try {
            // Wyślij request do background script
            await chrome.runtime.sendMessage({
                action: 'logout'
            });

            this.currentUser = null;
            this.showLoginForm();
            this.updateConnectionStatus(false);
            
            // Wyczyść formularz
            this.elements.emailInput.value = '';
            this.elements.passwordInput.value = '';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async handleManualScan() {
        try {
            // Sprawdź czy jesteśmy na stronie Allegro
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('allegro.pl/listing')) {
                this.showError('Proszę przejść na stronę z wynikami wyszukiwania Allegro');
                return;
            }

            // Disable button and show scanning status
            this.elements.manualScanBtn.disabled = true;
            this.elements.scanStatusText.textContent = 'Skanowanie...';

            // Send scan request to content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'scanPositions'
            });

            if (response.success) {
                this.elements.scanStatusText.textContent = `Zeskanowano ${response.productsCount} produktów`;
                await this.loadRecentScans(); // Refresh recent scans
                
                // Reset status after 3 seconds
                setTimeout(() => {
                    this.elements.scanStatusText.textContent = 'Gotowy';
                }, 3000);
            } else {
                this.elements.scanStatusText.textContent = 'Błąd skanowania';
                this.showError(response.error || 'Nie udało się zeskanować pozycji');
            }
        } catch (error) {
            console.error('Manual scan error:', error);
            this.elements.scanStatusText.textContent = 'Błąd';
            this.showError('Błąd podczas skanowania');
        } finally {
            this.elements.manualScanBtn.disabled = false;
        }
    }

    async handleAutoScanToggle(event) {
        const enabled = event.target.checked;
        
        try {
            // Zapisz ustawienie
            await chrome.storage.local.set({ autoScanEnabled: enabled });
            
            // Wyślij wiadomość do background script
            await chrome.runtime.sendMessage({
                action: 'setAutoScan',
                enabled: enabled
            });
            
            console.log('Auto-scan', enabled ? 'enabled' : 'disabled');
        } catch (error) {
            console.error('Error toggling auto-scan:', error);
            // Revert toggle if error
            event.target.checked = !enabled;
        }
    }

    async loadRecentScans() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getRecentScans',
                limit: 5
            });

            if (response.success) {
                this.displayRecentScans(response.scans);
            }
        } catch (error) {
            console.error('Error loading recent scans:', error);
        }
    }

    displayRecentScans(scans) {
        const container = this.elements.recentScansList;
        
        if (!scans || scans.length === 0) {
            container.innerHTML = '<div class="text-center" style="color: #6b7280; font-size: 12px;">Brak ostatnich skanów</div>';
            return;
        }

        container.innerHTML = scans.map(scan => {
            const date = new Date(scan.timestamp);
            const timeString = date.toLocaleTimeString('pl-PL', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            return `
                <div class="scan-item">
                    <div>
                        <div class="scan-keyword">${scan.keyword}</div>
                        <div class="scan-time">${timeString}</div>
                    </div>
                    <div class="scan-count">${scan.productsCount}</div>
                </div>
            `;
        }).join('');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['autoScanEnabled']);
            this.elements.autoScanToggle.checked = result.autoScanEnabled || false;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    openDashboard() {
        // Otwórz dashboard w nowej karcie
        chrome.tabs.create({
            url: 'https://allegro-monitor.vercel.app' // URL będzie aktualizowany po deploymencie
        });
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.action) {
            case 'scanCompleted':
                this.handleScanCompleted(message.data);
                break;
            case 'scanError':
                this.handleScanError(message.error);
                break;
            default:
                console.log('Unknown message:', message);
        }
    }

    handleScanCompleted(data) {
        this.elements.scanStatusText.textContent = `Zeskanowano ${data.productsCount} produktów`;
        this.loadRecentScans(); // Refresh recent scans
        
        // Reset status after 3 seconds
        setTimeout(() => {
            this.elements.scanStatusText.textContent = 'Gotowy';
        }, 3000);
    }

    handleScanError(error) {
        this.elements.scanStatusText.textContent = 'Błąd skanowania';
        this.showError(error || 'Nie udało się zeskanować pozycji');
    }

    // UI Helper Methods
    showLoginForm() {
        this.elements.loginSection.classList.remove('hidden');
        this.elements.mainSection.classList.add('hidden');
        this.elements.loadingSection.classList.add('hidden');
    }

    showMainInterface() {
        this.elements.loginSection.classList.add('hidden');
        this.elements.mainSection.classList.remove('hidden');
        this.elements.loadingSection.classList.add('hidden');
        
        if (this.currentUser) {
            this.elements.userEmail.textContent = this.currentUser.email;
        }
    }

    showLoading() {
        this.elements.loginSection.classList.add('hidden');
        this.elements.mainSection.classList.add('hidden');
        this.elements.loadingSection.classList.remove('hidden');
    }

    showError(message) {
        this.elements.loginError.textContent = message;
        this.elements.loginError.classList.remove('hidden');
    }

    hideError() {
        this.elements.loginError.classList.add('hidden');
    }

    updateConnectionStatus(connected) {
        const statusDot = this.elements.connectionStatus.querySelector('.status-dot');
        const statusText = this.elements.connectionStatus.querySelector('.status-text');
        
        if (connected) {
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
            statusText.textContent = 'Połączony';
        } else {
            statusDot.classList.remove('online');
            statusDot.classList.add('offline');
            statusText.textContent = 'Rozłączony';
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AllegroMonitorPopup();
}); 