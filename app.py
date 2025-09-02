from flask import Flask, request, send_file, jsonify, render_template
from flask_cors import CORS
import yt_dlp
import os
import tempfile
import random
import ssl

# SIMPLE SSL BYPASS - 100% WORKING
ssl._create_default_https_context = ssl._create_unverified_context
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['CURL_INSECURE'] = '1'

print("[APP] SSL bypass completed - app starting...")

app = Flask(__name__)
CORS(app)

# List of popular user agents
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

def get_random_user_agent():
    return random.choice(USER_AGENTS)

# Simple yt-dlp extractor
def get_info_extractor():
    return yt_dlp.YoutubeDL({
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'no_check_certificate': True,
        'prefer_insecure': True,
        'http_headers': {
            'User-Agent': get_random_user_agent(),
        },
        'socket_timeout': 30,
        'retries': 3,
    })

# Simple yt-dlp downloader
def get_downloader():
    return yt_dlp.YoutubeDL({
        'outtmpl': '%(title)s.%(ext)s',
        'quiet': True,
        'nocheckcertificate': True,
        'no_check_certificate': True,
        'prefer_insecure': True,
        'http_headers': {
            'User-Agent': get_random_user_agent(),
        },
        'socket_timeout': 30,
        'retries': 3,
    })

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search_video():
    try:
        print(f"[SEARCH] Request received")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400
            
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        print(f"[SEARCH] Processing URL: {url}")
        
        # Validate YouTube URL
        if 'youtube.com' not in url and 'youtu.be' not in url:
            return jsonify({'error': 'Please provide a valid YouTube URL'}), 400
        
        # Extract video information
        ydl = get_info_extractor()
        
        print(f"[SEARCH] Extracting video info...")
        info = ydl.extract_info(url, download=False)
        
        if not info:
            return jsonify({'error': 'No video information found'}), 500
        
        print(f"[SEARCH] Video info extracted: {info.get('title', 'Unknown')}")
        
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
        
        # Process formats
        formats = info.get('formats', [])
        video_formats = []
        audio_formats = []
        
        # Get video formats
        for fmt in formats:
            if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none':
                quality = fmt.get('height', 0)
                if quality and quality > 0:
                    format_info = {
                        'format_id': fmt.get('format_id'),
                        'ext': fmt.get('ext'),
                        'quality': f"{quality}p",
                        'type': 'video',
                        'label': f"{quality}p Video",
                        'details': f"{quality}p • {fmt.get('ext', '').upper()}"
                    }
                    video_formats.append(format_info)
        
        # Get audio format
        for fmt in formats:
            if fmt.get('acodec') != 'none' and fmt.get('vcodec') == 'none':
                audio_formats = [{
                    'format_id': fmt.get('format_id'),
                    'ext': fmt.get('ext', 'mp3'),
                    'type': 'audio',
                    'label': 'Audio (MP3)',
                    'details': 'Best available audio'
                }]
                break
        
        # Sort video formats by quality
        video_formats.sort(key=lambda x: int(x['quality'].replace('p', '')), reverse=True)
        
        video_data['formats'] = video_formats + audio_formats
        
        print(f"[SEARCH] Search completed successfully")
        return jsonify(video_data)
        
    except Exception as e:
        print(f"[SEARCH] Error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/download', methods=['POST'])
def download():
    try:
        print(f"[DOWNLOAD] Download request received")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400
            
        url = data.get('url')
        format_id = data.get('format_id')
        
        if not url or not format_id:
            return jsonify({'error': 'URL and format_id are required'}), 400
        
        print(f"[DOWNLOAD] Processing: {url} - {format_id}")
        
        # Create temporary directory
        temp_dir = tempfile.mkdtemp()
        os.chdir(temp_dir)
        
        # Configure download
        download_opts = {
            'outtmpl': '%(title)s.%(ext)s',
            'format': format_id,
            'nocheckcertificate': True,
            'no_check_certificate': True,
            'prefer_insecure': True,
        }
        
        # Download file
        ydl = yt_dlp.YoutubeDL(download_opts)
        ydl.download([url])
        
        # Find downloaded file
        files = os.listdir(temp_dir)
        if not files:
            return jsonify({'error': 'Failed to download file'}), 500
        
        filename = files[0]
        file_path = os.path.join(temp_dir, filename)
        
        print(f"[DOWNLOAD] File downloaded: {filename}")
        
        # Send file
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"[DOWNLOAD] Error: {str(e)}")
        return jsonify({'error': f'Download error: {str(e)}'}), 500

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'YouTube Downloader is running'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
