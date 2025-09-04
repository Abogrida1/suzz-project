const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Check if frontend build exists
app.get('/check-build', (req, res) => {
  const frontendPath = path.join(__dirname, '../frontend/build/index.html');
  const exists = fs.existsSync(frontendPath);
  
  res.json({
    buildExists: exists,
    buildPath: frontendPath,
    message: exists ? 'Frontend build found' : 'Frontend build not found'
  });
});

// Serve frontend
app.get('*', (req, res) => {
  const frontendPath = path.join(__dirname, '../frontend/build/index.html');
  
  if (fs.existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else {
    res.status(404).json({ 
      message: 'Frontend not built',
      path: req.path
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/test`);
  console.log(`Check build: http://localhost:${PORT}/check-build`);
});
