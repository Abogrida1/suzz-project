from flask import Flask, request, send_file, jsonify, render_template
from flask_cors import CORS
import yt_dlp
import os
import tempfile
import uuid
import random
from urllib.parse import urlparse, parse_qs

app = Flask(__name__)
CORS(app)

# List of popular user agents to rotate
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
]

def get_random_user_agent():
    return random.choice(USER_AGENTS)

# Configure yt-dlp options for info extraction
def get_info_extractor():
    return yt_dlp.YoutubeDL({
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        # Add rotating user agents
        'http_headers': {
            'User-Agent': get_random_user_agent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        },
        # Advanced anti-bot options
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'logtostderr': False,
        'geo_bypass': True,
        'geo_bypass_country': 'US',
        'socket_timeout': 60,
        'retries': 5,
        'fragment_retries': 5,
        'extractor_retries': 5,
        'file_access_retries': 5,
        'extractor_args': {
            'youtube': {
                'skip': ['dash', 'live_chat'],
                'player_client': ['android', 'web', 'mweb', 'tv_embedded'],
                'player_skip': ['webpage', 'configs'],
                'player_params': {'hl': 'en', 'gl': 'US'},
            }
        },
        # Add cookies and session handling
        'cookiefile': 'cookies.txt',
        'cookiesfrombrowser': ('chrome',),
        'cookiesfrombrowser_args': {
            'browser_name': 'chrome',
            'profile_name': 'Default',
        },
        # Add referer and origin
        'referer': 'https://www.youtube.com/',
        'origin': 'https://www.youtube.com',
    })

# Configure yt-dlp options for downloads
def get_downloader():
    return yt_dlp.YoutubeDL({
        'outtmpl': '%(title)s.%(ext)s',
        'quiet': True,
        'no_warnings': True,
        # Add rotating user agents
        'http_headers': {
            'User-Agent': get_random_user_agent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        },
        # Advanced anti-bot options
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'logtostderr': False,
        'geo_bypass': True,
        'geo_bypass_country': 'US',
        'socket_timeout': 60,
        'retries': 5,
        'fragment_retries': 5,
        'extractor_retries': 5,
        'file_access_retries': 5,
        'extractor_args': {
            'youtube': {
                'skip': ['dash', 'live_chat'],
                'player_client': ['android', 'web', 'mweb', 'tv_embedded'],
                'player_skip': ['webpage', 'configs'],
                'player_params': {'hl': 'en', 'gl': 'US'},
            }
        },
        # Add cookies and session handling
        'cookiefile': 'cookies.txt',
        'cookiesfrombrowser': ('chrome',),
        'cookiesfrombrowser_args': {
            'browser_name': 'chrome',
            'profile_name': 'Default',
        },
        # Add referer and origin
        'referer': 'https://www.youtube.com/',
        'origin': 'https://www.youtube.com',
    })

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search_video():
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Validate YouTube URL
        if 'youtube.com' not in url and 'youtu.be' not in url:
            return jsonify({'error': 'Please provide a valid YouTube URL'}), 400
        
        # Extract video information
        ydl = get_info_extractor()
        
        # Add additional options for hosted servers
        ydl.params.update({
            'extractor_args': {
                'youtube': {
                    'skip': ['dash', 'live_chat'],
                    'player_client': ['android', 'web', 'mweb', 'tv_embedded'],
                    'player_skip': ['webpage', 'configs'],
                    'player_params': {'hl': 'en', 'gl': 'US'},
                }
            },
            'socket_timeout': 60,
            'retries': 5,
            'fragment_retries': 5,
            'extractor_retries': 5,
            'file_access_retries': 5,
            # Add more anti-bot options
            'http_chunk_size': 10485760,  # 10MB chunks
            'buffersize': 1024,
            'sleep_interval': 1,
            'max_sleep_interval': 5,
            'sleep_interval_requests': 1,
            'max_sleep_interval_requests': 5,
        })
        
        info = ydl.extract_info(url, download=False)
        
        # Prepare video data
        video_data = {
            'title': info.get('title', 'Unknown Title'),
            'channel': info.get('uploader', 'Unknown Channel'),
            'thumbnail': info.get('thumbnail', ''),
            'duration': info.get('duration', 0),
            'view_count': info.get('view_count', 0),
            'upload_date': info.get('upload_date', ''),
            'formats': []
        }
        
        # Process available formats and create proper download options
        formats = info.get('formats', [])
        
        # Create video format options (only high quality video formats)
        video_formats = []
        
        # Common video quality formats we want to support
        target_qualities = [2160, 1440, 1080, 720, 480, 360, 240, 144]
        
        for fmt in formats:
            if fmt.get('format_id') and fmt.get('ext'):
                # Only video formats with both video and audio
                if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none':
                    quality = fmt.get('height', 0)
                    fps = fmt.get('fps', 0)
                    filesize = fmt.get('filesize', 0)
                    
                    if quality and quality > 0:
                        # Check if this is a quality we want to support
                        if quality in target_qualities:
                            format_info = {
                                'format_id': fmt.get('format_id'),
                                'ext': fmt.get('ext'),
                                'quality': f"{quality}p",
                                'fps': fps,
                                'filesize': filesize,
                                'type': 'video',
                                'label': f"{quality}p Video ({fmt.get('ext', '').upper()})",
                                'details': f"{quality}p • {fps}fps • {formatFileSize(filesize) if filesize else 'Unknown size'}"
                            }
                            video_formats.append(format_info)
        
        # Sort video formats by quality (highest first)
        def get_quality_number(quality_str):
            try:
                return int(float(quality_str.replace('p', '')))
            except (ValueError, AttributeError):
                return 0
        
        video_formats.sort(key=lambda x: get_quality_number(x['quality']), reverse=True)
        
        # Find best audio format that doesn't require conversion
        audio_formats = []
        best_audio_format = None
        
        # Look for MP3 or M4A formats first (no conversion needed)
        for fmt in formats:
            if fmt.get('acodec') != 'none' and fmt.get('vcodec') == 'none':
                if fmt.get('ext') in ['mp3', 'm4a']:
                    best_audio_format = fmt
                    break
        
        # If no MP3/M4A found, use best audio format
        if not best_audio_format:
            for fmt in formats:
                if fmt.get('acodec') != 'none' and fmt.get('vcodec') == 'none':
                    best_audio_format = fmt
                    break
        
        if best_audio_format:
            audio_formats = [{
                'format_id': best_audio_format.get('format_id'),
                'ext': best_audio_format.get('ext', 'mp3'),
                'quality': f"{best_audio_format.get('abr', 'Unknown')}kbps" if best_audio_format.get('abr') else 'Best quality',
                'type': 'audio',
                'label': f'Audio ({best_audio_format.get("ext", "").upper()})',
                'details': f'{best_audio_format.get("ext", "").upper()} • {best_audio_format.get("abr", "Unknown")}kbps • Best available audio'
            }]
        
        # Combine all formats
        video_data['formats'] = video_formats + audio_formats
        
        return jsonify(video_data)
        
    except Exception as e:
        print(f"Error in search_video: {str(e)}")  # Debug logging
        return jsonify({'error': str(e)}), 500

def formatFileSize(bytes):
    if not bytes:
        return 'Unknown size'
    sizes = ['B', 'KB', 'MB', 'GB']
    i = 0
    while bytes >= 1024 and i < len(sizes) - 1:
        bytes /= 1024.0
        i += 1
    return f"{bytes:.1f} {sizes[i]}"

@app.route('/download', methods=['POST'])
def download():
    try:
        data = request.get_json()
        url = data.get('url')
        format_id = data.get('format_id')
        download_type = data.get('type')  # 'video' or 'audio'
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        if not format_id:
            return jsonify({'error': 'Format ID is required'}), 400
        
        # Validate YouTube URL
        if 'youtube.com' not in url and 'youtu.be' not in url:
            return jsonify({'error': 'Please provide a valid YouTube URL'}), 400
        
        # Create temporary directory for downloads
        temp_dir = tempfile.mkdtemp()
        os.chdir(temp_dir)
        
        # Configure download options
        download_opts = {
            'outtmpl': '%(title)s.%(ext)s',
            'quiet': True,
            'no_warnings': True,
            # Add headers to avoid bot detection
            'http_headers': {
                'User-Agent': get_random_user_agent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
            },
            # Add additional options to avoid bot detection
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'logtostderr': False,
            'geo_bypass': True,
            'geo_bypass_country': 'US',
            'socket_timeout': 60,
            'retries': 5,
            'fragment_retries': 5,
            'extractor_retries': 5,
            'file_access_retries': 5,
            'extractor_args': {
                'youtube': {
                    'skip': ['dash', 'live_chat'],
                    'player_client': ['android', 'web', 'mweb', 'tv_embedded'],
                    'player_skip': ['webpage', 'configs'],
                    'player_params': {'hl': 'en', 'gl': 'US'},
                }
            },
            # Add cookies and session handling
            'cookiefile': 'cookies.txt',
            'cookiesfrombrowser': ('chrome',),
            'cookiesfrombrowser_args': {
                'browser_name': 'chrome',
                'profile_name': 'Default',
            },
            # Add referer and origin
            'referer': 'https://www.youtube.com/',
            'origin': 'https://www.youtube.com',
            # Add more anti-bot options
            'http_chunk_size': 10485760,  # 10MB chunks
            'buffersize': 1024,
            'sleep_interval': 1,
            'max_sleep_interval': 5,
            'sleep_interval_requests': 1,
            'max_sleep_interval_requests': 5,
        }
        
        # Add format selection
        if download_type == 'audio':
            # For audio downloads, use the specific format without conversion
            download_opts['format'] = format_id
            # Don't use postprocessors to avoid FFmpeg requirement
        else:
            # For specific video format downloads
            download_opts['format'] = format_id
        
        # Download the file
        ydl = yt_dlp.YoutubeDL(download_opts)
        ydl.download([url])
        
        # Find the downloaded file
        files = os.listdir(temp_dir)
        if not files:
            return jsonify({'error': 'Failed to download file'}), 500
        
        # Get the first file (should be the only one)
        filename = files[0]
        file_path = os.path.join(temp_dir, filename)
        
        # Send file to user
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )
        
    except Exception as e:
        print(f"Error in download: {str(e)}")  # Debug logging
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
