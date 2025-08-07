from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import requests
import random
import time
from datetime import datetime, timedelta
import logging

# Import our custom modules
from config import get_config
from models import create_models

# Initialize Flask app
app = Flask(__name__, template_folder='../templates', static_folder='../static')

# Load configuration
config = get_config()
app.config.from_object(config)

# Enable CORS
CORS(app, origins=config.CORS_ORIGINS)

# Initialize models
models = create_models(config.DATABASE_PATH)
user_model = models['user']
otp_model = models['otp']
audit_log = models['audit_log']
code_generator = models['code_generator']
security = models['security']

# Setup logging
logging.basicConfig(level=getattr(logging, config.LOG_LEVEL))
logger = logging.getLogger(__name__)

def generate_random_discount():
    """Generate random discount between min and max in specified steps"""
    discounts = list(range(config.MIN_DISCOUNT, config.MAX_DISCOUNT + 1, config.DISCOUNT_STEP))
    return random.choice(discounts)

def send_whatsapp_otp(phone_number, otp):
    """Enhanced OTP sending with multiple strategies for Saudi-to-Egyptian delivery"""
    
    # Strategy 1: Enhanced Egyptian number formatting for Saudi Green API
    formatted_numbers = get_formatted_phone_variants(phone_number)
    
    for attempt, formatted_phone in enumerate(formatted_numbers, 1):
        try:
            logger.info(f"OTP Attempt {attempt}: Trying {formatted_phone} for {phone_number}")
            
            # Enhanced message with Arabic and English
            message = config.OTP_MESSAGE_TEMPLATE.format(
                otp=otp,
                minutes=config.OTP_EXPIRY_MINUTES
            )
            
            # Try multiple API endpoints for better delivery
            api_endpoints = [
                f"{config.GREEN_API_BASE_URL}/waInstance{config.GREEN_API_INSTANCE_ID}/sendMessage/{config.GREEN_API_TOKEN}",
                f"{config.GREEN_API_BASE_URL}/waInstance{config.GREEN_API_INSTANCE_ID}/SendMessage/{config.GREEN_API_TOKEN}",
            ]
            
            for endpoint in api_endpoints:
                # Multiple payload formats for better compatibility
                payloads = [
                    {
                        "chatId": f"{formatted_phone}@c.us",
                        "message": message
                    },
                    {
                        "chatId": formatted_phone,
                        "message": message,
                        "quotedMessageId": None
                    },
                    {
                        "phoneNumber": formatted_phone,
                        "message": message
                    }
                ]
                
                for payload_idx, payload in enumerate(payloads):
                    try:
                        headers = {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'User-Agent': 'SuzuCafe/1.0'
                        }
                        
                        response = requests.post(
                            endpoint, 
                            json=payload, 
                            headers=headers, 
                            timeout=20,
                            verify=True
                        )
                        
                        logger.info(f"API Response - Endpoint: {endpoint}, Payload: {payload_idx}, Status: {response.status_code}, Body: {response.text[:200]}")
                        
                        # Check for successful response
                        if response.status_code == 200:
                            try:
                                response_data = response.json()
                                # Green API success indicators
                                if (response_data.get('idMessage') or 
                                    response_data.get('sent') == True or
                                    'sent' in response.text.lower()):
                                    
                                    audit_log.log_action(
                                        action="OTP_SENT_SUCCESS",
                                        user_phone=phone_number,
                                        details=f"OTP sent successfully to {formatted_phone} via Saudi Green API (Attempt {attempt}, Endpoint {endpoint}, Payload {payload_idx})",
                                        ip_address=request.remote_addr
                                    )
                                    return True
                            except:
                                # If JSON parsing fails but status is 200, consider it success
                                if response.status_code == 200:
                                    audit_log.log_action(
                                        action="OTP_SENT_SUCCESS",
                                        user_phone=phone_number,
                                        details=f"OTP sent successfully to {formatted_phone} (Status 200, non-JSON response)",
                                        ip_address=request.remote_addr
                                    )
                                    return True
                        
                        # Wait between payload attempts
                        time.sleep(1)
                        
                    except requests.exceptions.RequestException as e:
                        logger.warning(f"Request failed for payload {payload_idx}: {e}")
                        continue
                
                # Wait between endpoint attempts
                time.sleep(2)
            
            # Wait between phone format attempts
            time.sleep(3)
            
        except Exception as e:
            logger.error(f"Error in attempt {attempt} for {formatted_phone}: {e}")
            continue
    
    # If all attempts failed, try SMS fallback
    if config.SMS_FALLBACK_ENABLED:
        logger.info(f"Attempting SMS fallback for {phone_number}")
        if send_sms_otp(phone_number, otp):
            return True
    
    # Log final failure
    audit_log.log_action(
        action="OTP_SEND_FAILED_ALL_ATTEMPTS",
        user_phone=phone_number,
        details=f"All OTP delivery attempts failed for {phone_number}",
        ip_address=request.remote_addr
    )
    return False

def get_formatted_phone_variants(phone_number):
    """Generate multiple phone number format variants for better delivery"""
    variants = []
    
    # Clean the number first
    clean_number = phone_number.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
    
    # Egyptian number variants for Saudi Green API
    if clean_number.startswith('01') and len(clean_number) == 11:
        # Standard Egyptian mobile
        variants.extend([
            f"+2{clean_number}",           # +201xxxxxxxxx
            f"002{clean_number}",          # 00201xxxxxxxxx  
            f"2{clean_number}",            # 201xxxxxxxxx
            f"+20{clean_number[1:]}",      # +2001xxxxxxxxx
            clean_number,                   # 01xxxxxxxxx
        ])
    elif clean_number.startswith('1') and len(clean_number) == 10:
        # Handle 1xxxxxxxxx format
        variants.extend([
            f"+20{clean_number}",          # +201xxxxxxxxx
            f"002{clean_number}",          # 00201xxxxxxxxx
            f"20{clean_number}",           # 201xxxxxxxxx
            f"+201{clean_number}",         # +2011xxxxxxxxx
        ])
    elif clean_number.startswith('20') and len(clean_number) == 13:
        # Already has country code
        variants.extend([
            f"+{clean_number}",            # +201xxxxxxxxx
            f"00{clean_number}",           # 00201xxxxxxxxx
            clean_number,                   # 201xxxxxxxxx
        ])
    else:
        # Default handling
        variants.extend([
            f"+20{clean_number}",
            f"002{clean_number}",
            f"20{clean_number}",
            clean_number
        ])
    
    # Remove duplicates while preserving order
    seen = set()
    unique_variants = []
    for variant in variants:
        if variant not in seen:
            seen.add(variant)
            unique_variants.append(variant)
    
    return unique_variants

def send_sms_otp(phone_number, otp):
    """SMS fallback using alternative service"""
    try:
        if not config.SMS_FALLBACK_ENABLED or not config.SMS_API_KEY:
            return False
            
        formatted_phone = get_formatted_phone_variants(phone_number)[0]
        
        # Use SMS service (example with Twilio-like API)
        sms_url = f"{config.SMS_API_BASE_URL}/send"
        
        payload = {
            "to": formatted_phone,
            "message": f"رمز التحقق: {otp} | Verification code: {otp} | Suzu Cafe",
            "from": config.SMS_SENDER_ID
        }
        
        headers = {
            'Authorization': f'Bearer {config.SMS_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(sms_url, json=payload, headers=headers, timeout=15)
        
        if response.status_code == 200:
            audit_log.log_action(
                action="SMS_OTP_SENT",
                user_phone=phone_number,
                details=f"SMS OTP sent to {formatted_phone} as fallback",
                ip_address=request.remote_addr
            )
            return True
            
    except Exception as e:
        logger.error(f"SMS fallback failed: {e}")
    
    return False

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/admin')
def admin():
    """Serve the admin page"""
    return render_template('admin.html')

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user and return discount + QR directly (no OTP)"""
    data = request.get_json()
    phone_number = security.sanitize_input(data.get('phone_number', '')).strip()
    
    if not phone_number:
        return jsonify({'error': 'Phone number is required'}), 400

    # Validate phone number format (Egyptian format)
    if not security.validate_egyptian_phone(phone_number):
        return jsonify({'error': 'Invalid Egyptian phone number format'}), 400

    # Check if user already exists
    existing_user = user_model.get_user_by_phone(phone_number)
    if existing_user:
        if existing_user['is_used']:
            audit_log.log_action(
                action="REGISTRATION_BLOCKED",
                user_phone=phone_number,
                details="Phone number already used discount code",
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'This phone number has already used a discount code'}), 400
        else:
            # User exists, return their data directly
            return jsonify({
                'message': 'User already registered',
                'discount': existing_user['discount_percentage'],
                'unique_code': existing_user['unique_code'],
                'qr_code': existing_user['qr_code_data'],
                'is_verified': True
            })

    # Generate new user data
    discount = generate_random_discount()
    unique_code = code_generator.generate_unique_code()
    qr_data = f"{unique_code}|{phone_number}|{discount}"
    qr_code_base64 = code_generator.generate_qr_code(qr_data)

    # Create new user (mark as verified directly)
    if not user_model.create_user(phone_number, discount, unique_code, qr_code_base64, is_verified=True):
        return jsonify({'error': 'Failed to create user'}), 500

    audit_log.log_action(
        action="USER_REGISTERED",
        user_phone=phone_number,
        details=f"New user registered with {discount}% discount (no OTP)",
        ip_address=request.remote_addr
    )

    # Return discount and QR directly
    return jsonify({
        'message': 'Registration successful',
        'discount': discount,
        'unique_code': unique_code,
        'qr_code': qr_code_base64,
        'is_verified': True
    })

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login"""
    data = request.get_json()
    password = security.sanitize_input(data.get('password', ''))
    
    if security.verify_password(password, security.hash_password(config.ADMIN_PASSWORD)):
        audit_log.log_action(
            action="ADMIN_LOGIN_SUCCESS",
            details="Admin logged in successfully",
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        return jsonify({'message': 'Login successful'})
    else:
        audit_log.log_action(
            action="ADMIN_LOGIN_FAILED",
            details="Invalid admin password attempt",
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        return jsonify({'error': 'Invalid password'}), 401

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Get all users for admin panel"""
    try:
        users_list = user_model.get_all_users()
        stats = user_model.get_user_stats()
        
        audit_log.log_action(
            action="ADMIN_VIEW_USERS",
            details="Admin viewed users list",
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'users': users_list,
            'stats': stats
        })
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        return jsonify({'error': 'Failed to retrieve users'}), 500

@app.route('/api/admin/search', methods=['GET'])
def search_users():
    """Search users by phone number for admin panel"""
    try:
        search_query = request.args.get('q', '').strip()
        
        if not search_query:
            return jsonify({'error': 'Search query is required'}), 400
        
        # Get all users and filter by phone number
        all_users = user_model.get_all_users()
        filtered_users = [
            user for user in all_users 
            if search_query in user['phone_number']
        ]
        
        audit_log.log_action(
            action="ADMIN_SEARCH_USERS",
            details=f"Admin searched for: {search_query}",
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'users': filtered_users,
            'total_found': len(filtered_users),
            'search_query': search_query
        })
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        return jsonify({'error': 'Failed to search users'}), 500

@app.route('/api/admin/redeem', methods=['POST'])
def redeem_code():
    """Redeem a discount code"""
    data = request.get_json()
    code = security.sanitize_input(data.get('code', '')).strip()
    
    if not code:
        return jsonify({'error': 'Code is required'}), 400
    
    try:
        # Parse QR code data or use unique code directly
        qr_parsed = code_generator.parse_qr_data(code)
        unique_code = qr_parsed['unique_code']
        
        # Get user by code
        user = user_model.get_user_by_code(unique_code)
        
        if not user:
            audit_log.log_action(
                action="REDEEM_FAILED",
                details=f"Invalid code attempted: {unique_code}",
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Code not found'}), 404
        
        if not user['is_verified']:
            audit_log.log_action(
                action="REDEEM_FAILED",
                user_phone=user['phone_number'],
                details="Attempted to redeem unverified code",
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Phone number not verified'}), 400
        
        if user['is_used']:
            audit_log.log_action(
                action="REDEEM_FAILED",
                user_phone=user['phone_number'],
                details="Attempted to redeem already used code",
                ip_address=request.remote_addr
            )
            return jsonify({
                'error': 'Code already used', 
                'used_at': user['used_at']
            }), 400
        
        # Mark as used
        if user_model.use_code(unique_code):
            audit_log.log_action(
                action="CODE_REDEEMED",
                user_phone=user['phone_number'],
                details=f"Code {unique_code} redeemed successfully - {user['discount_percentage']}% discount",
                ip_address=request.remote_addr
            )
            
            return jsonify({
                'message': 'Code redeemed successfully',
                'phone_number': user['phone_number'],
                'discount_percentage': user['discount_percentage'],
                'unique_code': unique_code,
                'redeemed_at': datetime.now().isoformat()
            })
        else:
            return jsonify({'error': 'Failed to redeem code'}), 500
            
    except Exception as e:
        logger.error(f"Error redeeming code: {e}")
        return jsonify({'error': 'Failed to process redemption'}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('../static', filename)

# Cleanup expired OTPs periodically
def cleanup_expired_data():
    """Cleanup expired OTPs and perform maintenance tasks"""
    try:
        deleted_count = otp_model.cleanup_expired_otps()
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired OTPs")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")

# Call cleanup on startup
with app.app_context():
    cleanup_expired_data()

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

if __name__ == '__main__':
    # Database is already initialized by models.create_models()
    app.run(
        debug=config.DEBUG,
        host=config.HOST,
        port=config.PORT
    )
