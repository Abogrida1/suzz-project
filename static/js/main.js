// Modern JavaScript for SUZZ Customer Interface
class SuzzApp {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentUser = null;
        this.isProcessing = false;
        this.currentPhone = '';
        this.otpResendTimer = null;
        this.otpCountdown = 60;
    }

    init() {
        console.log('SUZZ App initialized');
        
        // Add event listeners
        this.addEventListeners();
        
        // Check for existing session token
        this.checkExistingSession();
    }
    
    addEventListeners() {
        // Phone input events
        const phoneInput = document.getElementById('phone-input');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.validatePhoneInput(e.target);
            });
            
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSendOTP();
                }
            });
        }
        
        // OTP input events
        const otpInput = document.getElementById('otp-input');
        if (otpInput) {
            otpInput.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length === 6) {
                    this.handleVerifyOTP();
                }
            });
            
            otpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleVerifyOTP();
                }
            });
        }
        
        // Button events
        const sendOtpBtn = document.getElementById('send-otp-btn');
        if (sendOtpBtn) {
            sendOtpBtn.addEventListener('click', () => this.handleSendOTP());
        }
        
        const verifyOtpBtn = document.getElementById('verify-otp-btn');
        if (verifyOtpBtn) {
            verifyOtpBtn.addEventListener('click', () => this.handleVerifyOTP());
        }
        
        const resendOtpBtn = document.getElementById('resend-otp-btn');
        if (resendOtpBtn) {
            resendOtpBtn.addEventListener('click', () => this.handleResendOTP());
        }
        
        const backToPhoneBtn = document.getElementById('back-to-phone-btn');
        if (backToPhoneBtn) {
            backToPhoneBtn.addEventListener('click', () => this.showWelcomeSection());
        }
    }
    
    checkExistingSession() {
        const sessionToken = localStorage.getItem('suzz_session_token');
        if (sessionToken) {
            // Try to validate existing session
            this.validateExistingSession(sessionToken);
        }
    }
    
    async validateExistingSession(sessionToken) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_token: sessionToken })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Session is valid, show user data
                this.showSuccessSection(data);
            } else {
                // Session expired, remove token
                localStorage.removeItem('suzz_session_token');
            }
        } catch (error) {
            console.error('Error validating session:', error);
            localStorage.removeItem('suzz_session_token');
        }
    }

    bindEvents() {
        const sendOtpBtn = document.getElementById('send-otp-btn');
        const verifyOtpBtn = document.getElementById('verify-otp-btn');
        const resendOtpBtn = document.getElementById('resend-otp-btn');
        const backToPhoneBtn = document.getElementById('back-to-phone-btn');
        const phoneInput = document.getElementById('phone-input');

        if (sendOtpBtn) {
            sendOtpBtn.addEventListener('click', () => this.handleSendOTP());
        }

        if (verifyOtpBtn) {
            verifyOtpBtn.addEventListener('click', () => this.handleVerifyOTP());
        }

        if (resendOtpBtn) {
            resendOtpBtn.addEventListener('click', () => this.handleResendOTP());
        }

        if (backToPhoneBtn) {
            backToPhoneBtn.addEventListener('click', () => this.showPhoneSection());
        }

        if (phoneInput) {
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSendOTP();
            });
            phoneInput.addEventListener('input', (e) => this.formatPhoneInput(e));
        }
    }

    setupOTPInput() {
        const otpInput = document.getElementById('otp-input');
        if (!otpInput) return;

        otpInput.addEventListener('input', (e) => {
            // Allow only numbers and limit to 6 digits
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
            
            // Auto-submit when 6 digits are entered
            if (e.target.value.length === 6) {
                this.handleVerifyOTP();
            }
        });

        otpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleVerifyOTP();
            }
        });
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
        const isValid = this.isValidEgyptianPhone(phone);
        
        if (isValid) {
            input.classList.remove('border-red-500', 'border-gray-600');
            input.classList.add('border-green-500');
            this.hideError('phone-error');
            return true; // Indicate success
        } else {
            input.classList.remove('border-green-500', 'border-gray-600');
            input.classList.add('border-red-500');
            this.showError('phone-error', 'يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 01)');
            return false; // Indicate failure
        }
    }

    isValidEgyptianPhone(phone) {
        // Validate Egyptian phone number format: 11 digits starting with 01
        const egyptianPhoneRegex = /^01[0-9]{9}$/;
        return egyptianPhoneRegex.test(phone.trim());
    }

    async handleSendOTP() {
        if (this.isProcessing) return;
        
        const phoneInput = document.getElementById('phone-input');
        const phoneNumber = phoneInput.value.trim();
        
        if (!this.validatePhoneInput(phoneInput)) {
            return;
        }
        
        this.currentPhone = phoneNumber;
        this.isProcessing = true;
        this.showLoading('send-otp-btn', 'جاري الإرسال...');
        
        // First check if user has active session
        this.checkSession(phoneNumber);
    }
    
    async checkSession(phoneNumber) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/check-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone_number: phoneNumber })
            });
            
            const data = await response.json();
            
            if (response.ok && !data.needs_otp) {
                // User has active session, show data directly
                this.showSuccessSection(data);
                this.hideLoading('send-otp-btn', 'إرسال رمز التحقق');
                this.isProcessing = false;
            } else {
                // User needs OTP, proceed with sending
                this.sendOTP(phoneNumber);
            }
        } catch (error) {
            console.error('Error checking session:', error);
            // If session check fails, proceed with OTP
            this.sendOTP(phoneNumber);
        }
    }
    
    async sendOTP(phoneNumber) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone_number: phoneNumber })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showOTPSection();
                this.startOTPResendTimer();
                this.showSuccess('تم إرسال رمز التحقق بنجاح!');
            } else {
                this.showError('phone-error', data.error || 'فشل في إرسال رمز التحقق');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            this.showError('phone-error', 'خطأ في الاتصال بالخادم. تحقق من صحة الكود.');
        } finally {
            this.hideLoading('send-otp-btn', 'إرسال رمز التحقق');
            this.isProcessing = false;
        }
    }

    async handleVerifyOTP() {
        if (this.isProcessing) return;
        
        const otpInput = document.getElementById('otp-input');
        const otpCode = otpInput.value.trim();
        
        if (otpCode.length !== 6) {
            this.showError('otp-error', 'يرجى إدخال رمز التحقق المكون من 6 أرقام');
            return;
        }
        
        this.isProcessing = true;
        this.showLoading('verify-otp-btn', 'جاري التحقق...');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: this.currentPhone,
                    otp_code: otpCode
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store session token for future use
                if (data.session_token) {
                    localStorage.setItem('suzz_session_token', data.session_token);
                }
                
                // Show success section with QR code
                this.showSuccessSection(data);
                this.showSuccess('تم التحقق بنجاح!');
            } else {
                this.showError('otp-error', data.error || 'فشل في التحقق من رمز التحقق');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            this.showError('otp-error', 'خطأ في الاتصال بالخادم. تحقق من صحة الكود.');
        } finally {
            this.hideLoading('verify-otp-btn', 'تحقق من الرمز');
            this.isProcessing = false;
        }
    }

    async handleResendOTP() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.showLoading('resend-otp-btn', 'جاري الإرسال...');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone_number: this.currentPhone })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('تم إعادة إرسال رمز التحقق بنجاح!');
                this.startOTPResendTimer();
                
                // Clear OTP input
                const otpInput = document.getElementById('otp-input');
                if (otpInput) {
                    otpInput.value = '';
                    otpInput.focus();
                }
            } else {
                this.showError('otp-error', data.error || 'فشل في إعادة إرسال رمز التحقق');
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            this.showError('otp-error', 'خطأ في الاتصال بالخادم. تحقق من صحة الكود.');
        } finally {
            this.hideLoading('resend-otp-btn', 'إعادة إرسال رمز التحقق');
            this.isProcessing = false;
        }
    }

    startOTPCountdown() {
        this.otpCountdown = 60;
        const resendBtn = document.getElementById('resend-otp-btn');
        
        if (this.otpResendTimer) {
            clearInterval(this.otpResendTimer);
        }

        this.otpResendTimer = setInterval(() => {
            if (this.otpCountdown > 0) {
                this.otpCountdown--;
                if (resendBtn) {
                    resendBtn.textContent = `🔄 إعادة إرسال (${this.otpCountdown}s)`;
                    resendBtn.disabled = true;
                }
            } else {
                if (resendBtn) {
                    resendBtn.textContent = '🔄 إعادة إرسال';
                    resendBtn.disabled = false;
                }
                clearInterval(this.otpResendTimer);
            }
        }, 1000);
    }

    startOTPResendTimer() {
        const resendBtn = document.getElementById('resend-otp-btn');
        if (!resendBtn) return;
        
        resendBtn.disabled = true;
        this.otpCountdown = 60;
        
        this.otpResendTimer = setInterval(() => {
            this.otpCountdown--;
            
            if (this.otpCountdown <= 0) {
                clearInterval(this.otpResendTimer);
                resendBtn.disabled = false;
                resendBtn.textContent = 'إعادة إرسال رمز التحقق';
            } else {
                resendBtn.textContent = `إعادة إرسال خلال ${this.otpCountdown} ثانية`;
            }
        }, 1000);
    }

    showPhoneSection() {
        this.showWelcomeSection();
    }

    showOTPSection() {
        this.hideAllSections();
        const otpSection = document.getElementById('otp-section');
        if (otpSection) {
            otpSection.classList.remove('hidden');
            otpSection.classList.add('fade-in');
            
            // Update current phone display
            const currentPhoneSpan = document.getElementById('current-phone');
            if (currentPhoneSpan) {
                currentPhoneSpan.textContent = this.currentPhone;
            }
            
            // Focus on OTP input
            const otpInput = document.getElementById('otp-input');
            if (otpInput) {
                otpInput.focus();
            }
        }
    }

    showSuccessMessage(message) {
        this.showSuccess(message);
    }

    showSuccessSection(data) {
        const successSection = document.getElementById('success-section');
        if (!successSection) return;
        
        successSection.innerHTML = `
            <div class="card-elegant max-w-4xl mx-auto p-8 md:p-10 text-center fade-in success-animation">
                <div class="mb-8">
                    <div class="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center animate-float">
                        <svg class="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">مبروك! 🎉</h2>
                    <p class="text-xl md:text-2xl text-gray-300 mb-4">تم التحقق من رقم هاتفك بنجاح</p>
                    <p class="text-lg text-gray-400">مرحباً بك في SUZZ</p>
                </div>
                
                <div class="bg-white/5 rounded-2xl p-6 md:p-8 mb-8 border border-white/10">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div class="text-center">
                            <div class="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                <span class="text-2xl md:text-3xl font-bold text-white">${data.discount}%</span>
                            </div>
                            <div class="text-lg md:text-xl text-gray-300">خصم على طلبك</div>
                        </div>
                        <div class="text-center">
                            <div class="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                <span class="text-base md:text-lg font-mono text-white">${data.unique_code}</span>
                            </div>
                            <div class="text-lg md:text-xl text-gray-300">كود الخصم</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white/5 rounded-2xl p-6 md:p-8 mb-8 border border-white/10">
                    <h3 class="text-2xl md:text-3xl font-semibold text-white mb-6">QR Code للخصم</h3>
                    <div class="flex justify-center mb-6">
                        <div class="relative">
                            <img src="data:image/png;base64,${data.qr_code}" 
                                 alt="QR Code" 
                                 class="w-48 h-48 md:w-56 md:h-56 border-4 border-green-400 rounded-2xl shadow-2xl">
                            <div class="absolute -inset-2 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl blur opacity-20"></div>
                        </div>
                    </div>
                    <button onclick="suzzApp.downloadQR('${data.qr_code}', 'suzz-discount')" 
                            class="btn-elegant text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105">
                        📥 تحميل QR Code
                    </button>
                </div>
                
                <div class="bg-gradient-to-r from-green-400/10 to-green-600/10 rounded-2xl p-6 mb-8 border border-green-400/20">
                    <div class="text-sm text-green-300 space-y-2">
                        <p>✨ هذا الكود صالح لمدة 24 ساعة</p>
                        <p>🔒 يمكنك استخدامه مرة واحدة فقط</p>
                        <p>💡 احفظ QR Code لاستخدامه في SUZZ</p>
                    </div>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onclick="suzzApp.showWelcomeSection()" 
                            class="btn-secondary py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105">
                        🔄 العودة للصفحة الرئيسية
                    </button>
                    <button onclick="suzzApp.showUserDashboard(data)" 
                            class="btn-elegant py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105">
                        🏠 الذهاب للداشبورد
                    </button>
                </div>
            </div>
        `;
        
        this.hideAllSections();
        successSection.classList.remove('hidden');
        successSection.classList.add('fade-in');
    }
    
    showUserDashboard(data) {
        const dashboardSection = document.getElementById('user-dashboard-section');
        if (!dashboardSection) return;
        
        // Check if code is already used
        const isCodeUsed = data.is_used || false;
        
        // Update dashboard data
        document.getElementById('dashboard-phone').textContent = this.currentPhone;
        document.getElementById('dashboard-discount').textContent = `${data.discount}%`;
        document.getElementById('dashboard-code').textContent = data.unique_code;
        
        // Update QR code
        const qrImg = document.getElementById('dashboard-qr');
        if (qrImg && data.qr_code) {
            qrImg.src = `data:image/png;base64,${data.qr_code}`;
        }
        
        // Show/hide QR code section based on whether code is used
        const qrSection = dashboardSection.querySelector('.bg-white\\/5');
        if (qrSection) {
            if (isCodeUsed) {
                qrSection.innerHTML = `
                    <div class="text-center">
                        <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl md:text-3xl font-semibold text-white mb-4">الكود مستخدم بالفعل</h3>
                        <p class="text-lg text-gray-300 mb-6">عذراً، هذا الكود تم استخدامه من قبل ولا يمكن استخدامه مرة أخرى</p>
                        <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p class="text-red-300 text-sm">💡 يمكنك التسجيل برقم هاتف آخر للحصول على خصم جديد</p>
                        </div>
                    </div>
                `;
            } else {
                qrSection.innerHTML = `
                    <h3 class="text-2xl md:text-3xl font-semibold text-white mb-6">QR Code للخصم</h3>
                    <div class="flex justify-center mb-6">
                        <div class="relative">
                            <img id="dashboard-qr" 
                                 alt="QR Code" 
                                 class="w-48 h-48 md:w-56 md:h-56 border-4 border-green-400 rounded-2xl shadow-2xl">
                            <div class="absolute -inset-2 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl blur opacity-20"></div>
                        </div>
                    </div>
                    <button onclick="suzzApp.downloadDashboardQR()" 
                            class="btn-elegant text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105">
                        📥 تحميل QR Code
                    </button>
                `;
            }
        }
        
        this.hideAllSections();
        dashboardSection.classList.remove('hidden');
        dashboardSection.classList.add('fade-in');
    }
    
    async logout() {
        try {
            const sessionToken = localStorage.getItem('suzz_session_token');
            if (sessionToken) {
                await fetch(`${this.apiBaseUrl}/api/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ session_token: sessionToken })
                });
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            // Clear local storage and show welcome section
            localStorage.removeItem('suzz_session_token');
            this.currentUser = null;
            this.currentPhone = '';
            this.showWelcomeSection();
        }
    }
    
    downloadDashboardQR() {
        const qrImg = document.getElementById('dashboard-qr');
        if (qrImg && qrImg.src) {
            const link = document.createElement('a');
            link.href = qrImg.src;
            link.download = 'suzz-dashboard-qr.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    hideAllSections() {
        const sections = ['welcome-section', 'otp-section', 'success-section', 'user-dashboard-section'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
                element.classList.remove('fade-in');
            }
        });
    }
    
    showWelcomeSection() {
        this.hideAllSections();
        const welcomeSection = document.getElementById('welcome-section');
        if (welcomeSection) {
            welcomeSection.classList.remove('hidden');
            welcomeSection.classList.add('fade-in');
            
            // Clear phone input
            const phoneInput = document.getElementById('phone-input');
            if (phoneInput) {
                phoneInput.value = '';
                phoneInput.focus();
            }
            
            // Clear OTP input
            const otpInput = document.getElementById('otp-input');
            if (otpInput) {
                otpInput.value = '';
            }
            
            // Clear errors
            this.hideError('phone-error');
            this.hideError('otp-error');
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

    showLoading(buttonId, loadingText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <div class="flex items-center justify-center space-x-3">
                    <div class="relative">
                        <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <div class="absolute inset-0 w-6 h-6 border-2 border-transparent border-t-green-400 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
                    </div>
                    <span class="font-semibold">${loadingText}</span>
                </div>
            `;
        }
    }
    
    hideLoading(buttonId, originalText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
    
    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 transform translate-x-full transition-all duration-500 backdrop-blur-sm border border-green-400/30';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <span class="font-semibold">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }
    
    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (errorElement && document.body.contains(errorElement)) {
                    errorElement.classList.add('hidden');
                }
            }, 5000);
        }
    }
    
    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    async generateQRCode() {
        const qrContainer = document.getElementById('qr-code-container');
        if (!qrContainer || !this.currentUser) return;

        qrContainer.innerHTML = '<p class="text-gray-500">جاري إنشاء الكود...</p>';

        const qrData = `${this.currentUser.uniqueCode}|${this.currentUser.phone}|${this.currentUser.discount}`;

        try {
            const canvas = await window.qrCompatibility.generateQRCode(qrData, 'qr-code-container');
            if (canvas) {
                this.addDownloadButton(canvas);
            }
        } catch (error) {
            console.error('QR Code generation error:', error);
            qrContainer.innerHTML = '<p class="text-red-400">خطأ في إنشاء الكود</p>';
        }
    }

    addDownloadButton(canvas) {
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'تحميل الكود';
        downloadBtn.className = 'mt-4 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors duration-300';
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `suzz-discount-${this.currentUser.uniqueCode}.png`;
            link.href = canvas.toDataURL();
            link.click();
        };
        
        const qrContainer = document.getElementById('qr-code-container');
        if (qrContainer) {
            qrContainer.appendChild(downloadBtn);
        }
    }

    downloadQR(qrCodeBase64, filename) {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${qrCodeBase64}`;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Utility method to reset the app
    reset() {
        this.currentUser = null;
        this.currentPhone = '';
        const phoneInput = document.getElementById('phone-input');
        const otpInput = document.getElementById('otp-input');
        
        if (phoneInput) {
            phoneInput.value = '';
            phoneInput.classList.remove('border-green-500', 'border-red-500');
        }
        
        if (otpInput) {
            otpInput.value = '';
        }
        
        if (this.otpResendTimer) {
            clearInterval(this.otpResendTimer);
        }
        
        this.showWelcomeSection();
    }
}

// Initialize the app
const suzzApp = new SuzzApp();
document.addEventListener('DOMContentLoaded', () => {
    suzzApp.init();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            suzzApp.reset();
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
