from flask import Flask, request, send_file, jsonify, render_template
from flask_cors import CORS
import yt_dlp
import os
import tempfile
import uuid
from urllib.parse import urlparse, parse_qs

app = Flask(__name__)
CORS(app)

# Configure yt-dlp options for info extraction
def get_info_extractor():
    return yt_dlp.YoutubeDL({
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    })

# Configure yt-dlp options for downloads
def get_downloader():
    return yt_dlp.YoutubeDL({
        'outtmpl': '%(title)s.%(ext)s',
        'quiet': True,
        'no_warnings': True,
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
