// Admin Dashboard JavaScript for Suzu
class AdminDashboard {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.isLoggedIn = false;
        this.currentUsers = [];
        this.qrScanner = null;
    }

    init() {
        this.bindEvents();
        this.showLoginSection();
        this.setupQRScanner();
    }

    bindEvents() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const refreshBtn = document.getElementById('refresh-btn');
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search-btn');
        const startScannerBtn = document.getElementById('start-scanner-btn');
        const stopScannerBtn = document.getElementById('stop-scanner-btn');
        const redeemManualBtn = document.getElementById('redeem-manual-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUsers());
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }

        if (startScannerBtn) {
            startScannerBtn.addEventListener('click', () => this.startQRScanner());
        }

        if (stopScannerBtn) {
            stopScannerBtn.addEventListener('click', () => this.stopQRScanner());
        }

        if (redeemManualBtn) {
            redeemManualBtn.addEventListener('click', () => this.redeemManualCode());
        }

        // Enter key for login
        const passwordInput = document.getElementById('admin-password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
    }

    showLoginSection() {
        this.hideAllSections();
        const loginSection = document.getElementById('login-section');
        if (loginSection) {
            loginSection.classList.remove('hidden');
            loginSection.classList.add('fade-in');
        }
    }

    showDashboardSection() {
        this.hideAllSections();
        const dashboardSection = document.getElementById('dashboard-section');
        const logoutContainer = document.getElementById('logout-container');
        
        if (dashboardSection) {
            dashboardSection.classList.remove('hidden');
            dashboardSection.classList.add('fade-in');
        }
        
        if (logoutContainer) {
            logoutContainer.classList.remove('hidden');
        }

        this.loadUsers();
    }

    showLoadingSection() {
        this.hideAllSections();
        const loadingSection = document.getElementById('loading-section');
        if (loadingSection) {
            loadingSection.classList.remove('hidden');
            loadingSection.classList.add('fade-in');
        }
    }

    hideAllSections() {
        const sections = ['login-section', 'dashboard-section', 'loading-section'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
                element.classList.remove('fade-in');
            }
        });
    }

    async handleLogin() {
        const passwordInput = document.getElementById('admin-password');
        const password = passwordInput.value;

        if (!password) {
            this.showLoginError('يرجى إدخال كلمة المرور');
            return;
        }

        this.showLoadingSection();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                this.isLoggedIn = true;
                passwordInput.value = '';
                this.showDashboardSection();
            } else {
                this.showLoginError('كلمة المرور غير صحيحة');
                this.showLoginSection();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError('خطأ في الاتصال بالخادم');
            this.showLoginSection();
        }
    }

    handleLogout() {
        this.isLoggedIn = false;
        this.showLoginSection();
    }

    showLoginError(message) {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            setTimeout(() => {
                errorElement.classList.add('hidden');
            }, 5000);
        }
    }

    async loadUsers() {
        if (!this.isLoggedIn) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/users`);
            const data = await response.json();

            if (response.ok) {
                this.currentUsers = data.users || [];
                this.updateStats(data.stats || {});
                this.renderUsersTable(this.currentUsers);
            } else {
                console.error('Failed to load users:', data.error);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    updateStats(stats) {
        const elements = {
            'total-users': stats.total_users || 0,
            'active-codes': stats.active_codes || 0,
            'redeemed-codes': stats.redeemed_codes || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toLocaleString('en-US'); // Change to English numerals
            }
        });
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-4 text-center text-gray-400">
                        لا يوجد مستخدمين
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'table-row border-b border-gray-700';
            
            const status = user.is_used ? 
                '<span class="text-red-400">تم الاستخدام</span>' : 
                '<span class="text-green-400">نشط</span>';

            const createdAt = new Date(user.created_at).toLocaleDateString('en-US');
            const usedAt = user.used_at ? new Date(user.used_at).toLocaleDateString('en-US') : '-';

            row.innerHTML = `
                <td class="p-4 text-sm">${user.phone_number}</td>
                <td class="p-4 text-sm">${user.discount_percentage}%</td>
                <td class="p-4 text-sm hidden lg:table-cell font-mono">${user.unique_code}</td>
                <td class="p-4 text-sm">${status}</td>
                <td class="p-4 text-sm hidden xl:table-cell">${createdAt}</td>
                <td class="p-4 text-sm hidden xl:table-cell">${usedAt}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    handleSearch(query) {
        const clearSearchBtn = document.getElementById('clear-search-btn');
        const searchInfo = document.getElementById('search-info');
        const searchResultsText = document.getElementById('search-results-text');

        if (!query.trim()) {
            this.renderUsersTable(this.currentUsers);
            if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
            if (searchInfo) searchInfo.classList.add('hidden');
            return;
        }

        const filteredUsers = this.currentUsers.filter(user => 
            user.phone_number.includes(query)
        );

        this.renderUsersTable(filteredUsers);

        if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
        if (searchInfo) {
            searchInfo.classList.remove('hidden');
            searchResultsText.textContent = `تم العثور على ${filteredUsers.length} مستخدم`;
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
            this.handleSearch('');
        }
    }

    async setupQRScanner() {
        try {
            this.qrScanner = await window.qrCompatibility.setupScanner("qr-reader");
            
            // Check if we got a fallback input instead of scanner
            if (this.qrScanner && this.qrScanner.type === 'file') {
                this.setupFileInputFallback();
            }
        } catch (error) {
            console.error('QR Scanner setup error:', error);
            this.setupFileInputFallback();
        }
    }

    setupFileInputFallback() {
        const container = document.getElementById('qr-reader');
        if (!container) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'w-full p-4 border-2 border-gray-600 rounded-xl bg-gray-800 text-white';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });

        container.innerHTML = `
            <div class="text-center p-8">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p class="text-gray-400 mb-4">اختر صورة للكود أو استخدم الكاميرا</p>
                <label class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                    اختر ملف
                    <input type="file" class="hidden" accept="image/*">
                </label>
            </div>
        `;

        const fileInput = container.querySelector('input[type="file"]');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });
    }

    async handleFileUpload(file) {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                // Simple QR code extraction from image
                // In a real implementation, you'd use a proper QR decoder
                const text = prompt('أدخل الكود الموجود في الصورة:');
                if (text) {
                    this.handleQRCode(text);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('File upload error:', error);
            this.showScanResult('خطأ في معالجة الصورة', 'error');
        }
    }

    async startQRScanner() {
        if (!this.qrScanner) {
            this.showScanResult('الماسح الضوئي غير متاح', 'error');
            return;
        }

        const startBtn = document.getElementById('start-scanner-btn');
        const stopBtn = document.getElementById('stop-scanner-btn');

        try {
            if (typeof Html5Qrcode !== 'undefined') {
                await this.qrScanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        this.handleQRCode(decodedText);
                        this.stopQRScanner();
                    },
                    (errorMessage) => {
                        // Ignore scanning errors
                    }
                );

                if (startBtn) startBtn.classList.add('hidden');
                if (stopBtn) stopBtn.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            this.showScanResult('خطأ في تشغيل الكاميرا. تأكد من استخدام HTTPS.', 'error');
        }
    }

    stopQRScanner() {
        if (!this.qrScanner) return;

        const startBtn = document.getElementById('start-scanner-btn');
        const stopBtn = document.getElementById('stop-scanner-btn');

        if (typeof Html5Qrcode !== 'undefined') {
            this.qrScanner.stop().then(() => {
                if (startBtn) startBtn.classList.remove('hidden');
                if (stopBtn) stopBtn.classList.add('hidden');
            }).catch(error => {
                console.error('Error stopping QR scanner:', error);
            });
        }
    }

    async handleQRCode(code) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (response.ok) {
                this.showScanResult(`✅ تم استخدام الكود بنجاح<br>الخصم: ${data.discount_percentage}%<br>الهاتف: ${data.phone_number}`, 'success');
                this.loadUsers(); // Refresh the users list
            } else {
                this.showScanResult(`❌ ${data.error || 'فشل استخدام الكود'}`, 'error');
            }
        } catch (error) {
            console.error('Error redeeming code:', error);
            this.showScanResult('❌ خطأ في الاتصال بالخادم', 'error');
        }
    }

    async redeemManualCode() {
        const codeInput = document.getElementById('manual-code-input');
        const code = codeInput.value.trim();

        if (!code) {
            this.showScanResult('❌ يرجى إدخال الكود', 'error');
            return;
        }

        await this.handleQRCode(code);
        codeInput.value = '';
    }

    showScanResult(message, type = 'info') {
        const resultDiv = document.getElementById('scan-result');
        const resultContent = document.getElementById('scan-result-content');

        if (!resultDiv || !resultContent) return;

        resultContent.innerHTML = message;
        resultDiv.className = `mt-8 p-6 rounded-xl border-2 ${type === 'success' ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'} ${type === 'info' ? 'border-blue-700 bg-blue-900/20' : ''}`;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            resultDiv.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    const adminDashboard = new AdminDashboard();
    adminDashboard.init();
});
