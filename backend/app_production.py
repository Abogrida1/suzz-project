from flask import Flask, request, jsonify, render_template, send_from_directory, make_response
from flask_cors import CORS
import requests
import random
import time
import pyotp
from datetime import datetime, timedelta
import logging
import os
from pathlib import Path

# Import our custom modules
from config_production import production_config
from models import create_models

# Initialize Flask app
app = Flask(__name__, template_folder='../templates', static_folder='../static')

# Load production configuration
app.config.from_object(production_config)

# Enable CORS
CORS(app, origins=production_config.CORS_ORIGINS)

# Ensure database directory exists
db_dir = Path(production_config.DATABASE_PATH).parent
db_dir.mkdir(parents=True, exist_ok=True)

# Initialize models with production config
try:
    models = create_models(production_config.DATABASE_PATH)
    user_model = models['user']
    audit_log = models['audit_log']
    code_generator = models['code_generator']
    security = models['security']
    otp_model = models['otp']
    print(f"✅ Database initialized successfully at: {production_config.DATABASE_PATH}")
except Exception as e:
    print(f"❌ Database initialization failed: {e}")
    # Fallback to basic models
    models = None
    user_model = None
    audit_log = None
    code_generator = None
    security = None
    otp_model = None

# Setup logging
logging.basicConfig(
    level=getattr(logging, production_config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def generate_random_discount():
    """Generate random discount between min and max in specified steps"""
    discounts = list(range(production_config.MIN_DISCOUNT, production_config.MAX_DISCOUNT + 1, production_config.DISCOUNT_STEP))
    return random.choice(discounts)

def generate_otp():
    """Generate a 6-digit numeric OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_whatsapp_otp(phone_number: str, otp_code: str) -> bool:
    """Send OTP via WhatsApp using Ultra Messages"""
    try:
        # Send OTP via Ultra Messages
        if production_config.ULTRA_MSG_INSTANCE_ID and production_config.ULTRA_MSG_TOKEN:
            ultra_url = f"{production_config.ULTRA_MSG_BASE_URL}/{production_config.ULTRA_MSG_INSTANCE_ID}/messages/chat"
            headers = {
                'Content-Type': 'application/json'
            }
            data = {
                "token": production_config.ULTRA_MSG_TOKEN,
                "to": f"+20{phone_number}",
                "body": production_config.OTP_MESSAGE_TEMPLATE.format(
                    otp=otp_code,
                    minutes=production_config.OTP_EXPIRY_MINUTES
                )
            }
            
            logger.info(f"Attempting to send OTP to {phone_number} via Ultra Messages")
            logger.info(f"URL: {ultra_url}")
            
            response = requests.post(ultra_url, json=data, headers=headers, timeout=15)
            
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
    """Check if admin session is valid"""
    try:
        data = request.get_json()
        session_token = data.get('session_token')
        
        if not session_token:
            return jsonify({'valid': False, 'error': 'No session token provided'}), 400
        
        # Check if models are available
        if not models:
            return jsonify({'valid': False, 'error': 'Database not available'}), 500
        
        # Check session validity
        is_valid = security.check_admin_session(session_token)
        
        if is_valid:
            return jsonify({'valid': True, 'message': 'Session is valid'})
        else:
            return jsonify({'valid': False, 'error': 'Invalid or expired session'})
            
    except Exception as e:
        logger.error(f"Error checking session: {e}")
        return jsonify({'valid': False, 'error': 'Internal server error'}), 500

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password required'}), 400
        
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Check credentials
        if username == 'mado' and password == production_config.ADMIN_PASSWORD:
            session_token = security.create_admin_session()
            return jsonify({
                'success': True, 
                'message': 'Login successful',
                'session_token': session_token,
                'user_type': 'mado'
            })
        elif username == 'suzz' and password == 'Suzz2212':
            session_token = security.create_admin_session()
            return jsonify({
                'success': True, 
                'message': 'Login successful',
                'session_token': session_token,
                'user_type': 'suzz'
            })
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        logger.error(f"Error in admin login: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    """Get all users for admin panel"""
    try:
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Get all users
        users = user_model.get_all_users()
        
        # Calculate statistics
        total_users = len(users)
        active_users = len([u for u in users if not u['is_used']])
        used_codes = len([u for u in users if u['is_used']])
        total_discounts = sum(u['discount_percentage'] for u in users)
        
        # Admin discounts
        admin_discounts = len([u for u in users if u.get('is_admin_discount', False)])
        
        # Pending verification
        pending_verification = len([u for u in users if not u['is_verified']])
        
        # Today's registrations
        today = datetime.now().date()
        today_registrations = len([u for u in users if datetime.fromisoformat(u['created_at']).date() == today])
        
        # This week's registrations
        week_ago = today - timedelta(days=7)
        this_week_registrations = len([u for u in users if datetime.fromisoformat(u['created_at']).date() >= week_ago])
        
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'used_codes': used_codes,
            'total_discounts': total_discounts,
            'admin_discounts': admin_discounts,
            'pending_verification': pending_verification,
            'today_registrations': today_registrations,
            'this_week_registrations': this_week_registrations
        }
        
        return jsonify({
            'success': True,
            'users': users,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting admin users: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/admin/create-discount', methods=['POST'])
def create_admin_discount():
    """Create admin discount"""
    try:
        data = request.get_json()
        discount_percentage = data.get('discount_percentage')
        description = data.get('description', 'خصم إداري')
        
        if not discount_percentage:
            return jsonify({'success': False, 'error': 'Discount percentage required'}), 400
        
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Create admin discount
        result = user_model.create_admin_discount(discount_percentage, description)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Admin discount created successfully',
                'user': result['user']
            })
        else:
            return jsonify({'success': False, 'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Error creating admin discount: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/admin/change-image', methods=['POST'])
def change_main_image():
    """Change main website image"""
    try:
        data = request.get_json()
        new_image_url = data.get('new_image_url')
        
        if not new_image_url:
            return jsonify({'success': False, 'error': 'New image URL required'}), 400
        
        # Validate URL
        if not new_image_url.startswith(('http://', 'https://')):
            return jsonify({'success': False, 'error': 'Invalid URL format'}), 400
        
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Update website settings
        result = audit_log.update_website_setting('main_image_url', new_image_url)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Main image updated successfully',
                'new_image_url': new_image_url
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to update image'}), 500
            
    except Exception as e:
        logger.error(f"Error changing main image: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/admin/clear-data', methods=['POST'])
def clear_all_data():
    """Clear all data (admin only)"""
    try:
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Clear all data
        result = user_model.clear_all_data()
        
        if result:
            return jsonify({
                'success': True,
                'message': 'All data cleared successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to clear data'}), 500
            
    except Exception as e:
        logger.error(f"Error clearing data: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/admin/reset-database', methods=['POST'])
def reset_database():
    """Reset database (admin only)"""
    try:
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Reset database
        result = user_model.reset_database()
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Database reset successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to reset database'}), 500
            
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/register', methods=['POST'])
def register_user():
    """User registration endpoint"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        
        if not phone_number:
            return jsonify({'success': False, 'error': 'Phone number required'}), 400
        
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Check if user already exists
        existing_user = user_model.get_user_by_phone(phone_number)
        if existing_user:
            return jsonify({'success': False, 'error': 'User already registered'}), 400
        
        # Generate OTP
        otp_code = generate_otp()
        expires_at = datetime.now() + timedelta(minutes=production_config.OTP_EXPIRY_MINUTES)
        
        # Save OTP
        otp_model.save_otp(phone_number, otp_code, expires_at)
        
        # Send OTP via WhatsApp
        if send_whatsapp_otp(phone_number, otp_code):
            return jsonify({
                'success': True,
                'message': 'OTP sent successfully',
                'phone_number': phone_number
            })
        else:
            # Fallback to simple OTP
            send_simple_otp(phone_number, otp_code)
            return jsonify({
                'success': True,
                'message': 'OTP sent via fallback method',
                'phone_number': phone_number,
                'otp_code': otp_code  # Only for testing
            })
            
    except Exception as e:
        logger.error(f"Error in user registration: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and create user"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        otp_code = data.get('otp_code')
        
        if not phone_number or not otp_code:
            return jsonify({'success': False, 'error': 'Phone number and OTP required'}), 400
        
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Verify OTP
        if not otp_model.verify_otp(phone_number, otp_code):
            return jsonify({'success': False, 'error': 'Invalid or expired OTP'}), 400
        
        # Generate discount
        discount_percentage = generate_random_discount()
        
        # Create user
        result = user_model.create_user(phone_number, discount_percentage)
        
        if result['success']:
            # Mark OTP as verified
            otp_model.mark_otp_verified(phone_number, otp_code)
            
            return jsonify({
                'success': True,
                'message': 'User created successfully',
                'user': result['user']
            })
        else:
            return jsonify({'success': False, 'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Error in OTP verification: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/redeem-code', methods=['POST'])
def redeem_code():
    """Redeem discount code"""
    try:
        data = request.get_json()
        unique_code = data.get('unique_code')
        
        if not unique_code:
            return jsonify({'success': False, 'error': 'Unique code required'}), 400
        
        # Check if models are available
        if not models:
            return jsonify({'success': False, 'error': 'Database not available'}), 500
        
        # Redeem code
        result = user_model.redeem_code(unique_code)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Code redeemed successfully',
                'discount_percentage': result['discount_percentage']
            })
        else:
            return jsonify({'success': False, 'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Error redeeming code: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/')
def index():
    """Main website page"""
    try:
        # Check if models are available
        if not models:
            return render_template('index.html', main_image_url='https://i.ibb.co/MDHwvrfG/IMG-5849.jpg')
        
        # Get main image URL
        main_image_url = audit_log.get_website_setting('main_image_url', 'https://i.ibb.co/MDHwvrfG/IMG-5849.jpg')
        
        return render_template('index.html', main_image_url=main_image_url)
        
    except Exception as e:
        logger.error(f"Error rendering index: {e}")
        return render_template('index.html', main_image_url='https://i.ibb.co/MDHwvrfG/IMG-5849.jpg')

@app.route('/admin')
def admin():
    """Admin panel page"""
    return render_template('admin.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('../static', filename)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        # Check if models are available
        if not models:
            return jsonify({
                'status': 'warning',
                'message': 'Database not available',
                'database_path': production_config.DATABASE_PATH,
                'timestamp': datetime.now().isoformat()
            }), 200
        
        # Check database connection
        test_connection = user_model.get_all_users()
        
        return jsonify({
            'status': 'healthy',
            'message': 'All systems operational',
            'database_path': production_config.DATABASE_PATH,
            'database_connected': True,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'message': 'System error',
            'error': str(e),
            'database_path': production_config.DATABASE_PATH,
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print(f"🚀 Starting SUZZ Cafe Production Server")
    print(f"📁 Database path: {production_config.DATABASE_PATH}")
    print(f"🌐 Server: {production_config.HOST}:{production_config.PORT}")
    print(f"🔧 Environment: {production_config.FLASK_ENV}")
    
    app.run(
        host=production_config.HOST,
        port=production_config.PORT,
        debug=production_config.DEBUG
    )
