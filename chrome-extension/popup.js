// Allegro Position Monitor - Popup Script
// Główny plik obsługujący interfejs popup wtyczki

let isLoggedIn = false;
let currentUser = null;
let urlQueue = [];
let currentQueueIndex = 0;
let isQueueRunning = false;

// DOM Elements
const elements = {
    // Sections
    loginSection: null,
    mainSection: null,
    loading: null,
    
    // Login
    loginForm: null,
    serverUrl: null,
    email: null,
    password: null,
    loginError: null,
    
    // Status
    statusIndicator: null,
    statusText: null,
    
    // Single Scan
    scanBtn: null,
    
    // Logout
    logoutBtn: null,
    
    // Queue System
    urlQueueTextarea: null,
    startQueueBtn: null,
    stopQueueBtn: null,
    clearQueueBtn: null,
    queueStatusText: null,
    queueProgress: null,
    currentUrlSpan: null,
    
    // Auto-scan
    autoScanToggle: null,
    
    // Results
    results: null,
    loadingText: null
};

document.addEventListener('DOMContentLoaded', async function() {
    initializeElements();
    setupEventListeners();
    await initializePopup();
});

function initializeElements() {
    // Get all DOM elements
    elements.loginSection = document.getElementById('loginSection');
    elements.mainSection = document.getElementById('mainSection');
    elements.loading = document.getElementById('loading');
    
    elements.loginForm = document.getElementById('loginForm');
    elements.serverUrl = document.getElementById('serverUrl');
    elements.email = document.getElementById('email');
    elements.password = document.getElementById('password');
    elements.loginError = document.getElementById('loginError');
    
    elements.statusIndicator = document.getElementById('statusIndicator');
    elements.statusText = document.getElementById('statusText');
    
    elements.scanBtn = document.getElementById('scanBtn');
    
    elements.logoutBtn = document.getElementById('logoutBtn');
    
    elements.urlQueueTextarea = document.getElementById('urlQueue');
    elements.startQueueBtn = document.getElementById('startQueueBtn');
    elements.stopQueueBtn = document.getElementById('stopQueueBtn');
    elements.clearQueueBtn = document.getElementById('clearQueueBtn');
    elements.queueStatusText = document.getElementById('queueStatusText');
    elements.queueProgress = document.getElementById('queueProgress');
    elements.currentUrlSpan = document.getElementById('currentUrl');
    
    elements.autoScanToggle = document.getElementById('autoScanToggle');
    
    elements.positionLimit = document.getElementById('positionLimit');
    elements.estimatedTime = document.getElementById('estimatedTime');
    
    elements.results = document.getElementById('results');
    elements.loadingText = document.getElementById('loadingText');
}

function setupEventListeners() {
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Single scan
    if (elements.scanBtn) {
        elements.scanBtn.addEventListener('click', handleManualScan);
    }
    
    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Queue controls
    if (elements.startQueueBtn) {
        elements.startQueueBtn.addEventListener('click', handleStartQueue);
    }
    
    if (elements.stopQueueBtn) {
        elements.stopQueueBtn.addEventListener('click', handleStopQueue);
    }
    
    if (elements.clearQueueBtn) {
        elements.clearQueueBtn.addEventListener('click', handleClearQueue);
    }
    
    // Auto-scan toggle
    if (elements.autoScanToggle) {
        elements.autoScanToggle.addEventListener('change', handleAutoScanToggle);
    }
    
    // Position limit
    if (elements.positionLimit) {
        elements.positionLimit.addEventListener('input', handlePositionLimitChange);
        elements.positionLimit.addEventListener('change', handlePositionLimitChange);
    }
}

async function initializePopup() {
    try {
        showLoading('Sprawdzanie stanu...');
        
        // CACHE authentication status to avoid frequent checks
        // Only check authentication once per popup session
        if (isLoggedIn && currentUser) {
            showMainSection();
            await updatePageStatus();
            await loadSettings();
            return;
        }
        
        // Check authentication status only if not already cached
        console.log('Checking authentication...');
        const authResult = await chrome.runtime.sendMessage({ action: 'checkAuth' });
        console.log('Auth result:', authResult);
        
        if (authResult.success && authResult.user) {
            console.log('Authentication successful, user:', authResult.user.email);
            isLoggedIn = true;
            currentUser = authResult.user;
            showMainSection();
            await updatePageStatus();
            await loadSettings();
        } else {
            console.log('Authentication failed:', authResult.error);
            isLoggedIn = false;
            currentUser = null;
            showLoginSection();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        // Don't reset login state on network errors
        if (isLoggedIn && currentUser) {
            showMainSection();
            await updatePageStatus();
        } else {
            showLoginSection();
        }
    } finally {
        hideLoading();
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const serverUrl = elements.serverUrl.value.trim();
    const email = elements.email.value.trim();
    const password = elements.password.value;
    
    if (!serverUrl || !email || !password) {
        showError('Wszystkie pola są wymagane');
        return;
    }
    
    try {
        showLoading('Logowanie...');
        console.log('Attempting login to:', serverUrl, 'with email:', email);
        
        const result = await chrome.runtime.sendMessage({
            action: 'login',
            serverUrl: serverUrl,
            email: email,
            password: password
        });
        
        console.log('Login result:', result);
        
        if (result.success) {
            console.log('Login successful, user:', result.user);
            isLoggedIn = true;
            currentUser = result.user;
            showMainSection();
            await updatePageStatus();
            await loadSettings();
            clearError();
        } else {
            console.error('Login failed:', result.error);
            showError(result.error || 'Błąd logowania');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Błąd połączenia z serwerem');
    } finally {
        hideLoading();
    }
}

async function handleManualScan() {
    if (!isLoggedIn) {
        showError('Musisz być zalogowany');
        return;
    }
    
    try {
        elements.scanBtn.disabled = true;
        elements.scanBtn.innerHTML = '<span class="btn-icon">⏳</span> Skanowanie...';
        
        // Get current page info
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('allegro.pl')) {
            throw new Error('To nie jest strona Allegro');
        }
        
        // Send scan message to content script
        const result = await chrome.tabs.sendMessage(tab.id, { action: 'scanPositions' });
        
        if (result.success) {
            showResult({
                type: 'success',
                title: 'Skan ukończony!',
                details: `Znaleziono ${result.productsCount} produktów na ${result.keyword || 'tej stronie'}`
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Scan error:', error);
        showResult({
            type: 'error',
            title: 'Błąd skanowania',
            details: error.message
        });
    } finally {
        elements.scanBtn.disabled = false;
        elements.scanBtn.innerHTML = '<span class="btn-icon">📊</span> Skanuj Pozycje';
    }
}

async function handleStartQueue() {
    const urls = parseQueueUrls();
    
    if (urls.length === 0) {
        showError('Wprowadź przynajmniej jeden URL');
        return;
    }
    
    if (!isLoggedIn) {
        showError('Musisz być zalogowany');
        return;
    }
    
    try {
        // Get position limit
        const positionLimit = parseInt(elements.positionLimit.value) || 10;
        
        // Start queue processing in background script
        const result = await chrome.runtime.sendMessage({
            action: 'startQueue',
            urls: urls,
            positionLimit: positionLimit
        });
        
        if (result.success) {
            urlQueue = urls;
            currentQueueIndex = 0;
            isQueueRunning = true;
            
            updateQueueControls();
            updateQueueStatus();
            
            showResult({
                type: 'success',
                title: 'Kolejka rozpoczęta!',
                details: `${result.totalUrls} URL-i, ${positionLimit} pozycji każdy`
            });
            
            // Start monitoring queue progress
            startQueueMonitoring();
        } else {
            showError('Błąd uruchamiania kolejki: ' + result.error);
        }
        
    } catch (error) {
        console.error('Queue start error:', error);
        showError('Błąd uruchamiania kolejki: ' + error.message);
    }
}

async function handleStopQueue() {
    try {
        // Stop queue processing in background script
        const result = await chrome.runtime.sendMessage({
            action: 'stopQueue'
        });
        
        if (result.success) {
            isQueueRunning = false;
            updateQueueControls();
            updateQueueStatus();
            
            showResult({
                type: 'info',
                title: 'Kolejka zatrzymana',
                details: `Przetworzono ${result.processed}/${result.total} URL-i`
            });
        } else {
            showError('Błąd zatrzymywania kolejki: ' + result.error);
        }
        
    } catch (error) {
        console.error('Queue stop error:', error);
        // Force stop locally even if background fails
        isQueueRunning = false;
        updateQueueControls();
        updateQueueStatus();
    }
}

function handleClearQueue() {
    elements.urlQueueTextarea.value = '';
    urlQueue = [];
    currentQueueIndex = 0;
    isQueueRunning = false;
    
    updateQueueControls();
    updateQueueStatus();
}

// Old processQueue functions removed - now handled in background script

function parseQueueUrls() {
    const text = elements.urlQueueTextarea.value.trim();
    if (!text) return [];
    
    return text
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && url.includes('allegro.pl'))
        .filter((url, index, array) => array.indexOf(url) === index); // Remove duplicates
}

function updateQueueControls() {
    elements.startQueueBtn.classList.toggle('hidden', isQueueRunning);
    elements.stopQueueBtn.classList.toggle('hidden', !isQueueRunning);
    elements.urlQueueTextarea.disabled = isQueueRunning;
}

function updateQueueStatus() {
    if (!isQueueRunning && urlQueue.length === 0) {
        elements.queueStatusText.textContent = 'Gotowa';
        elements.queueProgress.textContent = '0/0';
        elements.currentUrlSpan.textContent = '-';
    } else {
        elements.queueStatusText.textContent = isQueueRunning ? 'W toku' : 'Zatrzymana';
        elements.queueProgress.textContent = `${currentQueueIndex}/${urlQueue.length}`;
        elements.currentUrlSpan.textContent = urlQueue[currentQueueIndex] || '-';
    }
}

async function handleAutoScanToggle() {
    const enabled = elements.autoScanToggle.checked;
    
    try {
        await chrome.storage.local.set({ autoScanEnabled: enabled });
        await chrome.runtime.sendMessage({
            action: 'updateSettings',
            settings: { autoScanEnabled: enabled }
        });
    } catch (error) {
        console.error('Auto-scan toggle error:', error);
    }
}

async function updatePageStatus() {
    try {
        console.log('Updating page status...');
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Current tab URL:', tab?.url);
        
        if (!tab || !tab.url) {
            setStatus('error', 'Brak aktywnej karty');
            return;
        }
        
        // Check if it's Allegro page
        if (tab.url.includes('allegro.pl')) {
            setStatus('success', 'Strona Allegro wykryta');
            console.log('Allegro page detected');
            
            // Try to get page info from content script
            try {
                const pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' });
                console.log('Page info from content script:', pageInfo);
                
                if (pageInfo && pageInfo.success) {
                    console.log('Content script responded successfully');
                    // Check authentication status
                    if (isLoggedIn && currentUser) {
                        setStatus('success', 'Gotowy do skanowania');
                        console.log('Ready to scan - user authenticated');
                    } else {
                        setStatus('error', 'Zaloguj się aby skanować');
                        console.log('Not authenticated');
                    }
                } else {
                    setStatus('warning', 'Strona Allegro - odśwież jeśli potrzeba');
                    console.log('Content script not fully ready');
                }
            } catch (contentError) {
                console.error('Content script error:', contentError);
                setStatus('warning', 'Strona Allegro - odśwież jeśli potrzeba');
            }
        } else {
            setStatus('info', 'Przejdź na stronę Allegro');
            console.log('Not on Allegro page');
        }
        
        // Check authentication separately
        if (isLoggedIn && currentUser) {
            console.log('User is authenticated:', currentUser.email);
        } else {
            console.log('User not authenticated');
        }
        
    } catch (error) {
        console.error('Update page status error:', error);
        setStatus('error', 'Błąd sprawdzania statusu');
    }
}

async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['autoScanEnabled', 'positionLimit']);
        elements.autoScanToggle.checked = result.autoScanEnabled || false;
        
        // Load position limit (default 10)
        const positionLimit = result.positionLimit || 10;
        elements.positionLimit.value = positionLimit;
        updateEstimatedTime(positionLimit);
    } catch (error) {
        console.error('Settings load error:', error);
    }
}

async function handlePositionLimitChange() {
    try {
        let value = parseInt(elements.positionLimit.value);
        
        // Walidacja - wymuszenie granic 1-50
        if (isNaN(value) || value < 1) {
            value = 1;
            elements.positionLimit.value = 1;
        } else if (value > 50) {
            value = 50;
            elements.positionLimit.value = 50;
        }
        
        // Zapisz w storage
        await chrome.storage.local.set({ positionLimit: value });
        
        // Zaktualizuj estymowany czas
        updateEstimatedTime(value);
        
        // Wyślij do content script i background
        await chrome.runtime.sendMessage({
            action: 'updateSettings',
            settings: { positionLimit: value }
        });
        
    } catch (error) {
        console.error('Position limit change error:', error);
    }
}

function updateEstimatedTime(positionLimit) {
    if (!elements.estimatedTime) return;
    
    // Oblicz estymowany czas bazując na pozycjach
    let baseTime = 60; // 60 sekund dla 10 pozycji
    let timePerPosition = 6; // 6 sekund na pozycję
    
    if (positionLimit <= 10) {
        // 1-10 pozycji: 60-90 sekund
        const minTime = Math.max(30, positionLimit * timePerPosition);
        const maxTime = minTime + 30;
        elements.estimatedTime.textContent = `${minTime}-${maxTime}s`;
    } else if (positionLimit <= 20) {
        // 11-20 pozycji: +50% czasu
        const minTime = positionLimit * timePerPosition * 1.5;
        const maxTime = minTime + 60;
        elements.estimatedTime.textContent = `${Math.round(minTime/60)}m${Math.round(minTime%60)}s-${Math.round(maxTime/60)}m${Math.round(maxTime%60)}s`;
    } else if (positionLimit <= 30) {
        // 21-30 pozycji: +100% czasu
        const minTime = positionLimit * timePerPosition * 2;
        const maxTime = minTime + 90;
        elements.estimatedTime.textContent = `${Math.round(minTime/60)}m-${Math.round(maxTime/60)}m`;
    } else {
        // 31-50 pozycji: +150% czasu
        const minTime = positionLimit * timePerPosition * 2.5;
        const maxTime = minTime + 120;
        elements.estimatedTime.textContent = `${Math.round(minTime/60)}m-${Math.round(maxTime/60)}m`;
    }
}

function setStatus(type, text) {
    // Set appropriate emoji based on status type
    switch(type) {
        case 'success':
        case 'online':
            elements.statusIndicator.textContent = '🟢';
            break;
        case 'warning':
        case 'info':
            elements.statusIndicator.textContent = '🟡';
            break;
        case 'error':
        case 'offline':
        default:
            elements.statusIndicator.textContent = '🔴';
            break;
    }
    elements.statusText.textContent = text;
}

function showLoginSection() {
    elements.loginSection.classList.remove('hidden');
    elements.mainSection.classList.add('hidden');
}

function showMainSection() {
    elements.loginSection.classList.add('hidden');
    elements.mainSection.classList.remove('hidden');
}

function showLoading(text) {
    elements.loadingText.textContent = text;
    elements.loading.classList.remove('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function showError(message) {
    if (elements.loginError) {
        elements.loginError.textContent = message;
        elements.loginError.classList.remove('hidden');
    }
}

function clearError() {
    if (elements.loginError) {
        elements.loginError.classList.add('hidden');
    }
}

function showResult(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = `result-item ${result.type}`;
    
    resultDiv.innerHTML = `
        <div class="result-title">${result.title}</div>
        <div class="result-details">${result.details}</div>
    `;
    
    elements.results.prepend(resultDiv);
    
    // Keep only last 5 results
    const results = elements.results.querySelectorAll('.result-item');
    if (results.length > 5) {
        results[results.length - 1].remove();
    }
}

function startQueueMonitoring() {
    // Monitor queue progress every 5 seconds
    const monitorInterval = setInterval(async () => {
        try {
            const status = await chrome.runtime.sendMessage({ action: 'getQueueStatus' });
            
            if (status.success) {
                currentQueueIndex = status.currentIndex;
                urlQueue = new Array(status.totalUrls); // Just for length
                isQueueRunning = status.isRunning;
                
                updateQueueStatus();
                
                // If queue is finished, stop monitoring
                if (!status.isRunning) {
                    clearInterval(monitorInterval);
                    updateQueueControls();
                }
            }
        } catch (error) {
            console.error('Queue monitoring error:', error);
            clearInterval(monitorInterval);
        }
    }, 5000);
    
    // Listen for queue progress messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'queueProgress') {
            showResult({
                type: message.result.success ? 'success' : 'error',
                title: `URL ${message.index + 1}/${message.total} ${message.result.success ? 'ukończony' : 'błąd'}`,
                details: message.result.success ? 
                    `${message.url} - znaleziono ${message.result.productsCount} produktów` :
                    `${message.url} - ${message.result.error}`
            });
        } else if (message.action === 'queueComplete') {
            showResult({
                type: 'success',
                title: 'Kolejka ukończona!',
                details: `Przetworzono wszystkie ${message.total} URL-i`
            });
            isQueueRunning = false;
            updateQueueControls();
        }
    });
}

async function handleLogout() {
    try {
        showLoading('Wylogowywanie...');
        
        // Clear authentication in background script
        const result = await chrome.runtime.sendMessage({ action: 'logout' });
        
        // Reset local state
        isLoggedIn = false;
        currentUser = null;
        urlQueue = [];
        currentQueueIndex = 0;
        isQueueRunning = false;
        
        // Show login section
        showLoginSection();
        
        // Clear any results
        if (elements.results) {
            elements.results.innerHTML = '';
        }
        
        console.log('Logout successful');
        
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if there's an error
        isLoggedIn = false;
        currentUser = null;
        showLoginSection();
    } finally {
        hideLoading();
    }
} 