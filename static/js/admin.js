// Enhanced Admin JavaScript for Suzu Drive-Thru Kafé with Mobile Optimization
class SuzuAdmin {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.isLoggedIn = false;
        this.html5QrCode = null;
        this.users = [];
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupMobileOptimizations();
        this.showLoginSection();
        this.initializeAdvancedFeatures();
    }

    /**
     * Setup mobile-specific optimizations
     */
    setupMobileOptimizations() {
        if (this.isMobile) {
            // Add mobile-specific classes
            document.body.classList.add('mobile-optimized');
            
            // Setup touch gestures
            this.setupTouchGestures();
            
            // Setup viewport handling
            this.setupViewportHandling();
            
            // Setup mobile-friendly interactions
            this.setupMobileInteractions();
        }
    }

    /**
     * Setup touch gestures for mobile
     */
    setupTouchGestures() {
        // Pull to refresh functionality
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleGesture();
        });

        // Prevent zoom on double tap for form inputs
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    /**
     * Handle touch gestures
     */
    handleGesture() {
        const swipeThreshold = 100;
        const diff = this.touchStartY - this.touchEndY;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe up - scroll to top
                this.handleSwipeUp();
            } else {
                // Swipe down - pull to refresh
                this.handleSwipeDown();
            }
        }
    }

    /**
     * Handle swipe up gesture
     */
    handleSwipeUp() {
        if (window.scrollY > 200) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Handle swipe down gesture
     */
    handleSwipeDown() {
        if (window.scrollY === 0 && this.isLoggedIn) {
            this.showRefreshIndicator();
            setTimeout(() => {
                this.loadUsers();
                this.hideRefreshIndicator();
            }, 1000);
        }
    }

    /**
     * Setup viewport handling for mobile
     */
    setupViewportHandling() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustLayoutForOrientation();
            }, 500);
        });

        // Handle keyboard show/hide on mobile
        if (this.isMobile) {
            const viewport = document.querySelector('meta[name=viewport]');
            
            document.addEventListener('focusin', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
                }
            });

            document.addEventListener('focusout', (e) => {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            });
        }
    }

    /**
     * Setup mobile-friendly interactions
     */
    setupMobileInteractions() {
        // Larger touch targets for mobile
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (this.isMobile) {
                button.style.minHeight = '44px';
                button.style.minWidth = '44px';
            }
        });

        // Enhanced search for mobile
        this.setupMobileSearch();
        
        // Mobile-friendly table interactions
        this.setupMobileTable();
    }

    /**
     * Initialize advanced features
     */
    initializeAdvancedFeatures() {
        // Initialize advanced camera system
        if (window.AdvancedCameraSystem) {
            this.advancedCamera = window.AdvancedCameraSystem;
            this.setupAdvancedCameraIntegration();
        }

        // Setup image optimization
        if (window.ImageOptimizer) {
            window.ImageOptimizer.optimizeAllImages();
        }

        // Make this instance globally available for camera integration
        window.adminApp = this;
    }

    /**
     * Setup advanced camera integration
     */
    setupAdvancedCameraIntegration() {
        // Listen for QR code scan events
        document.addEventListener('qrCodeScanned', (event) => {
            const { text } = event.detail;
            this.handleQRScan(text);
        });
    }

    /**
     * Handle QR code scan from advanced camera
     */
    handleQRScan(qrData) {
        // Auto-fill manual input
        const manualInput = document.getElementById('manual-code-input');
        if (manualInput) {
            manualInput.value = qrData;
        }

        // Auto-process if valid
        if (this.isValidQRCode(qrData)) {
            this.redeemCode(qrData);
        }
    }

    /**
     * Check if QR code is valid
     */
    isValidQRCode(text) {
        return text && text.includes('|') && text.split('|').length >= 2;
    }

    /**
     * Setup mobile search enhancements
     */
    setupMobileSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput && this.isMobile) {
            // Add mobile-specific search enhancements
            searchInput.setAttribute('autocomplete', 'off');
            searchInput.setAttribute('autocorrect', 'off');
            searchInput.setAttribute('autocapitalize', 'off');
            searchInput.setAttribute('spellcheck', 'false');
        }
    }

    /**
     * Setup mobile table interactions
     */
    setupMobileTable() {
        if (this.isMobile) {
            // Add horizontal scroll indicator for mobile tables
            const tableContainer = document.querySelector('.overflow-x-auto');
            if (tableContainer) {
                tableContainer.addEventListener('scroll', (e) => {
                    const scrollLeft = e.target.scrollLeft;
                    const scrollWidth = e.target.scrollWidth;
                    const clientWidth = e.target.clientWidth;
                    
                    // Add visual indicators for scrollable content
                    if (scrollLeft > 0) {
                        tableContainer.classList.add('scrolled-left');
                    } else {
                        tableContainer.classList.remove('scrolled-left');
                    }
                    
                    if (scrollLeft < scrollWidth - clientWidth - 10) {
                        tableContainer.classList.add('scrolled-right');
                    } else {
                        tableContainer.classList.remove('scrolled-right');
                    }
                });
            }
        }
    }

    /**
     * Adjust layout for orientation changes
     */
    adjustLayoutForOrientation() {
        if (this.isMobile) {
            // Force table reflow
            const table = document.querySelector('table');
            if (table) {
                table.style.display = 'none';
                table.offsetHeight; // Trigger reflow
                table.style.display = '';
            }
            
            // Adjust QR scanner if active
            if (this.html5QrCode) {
                this.stopQRScanner();
                setTimeout(() => {
                    this.startQRScanner();
                }, 1000);
            }
        }
    }

    /**
     * Show refresh indicator for pull-to-refresh
     */
    showRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'refresh-indicator';
        indicator.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg z-50';
        indicator.innerHTML = '🔄 Refreshing...';
        document.body.appendChild(indicator);
    }

    /**
     * Hide refresh indicator
     */
    hideRefreshIndicator() {
        const indicator = document.getElementById('refresh-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Show success message with auto-hide
     */
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        toast.innerHTML = `✅ ${message}`;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Show error message with auto-hide
     */
    showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        toast.innerHTML = `❌ ${message}`;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    bindEvents() {
        // Login
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // QR Scanner
        document.getElementById('start-scanner-btn').addEventListener('click', () => this.startQRScanner());
        document.getElementById('stop-scanner-btn').addEventListener('click', () => this.stopQRScanner());

        // Manual code redemption
        document.getElementById('redeem-manual-btn').addEventListener('click', () => this.handleManualRedemption());
        document.getElementById('manual-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleManualRedemption();
        });

        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('clear-search-btn').addEventListener('click', () => this.clearSearch());

        // Refresh data
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadUsers());
    }

    async handleLogin() {
        const passwordInput = document.getElementById('admin-password');
        const password = passwordInput.value.trim();

        if (!password) {
            this.showError('login-error', 'Please enter a password');
            passwordInput.focus();
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.isLoggedIn = true;
                this.hideError('login-error');
                this.showDashboard();
                await this.loadUsers();
            } else {
                this.showError('login-error', data.error || 'Invalid password');
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('login-error', 'Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    handleLogout() {
        this.isLoggedIn = false;
        this.stopQRScanner();
        this.showLoginSection();
        
        // Clear form data
        document.getElementById('admin-password').value = '';
        document.getElementById('manual-code-input').value = '';
        this.clearScanResult();
    }

    async loadUsers() {
        if (!this.isLoggedIn) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/users`);
            const data = await response.json();

            if (response.ok) {
                this.users = data.users;
                this.updateStats();
                this.updateUsersTable();
            } else {
                console.error('Failed to load users:', data.error);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    updateStats() {
        const totalUsers = this.users.length;
        const verifiedUsers = this.users.filter(u => u.is_verified).length;
        const activeCodes = this.users.filter(u => u.is_verified && !u.is_used).length;
        const redeemedCodes = this.users.filter(u => u.is_used).length;

        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('verified-users').textContent = verifiedUsers;
        document.getElementById('active-codes').textContent = activeCodes;
        document.getElementById('redeemed-codes').textContent = redeemedCodes;
    }

    updateUsersTable() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors duration-200';

            const statusClass = user.is_used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
            const statusText = user.is_used ? 'Used' : 'Active';
            
            const verifiedClass = user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            const verifiedText = user.is_verified ? 'Yes' : 'Pending';

            row.innerHTML = `
                <td class="p-2 sm:p-4 border-b border-gray-200">
                    <span class="font-mono text-xs sm:text-sm">${this.formatPhone(user.phone_number)}</span>
                </td>
                <td class="p-2 sm:p-4 border-b border-gray-200">
                    <span class="font-bold text-sm sm:text-lg text-orange-600">${user.discount_percentage}%</span>
                </td>
                <td class="p-2 sm:p-4 border-b border-gray-200 hidden sm:table-cell">
                    <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">${user.unique_code}</span>
                </td>
                <td class="p-2 sm:p-4 border-b border-gray-200">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">${statusText}</span>
                </td>
                <td class="p-2 sm:p-4 border-b border-gray-200 hidden md:table-cell">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${verifiedClass}">${verifiedText}</span>
                </td>
                <td class="p-2 sm:p-4 border-b border-gray-200 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                    ${this.formatDateTime(user.created_at)}
                </td>
                <td class="p-2 sm:p-4 border-b border-gray-200 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                    ${user.used_at ? this.formatDateTime(user.used_at) : '-'}
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    async startQRScanner() {
        try {
            // Clear any previous scan results
            this.clearScanResult();
            
            // Show scanning status
            this.showScanResult('info', `
                <div class="text-center">
                    <div class="text-4xl mb-4">📷</div>
                    <h4 class="text-xl font-bold text-blue-800 mb-2">Starting Camera...</h4>
                    <p class="text-blue-700">Please allow camera access when prompted</p>
                    <div class="mt-4">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            `);

            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this browser');
            }

            // Request camera permissions first
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "environment",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            stream.getTracks().forEach(track => track.stop()); // Stop the test stream
            
            this.html5QrCode = new Html5Qrcode("qr-reader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                rememberLastUsedCamera: true
            };

            await this.html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    console.log('QR Code scanned:', decodedText);
                    this.handleQRCodeScan(decodedText);
                },
                (errorMessage) => {
                    // Ignore frequent scan errors but log them for debugging
                    console.debug('QR scan error (normal):', errorMessage);
                }
            );

            // Update UI to show scanner is active
            document.getElementById('start-scanner-btn').classList.add('hidden');
            document.getElementById('stop-scanner-btn').classList.remove('hidden');
            
            // Show scanning status
            this.showScanResult('info', `
                <div class="text-center">
                    <div class="text-4xl mb-4">📱</div>
                    <h4 class="text-xl font-bold text-green-800 mb-2">Camera Active</h4>
                    <p class="text-green-700 mb-2">Point your camera at a QR code to scan</p>
                    <div class="bg-white p-3 rounded-lg shadow-inner">
                        <p class="text-sm text-gray-600">
                            📋 Make sure the QR code is well-lit and centered in the camera view
                        </p>
                    </div>
                </div>
            `);

        } catch (err) {
            console.error('Error starting QR scanner:', err);
            let errorMessage = 'Camera access denied or not available.';
            let troubleshooting = '';
            
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera permission denied. Please allow camera access and try again.';
                troubleshooting = `
                    <div class="mt-4 text-left">
                        <p class="font-semibold mb-2">To fix this:</p>
                        <ul class="text-sm space-y-1">
                            <li>• Click the camera icon in your browser's address bar</li>
                            <li>• Select "Allow" for camera access</li>
                            <li>• Refresh the page and try again</li>
                        </ul>
                    </div>
                `;
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera found on this device.';
                troubleshooting = '<p class="text-sm mt-2">Please use a device with a camera or try manual code entry.</p>';
            } else if (err.name === 'NotSupportedError') {
                errorMessage = 'Camera not supported on this browser.';
                troubleshooting = '<p class="text-sm mt-2">Try using Chrome, Firefox, or Safari for better camera support.</p>';
            } else if (err.message && err.message.includes('not supported')) {
                errorMessage = 'QR scanning not supported on this browser.';
                troubleshooting = '<p class="text-sm mt-2">Please use manual code entry or try a different browser.</p>';
            }
            
            this.showScanResult('error', `
                <div class="text-center">
                    <div class="text-4xl mb-4">📷</div>
                    <h4 class="text-xl font-bold text-red-800 mb-2">Camera Error</h4>
                    <p class="text-red-700 mb-4">${errorMessage}</p>
                    ${troubleshooting}
                    <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                        <p class="text-sm text-gray-700">
                            💡 You can still redeem codes manually using the text input above
                        </p>
                    </div>
                </div>
            `);
        }
    }

    async stopQRScanner() {
        if (this.html5QrCode) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode = null;
            } catch (err) {
                console.error('Error stopping QR scanner:', err);
            }
        }

        document.getElementById('start-scanner-btn').classList.remove('hidden');
        document.getElementById('stop-scanner-btn').classList.add('hidden');
    }

    async handleQRCodeScan(qrData) {
        // Stop scanner after successful scan
        await this.stopQRScanner();
        
        // Process the scanned code
        await this.redeemCode(qrData);
    }

    async handleManualRedemption() {
        const codeInput = document.getElementById('manual-code-input');
        const code = codeInput.value.trim();

        if (!code) {
            this.showScanResult('error', 'Please enter a code');
            codeInput.focus();
            return;
        }

        await this.redeemCode(code);
    }

    async redeemCode(code) {
        this.showLoading();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showScanResult('success', `
                    <div class="text-center">
                        <div class="text-4xl mb-4">✅</div>
                        <h4 class="text-xl font-bold text-green-800 mb-4">Code Redeemed Successfully!</h4>
                        <div class="bg-white p-4 rounded-lg shadow-inner">
                            <p class="mb-2"><strong>Phone:</strong> ${this.formatPhone(data.phone_number)}</p>
                            <p class="mb-2"><strong>Discount:</strong> <span class="text-2xl font-bold text-orange-600">${data.discount_percentage}%</span></p>
                            <p class="mb-2"><strong>Code:</strong> <span class="font-mono text-sm">${data.unique_code}</span></p>
                            <p class="text-sm text-gray-600"><strong>Redeemed:</strong> ${this.formatDateTime(data.redeemed_at)}</p>
                        </div>
                    </div>
                `);
                
                // Clear manual input
                document.getElementById('manual-code-input').value = '';
                
                // Refresh users data
                await this.loadUsers();
                
            } else {
                let errorMessage = data.error || 'Redemption failed';
                let errorIcon = '❌';
                
                if (data.error && data.error.includes('already used')) {
                    errorIcon = '⚠️';
                    if (data.used_at) {
                        errorMessage += `<br><small>Used on: ${this.formatDateTime(data.used_at)}</small>`;
                    }
                } else if (data.error && data.error.includes('not verified')) {
                    errorIcon = '📱';
                    errorMessage = 'Phone number not verified. User must complete OTP verification first.';
                }
                
                this.showScanResult('error', `
                    <div class="text-center">
                        <div class="text-4xl mb-4">${errorIcon}</div>
                        <h4 class="text-xl font-bold text-red-800 mb-2">Redemption Failed</h4>
                        <p class="text-red-700">${errorMessage}</p>
                    </div>
                `);
            }
        } catch (error) {
            console.error('Redemption error:', error);
            this.showScanResult('error', `
                <div class="text-center">
                    <div class="text-4xl mb-4">🔌</div>
                    <h4 class="text-xl font-bold text-red-800 mb-2">Network Error</h4>
                    <p class="text-red-700">Please check your connection and try again.</p>
                </div>
            `);
        } finally {
            this.hideLoading();
        }
    }

    showScanResult(type, content) {
        const resultDiv = document.getElementById('scan-result');
        const contentDiv = document.getElementById('scan-result-content');
        
        resultDiv.classList.remove('hidden');
        
        if (type === 'success') {
            resultDiv.className = 'mt-8 p-6 rounded-xl border-2 border-green-200 bg-green-50';
        } else if (type === 'error') {
            resultDiv.className = 'mt-8 p-6 rounded-xl border-2 border-red-200 bg-red-50';
        } else {
            resultDiv.className = 'mt-8 p-6 rounded-xl border-2 border-gray-200 bg-gray-50';
        }
        
        contentDiv.innerHTML = content;
    }

    clearScanResult() {
        document.getElementById('scan-result').classList.add('hidden');
        document.getElementById('scan-result-content').innerHTML = '';
    }

    showLoginSection() {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
        document.getElementById('logout-container').classList.add('hidden');
        document.getElementById('admin-password').focus();
    }

    showDashboard() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        document.getElementById('logout-container').classList.remove('hidden');
    }

    showLoading() {
        document.getElementById('loading-section').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-section').classList.add('hidden');
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        errorElement.classList.add('hidden');
    }

    formatPhone(phone) {
        if (phone && phone.length === 11 && phone.startsWith('01')) {
            return `${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6)}`;
        }
        return phone;
    }

    formatDateTime(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    // Export users data as CSV
    exportUsersCSV() {
        if (this.users.length === 0) {
            alert('No users data to export');
            return;
        }

        const headers = ['Phone Number', 'Discount %', 'Unique Code', 'Status', 'Verified', 'Created At', 'Used At'];
        const csvContent = [
            headers.join(','),
            ...this.users.map(user => [
                user.phone_number,
                user.discount_percentage,
                user.unique_code,
                user.is_used ? 'Used' : 'Active',
                user.is_verified ? 'Yes' : 'No',
                user.created_at,
                user.used_at || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `suzu_users_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Search functionality
    async handleSearch(query) {
        const searchInput = document.getElementById('search-input');
        const clearBtn = document.getElementById('clear-search-btn');
        const searchInfo = document.getElementById('search-info');
        const searchResultsText = document.getElementById('search-results-text');

        if (!query.trim()) {
            // If search is empty, show all users
            this.updateUsersTable();
            clearBtn.classList.add('hidden');
            searchInfo.classList.add('hidden');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (response.ok) {
                // Update users list with search results
                this.users = data.users;
                this.updateUsersTable();
                
                // Show search info
                searchResultsText.textContent = `Found ${data.total_found} user(s) matching "${data.search_query}"`;
                searchInfo.classList.remove('hidden');
                clearBtn.classList.remove('hidden');
            } else {
                console.error('Search failed:', data.error);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('search-input');
        const clearBtn = document.getElementById('clear-search-btn');
        const searchInfo = document.getElementById('search-info');

        searchInput.value = '';
        clearBtn.classList.add('hidden');
        searchInfo.classList.add('hidden');
        
        // Reload all users
        this.loadUsers();
    }

    // Get statistics summary
    getStatsSummary() {
        const totalUsers = this.users.length;
        const verifiedUsers = this.users.filter(u => u.is_verified).length;
        const activeCodes = this.users.filter(u => u.is_verified && !u.is_used).length;
        const redeemedCodes = this.users.filter(u => u.is_used).length;
        
        const totalDiscountValue = this.users
            .filter(u => u.is_used)
            .reduce((sum, u) => sum + u.discount_percentage, 0);

        return {
            totalUsers,
            verifiedUsers,
            activeCodes,
            redeemedCodes,
            totalDiscountValue,
            verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0,
            redemptionRate: verifiedUsers > 0 ? (redeemedCodes / verifiedUsers * 100).toFixed(1) : 0
        };
    }
}

// Initialize the admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.suzuAdmin = new SuzuAdmin();
});

// Add keyboard shortcuts for admin
document.addEventListener('keydown', (e) => {
    // Ctrl+R or F5 to refresh data
    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        if (window.suzuAdmin && window.suzuAdmin.isLoggedIn) {
            e.preventDefault();
            window.suzuAdmin.loadUsers();
        }
    }
    
    // Escape to stop QR scanner
    if (e.key === 'Escape' && window.suzuAdmin && window.suzuAdmin.html5QrCode) {
        window.suzuAdmin.stopQRScanner();
    }
});
