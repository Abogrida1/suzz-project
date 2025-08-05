/**
 * Advanced Camera System with Multi-Device Compatibility
 * Ensures camera works on ANY device with multiple fallback strategies
 */
class AdvancedCameraSystem {
    constructor() {
        this.currentStream = null;
        this.scannerInstances = [];
        this.isScanning = false;
        this.scanResults = [];
        this.deviceCapabilities = {};
        this.init();
    }

    async init() {
        await this.detectDeviceCapabilities();
        this.setupEventListeners();
    }

    /**
     * Detect device capabilities and constraints
     */
    async detectDeviceCapabilities() {
        try {
            // Check for basic media support
            this.deviceCapabilities.hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            this.deviceCapabilities.hasWebRTC = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
            
            // Check for camera access
            if (this.deviceCapabilities.hasMediaDevices) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    this.deviceCapabilities.cameras = devices.filter(device => device.kind === 'videoinput');
                    this.deviceCapabilities.hasCameras = this.deviceCapabilities.cameras.length > 0;
                } catch (error) {
                    console.warn('Could not enumerate devices:', error);
                    this.deviceCapabilities.hasCameras = false;
                }
            }

            // Detect device type
            this.deviceCapabilities.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            this.deviceCapabilities.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            this.deviceCapabilities.isAndroid = /Android/.test(navigator.userAgent);
            
            // Check for specific browser capabilities
            this.deviceCapabilities.browser = this.detectBrowser();
            
            console.log('Device capabilities detected:', this.deviceCapabilities);
        } catch (error) {
            console.error('Error detecting device capabilities:', error);
        }
    }

    /**
     * Detect browser type for specific optimizations
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome')) return 'chrome';
        if (userAgent.includes('Firefox')) return 'firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
        if (userAgent.includes('Edge')) return 'edge';
        if (userAgent.includes('Opera')) return 'opera';
        
        return 'unknown';
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle visibility change to manage camera resources
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isScanning) {
                this.pauseScanning();
            } else if (!document.hidden && this.currentStream) {
                this.resumeScanning();
            }
        });

        // Handle orientation change on mobile
        if (this.deviceCapabilities.isMobile) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (this.isScanning) {
                        this.restartScanning();
                    }
                }, 500);
            });
        }
    }

    /**
     * Start camera with multiple fallback strategies
     */
    async startCamera(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }

        // Clear any existing content
        container.innerHTML = '';
        
        // Show loading state
        this.showLoadingState(container);

        try {
            // Strategy 1: Try optimal camera settings
            await this.tryOptimalCamera(container, options);
            return;
        } catch (error) {
            console.warn('Optimal camera failed:', error);
        }

        try {
            // Strategy 2: Try basic camera settings
            await this.tryBasicCamera(container, options);
            return;
        } catch (error) {
            console.warn('Basic camera failed:', error);
        }

        try {
            // Strategy 3: Try legacy camera API
            await this.tryLegacyCamera(container, options);
            return;
        } catch (error) {
            console.warn('Legacy camera failed:', error);
        }

        // Strategy 4: Show manual input fallback
        this.showManualInputFallback(container);
    }

    /**
     * Try optimal camera settings based on device
     */
    async tryOptimalCamera(container, options) {
        const constraints = this.getOptimalConstraints();
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.currentStream = stream;
        
        const video = this.createVideoElement();
        video.srcObject = stream;
        
        container.innerHTML = '';
        container.appendChild(video);
        
        await this.waitForVideoReady(video);
        await this.initializeQRScanners(container, video);
        
        this.showSuccessState(container);
        this.isScanning = true;
    }

    /**
     * Try basic camera settings
     */
    async tryBasicCamera(container, options) {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.currentStream = stream;
        
        const video = this.createVideoElement();
        video.srcObject = stream;
        
        container.innerHTML = '';
        container.appendChild(video);
        
        await this.waitForVideoReady(video);
        await this.initializeQRScanners(container, video);
        
        this.showSuccessState(container);
        this.isScanning = true;
    }

    /**
     * Try legacy camera API
     */
    async tryLegacyCamera(container, options) {
        // For older browsers
        const getUserMedia = navigator.getUserMedia || 
                           navigator.webkitGetUserMedia || 
                           navigator.mozGetUserMedia || 
                           navigator.msGetUserMedia;

        if (!getUserMedia) {
            throw new Error('No camera API available');
        }

        return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, 
                { video: true, audio: false },
                (stream) => {
                    this.currentStream = stream;
                    
                    const video = this.createVideoElement();
                    video.srcObject = stream;
                    
                    container.innerHTML = '';
                    container.appendChild(video);
                    
                    video.onloadedmetadata = async () => {
                        await this.initializeQRScanners(container, video);
                        this.showSuccessState(container);
                        this.isScanning = true;
                        resolve();
                    };
                },
                reject
            );
        });
    }

    /**
     * Get optimal camera constraints based on device
     */
    getOptimalConstraints() {
        const baseConstraints = {
            video: {
                facingMode: 'environment'
            },
            audio: false
        };

        if (this.deviceCapabilities.isMobile) {
            // Mobile optimizations
            baseConstraints.video.width = { ideal: 1280, max: 1920 };
            baseConstraints.video.height = { ideal: 720, max: 1080 };
            baseConstraints.video.frameRate = { ideal: 30, max: 60 };
        } else {
            // Desktop optimizations
            baseConstraints.video.width = { ideal: 1920, max: 3840 };
            baseConstraints.video.height = { ideal: 1080, max: 2160 };
            baseConstraints.video.frameRate = { ideal: 60 };
        }

        // iOS specific optimizations
        if (this.deviceCapabilities.isIOS) {
            baseConstraints.video.facingMode = { exact: 'environment' };
        }

        // Android specific optimizations
        if (this.deviceCapabilities.isAndroid) {
            baseConstraints.video.focusMode = 'continuous';
            baseConstraints.video.exposureMode = 'continuous';
        }

        return baseConstraints;
    }

    /**
     * Create optimized video element
     */
    createVideoElement() {
        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.muted = true;
        video.autoplay = true;
        video.style.width = '100%';
        video.style.height = 'auto';
        video.style.maxHeight = '400px';
        video.style.borderRadius = '12px';
        video.style.backgroundColor = '#000';
        
        return video;
    }

    /**
     * Wait for video to be ready
     */
    waitForVideoReady(video) {
        return new Promise((resolve) => {
            if (video.readyState >= 2) {
                resolve();
            } else {
                video.addEventListener('loadeddata', resolve, { once: true });
            }
        });
    }

    /**
     * Initialize multiple QR scanners for better compatibility
     */
    async initializeQRScanners(container, video) {
        // Clear existing scanners
        this.scannerInstances.forEach(scanner => {
            try {
                if (scanner.stop) scanner.stop();
                if (scanner.clear) scanner.clear();
            } catch (e) {}
        });
        this.scannerInstances = [];

        // Scanner 1: Html5-qrcode (primary)
        try {
            await this.initHtml5QrScanner(container, video);
        } catch (error) {
            console.warn('Html5-qrcode scanner failed:', error);
        }

        // Scanner 2: ZXing (fallback)
        try {
            await this.initZXingScanner(container, video);
        } catch (error) {
            console.warn('ZXing scanner failed:', error);
        }

        // Scanner 3: Custom canvas scanner (ultimate fallback)
        try {
            await this.initCanvasScanner(container, video);
        } catch (error) {
            console.warn('Canvas scanner failed:', error);
        }
    }

    /**
     * Initialize Html5-qrcode scanner
     */
    async initHtml5QrScanner(container, video) {
        if (typeof Html5Qrcode === 'undefined') {
            throw new Error('Html5Qrcode not available');
        }

        const scannerId = 'qr-scanner-' + Date.now();
        const scannerDiv = document.createElement('div');
        scannerDiv.id = scannerId;
        scannerDiv.style.display = 'none';
        container.appendChild(scannerDiv);

        const scanner = new Html5Qrcode(scannerId);
        
        const config = {
            fps: this.deviceCapabilities.isMobile ? 10 : 20,
            qrbox: this.deviceCapabilities.isMobile ? 
                { width: 250, height: 250 } : 
                { width: 300, height: 300 },
            aspectRatio: 1.0,
            disableFlip: false,
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        };

        await scanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText, decodedResult) => {
                this.handleScanResult(decodedText, decodedResult, 'html5-qrcode');
            },
            (error) => {
                // Ignore frequent scan errors
                if (!error.includes('No QR code found')) {
                    console.warn('Html5Qrcode scan error:', error);
                }
            }
        );

        this.scannerInstances.push(scanner);
    }

    /**
     * Initialize ZXing scanner (if available)
     */
    async initZXingScanner(container, video) {
        if (typeof ZXing === 'undefined') {
            // Try to load ZXing dynamically
            await this.loadZXingLibrary();
        }

        if (typeof ZXing === 'undefined') {
            throw new Error('ZXing not available');
        }

        const codeReader = new ZXing.BrowserQRCodeReader();
        
        const scanner = {
            stop: () => codeReader.reset(),
            clear: () => codeReader.reset()
        };

        codeReader.decodeFromVideoDevice(null, video, (result, error) => {
            if (result) {
                this.handleScanResult(result.text, result, 'zxing');
            }
        });

        this.scannerInstances.push(scanner);
    }

    /**
     * Initialize custom canvas scanner
     */
    async initCanvasScanner(container, video) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.style.display = 'none';
        container.appendChild(canvas);

        const scanner = {
            stop: () => clearInterval(this.canvasInterval),
            clear: () => clearInterval(this.canvasInterval)
        };

        this.canvasInterval = setInterval(() => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    // Here you would implement QR detection algorithm
                    // For now, we'll use a simple approach
                    this.analyzeImageData(imageData);
                } catch (error) {
                    console.warn('Canvas analysis error:', error);
                }
            }
        }, 500);

        this.scannerInstances.push(scanner);
    }

    /**
     * Load ZXing library dynamically
     */
    loadZXingLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@zxing/library@latest/umd/index.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Analyze image data for QR codes (basic implementation)
     */
    analyzeImageData(imageData) {
        // This is a placeholder for a more sophisticated QR detection algorithm
        // In a real implementation, you would analyze the image data for QR patterns
        console.log('Analyzing image data for QR codes...');
    }

    /**
     * Handle scan results from any scanner
     */
    handleScanResult(text, result, scannerType) {
        console.log(`QR Code detected by ${scannerType}:`, text);
        
        // Prevent duplicate results
        const now = Date.now();
        const isDuplicate = this.scanResults.some(r => 
            r.text === text && (now - r.timestamp) < 2000
        );
        
        if (isDuplicate) {
            return;
        }

        this.scanResults.push({
            text,
            result,
            scannerType,
            timestamp: now
        });

        // Trigger custom event
        const event = new CustomEvent('qrCodeScanned', {
            detail: { text, result, scannerType }
        });
        document.dispatchEvent(event);

        // Auto-process if it looks like a valid code
        if (this.isValidQRCode(text)) {
            this.processQRCode(text);
        }
    }

    /**
     * Check if QR code is valid
     */
    isValidQRCode(text) {
        // Check for expected format: code|phone|discount
        return text.includes('|') && text.split('|').length >= 2;
    }

    /**
     * Process valid QR code
     */
    processQRCode(text) {
        if (window.adminApp && typeof window.adminApp.handleQRScan === 'function') {
            window.adminApp.handleQRScan(text);
        } else {
            console.log('QR Code processed:', text);
        }
    }

    /**
     * Show loading state
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="camera-loading text-center p-6">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
                <h4 class="text-xl font-bold text-blue-800 mb-2">Starting Camera...</h4>
                <p class="text-blue-700">Please allow camera access when prompted</p>
                <div class="mt-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p class="text-sm text-blue-600">
                            📋 Make sure to allow camera permissions for the best experience
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show success state
     */
    showSuccessState(container) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'camera-status mt-4 p-4 bg-green-50 border border-green-200 rounded-lg';
        statusDiv.innerHTML = `
            <h4 class="text-lg font-bold text-green-800 mb-2">📷 Camera Active</h4>
            <p class="text-green-700 mb-2">Point your camera at a QR code to scan</p>
            <div class="bg-white p-3 rounded-lg shadow-inner">
                <p class="text-sm text-gray-600">
                    💡 Tips: Ensure good lighting and hold the QR code steady
                </p>
            </div>
        `;
        container.appendChild(statusDiv);
    }

    /**
     * Show manual input fallback
     */
    showManualInputFallback(container) {
        const errorMessage = this.getErrorMessage();
        
        container.innerHTML = `
            <div class="camera-error text-center p-6">
                <div class="text-6xl mb-4">📷</div>
                <h4 class="text-xl font-bold text-red-800 mb-4">Camera Not Available</h4>
                <p class="text-red-700 mb-4">${errorMessage}</p>
                
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h5 class="font-bold text-yellow-800 mb-2">Manual Code Entry</h5>
                    <p class="text-sm text-yellow-700 mb-3">Enter the unique code manually:</p>
                    <input type="text" 
                           id="manual-camera-input" 
                           placeholder="Enter code here" 
                           class="w-full p-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500" />
                    <button id="manual-camera-submit" 
                            class="w-full mt-3 py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                        Process Code
                    </button>
                </div>
                
                <div class="text-left">
                    <h6 class="font-bold text-gray-800 mb-2">Troubleshooting:</h6>
                    <ul class="text-sm text-gray-600 space-y-1">
                        <li>• Refresh the page and try again</li>
                        <li>• Check camera permissions in browser settings</li>
                        <li>• Try using a different browser (Chrome recommended)</li>
                        <li>• Ensure you're using HTTPS connection</li>
                    </ul>
                </div>
            </div>
        `;

        // Setup manual input handler
        const submitBtn = container.querySelector('#manual-camera-submit');
        const input = container.querySelector('#manual-camera-input');
        
        const handleSubmit = () => {
            const code = input.value.trim();
            if (code) {
                this.processQRCode(code);
            }
        };

        submitBtn.addEventListener('click', handleSubmit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSubmit();
        });
    }

    /**
     * Get appropriate error message based on device capabilities
     */
    getErrorMessage() {
        if (!this.deviceCapabilities.hasMediaDevices) {
            return 'Your browser does not support camera access. Please use a modern browser.';
        }
        
        if (!this.deviceCapabilities.hasCameras) {
            return 'No camera found on this device. Please use a device with a camera.';
        }
        
        if (this.deviceCapabilities.isIOS) {
            return 'Camera access denied. Please check Safari settings and allow camera access.';
        }
        
        return 'Camera access was denied or failed to start. Please check permissions and try again.';
    }

    /**
     * Stop camera and cleanup
     */
    stopCamera() {
        this.isScanning = false;
        
        // Stop all scanner instances
        this.scannerInstances.forEach(scanner => {
            try {
                if (scanner.stop) scanner.stop();
                if (scanner.clear) scanner.clear();
            } catch (e) {
                console.warn('Error stopping scanner:', e);
            }
        });
        this.scannerInstances = [];

        // Stop camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
            });
            this.currentStream = null;
        }

        // Clear intervals
        if (this.canvasInterval) {
            clearInterval(this.canvasInterval);
            this.canvasInterval = null;
        }
    }

    /**
     * Pause scanning (keep camera active)
     */
    pauseScanning() {
        this.isScanning = false;
        this.scannerInstances.forEach(scanner => {
            try {
                if (scanner.pause) scanner.pause();
            } catch (e) {}
        });
    }

    /**
     * Resume scanning
     */
    resumeScanning() {
        this.isScanning = true;
        this.scannerInstances.forEach(scanner => {
            try {
                if (scanner.resume) scanner.resume();
            } catch (e) {}
        });
    }

    /**
     * Restart scanning (full restart)
     */
    async restartScanning() {
        const container = document.querySelector('#qr-reader').parentElement;
        this.stopCamera();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.startCamera('qr-reader');
    }
}

// Initialize global camera system
window.AdvancedCameraSystem = new AdvancedCameraSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedCameraSystem;
}
