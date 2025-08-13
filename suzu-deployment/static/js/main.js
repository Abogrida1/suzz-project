// Modern JavaScript for Suzu Customer Interface
class SuzuApp {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
        this.isProcessing = false;
    }

    init() {
        this.bindEvents();
        this.showWelcomeSection();
        this.setupPhoneInput();
        this.setupAnimations();
    }

    bindEvents() {
        const registerBtn = document.getElementById('register-btn');
        const phoneInput = document.getElementById('phone-input');

        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.handleRegistration());
        }

        if (phoneInput) {
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleRegistration();
            });
            phoneInput.addEventListener('input', (e) => this.formatPhoneInput(e));
        }
    }

    setupPhoneInput() {
        const phoneInput = document.getElementById('phone-input');
        if (!phoneInput) return;

        phoneInput.addEventListener('focus', () => {
            phoneInput.classList.add('ring-4', 'ring-yellow-200/20');
            this.hideError('phone-error');
        });

        phoneInput.addEventListener('blur', () => {
            phoneInput.classList.remove('ring-4', 'ring-yellow-200/20');
            this.validatePhoneInput(phoneInput);
        });
    }

    setupAnimations() {
        // Add intersection observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        });

        document.querySelectorAll('.glass-card').forEach(card => {
            observer.observe(card);
        });
    }

    formatPhoneInput(event) {
        // Allow only numbers and limit to 11 digits for Egyptian numbers
        const input = event.target;
        let value = input.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 11) {
            value = value.slice(0, 11); // Limit to 11 digits
        }
        input.value = value;
    }

    validatePhoneInput(input) {
        const phone = input.value.trim();
        const isValid = phone.length > 0;
        
        if (phone.length > 0) {
            input.classList.remove('border-red-500', 'border-gray-600');
            input.classList.add('border-green-500');
            this.hideError('phone-error');
        } else {
            input.classList.remove('border-green-500', 'border-gray-600');
            input.classList.add('border-red-500');
            this.showError('phone-error', 'يرجى إدخال رقم الهاتف');
        }
    }

    isValidEgyptianPhone(phone) {
        // Allow any phone number format - no validation
        return phone.trim().length > 0;
    }

    async handleRegistration() {
        if (this.isProcessing) return;
        
        const phoneInput = document.getElementById('phone-input');
        const phone = phoneInput.value.trim();

        if (phone.length === 0) {
            this.showError('phone-error', 'يرجى إدخال رقم الهاتف');
            phoneInput.classList.add('border-red-500', 'error-shake');
            setTimeout(() => phoneInput.classList.remove('error-shake'), 500);
            phoneInput.focus();
            return;
        }

        this.hideError('phone-error');
        this.showLoading();
        this.isProcessing = true;

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
                
                // Add success animation
                setTimeout(() => {
                    this.showDiscountSection();
                }, 500);
            } else {
                this.showErrorSection(data.error || 'فشل التسجيل');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showErrorSection('خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
        } finally {
            this.hideLoading();
            this.isProcessing = false;
        }
    }

    showWelcomeSection() {
        this.hideAllSections();
        const welcomeSection = document.getElementById('welcome-section');
        if (welcomeSection) {
            welcomeSection.classList.remove('hidden');
            welcomeSection.classList.add('fade-in');
        }
    }

    showDiscountSection() {
        this.hideAllSections();
        const discountSection = document.getElementById('discount-section');
        if (discountSection) {
            discountSection.classList.remove('hidden');
            discountSection.classList.add('fade-in');
            
            if (this.currentUser) {
                document.getElementById('discount-value').textContent = `${this.currentUser.discount}%`;
                document.getElementById('unique-code').textContent = this.currentUser.uniqueCode;
                this.generateQRCode();
            }
        }
    }

    showErrorSection(message) {
        this.hideAllSections();
        const errorSection = document.getElementById('error-section');
        if (errorSection) {
            errorSection.classList.remove('hidden');
            errorSection.classList.add('fade-in');
            document.getElementById('error-message').textContent = message;
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                this.showWelcomeSection();
            }, 5000);
        }
    }

    showLoading() {
        const loadingSection = document.getElementById('loading-section');
        if (loadingSection) {
            loadingSection.classList.remove('hidden');
            loadingSection.classList.add('fade-in');
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
                element.classList.remove('fade-in');
            }
        });
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            errorElement.classList.add('fade-in');
        }
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.add('hidden');
            errorElement.classList.remove('fade-in');
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
                margin: 2,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            }, (error, canvas) => {
                if (error) {
                    console.error('QR Code generation error:', error);
                    qrContainer.innerHTML = '<p class="text-red-400">خطأ في إنشاء الكود</p>';
                } else {
                    canvas.className = 'mx-auto rounded-lg shadow-lg';
                    qrContainer.appendChild(canvas);
                    
                    // Add download button
                    this.addDownloadButton(canvas);
                }
            });
        } else {
            qrContainer.innerHTML = '<p class="text-red-400">مكتبة الكود غير متوفرة</p>';
        }
    }

    addDownloadButton(canvas) {
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'تحميل الكود';
        downloadBtn.className = 'mt-4 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors duration-300';
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `suzu-discount-${this.currentUser.uniqueCode}.png`;
            link.href = canvas.toDataURL();
            link.click();
        };
        
        const qrContainer = document.getElementById('qr-code-container');
        if (qrContainer) {
            qrContainer.appendChild(downloadBtn);
        }
    }

    // Utility method to reset the app
    reset() {
        this.currentUser = null;
        const phoneInput = document.getElementById('phone-input');
        if (phoneInput) {
            phoneInput.value = '';
            phoneInput.classList.remove('border-green-500', 'border-red-500');
        }
        this.showWelcomeSection();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new SuzuApp();
    app.init();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            app.reset();
        }
    });
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(registrationError => console.log('SW registration failed'));
    });
}
