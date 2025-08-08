// Main JavaScript for Suzu Drive-Thru Kafé - Enhanced Phone Number Login
class SuzuApp {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
    }

    init() {
        this.bindEvents();
        this.showWelcomeSection();
        this.initializeImageOptimization();
        this.setupPhoneInput();
    }

    initializeImageOptimization() {
        if (window.ImageOptimizer) {
            window.ImageOptimizer.optimizeAllImages();
        } else {
            setTimeout(() => this.initializeImageOptimization(), 500);
        }
    }

    setupPhoneInput() {
        const phoneInput = document.getElementById('phone-input');
        if (phoneInput) {
            phoneInput.addEventListener('focus', () => {
                phoneInput.classList.add('ring-4', 'ring-gray-200');
                phoneInput.classList.remove('border-red-500', 'border-green-500');
            });

            phoneInput.addEventListener('blur', () => {
                phoneInput.classList.remove('ring-4', 'ring-gray-200');
                this.validatePhoneInput(phoneInput);
            });
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
        
        if (value.length > 3 && value.length <= 7) {
            value = value.substring(0, 3) + ' ' + value.substring(3);
        } else if (value.length > 7) {
            value = value.substring(0, 3) + ' ' + value.substring(3, 7) + ' ' + value.substring(7);
        }
        
        input.value = value;
        
        this.validatePhoneInput(input);
    }

    validatePhoneInput(input) {
        const phone = input.value.replace(/\s/g, '');
        const isValid = this.isValidEgyptianPhone(phone);
        
        if (phone.length > 0) {
            if (isValid) {
                input.classList.remove('border-red-500', 'border-gray-300');
                input.classList.add('border-green-500');
                this.hideError('phone-error');
            } else {
                input.classList.remove('border-green-500', 'border-gray-300');
                input.classList.add('border-red-500');
                
                if (phone.length === 11) {
                    this.showError('phone-error', 'Please enter a valid Egyptian phone number (11 digits starting with 01)');
                }
            }
        } else {
            input.classList.remove('border-red-500', 'border-green-500');
            input.classList.add('border-gray-300');
            this.hideError('phone-error');
        }
    }

    isValidEgyptianPhone(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const phoneRegex = /^01[0-9]{9}$/;
        return phoneRegex.test(cleanPhone);
    }

    async handleRegistration() {
        const phoneInput = document.getElementById('phone-input');
        const phone = phoneInput.value.replace(/\s/g, '').trim();

        if (!this.isValidEgyptianPhone(phone)) {
            this.showError('phone-error', 'Please enter a valid Egyptian phone number (11 digits starting with 01)');
            phoneInput.focus();
            phoneInput.classList.add('border-red-500');
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
