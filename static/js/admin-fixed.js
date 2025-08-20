// Admin Dashboard JavaScript for SUZZ
class AdminDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000';
        this.isLoggedIn = false;
        this.currentUsers = [];
        this.currentUserType = null;
        this.qrScanner = null;
    }

    init() {
        this.bindEvents();
        this.showLoginSection();
        this.checkExistingSession();
    }

    bindEvents() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const refreshBtn = document.getElementById('refresh-btn');
        const searchInput = document.getElementById('search-input');

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

        // QR Scanner buttons
        const startScannerBtn = document.getElementById('start-scanner-btn');
        const stopScannerBtn = document.getElementById('stop-scanner-btn');
        const redeemManualBtn = document.getElementById('redeem-manual-btn');

        if (startScannerBtn) {
            startScannerBtn.addEventListener('click', () => this.startQRScanner());
        }

        if (stopScannerBtn) {
            stopScannerBtn.addEventListener('click', () => this.stopQRScanner());
        }

        if (redeemManualBtn) {
            redeemManualBtn.addEventListener('click', () => this.redeemManualCode());
        }

        // Custom discount creation button
        const createCustomDiscountBtn = document.getElementById('create-custom-discount-btn');
        if (createCustomDiscountBtn) {
            createCustomDiscountBtn.addEventListener('click', () => this.createCustomDiscount());
        }

        // Change main image button
        const changeMainImageBtn = document.getElementById('change-main-image-btn');
        if (changeMainImageBtn) {
            changeMainImageBtn.addEventListener('click', () => this.changeMainImage());
        }

        // Open main page button
        const openMainPageBtn = document.getElementById('open-main-page-btn');
        if (openMainPageBtn) {
            openMainPageBtn.addEventListener('click', () => this.openMainPage());
        }

        // Data management buttons
        const printAllDataBtn = document.getElementById('print-all-data-btn');
        const clearAllDataBtn = document.getElementById('clear-all-data-btn');
        const resetDatabaseBtn = document.getElementById('reset-database-btn');

        if (printAllDataBtn) {
            printAllDataBtn.addEventListener('click', () => this.printAllData());
        }
        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        }
        if (resetDatabaseBtn) {
            resetDatabaseBtn.addEventListener('click', () => this.resetDatabase());
        }

        // Manual refresh stats button
        const refreshStatsBtn = document.getElementById('refresh-stats-btn');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', () => {
                console.log('Manual refresh stats button clicked');
                this.loadUsers();
            });
        }

        // Mobile menu functionality
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        const mobileRefreshBtn = document.getElementById('mobile-refresh-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.add('active');
                console.log('Mobile menu opened');
            });
        }

        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                console.log('Mobile menu closed');
            });
        }

        if (mobileRefreshBtn) {
            mobileRefreshBtn.addEventListener('click', () => {
                this.loadUsers();
                mobileMenu.classList.remove('active');
                console.log('Mobile refresh clicked');
            });
        }

        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                this.handleLogout();
                mobileMenu.classList.remove('active');
                console.log('Mobile logout clicked');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu && mobileMenu.classList.contains('active') && 
                !mobileMenu.contains(e.target) && 
                !mobileMenuToggle.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        });

        // Enter key for login
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
    }

    checkExistingSession() {
        const sessionToken = localStorage.getItem('admin_session_token');
        if (sessionToken) {
            this.validateAdminSession(sessionToken);
        }
    }

    async validateAdminSession(sessionToken) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/validate-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_token: sessionToken })
            });

            if (response.ok) {
                this.isLoggedIn = true;
                // Restore user type from localStorage
                this.currentUserType = localStorage.getItem('admin_user_type') || 'suzz';
                this.showDashboardSection();
            } else {
                localStorage.removeItem('admin_session_token');
                localStorage.removeItem('admin_user_type');
                this.showLoginSection();
            }
        } catch (error) {
            console.error('Session validation error:', error);
            localStorage.removeItem('admin_session_token');
            localStorage.removeItem('admin_user_type');
            this.showLoginSection();
        }
    }

    showLoginSection() {
        this.hideAllSections();
        const loginSection = document.getElementById('login-section');
        if (loginSection) {
            loginSection.classList.remove('hidden');
            loginSection.classList.add('fade-in-up');
        }
    }

    showDashboardSection() {
        this.hideAllSections();
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (dashboardSection) {
            dashboardSection.classList.remove('hidden');
            dashboardSection.classList.add('fade-in-up');
        }

        // Display current user
        this.displayCurrentUser();
        
        // Show/hide admin features based on user type
        this.toggleAdminFeatures();
        
        // Load users and stats immediately
        console.log('Dashboard shown, loading users...');
        this.loadUsers();
        
        // Also force a refresh after a short delay to ensure data is loaded
        setTimeout(() => {
            console.log('Force refreshing data...');
            this.loadUsers();
        }, 500);
    }

    hideAllSections() {
        const sections = ['login-section', 'dashboard-section'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
                element.classList.remove('fade-in-up');
            }
        });
    }

    async handleLogin() {
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        
        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!username) {
            this.showError('username-error', 'يرجى إدخال اسم المستخدم');
            return;
        }

        if (!password) {
            this.showError('password-error', 'يرجى إدخال كلمة المرور');
            return;
        }

        // Check credentials
        if ((username === 'suzz' && password === 'Suzz2212') || 
            (username === 'mado' && password === 'Mado2212')) {
            
            // Store user type
            this.currentUserType = username;
            localStorage.setItem('admin_user_type', username);
            
            // Success - generate session token
            const sessionToken = this.generateSessionToken();
            localStorage.setItem('admin_session_token', sessionToken);
            
                this.isLoggedIn = true;
            this.showDashboardSection();
            
            // Clear password field
            if (passwordInput) {
                passwordInput.value = '';
            }
            } else {
            this.showError('password-error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    }

    generateSessionToken() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `admin_${timestamp}_${random}`;
    }

    handleLogout() {
        this.isLoggedIn = false;
        this.currentUserType = null;
        localStorage.removeItem('admin_session_token');
        localStorage.removeItem('admin_user_type');
        this.showLoginSection();
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    clearErrors() {
        const errorElements = ['username-error', 'password-error'];
        errorElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.classList.add('hidden');
                element.textContent = '';
            }
        });
    }

    async loadUsers() {
        try {
            console.log('Loading users for user:', this.currentUserType);
            console.log('API URL:', `${this.apiBaseUrl}/api/admin/users`);
            
            const response = await fetch(`${this.apiBaseUrl}/api/admin/users`);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                this.currentUsers = data.users || [];
                this.currentStats = data.stats || {};
                console.log('Users loaded:', this.currentUsers.length);
                console.log('Stats received:', this.currentStats);
                console.log('First user:', this.currentUsers[0]);
                
                // Always update stats (but DOM only for mado)
                this.updateStats(this.currentStats);
                
                // Always render users table
                this.renderUsersTable();
                
                // Show success message
                this.showMessage('✅ تم تحميل المستخدمين والإحصائيات بنجاح', 'success');
            } else {
                console.error('Error loading users:', data.error);
                this.showMessage(`❌ فشل في تحميل المستخدمين: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            console.error('Error details:', error.message);
            this.showMessage('❌ خطأ في الاتصال بالخادم', 'error');
        }
    }

    updateStats(stats) {
        console.log('updateStats called for user:', this.currentUserType);
        console.log('Updating stats with:', stats);
        
        // Only update DOM elements for mado user, but always store the stats
        if (this.currentUserType === 'mado') {
            // Ensure we have valid numbers and handle different stat formats
        const totalUsers = parseInt(stats.total_users) || 0;
        const activeUsers = parseInt(stats.active_users) || 0;
            const totalDiscounts = parseInt(stats.total_discounts) || parseInt(stats.total_users) || 0;
            const usedCodes = parseInt(stats.used_codes) || 0;
            const adminDiscounts = parseInt(stats.admin_discounts) || 0;
            const pendingVerification = parseInt(stats.pending_verification) || 0;
            const todayRegistrations = parseInt(stats.today_registrations) || 0;
            const thisWeekRegistrations = parseInt(stats.this_week_registrations) || 0;
            
            console.log('Parsed stats:', {
                totalUsers,
                activeUsers, 
                totalDiscounts,
                usedCodes,
                adminDiscounts,
                pendingVerification,
                todayRegistrations,
                thisWeekRegistrations
            });
            
            // Update DOM elements
            this.updateElement('total-users', totalUsers);
            this.updateElement('active-users', activeUsers);
            this.updateElement('total-discounts', totalDiscounts);
            this.updateElement('used-codes', usedCodes);
            this.updateElement('admin-discounts', adminDiscounts);
            this.updateElement('pending-verification', pendingVerification);
            this.updateElement('today-registrations', todayRegistrations);
            this.updateElement('this-week-registrations', thisWeekRegistrations);
            
            console.log('Stats DOM elements updated for mado user');
            } else {
            console.log('Stats DOM update skipped for user:', this.currentUserType, '(not mado)');
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            console.log(`Updated ${elementId} to: ${value}`);
        }
    }

        renderUsersTable() {
        console.log('renderUsersTable called');
        console.log('Current users count:', this.currentUsers ? this.currentUsers.length : 'null');
        
        const tbody = document.getElementById('users-table-body');
        const mobileUsers = document.getElementById('mobile-users');
        const noUsers = document.getElementById('no-users');
        
        console.log('tbody found:', !!tbody);
        console.log('mobileUsers found:', !!mobileUsers);
        console.log('noUsers found:', !!noUsers);
        
        if (!tbody || !mobileUsers) {
            console.error('tbody or mobileUsers not found!');
            return;
        }
        
        // Clear existing rows and mobile cards
        tbody.innerHTML = '';
        mobileUsers.innerHTML = '';
        console.log('tbody and mobileUsers cleared');
        
        if (!this.currentUsers || this.currentUsers.length === 0) {
            console.log('No users to display');
            if (noUsers) noUsers.classList.remove('hidden');
            return;
        }
        
        if (noUsers) noUsers.classList.add('hidden');

        this.currentUsers.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white/5 transition-colors';
            
            const status = user.is_verified ? 
                '<span class="text-green-400 font-semibold">✓ تم التحقق</span>' : 
                '<span class="text-yellow-400 font-semibold">⏳ في الانتظار</span>';

            const createdAt = new Date(user.created_at).toLocaleDateString('ar-EG');
            const discount = user.discount_percentage || '15';
            const code = user.unique_code || 'N/A';

            // Simple discount badge
            let discountBadge;
            if (user.is_used) {
                discountBadge = `<span class="inline-block px-2 py-1 text-xs font-medium bg-gray-600 text-gray-300 rounded">مستخدم</span>`;
            } else if (user.is_admin_discount) {
                discountBadge = `<span class="inline-block px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">${discount}% إداري</span>`;
            } else {
                discountBadge = `<span class="inline-block px-2 py-1 text-xs font-medium bg-green-600 text-white rounded">${discount}%</span>`;
            }

            // QR Code column
            let qrCodeColumn = '<span class="text-gray-400">-</span>';
            if (user.is_admin_discount) {
                // Always show QR code for admin discounts
                qrCodeColumn = `
                    <div class="flex flex-col items-center space-y-2">
                        <div id="qr-${user.id}" class="w-16 h-16 border-2 border-green-400 rounded-lg bg-white"></div>
                        <button onclick="adminDashboard.downloadUserQR('${user.id}', '${user.unique_code}')" 
                                class="text-xs text-blue-400 hover:text-blue-300">
                            📥 تحميل
                        </button>
                    </div>
                `;
            } else if (user.qr_code_data) {
                // For regular users with QR data
                try {
                    const qrData = typeof user.qr_code_data === 'string' ? JSON.parse(user.qr_code_data) : user.qr_code_data;
                    qrCodeColumn = `
                        <div class="flex flex-col items-center space-y-2">
                            <div id="qr-${user.id}" class="w-16 h-16 border-2 border-green-400 rounded-lg bg-white"></div>
                            <button onclick="adminDashboard.downloadUserQR('${user.id}', '${user.unique_code}')" 
                                    class="text-xs text-blue-400 hover:text-blue-300">
                                📥 تحميل
                            </button>
                        </div>
                    `;
                } catch (e) {
                    console.error('Error parsing QR data:', e);
                    qrCodeColumn = '<span class="text-red-400">خطأ</span>';
                }
            }

            row.innerHTML = `
                <td class="px-6 py-4 text-sm text-white">${user.phone_number || 'خصم إداري'}</td>
                <td class="px-6 py-4 text-sm">${discountBadge}</td>
                <td class="px-6 py-4 text-sm text-gray-400 font-mono text-xs">${code}</td>
                <td class="px-6 py-4 text-sm text-gray-300">${createdAt}</td>
                <td class="px-6 py-4 text-sm">${status}</td>
                <td class="px-6 py-4 text-sm">${qrCodeColumn}</td>
                <td class="px-6 py-4 text-sm">
                    <button onclick="adminDashboard.viewUserDetails('${user.phone_number || user.unique_code}')" 
                            class="text-blue-400 hover:text-blue-300 transition-colors text-xs">
                        👁️ عرض
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // Generate QR code for admin discounts
            if (user.is_admin_discount) {
                setTimeout(() => {
                    this.generateUserQRCode(user);
                }, 100);
            } else if (user.qr_code_data) {
                // For regular users with existing QR data
                setTimeout(() => {
                    this.generateUserQRCode(user);
                }, 100);
            }
        });
    }

    viewUserDetails(identifier) {
        // Find user by phone number or unique code
        const user = this.currentUsers.find(u => 
            u.phone_number === identifier || u.unique_code === identifier
        );
        
        if (user) {
            const phone = user.phone_number || 'خصم إداري';
            const discount = user.discount_percentage || '15';
            const code = user.unique_code || 'N/A';
            const type = user.is_admin_discount ? 'خصم إداري' : 'خصم عادي';
            const status = user.is_verified ? 
                (user.is_used ? 'مستخدم' : 'نشط') : 'في الانتظار';
            const createdAt = new Date(user.created_at).toLocaleDateString('ar-EG');
            const description = user.admin_description || user.description || '-';
            
            alert(`تفاصيل المستخدم:
رقم الهاتف: ${phone}
نسبة الخصم: ${discount}%
كود الخصم: ${code}
النوع: ${type}
الحالة: ${status}
تاريخ الإنشاء: ${createdAt}
الوصف: ${description}`);
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.renderUsersTable();
            return;
        }

        const filteredUsers = this.currentUsers.filter(user => {
            const phone = user.phone_number || '';
            const code = user.unique_code || '';
            const description = user.admin_description || user.description || '';
            
            return phone.includes(query) || 
                   code.includes(query) || 
                   description.includes(query);
        });

        this.renderFilteredUsers(filteredUsers);
    }

    renderFilteredUsers(filteredUsers) {
        const tbody = document.getElementById('users-table-body');
        const noUsers = document.getElementById('no-users-message');
        
        if (!tbody) return;
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        if (filteredUsers.length === 0) {
            if (noUsers) noUsers.classList.remove('hidden');
            return;
        }
        
        if (noUsers) noUsers.classList.add('hidden');
        
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white/5 transition-colors';
            
            const status = user.is_verified ? 
                '<span class="text-green-400 font-semibold">✓ تم التحقق</span>' : 
                '<span class="text-yellow-400 font-semibold">⏳ في الانتظار</span>';

            const createdAt = new Date(user.created_at).toLocaleDateString('ar-EG');
            const discount = user.discount_percentage || '15';
            const code = user.unique_code || 'N/A';

            // Simple discount badge
            let discountBadge;
            if (user.is_used) {
                discountBadge = `<span class="inline-block px-2 py-1 text-xs font-medium bg-gray-600 text-gray-300 rounded">مستخدم</span>`;
            } else if (user.is_admin_discount) {
                discountBadge = `<span class="inline-block px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">${discount}% إداري</span>`;
            } else {
                discountBadge = `<span class="inline-block px-2 py-1 text-xs font-medium bg-green-600 text-white rounded">${discount}%</span>`;
            }

            // QR Code column
            let qrCodeColumn = '<span class="text-gray-400">-</span>';
            if (user.is_admin_discount) {
                // Always show QR code for admin discounts
                qrCodeColumn = `
                    <div class="flex flex-col items-center space-y-2">
                        <div id="qr-${user.id}" class="w-16 h-16 border-2 border-green-400 rounded-lg bg-white"></div>
                        <button onclick="adminDashboard.downloadUserQR('${user.id}', '${user.unique_code}')" 
                                class="text-xs text-blue-400 hover:text-blue-300">
                            📥 تحميل
                        </button>
                    </div>
                `;
            } else if (user.qr_code_data) {
                // For regular users with QR data
                try {
                    const qrData = typeof user.qr_code_data === 'string' ? JSON.parse(user.qr_code_data) : user.qr_code_data;
                    qrCodeColumn = `
                        <div class="flex flex-col items-center space-y-2">
                            <div id="qr-${user.id}" class="w-16 h-16 border-2 border-green-400 rounded-lg bg-white"></div>
                            <button onclick="adminDashboard.downloadUserQR('${user.id}', '${user.unique_code}')" 
                                    class="text-xs text-blue-400 hover:text-blue-300">
                                📥 تحميل
                            </button>
                        </div>
                    `;
                } catch (e) {
                    console.error('Error parsing QR data:', e);
                    qrCodeColumn = '<span class="text-red-400">خطأ</span>';
                }
            }

            row.innerHTML = `
                <td class="px-6 py-4 text-sm text-white">${user.phone_number || 'خصم إداري'}</td>
                <td class="px-6 py-4 text-sm">${discountBadge}</td>
                <td class="px-6 py-4 text-sm text-gray-400 font-mono text-xs">${code}</td>
                <td class="px-6 py-4 text-sm text-gray-300">${createdAt}</td>
                <td class="px-6 py-4 text-sm">${status}</td>
                <td class="px-6 py-4 text-sm">${qrCodeColumn}</td>
                <td class="px-6 py-4 text-sm">
                    <button onclick="adminDashboard.viewUserDetails('${user.phone_number || user.unique_code}')" 
                            class="text-blue-400 hover:text-blue-300 transition-colors text-xs">
                        👁️ عرض
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // Generate QR code for admin discounts
            if (user.is_admin_discount) {
                setTimeout(() => {
                    this.generateUserQRCode(user);
                    // Also generate for mobile
                    this.generateMobileQRCode(user);
                }, 100);
            } else if (user.qr_code_data) {
                // For regular users with existing QR data
                setTimeout(() => {
                    this.generateUserQRCode(user);
                }, 100);
            }
        });
    }

    showNoUsersMessage() {
        const tbody = document.getElementById('users-table-body');
        const noUsers = document.getElementById('no-users');
        
        if (tbody) {
            tbody.innerHTML = '';
        }
        
        if (noUsers) {
            noUsers.classList.remove('hidden');
        }
    }

    // QR Scanner functionality
    async startQRScanner() {
        try {
            const qrReader = document.getElementById('qr-reader');
        const startBtn = document.getElementById('start-scanner-btn');
        const stopBtn = document.getElementById('stop-scanner-btn');

            if (typeof Html5Qrcode !== 'undefined') {
                this.qrScanner = new Html5Qrcode("qr-reader");
                
                await this.qrScanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        console.log('QR Code detected:', decodedText);
                        this.handleQRCode(decodedText);
                        this.stopQRScanner();
                    },
                    (errorMessage) => {
                        // Ignore scanning errors silently
                    }
                );

                if (startBtn) startBtn.classList.add('hidden');
                if (stopBtn) stopBtn.classList.remove('hidden');
                
                this.showScanResult('📱 المسح الضوئي نشط...', 'info');
            } else {
                this.showScanResult('❌ مكتبة QR Scanner غير متوفرة', 'error');
            }
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            this.showScanResult('❌ خطأ في تشغيل الكاميرا. تأكد من السماح باستخدام الكاميرا.', 'error');
        }
    }

    stopQRScanner() {
        const startBtn = document.getElementById('start-scanner-btn');
        const stopBtn = document.getElementById('stop-scanner-btn');

        if (this.qrScanner) {
            this.qrScanner.stop().then(() => {
                if (startBtn) startBtn.classList.remove('hidden');
                if (stopBtn) stopBtn.classList.add('hidden');
                
                // Reset the QR reader container
                const qrReader = document.getElementById('qr-reader');
                if (qrReader) {
                    qrReader.innerHTML = `
                        <div class="text-center p-8">
                            <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m0 0V2m0 2h2m0 0v2M4 20h4m0 0v2m0-2h2m0 0v-2"></path>
                            </svg>
                            <p class="text-gray-400 mb-4">QR Scanner جاهز للمسح</p>
                            <div class="flex gap-2 justify-center">
                                <button id="start-scanner-btn" class="btn-primary px-4 py-2 rounded-lg text-sm">
                                    🎥 تشغيل الكاميرا
                                </button>
                                <button id="stop-scanner-btn" class="btn-secondary px-4 py-2 rounded-lg text-sm hidden">
                                    ⏹️ إيقاف الكاميرا
                                </button>
                            </div>
                        </div>
                    `;
                    
                    // Re-bind events for new buttons
                    const newStartBtn = document.getElementById('start-scanner-btn');
                    const newStopBtn = document.getElementById('stop-scanner-btn');
                    
                    if (newStartBtn) {
                        newStartBtn.addEventListener('click', () => this.startQRScanner());
                    }
                    if (newStopBtn) {
                        newStopBtn.addEventListener('click', () => this.stopQRScanner());
                    }
                }
                
                this.showScanResult('⏹️ تم إيقاف المسح الضوئي', 'info');
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
                let resultMessage = `✅ تم استخدام الكود بنجاح!<br><strong>الخصم:</strong> ${data.discount_percentage}%`;
                
                if (data.phone_number) {
                    resultMessage += `<br><strong>الهاتف:</strong> ${data.phone_number}`;
                }
                
                if (data.is_admin_discount) {
                    resultMessage += `<br><strong>النوع:</strong> خصم إداري خاص`;
                }
                
                this.showScanResult(resultMessage, 'success');
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
        
        // Set colors based on type
        if (type === 'success') {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-green-500 bg-green-900/20 text-green-100';
        } else if (type === 'error') {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-red-500 bg-red-900/20 text-red-100';
        } else {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-900/20 text-blue-100';
        }

        resultDiv.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (resultDiv) {
                resultDiv.classList.add('hidden');
            }
        }, 5000);
    }

    async createCustomDiscount() {
        // Only mado can create custom discounts
        if (this.currentUserType !== 'mado') {
            this.showCustomDiscountResult('❌ فقط المستخدم mado يمكنه إنشاء خصومات مفتوحة', 'error');
            return;
        }

        const discountInput = document.getElementById('custom-discount');
        const descriptionInput = document.getElementById('custom-description');
        
        const discount = discountInput ? discountInput.value.trim() : '';
        const description = descriptionInput ? descriptionInput.value.trim() : '';

        if (!discount || !description) {
            this.showCustomDiscountResult('❌ يرجى ملء جميع الحقول', 'error');
            return;
        }

        if (discount < 1 || discount > 100) {
            this.showCustomDiscountResult('❌ نسبة الخصم يجب أن تكون بين 1% و 100%', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/create-custom-discount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    discount_percentage: parseInt(discount),
                    description: description,
                    created_by: this.currentUserType
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Generate QR code for the custom discount
                const qrData = {
                    unique_code: data.unique_code,
                    discount_percentage: parseInt(discount),
                    type: 'admin_discount',
                    description: description,
                    created_by: this.currentUserType,
                    created_at: new Date().toISOString()
                };

                const qrContainer = document.getElementById('custom-discount-result');
                if (qrContainer) {
                    qrContainer.innerHTML = `
                        <div class="text-center">
                            <h4 class="text-lg font-bold text-white mb-4">✅ تم إنشاء الخصم بنجاح!</h4>
                            <div class="bg-white/5 rounded-xl p-4 mb-4">
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>نسبة الخصم:</strong> ${discount}%</div>
                                    <div><strong>الوصف:</strong> ${description}</div>
                                    <div><strong>الكود:</strong> <span class="font-mono">${data.unique_code}</span></div>
                                    <div><strong>النوع:</strong> خصم إداري</div>
                                </div>
                            </div>
                            <div class="flex justify-center mb-4">
                                <div id="custom-qr-code" class="border-4 border-green-400 rounded-xl p-2 bg-white"></div>
                            </div>
                            <button onclick="adminDashboard.downloadCustomQR()" 
                                    class="btn-primary px-6 py-2 rounded-xl text-sm">
                                📥 تحميل QR Code
                            </button>
                        </div>
                    `;
                    
                    // Generate QR code with error handling
                    this.generateCustomQRCode(qrData);
                    
                    qrContainer.classList.remove('hidden');
                    
                    // Refresh users list to show the new discount
                    setTimeout(() => {
                        this.loadUsers();
                    }, 1000);
                }
            } else {
                this.showCustomDiscountResult(`❌ ${data.error || 'فشل في إنشاء الخصم'}`, 'error');
            }
        } catch (error) {
            console.error('Error creating custom discount:', error);
            this.showCustomDiscountResult('❌ خطأ في الاتصال بالخادم', 'error');
        }
    }

    showCustomDiscountResult(message, type = 'info') {
        const resultDiv = document.getElementById('custom-discount-result');
        if (!resultDiv) return;

        resultDiv.innerHTML = `
            <div class="text-center p-4">
                <div class="text-lg font-semibold ${type === 'success' ? 'text-green-400' : 'text-red-400'}">
                    ${message}
                </div>
            </div>
        `;
        
        // Set colors based on type
        if (type === 'success') {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-green-500 bg-green-900/20 text-green-100';
        } else if (type === 'error') {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-red-500 bg-red-900/20 text-red-100';
        } else {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-900/20 text-blue-100';
        }

        resultDiv.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (resultDiv) {
            resultDiv.classList.add('hidden');
            }
        }, 5000);
    }

    downloadCustomQR() {
        const qrContainer = document.getElementById('custom-qr-code');
        if (!qrContainer) return;

        try {
            // Find canvas element
            const canvas = qrContainer.querySelector('canvas');
            if (canvas) {
            const link = document.createElement('a');
            link.download = `custom-discount-${Date.now()}.png`;
                link.href = canvas.toDataURL();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            } else {
                console.error('Canvas not found for custom QR code');
            }
        } catch (error) {
            console.error('Error downloading custom QR code:', error);
        }
    }

    async changeMainImage() {
        const imageUrlInput = document.getElementById('new-main-image-url');
        if (!imageUrlInput) return;

        const newImageUrl = imageUrlInput.value.trim();
        
        if (!newImageUrl) {
            this.showChangeImageResult('❌ يرجى إدخال رابط الصورة', 'error');
            return;
        }

        if (!newImageUrl.startsWith('http://') && !newImageUrl.startsWith('https://')) {
            this.showChangeImageResult('❌ يجب أن يبدأ الرابط بـ http:// أو https://', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/change-main-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    admin_user: this.currentUserType,
                    image_url: newImageUrl
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showChangeImageResult(`✅ ${data.message}`, 'success');
                
                // Update the current image preview
                const currentImageElement = document.getElementById('current-main-image');
                if (currentImageElement) {
                    currentImageElement.src = newImageUrl;
                }
                
                // Clear the input
                imageUrlInput.value = '';
                
                // Show success message
                this.showChangeImageResult(`✅ تم تغيير الصورة الرئيسية بنجاح إلى: ${newImageUrl}`, 'success');
                
                // Update the main page image (if possible)
                this.updateMainPageImage(newImageUrl);
                
            } else {
                this.showChangeImageResult(`❌ ${data.error || 'فشل في تغيير الصورة'}`, 'error');
            }
        } catch (error) {
            console.error('Error changing main image:', error);
            this.showChangeImageResult('❌ خطأ في الاتصال بالخادم', 'error');
        }
    }

    showChangeImageResult(message, type = 'info') {
        const resultDiv = document.getElementById('change-image-result');
        if (!resultDiv) return;

        resultDiv.innerHTML = `
            <div class="text-center p-4">
                <div class="text-lg font-semibold ${type === 'success' ? 'text-green-400' : 'text-red-400'}">
                    ${message}
                </div>
            </div>
        `;
        
        // Set colors based on type
        if (type === 'success') {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-green-500 bg-green-900/20 text-green-100';
        } else if (type === 'error') {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-red-500 bg-red-900/20 text-red-100';
        } else {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-900/20 text-blue-100';
        }

        resultDiv.classList.remove('hidden');

        // Auto-hide after 8 seconds for success messages (longer to read instructions)
        const hideTime = type === 'success' ? 8000 : 5000;
        setTimeout(() => {
            if (resultDiv) {
                resultDiv.classList.add('hidden');
            }
        }, hideTime);
    }

    updateMainPageImage(newImageUrl) {
        // Store the new image URL in localStorage for the main page
        try {
            localStorage.setItem('suzz_main_image_url', newImageUrl);
            console.log('Image URL stored in localStorage:', newImageUrl);
            
            // Show message to user about how to see the change
            this.showChangeImageResult(`
                ✅ تم تغيير الصورة الرئيسية بنجاح!<br><br>
                <span class="text-sm text-gray-300">
                    💡 لرؤية التغيير في الصفحة الرئيسية:<br>
                    1. اذهب للصفحة الرئيسية<br>
                    2. اضغط F5 لتحديث الصفحة<br>
                    أو<br>
                    3. أعد فتح الصفحة الرئيسية
                </span>
            `, 'success');
            
        } catch (error) {
            console.log('Could not store image URL in localStorage:', error);
            this.showChangeImageResult(`
                ✅ تم تغيير الصورة الرئيسية بنجاح!<br><br>
                <span class="text-sm text-gray-300">
                    💡 لرؤية التغيير: أعد فتح الصفحة الرئيسية
                </span>
            `, 'success');
        }
    }

    async printAllData() {
        try {
            // Create print window content
            const printContent = this.createPrintContent();
            
            // Open new window for printing
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>SUZZ Cafe - تقرير البيانات</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            margin: 20px;
                            direction: rtl;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 3px solid #333;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        .header h1 {
                            color: #333;
                            margin: 0;
                            font-size: 28px;
                        }
                        .header p {
                            color: #666;
                            margin: 5px 0;
                        }
                        .stats-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 15px;
                            margin-bottom: 30px;
                        }
                        .stat-card {
                            background: #f8f9fa;
                            border: 1px solid #dee2e6;
                            border-radius: 8px;
                            padding: 15px;
                            text-align: center;
                        }
                        .stat-number {
                            font-size: 24px;
                            font-weight: bold;
                            color: #007bff;
                        }
                        .stat-label {
                            color: #666;
                            margin-top: 5px;
                        }
                        .users-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        .users-table th,
                        .users-table td {
                            border: 1px solid #dee2e6;
                            padding: 12px;
                            text-align: right;
                        }
                        .users-table th {
                            background: #f8f9fa;
                            font-weight: bold;
                            color: #333;
                        }
                        .users-table tr:nth-child(even) {
                            background: #f8f9fa;
                        }
                        .admin-discount {
                            background: #e3f2fd;
                            color: #1976d2;
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                        }
                        .regular-discount {
                            background: #e8f5e8;
                            color: #388e3c;
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            color: #666;
                            border-top: 1px solid #dee2e6;
                            padding-top: 20px;
                        }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <div class="footer">
                        <p>تم إنشاء هذا التقرير في: ${new Date().toLocaleString('ar-EG')}</p>
                        <p>SUZZ Cafe - أول Drive-Thru في السويس</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
            
            this.showPrintResult('✅ تم فتح نافذة الطباعة', 'success');
            
        } catch (error) {
            console.error('Error printing data:', error);
            this.showPrintResult('❌ خطأ في الطباعة', 'error');
        }
    }

    createPrintContent() {
        // Get current stats and users
        const stats = this.currentStats || {};
        const users = this.currentUsers || [];
        
        // Use stats if available, otherwise calculate from users
        let totalUsers = stats.total_users || users.length || 0;
        let activeUsers = stats.active_users || users.filter(u => u.is_verified && !u.is_used).length || 0;
        let usedCodes = stats.used_codes || users.filter(u => u.is_used).length || 0;
        let adminDiscounts = stats.admin_discounts || users.filter(u => u.is_admin_discount).length || 0;
        
        let statsHtml = `
            <div class="header">
                <h1>SUZZ Cafe</h1>
                <p>تقرير شامل لجميع البيانات</p>
                <p>أول Drive-Thru في السويس</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${totalUsers}</div>
                    <div class="stat-label">إجمالي المستخدمين</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${activeUsers}</div>
                    <div class="stat-label">المستخدمين النشطين</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${usedCodes}</div>
                    <div class="stat-label">الخصومات المستخدمة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${adminDiscounts}</div>
                    <div class="stat-label">الخصومات الإدارية</div>
                </div>
            </div>
        `;
        
        let usersHtml = `
            <h2>قائمة المستخدمين والخصومات</h2>
            <table class="users-table">
                <thead>
                    <tr>
                        <th>رقم الهاتف</th>
                        <th>نسبة الخصم</th>
                        <th>الكود</th>
                        <th>النوع</th>
                        <th>الحالة</th>
                        <th>تاريخ الإنشاء</th>
                        <th>الوصف</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        users.forEach(user => {
            const phone = user.phone_number || 'خصم إداري';
            const discount = user.discount_percentage || '15';
            const code = user.unique_code || 'N/A';
            const type = user.is_admin_discount ? 
                '<span class="admin-discount">إداري</span>' : 
                '<span class="regular-discount">عادي</span>';
            const status = user.is_verified ? 
                (user.is_used ? 'مستخدم' : 'نشط') : 'في الانتظار';
            const createdAt = new Date(user.created_at).toLocaleDateString('ar-EG');
            const description = user.admin_description || user.description || '-';
            
            usersHtml += `
                <tr>
                    <td>${phone}</td>
                    <td>${discount}%</td>
                    <td>${code}</td>
                    <td>${type}</td>
                    <td>${status}</td>
                    <td>${createdAt}</td>
                    <td>${description}</td>
                </tr>
            `;
        });
        
        usersHtml += `
                </tbody>
            </table>
        `;
        
        return statsHtml + usersHtml;
    }

    async clearAllData() {
        if (!confirm('⚠️ هل أنت متأكد من حذف جميع البيانات؟\n\nهذه العملية لا يمكن التراجع عنها!')) {
            return;
        }
        
        if (!confirm('🔴 تأكيد نهائي: سيتم حذف جميع المستخدمين والخصومات والبيانات!\n\nاكتب "DELETE" للتأكيد:')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/clear-all-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    admin_user: this.currentUserType,
                    confirmation: 'DELETE'
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showPrintResult('✅ تم حذف جميع البيانات بنجاح', 'success');
                // Refresh the page after a delay
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                this.showPrintResult(`❌ فشل في حذف البيانات: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showPrintResult('❌ خطأ في الاتصال بالخادم', 'error');
        }
    }

    async resetDatabase() {
        if (!confirm('⚠️ هل أنت متأكد من إعادة تعيين قاعدة البيانات؟\n\nسيتم حذف جميع البيانات وإنشاء قاعدة بيانات جديدة!')) {
            return;
        }
        
        if (!confirm('🔴 تأكيد نهائي: سيتم إعادة تعيين قاعدة البيانات بالكامل!\n\nاكتب "RESET" للتأكيد:')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/reset-database`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    admin_user: this.currentUserType,
                    confirmation: 'RESET'
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showPrintResult('✅ تم إعادة تعيين قاعدة البيانات بنجاح', 'success');
                // Refresh the page after a delay
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                this.showPrintResult(`❌ فشل في إعادة تعيين قاعدة البيانات: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Error resetting database:', error);
            this.showPrintResult('❌ خطأ في الاتصال بالخادم', 'error');
        }
    }

    showPrintResult(message, type = 'info') {
        const resultDiv = document.getElementById('print-result');
        const contentDiv = document.getElementById('print-content');
        
        if (!resultDiv || !contentDiv) return;

        contentDiv.innerHTML = `
            <div class="text-center p-4">
                <div class="text-lg font-semibold ${type === 'success' ? 'text-green-400' : 'text-red-400'}">
                    ${message}
                </div>
            </div>
        `;
        
        // Set colors based on type
        if (type === 'success') {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-green-500 bg-green-900/20 text-green-100';
        } else if (type === 'error') {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-red-500 bg-red-900/20 text-red-100';
        } else {
            resultDiv.className = 'mt-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-900/20 text-blue-100';
        }

        resultDiv.classList.remove('hidden');

        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (resultDiv) {
                resultDiv.classList.add('hidden');
            }
        }, 8000);
    }

    openMainPage() {
        // Open main page in new tab
        const mainPageUrl = `${this.apiBaseUrl}/`;
        window.open(mainPageUrl, '_blank');
        
        // Show message to user
        this.showChangeImageResult(`
            🌐 تم فتح الصفحة الرئيسية في تبويب جديد!<br><br>
            <span class="text-sm text-gray-300">
                💡 إذا قمت بتغيير الصورة، ستظهر في الصفحة الرئيسية تلقائياً<br>
                أو اضغط F5 لتحديث الصفحة
            </span>
        `, 'info');
    }

    displayCurrentUser() {
        const currentUserElement = document.getElementById('current-admin-user');
        if (currentUserElement) {
            currentUserElement.textContent = this.currentUserType;
        }
    }

    toggleAdminFeatures() {
        console.log('Toggle admin features called for user:', this.currentUserType);
        
        const adminFeaturesSection = document.getElementById('admin-features-section');
        const changeMainImageSection = document.getElementById('change-main-image-section');
        const dataManagementSection = document.getElementById('data-management-section');
        
        // Stats sections - hide for suzz, show for mado
        const statsContainers = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4.gap-4.mb-8');
        const refreshStatsBtn = document.getElementById('refresh-stats-btn');
        
            if (this.currentUserType === 'mado') {
            // Show all features for mado
            if (adminFeaturesSection) adminFeaturesSection.classList.remove('hidden');
            if (changeMainImageSection) changeMainImageSection.classList.remove('hidden');
            if (dataManagementSection) dataManagementSection.classList.remove('hidden');
            
            // Show stats for mado
            statsContainers.forEach(container => {
                container.classList.remove('hidden');
                console.log('Showing stats container for mado');
            });
            
            if (refreshStatsBtn) {
                refreshStatsBtn.parentElement.classList.remove('hidden');
                console.log('Showing refresh stats button for mado');
            }
            } else {
            // Hide admin features for suzz
            if (adminFeaturesSection) adminFeaturesSection.classList.add('hidden');
            if (changeMainImageSection) changeMainImageSection.classList.add('hidden');
            if (dataManagementSection) dataManagementSection.classList.add('hidden');
            
            // Hide stats for suzz
            statsContainers.forEach(container => {
                container.classList.add('hidden');
                console.log('Hiding stats container for suzz');
            });
            
            if (refreshStatsBtn) {
                refreshStatsBtn.parentElement.classList.add('hidden');
                console.log('Hiding refresh stats button for suzz');
            }
        }
    }

    async generateUserQRCode(user) {
        const qrContainer = document.getElementById(`qr-${user.id}`);
        if (!qrContainer) return;

        try {
            // Create proper QR data for admin discounts
            let qrData;
            
            if (user.is_admin_discount) {
                // For admin discounts, create proper QR data
                qrData = {
                    unique_code: user.unique_code,
                    discount_percentage: user.discount_percentage,
                    type: 'admin_discount',
                    description: user.admin_description || 'خصم إداري',
                    created_by: 'mado',
                    created_at: user.created_at || new Date().toISOString()
                };
                
                // Clear container and create QR code structure
                qrContainer.innerHTML = `
                    <div class="flex flex-col items-center space-y-2">
                        <div id="qr-canvas-${user.id}" class="w-16 h-16 border-2 border-green-400 rounded-lg bg-white"></div>
                        <button class="download-qr-btn text-xs text-blue-400 hover:text-blue-300" 
                                data-user-id="${user.id}" data-code="${user.unique_code}">
                            📥 تحميل
                        </button>
                    </div>
                `;
                
                // Add event listener to the download button
                const downloadBtn = qrContainer.querySelector('.download-qr-btn');
                if (downloadBtn) {
                    downloadBtn.addEventListener('click', () => {
                        this.downloadUserQR(user.id, user.unique_code);
                    });
                }
                
                // Get the new canvas container
                const canvasContainer = document.getElementById(`qr-canvas-${user.id}`);
                if (canvasContainer && typeof QRCode !== 'undefined') {
                    QRCode.toCanvas(canvasContainer, JSON.stringify(qrData), {
                        width: 64,
                        margin: 1,
                        color: {
                            dark: '#059669',
                            light: '#ffffff'
                        }
                    }, (error, canvas) => {
                        if (error) {
                            console.error('Error generating admin discount QR code:', error);
                            canvasContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
                        } else {
                            console.log('Admin discount QR code generated successfully for user:', user.id);
                            canvas.style.maxWidth = '100%';
                            canvas.style.height = 'auto';
                        }
                    });
                }
                return; // Exit early for admin discounts
            } else if (user.qr_code_data) {
                // For regular users, use existing qr_code_data
                qrData = typeof user.qr_code_data === 'string' ? 
                    JSON.parse(user.qr_code_data) : user.qr_code_data;
            } else {
                // Fallback for users without QR data
                qrData = {
                    unique_code: user.unique_code,
                    discount_percentage: user.discount_percentage,
                    type: 'user_discount',
                    phone_number: user.phone_number,
                    created_at: user.created_at || new Date().toISOString()
                };
            }

            if (typeof QRCode !== 'undefined') {
                QRCode.toCanvas(qrContainer, JSON.stringify(qrData), {
                    width: 100, // Smaller QR code for user details
                    margin: 1,
                    color: {
                        dark: '#059669',
                        light: '#ffffff'
                    }
                }, (error, canvas) => {
                    if (error) {
                        console.error('Error generating user QR code:', error);
                        qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
                    }
                });
            } else {
                console.error('QR Code library not available for user QR generation.');
                qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
            }
        } catch (error) {
            console.error('Error generating user QR code:', error);
            qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
        }
    }

    async generateMobileQRCode(user) {
        const qrContainer = document.getElementById(`mobile-qr-${user.id}`);
        if (!qrContainer) return;

        try {
            // Create proper QR data for admin discounts
            let qrData;
            
            if (user.is_admin_discount) {
                qrData = {
                    unique_code: user.unique_code,
                    discount_percentage: user.discount_percentage,
                    type: 'admin_discount',
                    description: user.admin_description || 'خصم إداري',
                    created_by: 'mado',
                    created_at: user.created_at || new Date().toISOString()
                };
            } else {
                return; // Only generate for admin discounts on mobile
            }

            if (typeof QRCode !== 'undefined') {
                QRCode.toCanvas(qrContainer, JSON.stringify(qrData), {
                    width: 96, // Smaller for mobile
                    margin: 1,
                    color: {
                        dark: '#059669',
                        light: '#ffffff'
                    }
                }, (error, canvas) => {
                    if (error) {
                        console.error('Error generating mobile QR code:', error);
                        qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
                    } else {
                        console.log('Mobile QR code generated successfully for user:', user.id);
                        canvas.style.maxWidth = '100%';
                        canvas.style.height = 'auto';
                    }
                });
            } else {
                console.error('QR Code library not available for mobile QR generation.');
                qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
            }
        } catch (error) {
            console.error('Error generating mobile QR code:', error);
            qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
        }
    }

    async downloadUserQR(userId, code) {
        const user = this.currentUsers.find(u => u.id === userId);
        if (!user) {
            this.showScanResult('❌ المستخدم غير موجود', 'error');
            return;
        }

        try {
            // Create proper QR data for admin discounts
            let qrData;
            
            if (user.is_admin_discount) {
                // For admin discounts, create proper QR data
                qrData = {
                    unique_code: code,
                    discount_percentage: user.discount_percentage,
                    type: 'admin_discount',
                    description: user.admin_description || 'خصم إداري',
                    created_by: 'mado',
                    created_at: user.created_at || new Date().toISOString()
                };
            } else if (user.qr_code_data) {
                // For regular users, use existing qr_code_data
                qrData = typeof user.qr_code_data === 'string' ? 
                    JSON.parse(user.qr_code_data) : user.qr_code_data;
            } else {
                // Fallback for users without QR data
                qrData = {
                    unique_code: code,
                    discount_percentage: user.discount_percentage,
                    type: 'user_discount',
                    phone_number: user.phone_number,
                    created_at: user.created_at || new Date().toISOString()
                };
            }

            // For admin discounts, we need to find the canvas container
            let targetContainer;
            if (user.is_admin_discount) {
                targetContainer = document.getElementById(`qr-canvas-${user.id}`);
            } else {
                targetContainer = document.getElementById(`qr-${user.id}`);
            }
            
            if (targetContainer) {
                if (typeof QRCode !== 'undefined') {
                    QRCode.toCanvas(targetContainer, JSON.stringify(qrData), {
                        width: 100, // Smaller QR code for user details
                        margin: 1,
                        color: {
                            dark: '#059669',
                            light: '#ffffff'
                        }
                    }, (error, canvas) => {
                        if (error) {
                            console.error('Error generating user QR code for download:', error);
                            targetContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
                        } else {
                            const link = document.createElement('a');
                            link.download = `user-qr-${user.phone_number || user.unique_code}.png`;
                            link.href = canvas.toDataURL();
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    });
                } else {
                    console.error('QR Code library not available for user QR download.');
                    targetContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
                }
            } else {
                console.error('QR container not found for user:', user.id);
                this.showScanResult('❌ حاوية الكود غير موجودة', 'error');
            }
        } catch (error) {
            console.error('Error downloading user QR:', error);
            this.showScanResult('❌ خطأ في تحميل الكود', 'error');
        }
    }

    async generateCustomQRCode(qrData) {
        const qrContainer = document.getElementById('custom-qr-code');
        if (!qrContainer) return;

        try {
            if (typeof QRCode !== 'undefined') {
                QRCode.toCanvas(qrContainer, JSON.stringify(qrData), {
                    width: 200, // Larger QR code for custom discounts
                    margin: 2,
                    color: {
                        dark: '#059669',
                        light: '#ffffff'
                    }
                }, (error, canvas) => {
                    if (error) {
                        console.error('Error generating custom QR code:', error);
                        qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
                    }
                });
            } else {
                console.error('QR Code library not available for custom QR generation.');
                qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
            }
        } catch (error) {
            console.error('Error generating custom QR code:', error);
            qrContainer.innerHTML = '<span class="text-red-400 text-xs">خطأ</span>';
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) return;

        messageDiv.innerHTML = `
            <div class="text-center p-4">
                <div class="text-lg font-semibold ${type === 'success' ? 'text-green-400' : 'text-red-400'}">
                    ${message}
                </div>
            </div>
        `;
        
        // Set colors based on type
        if (type === 'success') {
            messageDiv.className = 'mt-4 p-4 rounded-xl border-2 border-green-500 bg-green-900/20 text-green-100';
        } else if (type === 'error') {
            messageDiv.className = 'mt-4 p-4 rounded-xl border-2 border-red-500 bg-red-900/20 text-red-100';
        } else {
            messageDiv.className = 'mt-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-900/20 text-blue-100';
        }

        messageDiv.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageDiv) {
                messageDiv.classList.add('hidden');
            }
        }, 5000);
    }
}

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
    adminDashboard.init();
});
