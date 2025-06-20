const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const session = require('express-session'); // added for express session

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.use(session({
  secret: 'your-secret-key',  // 🔒 use a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }  // Set to true if using HTTPS
}));

// Export the app instead of listening here
module.exports = app;