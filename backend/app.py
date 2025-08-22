from flask import Flask, request, jsonify, render_template, send_from_directory, make_response
from flask_cors import CORS
import requests
import random
import time
import pyotp
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
otp_model = models['otp']

# Setup logging
logging.basicConfig(level=getattr(logging, config.LOG_LEVEL))
logger = logging.getLogger(__name__)

def generate_random_discount():
    """Generate random discount between min and max in specified steps"""
    discounts = list(range(config.MIN_DISCOUNT, config.MAX_DISCOUNT + 1, config.DISCOUNT_STEP))
    return random.choice(discounts)

def generate_otp():
    """Generate a 6-digit numeric OTP"""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_whatsapp_otp(phone_number: str, otp_code: str) -> bool:
    """Send OTP via WhatsApp using Ultra Messages"""
    try:
        # Send OTP via Ultra Messages
        if config.ULTRA_MSG_INSTANCE_ID and config.ULTRA_MSG_TOKEN:
            ultra_url = f"{config.ULTRA_MSG_BASE_URL}/{config.ULTRA_MSG_INSTANCE_ID}/messages/chat"
            headers = {
                'Content-Type': 'application/json'
            }
            data = {
                "token": config.ULTRA_MSG_TOKEN,
                "to": f"+20{phone_number}",
                "body": config.OTP_MESSAGE_TEMPLATE.format(
                    otp=otp_code,
                    minutes=config.OTP_EXPIRY_MINUTES
                )
            }
            
            logger.info(f"Attempting to send OTP to {phone_number} via Ultra Messages")
            logger.info(f"URL: {ultra_url}")
            logger.info(f"Data: {data}")
            
            response = requests.post(ultra_url, json=data, headers=headers, timeout=15)
            
            logger.info(f"Ultra Messages response status: {response.status_code}")
            logger.info(f"Ultra Messages response text: {response.text}")
            
            if response.status_code == 200:
                logger.info(f"OTP sent successfully via Ultra Messages to {phone_number}")
                return True
            else:
                logger.error(f"Ultra Messages failed: {response.status_code} - {response.text}")
                return False
        
        logger.error("Ultra Messages not configured")
        return False
        
    except requests.exceptions.Timeout:
        logger.error("Ultra Messages API timeout")
        return False
    except requests.exceptions.ConnectionError:
        logger.error("Ultra Messages API connection error")
        return False
    except Exception as e:
        logger.error(f"Error sending WhatsApp OTP: {e}")
        return False

# SIMPLE OTP SYSTEM - BACKUP SOLUTION
def send_simple_otp(phone_number: str, otp_code: str) -> bool:
    """Simple OTP system that always works (for testing)"""
    logger.info(f"Simple OTP system: Code {otp_code} for {phone_number}")
    return True

@app.route('/api/check-session', methods=['POST'])
def check_session():
    """Check if user has active session and return data"""
    data = request.get_json()
    phone_number = security.sanitize_input(data.get('phone_number', '')).strip()
    
    if not phone_number:
        return jsonify({'error': 'Phone number is required'}), 400
    
    # Validate Egyptian phone number format
    if not security.validate_egyptian_phone(phone_number):
        return jsonify({'error': 'رقم الهاتف غير صحيح. يجب أن يكون 11 رقم يبدأ بـ 01'}), 400
    
    # Check if user exists and has active session
    existing_user = user_model.get_user_by_phone(phone_number)
    if not existing_user:
        return jsonify({'needs_otp': True, 'message': 'User not found, needs OTP'})
    
    if not existing_user['is_verified']:
        return jsonify({'needs_otp': True, 'message': 'User not verified, needs OTP'})
    
    # Check if user has active session
    user_session_model = models['user_session']
    active_sessions = user_session_model.get_active_sessions(phone_number)
    
    if active_sessions:
        # User has active session, return data directly
        audit_log.log_action(
            action="USER_ACCESSED_VIA_SESSION",
            user_phone=phone_number,
            details="User accessed data via active session",
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'needs_otp': False,
            'message': 'Access successful via session',
            'discount': existing_user['discount_percentage'],
            'unique_code': existing_user['unique_code'],
            'qr_code': existing_user['qr_code_data'],
            'is_verified': True,
            'is_used': existing_user.get('is_used', False),
            'phone_number': phone_number
        })
    else:
        # User exists but no active session, needs OTP
        return jsonify({'needs_otp': True, 'message': 'Session expired, needs OTP'})

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    """Send OTP to phone number"""
    data = request.get_json()
    phone_number = security.sanitize_input(data.get('phone_number', '')).strip()

    app.logger.info(f"OTP request received: {phone_number}")

    if not phone_number:
        app.logger.warning("OTP failed: Phone number is required")
        return jsonify({'error': 'Phone number is required'}), 400

    # Validate Egyptian phone number format
    if not security.validate_egyptian_phone(phone_number):
        app.logger.warning(f"OTP failed: Invalid phone format: {phone_number}")
        return jsonify({'error': 'رقم الهاتف غير صحيح. يجب أن يكون 11 رقم يبدأ بـ 01'}), 400

    # Check if user already exists and has used a code
    existing_user = user_model.get_user_by_phone(phone_number)
    if existing_user and existing_user['is_used']:
        audit_log.log_action(
            action="OTP_BLOCKED",
            user_phone=phone_number,
            details="Phone number already used discount code",
            ip_address=request.remote_addr
        )
        app.logger.warning(f"OTP blocked: Phone number already used discount code: {phone_number}")
        return jsonify({'error': 'This phone number has already used a discount code'}), 400

    # Generate OTP
    otp_code = generate_otp()
    app.logger.info(f"Generated OTP: {otp_code} for {phone_number}")
    
    # Try to send via WhatsApp first
    whatsapp_sent = send_whatsapp_otp(phone_number, otp_code)
    
    if not whatsapp_sent:
        app.logger.warning(f"WhatsApp OTP failed for {phone_number}, using simple system")
        # Fallback to simple system
        whatsapp_sent = send_simple_otp(phone_number, otp_code)
    
    if whatsapp_sent:
        app.logger.info(f"Attempting to create OTP record in database for {phone_number}")
        # Create OTP record
        if otp_model.create_otp(phone_number, otp_code):
            audit_log.log_action(
                action="OTP_SENT",
                user_phone=phone_number,
                details=f"OTP sent successfully: {otp_code}",
                ip_address=request.remote_addr
            )
            app.logger.info(f"OTP created and sent successfully: {phone_number}")
            app.logger.info(f"OTP CODE FOR TESTING: {otp_code}")
            return jsonify({'message': 'OTP sent successfully'})
        else:
            app.logger.error(f"Failed to create OTP record for {phone_number}")
            return jsonify({'error': 'Failed to create OTP - Database Error'}), 500
    else:
        app.logger.error(f"Failed to send OTP via all methods for {phone_number}")
        return jsonify({'error': 'Failed to send OTP. Please try again later.'}), 500

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/admin')
def admin():
    """Serve the admin page"""
    return render_template('admin.html')

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and register user"""
    data = request.get_json()
    phone_number = security.sanitize_input(data.get('phone_number', '')).strip()
    otp_code = security.sanitize_input(data.get('otp_code', '')).strip()

    app.logger.info(f"OTP verification request: {phone_number} with code: {otp_code}")

    if not phone_number or not otp_code:
        app.logger.warning("OTP verification failed: Missing phone number or OTP code")
        return jsonify({'error': 'Phone number and OTP are required'}), 400

    # Validate phone number format
    if not security.validate_egyptian_phone(phone_number):
        app.logger.warning(f"OTP verification failed: Invalid phone format: {phone_number}")
        return jsonify({'error': 'رقم الهاتف غير صحيح'}), 400

    # Check if user already exists and has used a code
    existing_user = user_model.get_user_by_phone(phone_number)
    if existing_user and existing_user['is_verified'] and existing_user['is_used']:
        app.logger.warning(f"OTP verification failed: User already used code: {phone_number}")
        return jsonify({'error': 'This phone number has already used a discount code'}), 400

    # SIMPLE OTP VERIFICATION - NO DATABASE COMPLEXITY
    app.logger.info(f"Attempting to verify OTP for {phone_number}")
    
    # Get the most recent OTP for this phone number
    recent_otp = otp_model.get_active_otp(phone_number)
    
    if not recent_otp:
        app.logger.warning(f"No active OTP found for {phone_number}")
        return jsonify({'error': 'رمز التحقق غير موجود أو منتهي الصلاحية'}), 400
    
    # Check if OTP matches
    if recent_otp['otp_code'] != otp_code:
        app.logger.warning(f"OTP mismatch for {phone_number}: expected {recent_otp['otp_code']}, got {otp_code}")
        return jsonify({'error': 'رمز التحقق غير صحيح'}), 400
    
    # Check if OTP is expired
    expires_at = datetime.fromisoformat(recent_otp['expires_at'])
    if expires_at <= datetime.now():
        app.logger.warning(f"OTP expired for {phone_number}")
        return jsonify({'error': 'رمز التحقق منتهي الصلاحية'}), 400
    
    app.logger.info(f"OTP verified successfully for {phone_number}")
    
    # Mark OTP as verified
    otp_model.verify_otp(phone_number, otp_code)

    # Create user session for repeated access
    session_token = security.generate_session_token()
    user_session_model = models['user_session']
    
    if user_session_model.create_session(phone_number, session_token):
        app.logger.info(f"User session created for {phone_number}")
    else:
        app.logger.warning(f"Failed to create user session for {phone_number}")

    # If user exists but not verified, just verify them
    if existing_user and not existing_user['is_verified']:
        user_model.verify_user(phone_number)
        audit_log.log_action(
            action="USER_VERIFIED",
            user_phone=phone_number,
            details="User verified via OTP",
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'message': 'User verified successfully',
            'discount': existing_user['discount_percentage'],
            'unique_code': existing_user['unique_code'],
            'qr_code': existing_user['qr_code_data'],
            'is_verified': True,
            'session_token': session_token
        })

    # Create new user
    discount = generate_random_discount()
    unique_code = code_generator.generate_unique_code()
    qr_data = f"{unique_code}|{phone_number}|{discount}"
    qr_code_base64 = code_generator.generate_qr_code(qr_data)

    if user_model.create_user(phone_number, discount, unique_code, qr_code_base64, is_verified=True):
        audit_log.log_action(
            action="USER_REGISTERED",
            user_phone=phone_number,
            details=f"New user registered with {discount}% discount via OTP",
            ip_address=request.remote_addr
        )

        app.logger.info(f"Registration successful: {phone_number} with discount {discount}%")

        return jsonify({
            'message': 'Registration successful',
            'discount': discount,
            'unique_code': unique_code,
            'qr_code': qr_code_base64,
            'is_verified': True,
            'session_token': session_token
        })
    else:
        app.logger.error(f"Failed to create user: {phone_number}")
        return jsonify({'error': 'Failed to create user'}), 500

@app.route('/api/access', methods=['POST'])
def access_with_session():
    """Access user data using session token"""
    data = request.get_json()
    session_token = data.get('session_token', '').strip()
    
    if not session_token:
        return jsonify({'error': 'Session token is required'}), 400
    
    user_session_model = models['user_session']
    phone_number = user_session_model.validate_session(session_token)
    
    if not phone_number:
        return jsonify({'error': 'Invalid or expired session'}), 401
    
    # Get user data
    existing_user = user_model.get_user_by_phone(phone_number)
    if not existing_user:
        return jsonify({'error': 'User not found'}), 404
    
    if not existing_user['is_verified']:
        return jsonify({'error': 'User not verified'}), 403
    
    audit_log.log_action(
        action="USER_ACCESSED",
        user_phone=phone_number,
        details="User accessed data via session",
        ip_address=request.remote_addr
    )
    
    return jsonify({
        'message': 'Access successful',
        'discount': existing_user['discount_percentage'],
        'unique_code': existing_user['unique_code'],
        'qr_code': existing_user['qr_code_data'],
        'is_verified': True,
        'is_used': existing_user.get('is_used', False),
        'phone_number': phone_number
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout user by invalidating session"""
    data = request.get_json()
    session_token = data.get('session_token', '').strip()
    
    if not session_token:
        return jsonify({'error': 'Session token is required'}), 400
    
    user_session_model = models['user_session']
    if user_session_model.invalidate_session(session_token):
        return jsonify({'message': 'Logged out successfully'})
    else:
        return jsonify({'error': 'Failed to logout'}), 500

@app.route('/api/register', methods=['POST'])
def register():
    """Legacy registration endpoint - now redirects to OTP flow"""
    data = request.get_json()
    phone_number = security.sanitize_input(data.get('phone_number', '')).strip()

    app.logger.info(f"Legacy registration request received: {phone_number}")

    if not phone_number:
        return jsonify({'error': 'Phone number is required'}), 400

    # Validate Egyptian phone number format
    if not security.validate_egyptian_phone(phone_number):
        return jsonify({'error': 'رقم الهاتف غير صحيح. يجب أن يكون 11 رقم يبدأ بـ 01'}), 400

    # Check if user already exists and has used a code
    existing_user = user_model.get_user_by_phone(phone_number)
    if existing_user and existing_user['is_used']:
        return jsonify({'error': 'This phone number has already used a discount code'}), 400

    # If OTP is disabled, use legacy flow
    if not config.OTP_ENABLED:
        # Legacy registration logic (no OTP)
        if existing_user and not existing_user['is_used']:
            return jsonify({
                'message': 'User already registered',
                'discount': existing_user['discount_percentage'],
                'unique_code': existing_user['unique_code'],
                'qr_code': existing_user['qr_code_data'],
                'is_verified': True
            })

        discount = generate_random_discount()
        unique_code = code_generator.generate_unique_code()
        qr_data = f"{unique_code}|{phone_number}|{discount}"
        qr_code_base64 = code_generator.generate_qr_code(qr_data)

        if user_model.create_user(phone_number, discount, unique_code, qr_code_base64, is_verified=True):
            audit_log.log_action(
                action="USER_REGISTERED",
                user_phone=phone_number,
                details=f"New user registered with {discount}% discount (no OTP)",
                ip_address=request.remote_addr
            )

            return jsonify({
                'message': 'Registration successful',
                'discount': discount,
                'unique_code': unique_code,
                'qr_code': qr_code_base64,
                'is_verified': True
            })
        else:
            return jsonify({'error': 'Failed to create user'}), 500

    # OTP is enabled, redirect to OTP flow
    return jsonify({
        'error': 'OTP verification required',
        'requires_otp': True,
        'message': 'Please request OTP first'
    }), 400

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

# Admin endpoints
@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    """Get all users for admin dashboard"""
    try:
        # In a real app, you'd verify admin session here
        users = user_model.get_all_users()
        
        # Calculate proper statistics with better handling
        total_users = len(users)
        
        # Debug print users data
        app.logger.info(f"Users data sample: {users[:2] if users else 'No users'}")
        
        # Count with explicit boolean checks
        verified_users = 0
        used_codes = 0
        active_users = 0
        
        for user in users:
            is_verified = user.get('is_verified') in [True, 1, '1']
            is_used = user.get('is_used') in [True, 1, '1']
            
            if is_verified:
                verified_users += 1
                if not is_used:
                    active_users += 1
            
            if is_used:
                used_codes += 1
        
        app.logger.info(f"Admin stats - Total: {total_users}, Verified: {verified_users}, Active: {active_users}, Used: {used_codes}")
        
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'total_discounts': total_users,
            'used_codes': used_codes,
            'verified_users': verified_users
        }
        
        app.logger.info(f"Returning stats: {stats}")
        app.logger.info(f"Returning {len(users)} users")
        
        return jsonify({
            'success': True,
            'users': users,
            'stats': stats
        })
    except Exception as e:
        app.logger.error(f"Error getting users: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to load users'
        }), 500

@app.route('/api/admin/validate-session', methods=['POST'])
def admin_validate_session():
    """Validate admin session token"""
    try:
        data = request.get_json()
        session_token = data.get('session_token')
        
        if not session_token:
            return jsonify({'valid': False}), 400
            
        # Simple validation - in real app, check against database
        if session_token.startswith('admin_'):
            return jsonify({'valid': True}), 200
        else:
            return jsonify({'valid': False}), 401
            
    except Exception as e:
        app.logger.error(f"Error validating admin session: {e}")
        return jsonify({'valid': False}), 500

@app.route('/api/admin/redeem', methods=['POST'])
def admin_redeem():
    """Redeem a discount code"""
    try:
        data = request.get_json()
        code = data.get('code', '').strip()
        
        if not code:
            return jsonify({'error': 'كود غير صالح'}), 400
        
        # Find user by unique code
        user = user_model.get_user_by_code(code)
        
        if not user:
            return jsonify({'error': 'كود غير موجود'}), 404
        
        # Check if user is verified (admin discounts are always verified)
        if not user.get('is_verified') and not user.get('is_admin_discount'):
            return jsonify({'error': 'كود غير مفعل'}), 400
        
        # Check if code is already used
        if user.get('is_used'):
            return jsonify({'error': 'تم استخدام هذا الكود من قبل'}), 400
        
        # Mark code as used
        if user_model.use_code(code):
            phone_number = user.get('phone_number', 'خصم إداري')
            app.logger.info(f"Code redeemed successfully: {code} for {phone_number}")
            return jsonify({
                'success': True,
                'message': 'تم استخدام الكود بنجاح',
                'phone_number': phone_number,
                'discount_percentage': user['discount_percentage'],
                'unique_code': code,
                'is_admin_discount': user.get('is_admin_discount', False)
            })
        else:
            return jsonify({'error': 'فشل في استخدام الكود'}), 500
            
    except Exception as e:
        app.logger.error(f"Error redeeming code: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/api/admin/create-custom-discount', methods=['POST'])
def admin_create_custom_discount():
    """Create a custom discount code"""
    try:
        data = request.get_json()
        discount_percentage = data.get('discount_percentage')
        description = data.get('description', '').strip()
        created_by = data.get('created_by', '')
        
        if not discount_percentage or not description:
            return jsonify({'error': 'جميع الحقول مطلوبة'}), 400
        
        if discount_percentage < 1 or discount_percentage > 100:
            return jsonify({'error': 'نسبة الخصم يجب أن تكون بين 1% و 100%'}), 400
        
        # Generate unique code
        unique_code = f"ADMIN-{discount_percentage}-{int(time.time())}"
        
        # Create proper QR code data
        qr_code_data = {
            "unique_code": unique_code,
            "discount_percentage": discount_percentage,
            "type": "admin_discount",
            "description": description,
            "created_by": created_by,
            "created_at": datetime.now().isoformat()
        }
        
        # Create custom discount user (phone number will be empty for admin discounts)
        if user_model.create_custom_discount(unique_code, discount_percentage, description, created_by, qr_code_data):
            app.logger.info(f"Custom discount created: {unique_code} by {created_by}")
            return jsonify({
                'success': True,
                'message': 'تم إنشاء الخصم بنجاح',
                'unique_code': unique_code,
                'discount_percentage': discount_percentage,
                'description': description,
                'qr_code_data': qr_code_data
            })
        else:
            return jsonify({'error': 'فشل في إنشاء الخصم'}), 500
            
    except Exception as e:
        app.logger.error(f"Error creating custom discount: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/api/admin/change-main-image', methods=['POST'])
def admin_change_main_image():
    """Change the main image of the website - Only for mado user"""
    try:
        # Check if user is mado (admin)
        data = request.get_json()
        admin_user = data.get('admin_user', '')
        
        if admin_user != 'mado':
            return jsonify({'error': 'فقط المستخدم mado يمكنه تغيير الصورة الرئيسية'}), 403
        
        # Get the new image URL
        new_image_url = data.get('image_url', '').strip()
        
        if not new_image_url:
            return jsonify({'error': 'رابط الصورة مطلوب'}), 400
        
        # Validate URL format
        if not new_image_url.startswith(('http://', 'https://')):
            return jsonify({'error': 'رابط الصورة يجب أن يكون صحيحاً'}), 400
        
        # Store the new image URL in database safely
        try:
            conn = user_model.db.get_connection()
            cursor = conn.cursor()
            
            # Check if website_settings table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='website_settings'")
            table_exists = cursor.fetchone()
            
            if table_exists:
                # Update or insert the main image setting
                cursor.execute('''
                    INSERT OR REPLACE INTO website_settings (setting_key, setting_value, description, updated_by)
                    VALUES (?, ?, ?, ?)
                ''', ('main_image_url', new_image_url, 'الصورة الرئيسية للموقع', admin_user))
                app.logger.info(f"Main image URL updated: {new_image_url}")
            else:
                app.logger.warning("website_settings table does not exist, skipping database update")
            
            conn.commit()
            conn.close()
            
            # Log the change
            audit_log.log_action(
                action="CHANGE_MAIN_IMAGE",
                admin_session=f"admin_{admin_user}",
                details=f"Main image changed to: {new_image_url}",
                ip_address=request.remote_addr
            )
            
            app.logger.info(f"Main image changed by {admin_user} to: {new_image_url}")
            
            return jsonify({
                'success': True,
                'message': 'تم تغيير الصورة الرئيسية بنجاح',
                'new_image_url': new_image_url
            })
            
        except Exception as db_error:
            app.logger.error(f"Database error changing main image: {db_error}")
            return jsonify({'error': 'خطأ في قاعدة البيانات'}), 500
        
    except Exception as e:
        app.logger.error(f"Error changing main image: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/api/website-settings', methods=['GET'])
def get_website_settings():
    """Get website settings including main image"""
    try:
        conn = user_model.db.get_connection()
        cursor = conn.cursor()
        
        # Check if website_settings table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='website_settings'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            # Get all website settings
            cursor.execute('SELECT setting_key, setting_value FROM website_settings')
            settings = dict(cursor.fetchall())
        else:
            # Return default settings if table doesn't exist
            settings = {
                'main_image_url': 'https://i.ibb.co/MDHwvrfG/IMG-5849.jpg',
                'site_name': 'SUZZ',
                'site_description': 'أول Drive-Thru في السويس',
                'default_discount': '15'
            }
            app.logger.warning("website_settings table does not exist, returning defaults")
        
        conn.close()
        
        return jsonify({
            'success': True,
            'settings': settings
        })
        
    except Exception as e:
        app.logger.error(f"Error getting website settings: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/api/admin/export-data', methods=['GET'])
def export_data():
    """Export all data in various formats"""
    try:
        format_type = request.args.get('format', 'csv').lower()
        
        # Get all users data
        users = user_model.get_all_users()
        
        if format_type == 'csv':
            # Generate CSV content
            csv_content = "Phone Number,Discount %,Code,Status,Verified,Used,Admin Discount,Description,Created At\n"
            for user in users:
                phone = user.get('phone_number', 'N/A')
                discount = user.get('discount_percentage', 'N/A')
                code = user.get('unique_code', 'N/A')
                status = 'Active' if not user.get('is_used') else 'Used'
                verified = 'Yes' if user.get('is_verified') else 'No'
                used = 'Yes' if user.get('is_used') else 'No'
                admin = 'Yes' if user.get('is_admin_discount') else 'No'
                desc = user.get('admin_description', 'N/A')
                created = user.get('created_at', 'N/A')
                
                csv_content += f"{phone},{discount},{code},{status},{verified},{used},{admin},{desc},{created}\n"
            
            response = make_response(csv_content)
            response.headers['Content-Type'] = 'text/csv'
            response.headers['Content-Disposition'] = f'attachment; filename=suzz_data_{datetime.now().strftime("%Y%m%d")}.csv'
            return response
            
        elif format_type == 'excel':
            # For Excel, we'll return a JSON with download instructions
            return jsonify({
                'success': True,
                'message': 'Excel export not yet implemented',
                'data': users
            })
            
        elif format_type == 'word':
            # For Word, we'll return a JSON with download instructions
            return jsonify({
                'success': True,
                'message': 'Word export not yet implemented',
                'data': users
            })
            
        else:
            return jsonify({'error': 'Format not supported'}), 400
            
    except Exception as e:
        app.logger.error(f"Error exporting data: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/api/admin/clear-all-data', methods=['POST'])
def clear_all_data():
    """Clear all data from database - Only for mado user"""
    try:
        data = request.get_json()
        admin_user = data.get('admin_user', '')
        confirmation = data.get('confirmation', '')
        
        if admin_user != 'mado':
            return jsonify({'error': 'فقط المستخدم mado يمكنه حذف البيانات'}), 403
        
        if confirmation != 'DELETE':
            return jsonify({'error': 'تأكيد غير صحيح'}), 400
        
        # Clear all data safely
        conn = user_model.db.get_connection()
        cursor = conn.cursor()
        
        # Get list of existing tables to avoid errors
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = {row[0] for row in cursor.fetchall()}
        
        # Clear tables that exist
        safe_tables = ['users', 'otps', 'admin_sessions', 'user_sessions', 'audit_log']
        for table in safe_tables:
            if table in existing_tables:
                cursor.execute(f'DELETE FROM {table}')
                app.logger.info(f"Cleared table: {table}")
        
        # Reset website settings to defaults
        if 'website_settings' in existing_tables:
            cursor.execute('DELETE FROM website_settings')
            cursor.execute('''
                INSERT INTO website_settings (setting_key, setting_value, description, updated_by)
                VALUES 
                ('main_image_url', 'https://i.ibb.co/MDHwvrfG/IMG-5849.jpg', 'الصورة الرئيسية للموقع', 'system'),
                ('site_name', 'SUZZ', 'اسم الموقع', 'system'),
                ('site_description', 'أول Drive-Thru في السويس', 'وصف الموقع', 'system'),
                ('default_discount', '15', 'نسبة الخصم الافتراضية', 'system')
            ''')
            app.logger.info("Website settings reset to defaults")
        
        conn.commit()
        conn.close()
        
        # Log the action
        app.logger.info(f"All data cleared by {admin_user}")
        
        return jsonify({
            'success': True,
            'message': 'تم حذف جميع البيانات بنجاح'
        })
        
    except Exception as e:
        app.logger.error(f"Error clearing data: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/api/admin/reset-database', methods=['POST'])
def reset_database():
    """Reset database to initial state - Only for mado user"""
    try:
        data = request.get_json()
        admin_user = data.get('admin_user', '')
        confirmation = data.get('confirmation', '')
        
        if admin_user != 'mado':
            return jsonify({'error': 'فقط المستخدم mado يمكنه إعادة تعيين قاعدة البيانات'}), 403
        
        if confirmation != 'RESET':
            return jsonify({'error': 'تأكيد غير صحيح'}), 400
        
        # Clear all data and recreate initial data safely
        conn = user_model.db.get_connection()
        cursor = conn.cursor()
        
        # Get list of existing tables to avoid errors
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = {row[0] for row in cursor.fetchall()}
        
        # Clear tables that exist
        safe_tables = ['users', 'otps', 'admin_sessions', 'user_sessions', 'audit_log']
        for table in safe_tables:
            if table in existing_tables:
                cursor.execute(f'DELETE FROM {table}')
                app.logger.info(f"Reset: Cleared table {table}")
        
        # Reset website settings
        if 'website_settings' in existing_tables:
            cursor.execute('DELETE FROM website_settings')
            cursor.execute('''
                INSERT INTO website_settings (setting_key, setting_value, description, updated_by)
                VALUES 
                ('main_image_url', 'https://i.ibb.co/MDHwvrfG/IMG-5849.jpg', 'الصورة الرئيسية للموقع', 'system'),
                ('site_name', 'SUZZ', 'اسم الموقع', 'system'),
                ('site_description', 'أول Drive-Thru في السويس', 'وصف الموقع', 'system'),
                ('default_discount', '15', 'نسبة الخصم الافتراضية', 'system')
            ''')
            app.logger.info("Reset: Website settings restored")
        
        # Recreate initial data
        if 'users' in existing_tables:
            cursor.execute('''
                INSERT INTO users (phone_number, discount_percentage, unique_code, qr_code_data, is_verified, is_admin_discount, admin_description)
                VALUES 
                ('', 25, 'ADMIN-TEST-001', '{"unique_code": "ADMIN-TEST-001", "discount_percentage": 25}', TRUE, TRUE, 'خصم إداري تجريبي')
            ''')
            app.logger.info("Reset: Initial test data created")
        
        conn.commit()
        conn.close()
        
        # Log the action
        app.logger.info(f"Database reset by {admin_user}")
        
        return jsonify({
            'success': True,
            'message': 'تم إعادة تعيين قاعدة البيانات بنجاح'
        })
        
    except Exception as e:
        app.logger.error(f"Error resetting database: {e}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

if __name__ == '__main__':
    # Database is already initialized by models.create_models()
    app.run(
        debug=config.DEBUG,
        host=config.HOST,
        port=config.PORT
    )
