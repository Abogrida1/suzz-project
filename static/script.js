document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const urlInput = document.getElementById('youtubeUrl');
    const searchBtn = document.getElementById('searchBtn');
    const videoPreview = document.getElementById('videoPreview');
    const downloadOptions = document.getElementById('downloadOptions');
    const statusDiv = document.getElementById('status');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');

    // Video preview elements
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const videoChannel = document.getElementById('videoChannel');
    const videoDuration = document.getElementById('videoDuration');
    const videoViews = document.getElementById('videoViews');
    const videoDate = document.getElementById('videoDate');

    // Download quality containers
    const videoQualities = document.getElementById('videoQualities');
    const audioQualities = document.getElementById('audioQualities');

    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Search functionality
    async function handleSearch() {
        const url = urlInput.value.trim();
        
        if (!validateUrl(url)) {
            return;
        }

        try {
            showLoading('Searching for video information...');
            hideStatus();
            
            console.log('Searching for URL:', url); // Debug log
            
            const response = await fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            console.log('Response status:', response.status); // Debug log

            if (response.ok) {
                // Check if response has content
                const responseText = await response.text();
                console.log('Raw response:', responseText); // Debug log
                
                if (!responseText || responseText.trim() === '') {
                    throw new Error('Empty response from server');
                }
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    console.error('Response text:', responseText);
                    throw new Error('Invalid JSON response from server');
                }
                
                console.log('Video data received:', data); // Debug log
                
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid data format from server');
                }
                
                displayVideoInfo(data);
                displayDownloadOptions(data.formats);
                showStatus('Video found! Choose your download format.', 'success');
            } else {
                let errorData;
                try {
                    const errorText = await response.text();
                    if (errorText && errorText.trim() !== '') {
                        errorData = JSON.parse(errorText);
                    } else {
                        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                    }
                } catch (parseError) {
                    console.error('Error parsing error response:', parseError);
                    errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                }
                
                console.error('Server error:', errorData); // Debug log
                showStatus(errorData.error || 'Failed to get video information', 'error');
            }
        } catch (error) {
            console.error('Search error:', error);
            showStatus(`Error searching video: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    // Display video information
    function displayVideoInfo(videoData) {
        try {
            if (!videoData || typeof videoData !== 'object') {
                throw new Error('Invalid video data received');
            }
            
            // Validate required fields
            if (!videoData.title) {
                throw new Error('Video title is missing');
            }
            
            // Set video information with fallbacks
            videoThumbnail.src = videoData.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gVGh1bWJuYWlsPC90ZXh0Pgo8L3N2Zz4K';
            videoTitle.textContent = videoData.title || 'Unknown Title';
            videoChannel.textContent = videoData.channel || 'Unknown Channel';
            videoDuration.textContent = formatDuration(videoData.duration || 0);
            videoViews.textContent = formatViews(videoData.view_count || 0);
            videoDate.textContent = formatDate(videoData.upload_date || '');
            
            videoPreview.style.display = 'block';
            downloadOptions.style.display = 'block';
        } catch (error) {
            console.error('Error displaying video info:', error);
            showStatus(`Error displaying video information: ${error.message}`, 'error');
            
            // Hide video preview on error
            videoPreview.style.display = 'none';
            downloadOptions.style.display = 'none';
        }
    }

    // Display download options
    function displayDownloadOptions(formats) {
        try {
            console.log('Displaying formats:', formats); // Debug log
            
            // Clear previous options
            videoQualities.innerHTML = '';
            audioQualities.innerHTML = '';

            if (!formats || !Array.isArray(formats)) {
                console.error('Invalid formats data:', formats);
                videoQualities.innerHTML = '<p class="no-formats">No video formats available</p>';
                audioQualities.innerHTML = '<p class="no-formats">No audio formats available</p>';
                return;
            }

            // Separate formats by type
            const videoFormats = formats.filter(f => f && f.type === 'video');
            const audioFormats = formats.filter(f => f && f.type === 'audio');

            console.log('Video formats:', videoFormats); // Debug log
            console.log('Audio formats:', audioFormats); // Debug log

            // Display video formats with quality indicators
            if (videoFormats.length > 0) {
                videoFormats.forEach((format, index) => {
                    try {
                        if (!format || !format.format_id) {
                            console.warn('Invalid video format:', format);
                            return;
                        }
                        const option = createVideoQualityOption(format, index === 0);
                        videoQualities.appendChild(option);
                    } catch (error) {
                        console.error('Error creating video option:', error, format);
                    }
                });
            } else {
                videoQualities.innerHTML = '<p class="no-formats">No video formats available</p>';
            }

            // Display audio formats
            if (audioFormats.length > 0) {
                audioFormats.forEach(format => {
                    try {
                        if (!format || !format.format_id) {
                            console.warn('Invalid audio format:', format);
                            return;
                        }
                        const option = createAudioQualityOption(format);
                        audioQualities.appendChild(option);
                    } catch (error) {
                        console.error('Error creating audio option:', error, format);
                    }
                });
            } else {
                audioQualities.innerHTML = '<p class="no-formats">No audio formats available</p>';
            }
        } catch (error) {
            console.error('Error displaying download options:', error);
            showStatus('Error displaying download options', 'error');
        }
    }

    // Create video quality option element
    function createVideoQualityOption(format, isRecommended = false) {
        try {
            if (!format || !format.format_id) {
                console.error('Invalid format data:', format);
                return document.createElement('div');
            }

            const option = document.createElement('div');
            option.className = 'quality-option video-option';
            if (isRecommended) {
                option.classList.add('recommended');
            }
            
            const qualityInfo = document.createElement('div');
            qualityInfo.className = 'quality-info';
            
            const qualityLabel = document.createElement('div');
            qualityLabel.className = 'quality-label';
            
            // Add recommended badge for highest quality
            if (isRecommended) {
                const recommendedBadge = document.createElement('span');
                recommendedBadge.className = 'recommended-badge';
                recommendedBadge.textContent = '⭐ Recommended';
                qualityLabel.appendChild(recommendedBadge);
                qualityLabel.appendChild(document.createElement('br'));
            }
            
            qualityLabel.appendChild(document.createTextNode(format.label || 'Unknown Format'));
            
            const qualityDetails = document.createElement('div');
            qualityDetails.className = 'quality-details';
            qualityDetails.textContent = format.details || 'No details available';
            
            qualityInfo.appendChild(qualityLabel);
            qualityInfo.appendChild(qualityDetails);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn video-download-btn';
            downloadBtn.textContent = 'Download Video';
            downloadBtn.addEventListener('click', () => {
                try {
                    handleDownload(format);
                } catch (error) {
                    console.error('Error in download button click:', error);
                    showStatus('Error starting download', 'error');
                }
            });
            
            option.appendChild(qualityInfo);
            option.appendChild(downloadBtn);
            
            return option;
        } catch (error) {
            console.error('Error creating video quality option:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'quality-option error';
            errorDiv.innerHTML = '<p>Error creating option</p>';
            return errorDiv;
        }
    }

    // Create audio quality option element
    function createAudioQualityOption(format) {
        try {
            if (!format || !format.format_id) {
                console.error('Invalid format data:', format);
                return document.createElement('div');
            }

            const option = document.createElement('div');
            option.className = 'quality-option audio-option';
            
            const qualityInfo = document.createElement('div');
            qualityInfo.className = 'quality-info';
            
            const qualityLabel = document.createElement('div');
            qualityLabel.className = 'quality-label';
            qualityLabel.textContent = format.label || 'Unknown Format';
            
            const qualityDetails = document.createElement('div');
            qualityDetails.className = 'quality-details';
            qualityDetails.textContent = format.details || 'No details available';
            
            qualityInfo.appendChild(qualityLabel);
            qualityInfo.appendChild(qualityDetails);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn audio-download-btn';
            
            // Set button text based on audio format
            const audioExt = format.ext ? format.ext.toUpperCase() : 'AUDIO';
            downloadBtn.textContent = `Download ${audioExt}`;
            downloadBtn.addEventListener('click', () => {
                try {
                    handleDownload(format);
                } catch (error) {
                    console.error('Error in audio download button click:', error);
                    showStatus('Error starting audio download', 'error');
                }
            });
            
            option.appendChild(qualityInfo);
            option.appendChild(downloadBtn);
            
            return option;
        } catch (error) {
            console.error('Error creating audio quality option:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'quality-option error';
            errorDiv.innerHTML = '<p>Error creating audio option</p>';
            return errorDiv;
        }
    }

    // Handle download
    async function handleDownload(format) {
        const url = urlInput.value.trim();
        
        if (!format || !format.format_id) {
            showStatus('Invalid format selected', 'error');
            return;
        }
        
        try {
            const downloadType = format.type === 'audio' ? 'audio' : 'video';
            const formatName = format.ext ? format.ext.toUpperCase() : 'file';
            showLoading(`Preparing ${downloadType} download (${formatName})...`);
            
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    format_id: format.format_id,
                    type: format.type || 'video'
                })
            });

            if (response.ok) {
                // Get filename from response headers
                const contentDisposition = response.headers.get('content-disposition');
                let filename = 'download';
                
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }

                // Create blob and download
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);
                
                const successMessage = format.type === 'audio' ? 
                    `${formatName} audio downloaded successfully!` : 
                    'Video downloaded successfully!';
                showStatus(successMessage, 'success');
            } else {
                let errorData;
                try {
                    const errorText = await response.text();
                    if (errorText && errorText.trim() !== '') {
                        errorData = JSON.parse(errorText);
                    } else {
                        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                    }
                } catch (parseError) {
                    console.error('Error parsing error response:', parseError);
                    errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                }
                
                showStatus(errorData.error || `Failed to download ${format.type || 'file'}`, 'error');
            }
        } catch (error) {
            console.error('Download error:', error);
            showStatus(`Error downloading ${format.type || 'file'}: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    // Utility functions
    function validateUrl(url) {
        if (!url.trim()) {
            showStatus('Please enter a YouTube URL', 'error');
            return false;
        }
        
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            showStatus('Please enter a valid YouTube URL', 'error');
            return false;
        }
        
        return true;
    }

    function formatDuration(seconds) {
        if (!seconds || seconds <= 0) return 'Unknown';
        try {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error formatting duration:', error);
            return 'Unknown';
        }
    }

    function formatViews(views) {
        if (!views || views <= 0) return 'Unknown views';
        try {
            if (views >= 1000000) {
                return `${(views / 1000000).toFixed(1)}M views`;
            } else if (views >= 1000) {
                return `${(views / 1000).toFixed(1)}K views`;
            }
            return `${views} views`;
        } catch (error) {
            console.error('Error formatting views:', error);
            return 'Unknown views';
        }
    }

    function formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Unknown date';
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Unknown date';
        }
    }

    // Status and loading functions
    function showStatus(message, type = 'info') {
        try {
            statusDiv.textContent = message;
            statusDiv.className = `status-message ${type}`;
            statusDiv.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);
            }
        } catch (error) {
            console.error('Error showing status:', error);
        }
    }

    function hideStatus() {
        try {
            statusDiv.style.display = 'none';
        } catch (error) {
            console.error('Error hiding status:', error);
        }
    }

    function showLoading(message) {
        try {
            loadingText.textContent = message;
            loadingOverlay.style.display = 'flex';
        } catch (error) {
            console.error('Error showing loading:', error);
        }
    }

    function hideLoading() {
        try {
            loadingOverlay.style.display = 'none';
        } catch (error) {
            console.error('Error hiding loading:', error);
        }
    }

    // Visual feedback for input focus
    urlInput.addEventListener('focus', function() {
        try {
            this.parentElement.style.transform = 'scale(1.02)';
        } catch (error) {
            console.error('Error in focus effect:', error);
        }
    });

    urlInput.addEventListener('blur', function() {
        try {
            this.parentElement.style.transform = 'scale(1)';
        } catch (error) {
            console.error('Error in blur effect:', error);
        }
    });

    // Add smooth transitions
    try {
        document.body.style.transition = 'all 0.3s ease';
    } catch (error) {
        console.error('Error setting transition:', error);
    }
});
