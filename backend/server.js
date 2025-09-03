const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const { authenticateToken } = require('./middleware/auth');
const { setupSocketHandlers } = require('./socket/socketHandlers');

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.CORS_ORIGIN,
        process.env.CLIENT_URL,
        "http://localhost:3000",
        "https://suzz-project-11.onrender.com"
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 120000, // 2 minutes
  pingInterval: 30000, // 30 seconds
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  serveClient: false
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      manifestSrc: ["'self'"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.CLIENT_URL,
      "http://localhost:3000",
      "https://suzz-project-11.onrender.com"
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

app.use(cors(corsOptions));

// Rate limiting - more lenient for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Serve static files from root
app.use(express.static('.'));

// Database connection middleware
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database not connected',
      message: 'Please check MongoDB connection',
      status: 'Service Unavailable'
    });
  }
  next();
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, checkDatabaseConnection, userRoutes);
app.use('/api/messages', authenticateToken, checkDatabaseConnection, messageRoutes);
app.use('/api/upload', authenticateToken, checkDatabaseConnection, uploadRoutes);
app.use('/api/groups', authenticateToken, checkDatabaseConnection, require('./routes/groups'));
app.use('/api/admin', authenticateToken, checkDatabaseConnection, require('./routes/admin'));
app.use('/api/admin-management', authenticateToken, checkDatabaseConnection, require('./routes/adminManagement'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    database: dbStatus,
    timestamp: new Date().toISOString() 
  });
});

// Root endpoint - serve frontend if available, otherwise show API info
app.get('/', (req, res) => {
  const frontendPath = path.join(__dirname, '../frontend/build/index.html');
  
  // Check if frontend build exists
  if (fs.existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else {
    res.json({ 
      message: 'Secure Chat App Backend API',
      status: 'Running',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        users: '/api/users',
        messages: '/api/messages',
        upload: '/api/upload'
      },
      frontend: 'Frontend not built yet. Use /app route or build frontend first.',
      timestamp: new Date().toISOString()
    });
  }
});

// Serve frontend build files
app.get('/app', (req, res) => {
  const frontendPath = path.join(__dirname, '../frontend/build/index.html');
  
  if (fs.existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else {
    res.status(404).json({
      error: 'Frontend not built',
      message: 'Please build the frontend first or check the build process',
      instructions: 'Run: cd frontend && npm install && npm run build'
    });
  }
});

// Serve frontend static files
app.use('/static', express.static(path.join(__dirname, '../frontend/build/static')));

// Serve manifest.json
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, '../frontend/build/manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.sendFile(manifestPath);
  } else {
    res.status(404).json({ error: 'Manifest not found' });
  }
});

// Serve all frontend routes
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  console.log('Server will continue running without database connection');
  // Don't exit the process, just log the error
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Handle Socket.IO errors
io.on('error', (error) => {
  console.error('Socket.IO error:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
