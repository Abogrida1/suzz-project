/**
 * QR Code Compatibility Layer for Suzu
 * Works across all browsers and hosting environments
 */

class QRCompatibilityManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.fallbackMode = false;
    }

    async init() {
        await this.setupFallbackSystems();
        this.setupEventListeners();
    }

    async setupFallbackSystems() {
        // Check if we're in fallback mode (offline or CDN issues)
        if (!this.isOnline || !await this.testCDNConnectivity()) {
            this.fallbackMode = true;
        }
    }

    async testCDNConnectivity() {
        try {
            const response = await fetch('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js', { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    setupEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    handleOnline() {
        this.isOnline = true;
        this.fallbackMode = false;
    }

    handleOffline() {
        this.isOnline = false;
        this.fallbackMode = true;
    }

    // QR Code Generation with fallback
    async generateQRCode(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            if (typeof QRCode !== 'undefined') {
                return this.generateQRCodeCDN(data, containerId);
            } else {
                return this.generateQRCodeFallback(data, containerId);
            }
        } catch (error) {
            console.error('QR Generation error:', error);
            return this.generateQRCodeFallback(data, containerId);
        }
    }

    async generateQRCodeCDN(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        return new Promise((resolve, reject) => {
            QRCode.toCanvas(data, {
                width: 200,
                height: 200,
                margin: 2,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            }, (error, canvas) => {
                if (error) {
                    reject(error);
                } else {
                    container.innerHTML = '';
                    canvas.className = 'mx-auto rounded-lg shadow-lg';
                    container.appendChild(canvas);
                    resolve(canvas);
                }
            });
        });
    }

    generateQRCodeFallback(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create a simple canvas-based QR representation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        
        // Create a simple pattern
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(data, size/2, size/2);
        
        container.innerHTML = '';
        canvas.className = 'mx-auto rounded-lg shadow-lg';
        container.appendChild(canvas);
        
        return canvas;
    }

    // QR Code Scanning with fallback
    async setupScanner(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            if (typeof Html5Qrcode !== 'undefined') {
                return this.setupScannerCDN(containerId);
            } else {
                return this.setupScannerFallback(containerId);
            }
        } catch (error) {
            console.error('Scanner setup error:', error);
            return this.setupScannerFallback(containerId);
        }
    }

    async setupScannerCDN(containerId) {
        const scanner = new Html5Qrcode(containerId);
        return scanner;
    }

    setupScannerFallback(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Simple file input fallback
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.className = 'w-full p-2 border rounded';
        
        container.innerHTML = '<p class="text-center text-gray-500 mb-4">يرجى تحميل صورة للكود</p>';
        container.appendChild(input);
        
        return input;
    }

    checkBrowserCompatibility() {
        const features = {
            camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
            canvas: !!window.CanvasRenderingContext2D,
            webgl: !!window.WebGLRenderingContext,
            serviceWorker: 'serviceWorker' in navigator
        };

        return features;
    }

    showCompatibilityWarnings() {
        const features = this.checkBrowserCompatibility();
        const warnings = [];

        if (!features.camera) {
            warnings.push('الكاميرا غير مدعومة في هذا المتصفح');
        }

        if (!features.canvas) {
            warnings.push('Canvas غير مدعوم');
        }

        return warnings;
    }
}

// Global QR compatibility instance
window.qrCompatibility = new QRCompatibilityManager();
