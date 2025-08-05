# 🔥 Suzu Drive-Thru Kafé - Promotional Web App

A complete, production-ready promotional web application for **Suzu Drive-Thru Kafé** (سوزو كافيه) featuring WhatsApp OTP verification, random discount generation, QR code redemption, and admin management panel.

![Suzu Kafé](https://img.shields.io/badge/Suzu-Kafé-8B4513?style=for-the-badge&logo=coffee)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.3+-000000?style=for-the-badge&logo=flask&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🌟 Features

### 🎁 Customer Features
- **Phone Registration**: Egyptian phone number format (01xxxxxxxxx)
- **WhatsApp OTP**: Secure verification via WhatsApp Business API
- **Random Discounts**: 10% to 40% in 5% increments
- **QR Code Generation**: Unique codes for in-store redemption
- **One-time Use**: Each phone number can only claim once
- **Bilingual Support**: Arabic and English interface

### 👨‍💼 Admin Features
- **Secure Login**: Password-protected admin panel
- **QR Scanner**: Real-time camera scanning for code redemption
- **Manual Redemption**: Enter codes manually
- **User Management**: View all users, discounts, and redemption status
- **Real-time Stats**: Dashboard with key metrics
- **Export Data**: CSV export functionality

### 🔧 Technical Features
- **Flask Backend**: RESTful API with SQLite database
- **Modern Frontend**: TailwindCSS with responsive design
- **QR Code Integration**: Generation and scanning capabilities
- **WhatsApp Integration**: WhatsApp Business API for OTP delivery
- **Production Ready**: Hosting-ready configuration
- **Security**: Password hashing, input validation, rate limiting

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- WhatsApp Business API account (Meta Business)
- Modern web browser with camera access (for QR scanning)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/suzu-drive-thru-kafe.git
cd suzu-drive-thru-kafe
```

2. **Set up Python virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r backend/requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your GreenAPI credentials
```

5. **Run the application**
```bash
cd backend
python app.py
```

6. **Access the application**
- Customer Interface: http://localhost:5000
- Admin Panel: http://localhost:5000/admin

## 🔑 Configuration

### WhatsApp Business API Setup
1. Sign up at [Meta for Developers](https://developers.facebook.com/)
2. Create a WhatsApp Business API application
3. Get your Access Token and Phone Number ID
4. Update `.env` file:
```env
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

### Admin Access
- Default password: `Suzz2212`
- Change in `.env` file: `ADMIN_PASSWORD=your_new_password`

## 📱 User Flow

### Customer Journey
1. **Landing Page**: Beautiful coffee-themed interface
2. **Phone Entry**: Enter Egyptian phone number (01xxxxxxxxx)
3. **WhatsApp OTP**: Receive 6-digit code via WhatsApp
4. **Verification**: Enter OTP to verify phone number
5. **Discount Reveal**: Get random discount (10-40%)
6. **QR Code**: Receive unique QR code and user code
7. **Redemption**: Show QR code at café for discount

### Admin Workflow
1. **Login**: Secure password authentication
2. **Dashboard**: View statistics and user data
3. **QR Scanning**: Use camera to scan customer codes
4. **Manual Entry**: Enter codes manually if needed
5. **Redemption**: Mark codes as used
6. **Management**: View all users and export data

## 🏗️ Project Structure

```
suzu-drive-thru-kafe/
├── backend/
│   ├── app.py              # Main Flask application
│   └── requirements.txt    # Python dependencies
├── templates/
│   ├── index.html         # Customer interface
│   └── admin.html         # Admin panel
├── static/
│   ├── js/
│   │   ├── main.js        # Customer JavaScript
│   │   └── admin.js       # Admin JavaScript
│   └── css/
│       └── style.css      # Custom styles
├── .env.example           # Environment variables template
├── README.md             # This file
└── suzu_cafe.db          # SQLite database (auto-created)
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    discount_percentage INTEGER NOT NULL,
    unique_code TEXT UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL
);
```

### OTPs Table
```sql
CREATE TABLE otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🌐 API Endpoints

### Customer Endpoints
- `POST /api/register` - Register phone number and send OTP
- `POST /api/verify-otp` - Verify OTP code

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/users` - Get all users data
- `POST /api/admin/redeem` - Redeem discount code

## 🚀 Deployment

### Render (Recommended)
1. Fork this repository
2. Connect to Render
3. Set environment variables
4. Deploy automatically

### PythonAnywhere
1. Upload files to PythonAnywhere
2. Set up virtual environment
3. Configure WSGI file
4. Set environment variables

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy with one click

### Docker (Optional)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "backend/app.py"]
```

## 🔒 Security Features

- **Password Hashing**: SHA-256 for admin authentication
- **Input Validation**: Phone number and OTP format validation
- **Rate Limiting**: Prevent abuse of API endpoints
- **CORS Protection**: Configurable cross-origin requests
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

## 📊 Analytics & Monitoring

### Built-in Metrics
- Total registered users
- Verified users count
- Active discount codes
- Redeemed codes count
- Verification rate
- Redemption rate

### Export Features
- CSV export of all user data
- Timestamp tracking
- Usage statistics

## 🎨 Customization

### Branding
- Update logo URLs in templates
- Modify color scheme in CSS variables
- Change coffee shop name throughout files

### Discount Logic
```python
# In backend/app.py
def generate_random_discount():
    discounts = [10, 15, 20, 25, 30, 35, 40]
    return random.choice(discounts)
```

### WhatsApp Messages
```python
# Customize OTP message in backend/app.py
message = f"🔐 رمز التحقق الخاص بك في سوزو كافيه: {otp}\n\nYour Suzu Kafé verification code: {otp}"
```

## 🐛 Troubleshooting

### Common Issues

**1. WhatsApp OTP not received**
- Check GreenAPI instance status
- Verify phone number format
- Ensure WhatsApp is installed on target phone

**2. QR Scanner not working**
- Enable camera permissions
- Use HTTPS in production
- Try different browsers

**3. Database errors**
- Check file permissions
- Ensure SQLite is installed
- Verify database path

**4. Admin login fails**
- Check password in .env file
- Clear browser cache
- Verify password hashing

## 📞 Support

### WhatsApp Business API Support
- Documentation: https://developers.facebook.com/docs/whatsapp/
- Support: https://developers.facebook.com/support/

### Technical Support
- Create GitHub issue for bugs
- Check documentation first
- Provide error logs and steps to reproduce

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WhatsApp Business API** for WhatsApp integration
- **TailwindCSS** for beautiful styling
- **QRCode.js** for QR code generation
- **Html5-QRCode** for QR scanning
- **Flask** for the backend framework

## 📈 Roadmap

### Version 2.0 (Planned)
- [ ] Multi-language support (Arabic, English, French)
- [ ] SMS OTP fallback
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Loyalty program integration
- [ ] Social media sharing
- [ ] Push notifications
- [ ] Mobile app (React Native)

### Version 1.1 (Next Release)
- [ ] Rate limiting implementation
- [ ] Enhanced security features
- [ ] Backup and restore functionality
- [ ] Advanced admin filters
- [ ] Bulk operations
- [ ] API documentation

---

**Made with ☕ for Suzu Drive-Thru Kafé**

*For technical support or business inquiries, please contact the development team.*

# Suzz - Premium Coffee Experience

## Local Development

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Environment Variables

انسخ `.env.example` إلى `.env` وأضف القيم الخاصة بك.

## Deploy to Railway

1. اربط الريبو بـ Railway.
2. Railway سيكتشف `Procfile` و`requirements.txt` تلقائيًا.
3. أضف متغيرات البيئة من لوحة تحكم Railway.
