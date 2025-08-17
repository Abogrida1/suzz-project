### Cafe Rewards Web App

- Backend: Node.js + Express + MongoDB
- Frontend: React + Vite + Tailwind CSS
- OTP: Ultra Message (WhatsApp) with dev simulation

#### Quick start (local)
1. Backend
   - cd `backend`
   - `cp .env.example .env` and adjust values. If no MongoDB, dev will fallback to in-memory DB.
   - `npm install`
   - `npm run dev`
   - Backend runs on `http://localhost:4000`
2. Frontend
   - cd `frontend`
   - `npm install`
   - `cp .env.example .env`
   - `npm run dev`
   - Frontend runs on `http://localhost:5173`

#### Ultra Message
- Set `ULTRA_INSTANCE_ID`, `ULTRA_TOKEN`, `ULTRA_PHONE_SENDER` in backend `.env` to send OTP via WhatsApp.
- If not set, OTP is simulated and logged to the backend console.

#### Admin Panel
- Visit `/admin`, default creds in backend `.env.example` (`admin`/`admin123`). Stored as Basic auth in localStorage.

#### API routes
- `POST /api/auth/request-otp` { phoneNumber }
- `POST /api/auth/verify-otp` { phoneNumber, otp }
- `POST /api/discount/get-or-create` { phoneNumber }
- `POST /api/discount/me` { phoneNumber }
- `GET /api/admin/customers` (Basic Auth)
- `POST /api/admin/redeem` { redemptionCode } (Basic Auth)

#### Notes
- Discounts: random 20-40 divisible by 5. Re-login before redemption shows the same discount. After redemption shows message.
- QR payload includes `phoneNumber` and `redemptionCode`. Admin can scan or enter code to redeem.