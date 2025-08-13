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

    app.logger.info(f"Registration request received: {phone_number}")

    if not phone_number:
        app.logger.warning("Registration failed: Phone number is required")
        return jsonify({'error': 'Phone number is required'}), 400

    # Accept phone number as-is without validation
    normalized_phone = phone_number.strip()

    # Check if user already exists
    existing_user = user_model.get_user_by_phone(phone_number)
    if existing_user:
        if existing_user['is_used']:
            audit_log.log_action(
                action="REGISTRATION_BLOCKED",
                user_phone=normalized_phone,
                details="Phone number already used discount code",
                ip_address=request.remote_addr
            )
            app.logger.warning(f"Registration blocked: Phone number already used discount code: {normalized_phone}")
            return jsonify({'error': 'This phone number has already used a discount code'}), 400
        else:
            # User exists, return their data directly
            app.logger.info(f"User already registered: {normalized_phone}")
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
    qr_data = f"{unique_code}|{normalized_phone}|{discount}"
    qr_code_base64 = code_generator.generate_qr_code(qr_data)

    # Create new user (mark as verified directly)
    if not user_model.create_user(normalized_phone, discount, unique_code, qr_code_base64, is_verified=True):
        app.logger.error(f"Failed to create user: {normalized_phone}")
        return jsonify({'error': 'Failed to create user'}), 500

    audit_log.log_action(
        action="USER_REGISTERED",
        user_phone=normalized_phone,
        details=f"New user registered with {discount}% discount (no OTP)",
        ip_address=request.remote_addr
    )

    app.logger.info(f"Registration successful: {normalized_phone} with discount {discount}%")

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
        
        # Phone verification removed - allow all users to redeem
        pass
        
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
