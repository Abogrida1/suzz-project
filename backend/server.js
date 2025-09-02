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
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Serve static files from root
app.use(express.static('.'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
  process.exit(1);
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
