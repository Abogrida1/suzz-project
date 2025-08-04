from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import requests
import random
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
    """Send OTP via WhatsApp using GreenAPI"""
    try:
        # Format phone number for WhatsApp (add +20 for Egypt if needed)
        if not phone_number.startswith('+'):
            if phone_number.startswith('01'):
                formatted_phone = f"+2{phone_number}"
            else:
                formatted_phone = f"+20{phone_number}"
        else:
            formatted_phone = phone_number
        
        url = f"{config.GREEN_API_BASE_URL}/waInstance{config.GREEN_API_INSTANCE_ID}/sendMessage/{config.GREEN_API_TOKEN}"
        
        # Format message using template
        message = config.OTP_MESSAGE_TEMPLATE.format(
            otp=otp,
            minutes=config.OTP_EXPIRY_MINUTES
        )
        
        payload = {
            "chatId": f"{formatted_phone}@c.us",
            "message": message
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        # Log the attempt
        audit_log.log_action(
            action="OTP_SENT",
            user_phone=phone_number,
            details=f"WhatsApp OTP sent to {formatted_phone}",
            ip_address=request.remote_addr
        )
        
        return response.status_code == 200
        
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        audit_log.log_action(
            action="OTP_SEND_FAILED",
            user_phone=phone_number,
            details=f"Failed to send OTP: {str(e)}",
            ip_address=request.remote_addr
        )
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
    """Register a new user and send OTP"""
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
            # User exists but hasn't used the code yet
            return jsonify({
                'message': 'User already registered',
                'discount': existing_user['discount_percentage'],
                'unique_code': existing_user['unique_code'],
                'qr_code': existing_user['qr_code_data'],
                'is_verified': existing_user['is_verified']
            })
    
    # Generate new user data
    discount = generate_random_discount()
    unique_code = code_generator.generate_unique_code()
    qr_data = f"{unique_code}|{phone_number}|{discount}"
    qr_code_base64 = code_generator.generate_qr_code(qr_data)
    
    # Create new user
    if not user_model.create_user(phone_number, discount, unique_code, qr_code_base64):
        return jsonify({'error': 'Failed to create user'}), 500
    
    # Generate and send OTP
    otp = f"{random.randint(100000, 999999)}"
    
    # Store OTP
    if not otp_model.create_otp(phone_number, otp, config.OTP_EXPIRY_MINUTES):
        return jsonify({'error': 'Failed to generate OTP'}), 500
    
    # Log registration attempt
    audit_log.log_action(
        action="USER_REGISTERED",
        user_phone=phone_number,
        details=f"New user registered with {discount}% discount",
        ip_address=request.remote_addr
    )
    
    # Send OTP via WhatsApp
    if send_whatsapp_otp(phone_number, otp):
        return jsonify({
            'message': 'OTP sent successfully',
            'discount': discount,
            'unique_code': unique_code,
            'qr_code': qr_code_base64
        })
    else:
        return jsonify({'error': 'Failed to send OTP'}), 500

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP code"""
    data = request.get_json()
    phone_number = security.sanitize_input(data.get('phone_number', '')).strip()
    otp_code = security.sanitize_input(data.get('otp_code', '')).strip()
    
    if not phone_number or not otp_code:
        return jsonify({'error': 'Phone number and OTP are required'}), 400
    
    # Verify OTP using model
    if not otp_model.verify_otp(phone_number, otp_code):
        audit_log.log_action(
            action="OTP_VERIFICATION_FAILED",
            user_phone=phone_number,
            details="Invalid or expired OTP",
            ip_address=request.remote_addr
        )
        return jsonify({'error': 'Invalid or expired OTP'}), 400
    
    # Mark user as verified
    if not user_model.verify_user(phone_number):
        return jsonify({'error': 'Failed to verify user'}), 500
    
    # Get user data
    user = user_model.get_user_by_phone(phone_number)
    
    if user:
        audit_log.log_action(
            action="OTP_VERIFIED",
            user_phone=phone_number,
            details="User successfully verified",
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'message': 'OTP verified successfully',
            'discount': user['discount_percentage'],
            'unique_code': user['unique_code'],
            'qr_code': user['qr_code_data'],
            'is_verified': True
        })
    else:
        return jsonify({'error': 'User not found'}), 404

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
