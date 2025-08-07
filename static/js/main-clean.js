// Main JavaScript for Suzu Drive-Thru Kafé - OTP Removed Version
class SuzuApp {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
    }

    init() {
        this.bindEvents();
        this.showWelcomeSection();
        this.initializeImageOptimization();
    }

    initializeImageOptimization() {
        if (window.ImageOptimizer) {
            window.ImageOptimizer.optimizeAllImages();
        } else {
            setTimeout(() => this.initializeImageOptimization(), 500);
        }
    }

    bindEvents() {
        document.getElementById('register-btn').addEventListener('click', () => this.handleRegistration());
        document.getElementById('phone-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegistration();
        });
        document.getElementById('phone-input').addEventListener('input', (e) => {
            this.formatPhoneInput(e.target);
        });
    }

    formatPhoneInput(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        input.value = value;

        if (this.isValidEgyptianPhone(value)) {
            this.hideError('phone-error');
        }
    }

    isValidEgyptianPhone(phone) {
        const phoneRegex = /^01[0-9]{9}$/;
        return phoneRegex.test(phone);
    }

    async handleRegistration() {
        const phoneInput = document.getElementById('phone-input');
        const phone = phoneInput.value.trim();

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
                    qrCode: data.qr_code,
                    isVerified: true
                };
                this.showDiscountSection();
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

    showWelcomeSection() {
        this.hideAllSections();
        document.getElementById('welcome-section').classList.remove('hidden');
    }

    showDiscountSection() {
        this.hideAllSections();
        document.getElementById('discount-section').classList.remove('hidden');

        if (this.currentUser) {
            document.getElementById('discount-value').textContent = `${this.currentUser.discount}%`;
            document.getElementById('unique-code').textContent = this.currentUser.uniqueCode;
            this.generateQRCode();
        }
    }

    showErrorSection(message) {
        this.hideAllSections();
        document.getElementById('error-section').classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
    }

    showLoading() {
        const loadingSection = document.getElementById('loading-section');
        if (loadingSection) {
            loadingSection.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingSection = document.getElementById('loading-section');
        if (loadingSection) {
            loadingSection.classList.add('hidden');
        }
    }

    hideAllSections() {
        const sections = ['welcome-section', 'discount-section', 'error-section', 'loading-section'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
            }
        });
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    generateQRCode() {
        const qrContainer = document.getElementById('qr-code-container');
        if (!qrContainer || !this.currentUser) return;

        qrContainer.innerHTML = '';

        const qrData = `${this.currentUser.uniqueCode}|${this.currentUser.phone}|${this.currentUser.discount}`;

        if (typeof QRCode !== 'undefined') {
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
        } else {
            qrContainer.innerHTML = '<p class="text-red-600">QR Code library not available</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new SuzuApp();
    app.init();
});
