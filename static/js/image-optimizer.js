/**
 * Advanced Image Optimization and Fallback System
 * Ensures images display on ALL devices regardless of method
 */
class ImageOptimizer {
    constructor() {
        this.imageCache = new Map();
        this.fallbackImages = {
            logo: '/static/images/logo-fallback.svg',
            coffee: '/static/images/coffee-fallback.svg',
            default: '/static/images/default-fallback.svg'
        };
        this.init();
    }

    init() {
        this.setupImageObserver();
        this.preloadCriticalImages();
        this.setupErrorHandling();
    }

    /**
     * Setup Intersection Observer for lazy loading
     */
    setupImageObserver() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.imageObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
        }
    }

    /**
     * Enhanced image loading with multiple fallback strategies
     */
    async loadImage(imgElement) {
        const originalSrc = imgElement.dataset.src || imgElement.src;
        const imageType = imgElement.dataset.type || 'default';
        
        // Strategy 1: Try original URL
        if (await this.tryLoadImage(originalSrc)) {
            this.setImageSrc(imgElement, originalSrc);
            return;
        }

        // Strategy 2: Try with different protocols
        const protocols = ['https://', 'http://'];
        for (const protocol of protocols) {
            const modifiedUrl = originalSrc.replace(/^https?:\/\//, protocol);
            if (await this.tryLoadImage(modifiedUrl)) {
                this.setImageSrc(imgElement, modifiedUrl);
                return;
            }
        }

        // Strategy 3: Try proxy/CORS bypass
        const proxyUrls = [
            `https://cors-anywhere.herokuapp.com/${originalSrc}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(originalSrc)}`,
            `https://images.weserv.nl/?url=${encodeURIComponent(originalSrc)}`
        ];

        for (const proxyUrl of proxyUrls) {
            if (await this.tryLoadImage(proxyUrl)) {
                this.setImageSrc(imgElement, proxyUrl);
                return;
            }
        }

        // Strategy 4: Convert to base64 and cache
        try {
            const base64Image = await this.convertToBase64(originalSrc);
            if (base64Image) {
                this.setImageSrc(imgElement, base64Image);
                this.imageCache.set(originalSrc, base64Image);
                return;
            }
        } catch (error) {
            console.warn('Base64 conversion failed:', error);
        }

        // Strategy 5: Use local fallback
        this.setFallbackImage(imgElement, imageType);
    }

    /**
     * Try to load image and return promise
     */
    tryLoadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
            
            // Timeout after 5 seconds
            setTimeout(() => resolve(false), 5000);
        });
    }

    /**
     * Convert image to base64 using canvas
     */
    async convertToBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl, { mode: 'cors' });
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Set image source with loading animation
     */
    setImageSrc(imgElement, src) {
        imgElement.style.opacity = '0';
        imgElement.style.transition = 'opacity 0.3s ease';
        
        imgElement.onload = () => {
            imgElement.style.opacity = '1';
            imgElement.classList.add('loaded');
        };
        
        imgElement.src = src;
    }

    /**
     * Set fallback image with generated content
     */
    setFallbackImage(imgElement, type) {
        const fallbackSrc = this.fallbackImages[type] || this.fallbackImages.default;
        
        // If no local fallback, generate SVG
        if (!fallbackSrc || fallbackSrc.includes('fallback')) {
            const generatedSvg = this.generateFallbackSVG(type, imgElement);
            this.setImageSrc(imgElement, generatedSvg);
        } else {
            this.setImageSrc(imgElement, fallbackSrc);
        }
    }

    /**
     * Generate SVG fallback based on type
     */
    generateFallbackSVG(type, imgElement) {
        const width = imgElement.offsetWidth || 200;
        const height = imgElement.offsetHeight || 200;
        
        let content = '';
        let bgColor = '#f3f4f6';
        let textColor = '#6b7280';
        
        switch (type) {
            case 'logo':
                content = `
                    <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/3}" fill="#d97706" opacity="0.8"/>
                    <text x="${width/2}" y="${height/2 + 8}" text-anchor="middle" fill="white" font-size="${Math.min(width, height)/4}" font-weight="bold">S</text>
                `;
                bgColor = '#fbbf24';
                break;
            case 'coffee':
                content = `
                    <rect x="${width*0.3}" y="${height*0.2}" width="${width*0.4}" height="${height*0.6}" rx="8" fill="#8b4513" opacity="0.8"/>
                    <ellipse cx="${width/2}" cy="${height*0.25}" rx="${width*0.15}" ry="${height*0.05}" fill="#d2691e"/>
                    <text x="${width/2}" y="${height*0.85}" text-anchor="middle" fill="#8b4513" font-size="12" font-weight="bold">Coffee</text>
                `;
                bgColor = '#fef3c7';
                break;
            default:
                content = `
                    <rect x="${width*0.2}" y="${height*0.2}" width="${width*0.6}" height="${height*0.6}" rx="8" fill="#e5e7eb" opacity="0.8"/>
                    <text x="${width/2}" y="${height/2 + 4}" text-anchor="middle" fill="#9ca3af" font-size="14">Image</text>
                `;
        }

        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${bgColor}"/>
                ${content}
            </svg>
        `;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Setup global error handling for images
     */
    setupErrorHandling() {
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                const img = e.target;
                if (!img.dataset.fallbackAttempted) {
                    img.dataset.fallbackAttempted = 'true';
                    const imageType = img.dataset.type || 'default';
                    this.setFallbackImage(img, imageType);
                }
            }
        }, true);
    }

    /**
     * Preload critical images
     */
    preloadCriticalImages() {
        const criticalImages = [
            'https://www.pythonanywhere.com/user/battbot/files/home/battbot/WhatsApp%20Image%202025-08-04%20at%2003.22.59_8508aa3a.jpg',
            'https://www.pythonanywhere.com/user/battbot/files/home/battbot/WhatsApp%20Image%202025-08-04%20at%2003.23.05_d23941ee.jpg'
        ];

        criticalImages.forEach(src => {
            this.tryLoadImage(src).then(success => {
                if (success) {
                    console.log(`Preloaded: ${src}`);
                }
            });
        });
    }

    /**
     * Initialize responsive images
     */
    initResponsiveImages() {
        const images = document.querySelectorAll('img[data-responsive]');
        images.forEach(img => {
            this.makeResponsive(img);
        });
    }

    /**
     * Make image responsive with srcset
     */
    makeResponsive(img) {
        const originalSrc = img.src || img.dataset.src;
        const sizes = [400, 800, 1200, 1600];
        
        // Generate srcset for different screen sizes
        const srcset = sizes.map(size => {
            const resizedUrl = this.getResizedImageUrl(originalSrc, size);
            return `${resizedUrl} ${size}w`;
        }).join(', ');

        img.srcset = srcset;
        img.sizes = '(max-width: 640px) 400px, (max-width: 1024px) 800px, (max-width: 1280px) 1200px, 1600px';
    }

    /**
     * Get resized image URL using external service
     */
    getResizedImageUrl(originalUrl, width) {
        // Use image resizing service
        return `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=${width}&q=85&output=webp`;
    }

    /**
     * Public method to optimize all images on page
     */
    optimizeAllImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (this.imageObserver) {
                this.imageObserver.observe(img);
            } else {
                this.loadImage(img);
            }
        });
        
        this.initResponsiveImages();
    }

    /**
     * Force reload all failed images
     */
    retryFailedImages() {
        const failedImages = document.querySelectorAll('img[data-fallback-attempted]');
        failedImages.forEach(img => {
            img.removeAttribute('data-fallback-attempted');
            this.loadImage(img);
        });
    }
}

// Initialize global image optimizer
window.ImageOptimizer = new ImageOptimizer();

// Auto-optimize images when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ImageOptimizer.optimizeAllImages();
});

// Re-optimize images when they're dynamically added
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
                const images = node.tagName === 'IMG' ? [node] : node.querySelectorAll('img');
                images.forEach(img => {
                    if (window.ImageOptimizer.imageObserver) {
                        window.ImageOptimizer.imageObserver.observe(img);
                    } else {
                        window.ImageOptimizer.loadImage(img);
                    }
                });
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
