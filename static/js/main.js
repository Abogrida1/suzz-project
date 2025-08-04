// Main JavaScript for Suzu Drive-Thru Kafé
class SuzuApp {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
        this.otpTimer = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showWelcomeSection();
    }

    bindEvents() {
        // Phone registration
        document.getElementById('register-btn').addEventListener('click', () => this.handleRegistration());
        document.getElementById('phone-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegistration();
        });

        // OTP verification
        document.getElementById('verify-otp-btn').addEventListener('click', () => this.handleOTPVerification());
        document.getElementById('otp-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleOTPVerification();
        });

        // Phone input formatting
        document.getElementById('phone-input').addEventListener('input', (e) => {
            this.formatPhoneInput(e.target);
        });

        // OTP input formatting
        document.getElementById('otp-input').addEventListener('input', (e) => {
            this.formatOTPInput(e.target);
        });
    }

    formatPhoneInput(input) {
        // Remove non-digits
        let value = input.value.replace(/\D/g, '');
        
        // Limit to 11 digits
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        input.value = value;
        
        // Clear error if valid format
        if (this.isValidEgyptianPhone(value)) {
            this.hideError('phone-error');
        }
    }

    formatOTPInput(input) {
        // Remove non-digits
        let value = input.value.replace(/\D/g, '');
        
        // Limit to 6 digits
        if (value.length > 6) {
            value = value.substring(0, 6);
        }
        
        input.value = value;
    }

    isValidEgyptianPhone(phone) {
        // Egyptian phone numbers: 11 digits starting with 01
        const phoneRegex = /^01[0-9]{9}$/;
        return phoneRegex.test(phone);
    }

    async handleRegistration() {
        const phoneInput = document.getElementById('phone-input');
        const phone = phoneInput.value.trim();

        // Validate phone number
        if (!this.isValidEgyptianPhone(phone)) {
            this.showError('phone-error', 'Please enter a valid Egyptian phone number (11 digits starting with 01)');
            phoneInput.focus();
            return;
        }

        this.hideError('phone-error');
        this.showLoading();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: phone
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = {
                    phone: phone,
                    discount: data.discount,
                    uniqueCode: data.unique_code,
                    qrCode: data.qr_code
                };

                if (data.is_verified) {
                    // User already verified, show discount directly
                    this.showDiscountSection();
                } else {
                    // Show OTP section
                    this.showOTPSection();
                    this.startOTPTimer();
                }
            } else {
                this.showErrorSection(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showErrorSection('Network error. Please check your connection and try again.');
        } finally {
            this.hideLoading();
        }
    }

    async handleOTPVerification() {
        const otpInput = document.getElementById('otp-input');
        const otp = otpInput.value.trim();

        if (otp.length !== 6) {
            this.showError('otp-error', 'Please enter a 6-digit OTP code');
            otpInput.focus();
            return;
        }

        this.hideError('otp-error');
        this.showLoading();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: this.currentUser.phone,
                    otp_code: otp
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = {
                    ...this.currentUser,
                    discount: data.discount,
                    uniqueCode: data.unique_code,
                    qrCode: data.qr_code,
                    isVerified: true
                };

                this.stopOTPTimer();
                this.showDiscountSection();
            } else {
                this.showError('otp-error', data.error || 'Invalid OTP code');
                otpInput.focus();
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showError('otp-error', 'Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    showWelcomeSection() {
        this.hideAllSections();
        document.getElementById('welcome-section').classList.remove('hidden');
    }

    showOTPSection() {
        this.hideAllSections();
        document.getElementById('otp-section').classList.remove('hidden');
        document.getElementById('otp-input').focus();
    }

    showDiscountSection() {
        this.hideAllSections();
        document.getElementById('discount-section').classList.remove('hidden');
        
        // Update discount display
        document.getElementById('discount-value').textContent = `${this.currentUser.discount}%`;
        document.getElementById('unique-code').textContent = this.currentUser.uniqueCode;
        
        // Generate QR code
        this.generateQRCode();
    }

    showErrorSection(message) {
        this.hideAllSections();
        document.getElementById('error-section').classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
    }

    showLoading() {
        document.getElementById('loading-section').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-section').classList.add('hidden');
    }

    hideAllSections() {
        const sections = ['welcome-section', 'otp-section', 'discount-section', 'error-section', 'loading-section'];
        sections.forEach(sectionId => {
            document.getElementById(sectionId).classList.add('hidden');
        });
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

    generateQRCode() {
        const qrContainer = document.getElementById('qr-code-container');
        qrContainer.innerHTML = '';

        // Create QR code data
        const qrData = `${this.currentUser.uniqueCode}|${this.currentUser.phone}|${this.currentUser.discount}`;

        // Generate QR code using QRCode.js
        QRCode.toCanvas(qrData, {
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        }, (error, canvas) => {
            if (error) {
                console.error('QR Code generation error:', error);
                qrContainer.innerHTML = '<p class="text-red-600">Error generating QR code</p>';
            } else {
                canvas.className = 'mx-auto rounded-lg shadow-lg';
                qrContainer.appendChild(canvas);
            }
        });
    }

    startOTPTimer() {
        let timeLeft = 300; // 5 minutes in seconds
        const countdownElement = document.getElementById('countdown');
        
        this.otpTimer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                this.stopOTPTimer();
                this.showErrorSection('OTP expired. Please try again.');
            }
            
            timeLeft--;
        }, 1000);
    }

    stopOTPTimer() {
        if (this.otpTimer) {
            clearInterval(this.otpTimer);
            this.otpTimer = null;
        }
    }

    // Utility method to format phone number for display
    formatPhoneForDisplay(phone) {
        if (phone.length === 11 && phone.startsWith('01')) {
            return `${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6)}`;
        }
        return phone;
    }

    // Utility method to get current timestamp
    getCurrentTimestamp() {
        return new Date().toISOString();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SuzuApp();
});

// Add some global utility functions
window.SuzuUtils = {
    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount);
    },

    // Format date for Arabic locale
    formatDate: (date) => {
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    // Copy text to clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    }
};

// Add service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/js/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
