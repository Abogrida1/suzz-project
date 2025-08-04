// Admin JavaScript for Suzu Drive-Thru Kafé
class SuzuAdmin {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.isLoggedIn = false;
        this.html5QrCode = null;
        this.users = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.showLoginSection();
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
                <td class="p-4 border-b border-gray-200">
                    <span class="font-mono text-sm">${this.formatPhone(user.phone_number)}</span>
                </td>
                <td class="p-4 border-b border-gray-200">
                    <span class="font-bold text-lg text-orange-600">${user.discount_percentage}%</span>
                </td>
                <td class="p-4 border-b border-gray-200">
                    <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">${user.unique_code}</span>
                </td>
                <td class="p-4 border-b border-gray-200">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">${statusText}</span>
                </td>
                <td class="p-4 border-b border-gray-200">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${verifiedClass}">${verifiedText}</span>
                </td>
                <td class="p-4 border-b border-gray-200 text-sm text-gray-600">
                    ${this.formatDateTime(user.created_at)}
                </td>
                <td class="p-4 border-b border-gray-200 text-sm text-gray-600">
                    ${user.used_at ? this.formatDateTime(user.used_at) : '-'}
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    async startQRScanner() {
        try {
            this.html5QrCode = new Html5Qrcode("qr-reader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await this.html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    this.handleQRCodeScan(decodedText);
                },
                (errorMessage) => {
                    // Ignore scan errors (they're frequent and normal)
                }
            );

            document.getElementById('start-scanner-btn').classList.add('hidden');
            document.getElementById('stop-scanner-btn').classList.remove('hidden');

        } catch (err) {
            console.error('Error starting QR scanner:', err);
            this.showScanResult('error', 'Camera access denied or not available. Please check permissions.');
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
