# 🚀 Suzz Project - Secure Chat App

A modern full-stack chat application similar to WhatsApp and Messenger, built with React, Node.js, Express, MongoDB, and Socket.IO.

## ✨ Features

- 🔐 **Authentication**: JWT-based user registration and login
- 💬 **Real-time Chat**: Global chat room and private messaging
- 👥 **User Management**: Profile management, user search, and friend system
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📎 **File Sharing**: Send images and small files
- 🔔 **Notifications**: Real-time message notifications
- ⚡ **Live Updates**: Typing indicators and message status

## 🛠️ Tech Stack

- **Frontend**: React, TailwindCSS, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO for live communication

## 📁 Project Structure

```
secure-chat-app/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utility functions
│   └── public/           # Static files
├── backend/           # Node.js/Express backend API
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── middleware/    # Custom middleware
│   └── socket/        # Socket.IO handlers
├── package.json       # Root package.json for scripts
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Abogrida1/suzz-project.git
cd suzz-project
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
```bash
# Copy the example environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Configure your environment variables in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-chat-app
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

5. Start the development servers:
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

## 🌐 Deployment

### Option 1: Docker Compose (Recommended for VPS/Dedicated Server)

1. Clone the repository:
```bash
git clone https://github.com/Abogrida1/suzz-project.git
cd suzz-project
```

2. Update environment variables in `docker-compose.yml`:
```yaml
# Change these values for production
JWT_SECRET: your-super-secret-jwt-key-change-this-in-production
MONGO_INITDB_ROOT_PASSWORD: your-secure-mongodb-password
```

3. Start the application:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Option 2: Railway

1. **Backend Deployment:**
   - Connect your GitHub repository to Railway
   - Set the root directory to `backend`
   - Add environment variables:
     ```
     NODE_ENV=production
     MONGODB_URI=your-mongodb-connection-string
     JWT_SECRET=your-super-secret-jwt-key
     CLIENT_URL=https://your-frontend-url.railway.app
     ```
   - Deploy

2. **Frontend Deployment:**
   - Create a new Railway project for frontend
   - Set the root directory to `frontend`
   - Add environment variables:
     ```
     REACT_APP_SERVER_URL=https://your-backend-url.railway.app
     ```
   - Deploy

### Option 3: Render

1. **Backend Deployment:**
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variables (same as Railway)

2. **Frontend Deployment:**
   - Create a new Static Site on Render
   - Connect your GitHub repository
   - Set build command: `cd frontend && npm install && npm run build`
   - Set publish directory: `frontend/build`
   - Add environment variables (same as Railway)

### Option 4: Vercel + Railway/Render

1. **Backend:** Deploy to Railway or Render (see above)
2. **Frontend:** Deploy to Vercel:
   - Connect your repository to Vercel
   - Set build command: `cd frontend && npm run build`
   - Set output directory: `frontend/build`
   - Add environment variable: `REACT_APP_SERVER_URL=https://your-backend-url`

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-chat-app
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=http://localhost:3000
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### Frontend (.env)
```env
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_APP_NAME=Secure Chat App
```

## 🗄️ MongoDB Setup

### Option 1: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your environment variables

### Option 2: Self-hosted MongoDB
1. Install MongoDB on your server
2. Create the database: `secure-chat-app`
3. Update `MONGODB_URI` to point to your MongoDB instance

## 📋 Production Checklist

- [ ] Change default JWT secret
- [ ] Set up proper MongoDB with authentication
- [ ] Configure CORS for your domain
- [ ] Set up SSL/HTTPS
- [ ] Configure file upload limits
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for MongoDB
- [ ] Test all functionality in production environment

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/search` - Search users
- `PUT /api/users/profile` - Update user profile

### Messages
- `GET /api/messages/global` - Get global chat messages
- `GET /api/messages/private/:userId` - Get private messages
- `POST /api/messages` - Send message

## 🔌 Socket.IO Events

### Client to Server
- `join_global` - Join global chat
- `join_private` - Join private chat
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server to Client
- `message_received` - New message received
- `user_typing` - User typing indicator
- `user_stopped_typing` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Made with ❤️ by Mohamed Islam**

**⭐ Star this repository if it helped you!**